
import { AppState } from "../types";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

/**
 * دالة مساعدة لتحويل أي خطأ إلى نص مفهوم
 */
const parseSupabaseError = (error: any): string => {
  if (!error) return "Unknown Error";
  if (typeof error === 'string') return error;
  
  const code = error.code;
  const message = error.message || "";

  // التعامل مع خطأ RLS الشهير
  if (code === '42501') {
    return "RLS Permission Error (42501): Please go to Supabase SQL Editor and run: ALTER TABLE pms_data DISABLE ROW LEVEL SECURITY;";
  }

  // استخراج الرسالة من كائن خطأ Supabase
  const msg = message || error.details || error.hint || JSON.stringify(error);
  const codePrefix = code ? `[Code: ${code}] ` : "";
  
  return `${codePrefix}${msg}`;
};

export const databaseService = {
  fetchState: async (currentLastUpdated?: string): Promise<{ state: AppState, hasUpdates: boolean } | null> => {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('pms_data')
        .select('state')
        .eq('id', 1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn("Table pms_data is empty or ID 1 missing.");
          return null;
        }
        const errorText = parseSupabaseError(error);
        throw new Error(errorText);
      }

      if (!data || !data.state) return null;

      const cloudState: AppState = data.state;
      const hasUpdates = !currentLastUpdated || (cloudState.lastUpdated || '') > currentLastUpdated;
      
      return { state: cloudState, hasUpdates };
    } catch (e: any) {
      throw e; // نمرر الخطأ ليتم عرضه في الواجهة
    }
  },

  saveState: async (state: AppState): Promise<boolean> => {
    if (!isSupabaseConfigured()) return false;

    try {
      const stateToSave: AppState = {
        ...state,
        lastUpdated: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('pms_data')
        .upsert({ id: 1, state: stateToSave });

      if (error) {
        const errorText = parseSupabaseError(error);
        throw new Error(errorText);
      }
      
      return true;
    } catch (e: any) {
      console.error("Sync Failure Details:", e.message);
      throw e;
    }
  }
};
