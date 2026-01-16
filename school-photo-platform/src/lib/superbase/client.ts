import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get Supabase client for browser-side operations
 * Uses singleton pattern to reuse the same client instance
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env. NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in . env. local'
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // We use Next.js session, not Supabase auth
    },
  });

  return supabaseClient;
}

/**
 * Get public URL for an uploaded file
 */
export function getPublicUrl(bucket: string, path: string): string {
  const supabase = getSupabaseClient();
  const { data } = supabase. storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}