import type { Database } from '@/supabase/types';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error(
    'Missing required environment variables for Supabase browser client',
  );
}

export const supabase = createBrowserClient<Database>(supabaseUrl, anonKey);
