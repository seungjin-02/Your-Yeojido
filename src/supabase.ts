import {createClient} from '@supabase/supabase-js';
const env=import.meta.env;
const url=env.VITE_SUPABASE_URL?.trim(),key=env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()||env.VITE_SUPABASE_ANON_KEY?.trim();
// Only the project's public client key belongs in a web or installed PWA bundle.
export const supabase=url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}):null;
