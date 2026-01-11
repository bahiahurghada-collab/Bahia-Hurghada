
import { AppState } from "../types";
import { supabase } from "./supabaseClient";

export const databaseService = {
  /**
   * جلب الحالة الكاملة من جدول pms_data في Supabase
   */
  fetchState: async (currentLastUpdated?: string): Promise<{ state: AppState, hasUpdates: boolean } | null> => {
    try {
      const { data, error } = await supabase
        .from('pms_data')
        .select('state')
        .eq('id', 1)
        .single();

      if (error) {
        // إذا كان الخطأ هو عدم وجود بيانات (الصف غير موجود)
        if (error.code === 'PGRST116') {
          console.warn("Database is empty, initializing first record...");
          return null;
        }
        throw error;
      }

      if (!data || !data.state) return null;

      const cloudState: AppState = data.state;
      
      // التحقق من التوقيت لمنع إعادة تحميل نفس البيانات
      const hasUpdates = !currentLastUpdated || (cloudState.lastUpdated || '') > currentLastUpdated;
      
      return { state: cloudState, hasUpdates };
    } catch (e) {
      console.error("Supabase Connection Error:", e);
      // في حالة وجود خطأ في الشبكة، نبلغ النظام ليتعامل معه
      return null;
    }
  },

  /**
   * حفظ الحالة في السيرفر
   */
  saveState: async (state: AppState): Promise<boolean> => {
    try {
      const stateToSave: AppState = {
        ...state,
        lastUpdated: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('pms_data')
        .upsert({ id: 1, state: stateToSave });

      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Supabase Sync Failed:", e);
      return false;
    }
  }
};
