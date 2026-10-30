import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeRedirectUrl, generatePlayerId } from '@/lib/auth/validation';

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
        // Fetch authenticated user info
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const meta = user.user_metadata || {};
          // Extract Google name and picture
          const googleName =
            meta.full_name ||
            meta.name ||
            meta.given_name ||
            meta.username ||
            (user.email ? user.email.split('@')[0] : 'Player');

          const googleAvatar = meta.avatar_url || meta.picture || '👑';

          // Check if profile exists
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', user.id)
            .maybeSingle();

          if (!existingProfile) {
            // New user from Google or signup: create profile automatically
            let cleanUsername = googleName
              .replace(/[^a-zA-Z0-9_]/g, '_')
              .substring(0, 18);
            if (cleanUsername.length < 3) {
              cleanUsername = `Player_${user.id.substring(0, 4)}`;
            }

            const newPlayerId = generatePlayerId();

            await supabase.from('profiles').insert({
              id: user.id,
              username: cleanUsername,
              player_id: newPlayerId,
              avatar_url: googleAvatar,
              level: 1,
              xp: 0,
              wins: 0,
              losses: 0,
              total_games: 0,
              is_online: true,
            });
          } else if (
            googleAvatar &&
            (!existingProfile.avatar_url ||
              existingProfile.avatar_url === 'GV' ||
              existingProfile.avatar_url === '👑')
          ) {
            // Update profile with real Google photo
            await supabase
              .from('profiles')
              .update({ avatar_url: googleAvatar, is_online: true })
              .eq('id', user.id);
          }

          // Ensure 100,000 free starting chips are granted
          try {
            await supabase.rpc('grant_starting_chips', { p_user_id: user.id });
          } catch (walletErr) {
            console.error('Wallet starting grant notice:', walletErr);
          }
        }

        return NextResponse.redirect(new URL(sanitizedTarget, request.url));
      }
    } catch (err) {
      console.error('Error during auth code exchange:', err);
    }
  }

  // Fallback redirect if code is invalid or missing
  return NextResponse.redirect(
    new URL('/auth/login?error=auth_callback_failed', request.url)
  );
}
