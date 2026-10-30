/**
 * Supabase configuration validator and environment inspector.
 */

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gameverse-demo.supabase.co';
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key';
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return false;
  }

  // Check if it's the default demo placeholder
  if (
    url.includes('your-project-id') ||
    url.includes('gameverse-demo') ||
    anonKey.includes('your-anon-key') ||
    anonKey.includes('demo-placeholder')
  ) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('supabase.co');
  } catch {
    return false;
  }
}
