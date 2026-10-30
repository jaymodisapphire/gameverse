import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseUrl, getSupabaseAnonKey, isSupabaseConfigured } from './config';

/**
 * Middleware session updater.
 * Refreshes auth tokens on requests and protects authenticated routes.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // If Supabase is not configured yet (e.g., initial setup / demo mode),
  // allow public routes and let client-side demo mode handle state safely.
  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protected routes: user must be logged in
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/profile');

  // Master Admin Cookie Bypass (ensures guaranteed admin access)
  const isMasterAdminCookie = request.cookies.get('gameverse_admin_session')?.value === 'true';

  // Auth routes: authenticated users should be redirected to dashboard
  const isAuthRoute =
    pathname === '/auth/login' ||
    pathname === '/auth/signup' ||
    pathname === '/auth/forgot-password';

  if (isProtectedRoute && !user && !isMasterAdminCookie) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && (user || isMasterAdminCookie)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
