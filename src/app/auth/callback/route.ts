import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeRedirectUrl } from '@/lib/auth/validation';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  // Sanitize target redirect to prevent open redirect vulnerabilities
  const sanitizedTarget = sanitizeRedirectUrl(next, '/dashboard');

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(new URL(sanitizedTarget, request.url));
      }
    } catch (err) {
      console.error('Error during auth code exchange:', err);
    }
  }

  // Fallback redirect if code is invalid or missing
  return NextResponse.redirect(new URL('/auth/login?error=auth_callback_failed', request.url));
}
