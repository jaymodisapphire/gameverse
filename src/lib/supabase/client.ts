import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseUrl, getSupabaseAnonKey } from './config';

/**
 * Creates and returns a Supabase client for client-side (browser) components.
 * Configured with PKCE flow and cookie-based session storage.
 */
export function createClient() {
  return createBrowserClient(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  );
}
