import { createClient } from '@supabase/supabase-js';
import { db } from './localDB';

let cachedClient = null;
let cachedUrl = null;
let cachedKey = null;

export const getSupabaseClient = async () => {
  try {
    // 1. Try to load from environment variables first
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (envUrl && envKey) {
      if (cachedClient && cachedUrl === envUrl && cachedKey === envKey) {
        return cachedClient;
      }
      cachedUrl = envUrl;
      cachedKey = envKey;
      cachedClient = createClient(envUrl, envKey);
      return cachedClient;
    }

    // 2. Fall back to settings in database
    const settings = await db.settings.get('main');
    if (!settings?.supabaseUrl || !settings?.supabaseKey) return null;

    if (cachedClient && cachedUrl === settings.supabaseUrl && cachedKey === settings.supabaseKey) {
      return cachedClient;
    }

    cachedUrl = settings.supabaseUrl;
    cachedKey = settings.supabaseKey;
    cachedClient = createClient(cachedUrl, cachedKey);
    return cachedClient;
  } catch (error) {
    console.error('Failed to get Supabase client:', error);
    return null;
  }
};
