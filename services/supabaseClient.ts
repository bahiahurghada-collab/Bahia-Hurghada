
import { createClient } from '@supabase/supabase-js';

// الرابط والمفتاح الخاص بك (تم التأكد من صحتها)
const SUPABASE_URL = 'https://uutqiphiawhqzzzvpfez.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dHFpcGhpYXdocXp6enZwZmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMDk1MjUsImV4cCI6MjA4MzY4NTUyNX0.IiSZGyYYktKTB8SntVP7W2peq9P59ZWggxPVw-Gy_rQ';

// دالة للتحقق مما إذا كانت الإعدادات جاهزة (تم تعديل المنطق ليكون صحيحاً)
export const isSupabaseConfigured = () => {
  // // Fix: Cast constants to string to prevent TypeScript literal type mismatch errors when comparing with placeholders
  return (SUPABASE_URL as string) !== 'https://YOUR_PROJECT_ID.supabase.co' && 
         (SUPABASE_ANON_KEY as string) !== 'YOUR_ANON_KEY' &&
         SUPABASE_URL.startsWith('https://');
};

// إنشاء العميل باستخدام القيم الحقيقية مباشرة
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
