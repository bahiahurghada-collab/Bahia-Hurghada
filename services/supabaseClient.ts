
import { createClient } from '@supabase/supabase-js'

/**
 * دالة للحصول على المتغيرات من البيئة أو استخدام القيم الافتراضية المقدمة
 */
const getEnv = (name: string, fallback: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const val = (import.meta as any).env[name];
      if (val) return val;
    }
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
      return process.env[name]!;
    }
  } catch (e) {}
  return fallback;
};

// استخدام البيانات التي قدمتها كقيم افتراضية
const DEFAULT_URL = 'https://uutqiphiawhqzzzvpfez.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dHFpcGhpYXdocXp6enZwZmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMDk1MjUsImV4cCI6MjA4MzY4NTUyNX0.IiSZGyYYktKTB8SntVP7W2peq9P59ZWggxPVw-Gy_rQ';

const supabaseUrl = getEnv('VITE_SUPABASE_URL', DEFAULT_URL);
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', DEFAULT_KEY);

/**
 * التحقق من صحة الإعدادات
 */
export const isSupabaseConfigured = (): boolean => {
  return (
    !!supabaseUrl && 
    !!supabaseAnonKey && 
    supabaseUrl.startsWith('http')
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
