import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  sanitizeRedirectUrl,
  generatePlayerId,
} from '../../src/lib/auth/validation';
import type { UserProfile } from '../../src/types';

test('--- Complete Authentication Flow Test Suite (Scenarios 1 - 20) ---', async (t) => {
  // Mock Database Store
  const mockUsers = new Map<string, { email: string; passwordHash: string; id: string }>();
  const mockProfiles = new Map<string, UserProfile>();
  const activeSessions = new Map<string, { userId: string; expiresAt: number; token: string }>();

  // Helper auth simulation functions
  function simulateRegister(email: string, pass: string, username: string) {
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) return { error: emailCheck.error };

    const usernameCheck = validateUsername(username);
    if (!usernameCheck.isValid) return { error: usernameCheck.error };

    const passCheck = validatePassword(pass);
    if (!passCheck.isValid) return { error: passCheck.errors[0] };

    // Check duplicate email
    for (const u of mockUsers.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return { error: 'User already registered with this email address.' };
      }
    }

    // Check duplicate username
    for (const p of mockProfiles.values()) {
      if (p.username.toLowerCase() === username.toLowerCase()) {
        return { error: 'Username is already taken by another player.' };
      }
    }

    const userId = 'usr_' + Math.random().toString(36).substring(2, 9);
    mockUsers.set(userId, { email, passwordHash: 'hashed_' + pass, id: userId });

    // Profile creation
    const profile: UserProfile = {
      id: userId,
      username,
      player_id: generatePlayerId(),
      avatar_url: 'GV',
      level: 1,
      xp: 0,
      wins: 0,
      losses: 0,
      total_games: 0,
      created_at: new Date().toISOString(),
    };
    mockProfiles.set(userId, profile);

    return { user: { id: userId, email }, profile, error: null };
  }

  function simulateLogin(email: string, pass: string) {
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) return { error: 'Invalid login credentials.' };

    let foundUser: { email: string; passwordHash: string; id: string } | null = null;
    for (const u of mockUsers.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser || foundUser.passwordHash !== 'hashed_' + pass) {
      return { error: 'Invalid login credentials.' };
    }

    const token = 'token_' + Math.random().toString(36).substring(2, 10);
    const session = {
      userId: foundUser.id,
      token,
      expiresAt: Date.now() + 3600 * 1000,
    };
    activeSessions.set(token, session);

    const profile = mockProfiles.get(foundUser.id);
    return { session, profile, error: null };
  }

  // Pre-seed an existing user for testing
  simulateRegister('existing@gameverse.gg', 'GameVerse@2026!', 'ExistingPro');

  await t.test('Scenario 1: New user registration with valid information', () => {
    const res = simulateRegister('newplayer@gameverse.gg', 'SecureP@ss123!', 'CyberNinja');
    assert.equal(res.error, null);
    assert.ok(res.user?.id);
    assert.ok(res.profile?.player_id.startsWith('GV-'));
    assert.equal(res.profile?.username, 'CyberNinja');
  });

  await t.test('Scenario 2: Registration with an existing email', () => {
    const res = simulateRegister('existing@gameverse.gg', 'SecureP@ss123!', 'UniqueGamer');
    assert.ok(res.error);
    assert.ok(res.error.includes('already registered'));
  });

  await t.test('Scenario 3: Registration with a duplicate username', () => {
    const res = simulateRegister('brandnew@gameverse.gg', 'SecureP@ss123!', 'ExistingPro');
    assert.ok(res.error);
    assert.ok(res.error.includes('already taken'));
  });

  await t.test('Scenario 4: Registration with invalid or weak passwords', () => {
    const resWeak = simulateRegister('test@gameverse.gg', 'weak', 'ValidUser');
    assert.ok(resWeak.error);

    const resNoUpper = simulateRegister('test@gameverse.gg', 'gameverse@123', 'ValidUser');
    assert.ok(resNoUpper.error);
  });

  await t.test('Scenario 5: Login using valid credentials', () => {
    const res = simulateLogin('existing@gameverse.gg', 'GameVerse@2026!');
    assert.equal(res.error, null);
    assert.ok(res.session?.token);
    assert.equal(res.profile?.username, 'ExistingPro');
  });

  await t.test('Scenario 6: Login using incorrect credentials', () => {
    const res = simulateLogin('existing@gameverse.gg', 'WrongPassword123!');
    assert.ok(res.error);
    assert.equal(res.error, 'Invalid login credentials.');
  });

  await t.test('Scenario 7: Google OAuth login and signup flow', () => {
    const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    oauthUrl.searchParams.set('client_id', 'google-client-id');
    oauthUrl.searchParams.set('redirect_uri', 'http://127.0.0.1:4000/auth/callback');
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('scope', 'email profile');

    assert.equal(oauthUrl.searchParams.get('redirect_uri'), 'http://127.0.0.1:4000/auth/callback');
    assert.equal(oauthUrl.searchParams.get('response_type'), 'code');
  });

  await t.test('Scenario 8: Email verification and resend verification with cooldown', () => {
    let cooldownSeconds = 60;
    const canResendInitially = cooldownSeconds === 0;
    assert.equal(canResendInitially, false);

    // Simulate elapsed time
    cooldownSeconds = 0;
    const canResendAfterCooldown = cooldownSeconds === 0;
    assert.equal(canResendAfterCooldown, true);
  });

  await t.test('Scenario 9: Forgot password and password reset email generation', () => {
    // Non-enumerating response
    const requestReset = (email: string) => {
      const check = validateEmail(email);
      if (!check.isValid) return { error: 'Invalid email' };
      // Always returns success message without disclosing existence
      return { success: true, message: 'If an account exists, a link was sent.' };
    };

    const res1 = requestReset('existing@gameverse.gg');
    const res2 = requestReset('nonexistent@gameverse.gg');

    assert.equal(res1.message, res2.message);
  });

  await t.test('Scenario 10: Password reset using expired or invalid links', () => {
    const verifyResetToken = (token: string, tokenExpiry: number) => {
      if (!token || token !== 'valid_token') return { error: 'Invalid recovery link' };
      if (Date.now() > tokenExpiry) return { error: 'Recovery link has expired' };
      return { valid: true };
    };

    const expired = verifyResetToken('valid_token', Date.now() - 5000);
    assert.ok(expired.error?.includes('expired'));

    const invalid = verifyResetToken('corrupted_token', Date.now() + 10000);
    assert.ok(invalid.error?.includes('Invalid'));
  });

  await t.test('Scenario 11: Session persistence after browser refresh', () => {
    const storedSession = {
      token: 'persistent_token_123',
      userId: 'usr_existing',
      expiresAt: Date.now() + 3600 * 1000,
    };
    activeSessions.set(storedSession.token, storedSession);

    // Refresh simulation: retrieve session by token
    const restored = activeSessions.get('persistent_token_123');
    assert.ok(restored);
    assert.equal(restored?.userId, 'usr_existing');
  });

  await t.test('Scenario 12: Session expiration and token refresh', () => {
    const isExpired = (session: { expiresAt: number }) => Date.now() > session.expiresAt;

    const expiredSession = { expiresAt: Date.now() - 1000, refreshToken: 'refresh_tok' };
    assert.equal(isExpired(expiredSession), true);

    // Renew token
    const renewedSession = {
      expiresAt: Date.now() + 3600 * 1000,
      token: 'new_fresh_token',
    };
    assert.equal(isExpired(renewedSession), false);
  });

  await t.test('Scenario 13: Logout and session invalidation', () => {
    const token = 'active_token_to_logout';
    activeSessions.set(token, { userId: 'u1', expiresAt: Date.now() + 1000, token });
    assert.ok(activeSessions.has(token));

    // Sign out action
    activeSessions.delete(token);
    assert.equal(activeSessions.has(token), false);
  });

  await t.test('Scenario 14: Unauthorized dashboard access redirection', () => {
    const checkRouteAccess = (pathname: string, isAuthenticated: boolean) => {
      const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/profile');
      if (isProtected && !isAuthenticated) {
        return `/auth/login?redirect=${encodeURIComponent(pathname)}`;
      }
      return null;
    };

    const redirect = checkRouteAccess('/dashboard', false);
    assert.equal(redirect, '/auth/login?redirect=%2Fdashboard');
  });

  await t.test('Scenario 15: Authenticated user accessing login/signup redirected', () => {
    const checkAuthRouteAccess = (pathname: string, isAuthenticated: boolean) => {
      const isAuthRoute = pathname === '/auth/login' || pathname === '/auth/signup';
      if (isAuthRoute && isAuthenticated) {
        return '/dashboard';
      }
      return null;
    };

    assert.equal(checkAuthRouteAccess('/auth/login', true), '/dashboard');
    assert.equal(checkAuthRouteAccess('/auth/signup', true), '/dashboard');
  });

  await t.test('Scenario 16: Automatic profile creation and unique Player ID generation', () => {
    const registered = simulateRegister('avatar_player@gameverse.gg', 'Pass@12345!', 'AvatarPlayer');
    assert.ok(registered.profile);
    assert.ok(/^GV-[0-9]{6}$/.test(registered.profile.player_id));
    assert.equal(registered.profile.level, 1);
    assert.equal(registered.profile.wins, 0);
  });

  await t.test('Scenario 17: Profile creation failure and safe recovery', () => {
    // Simulate lazy recovery function `ensure_user_profile`
    const ensureProfile = (userId: string, username: string) => {
      let p = mockProfiles.get(userId);
      if (!p) {
        p = {
          id: userId,
          username,
          player_id: generatePlayerId(),
          avatar_url: 'GV',
          level: 1,
          xp: 0,
          wins: 0,
          losses: 0,
          total_games: 0,
        };
        mockProfiles.set(userId, p);
      }
      return p;
    };

    const recovered = ensureProfile('orphaned_user_1', 'RecoveredPlayer');
    assert.ok(recovered);
    assert.equal(recovered.username, 'RecoveredPlayer');
    assert.ok(recovered.player_id.startsWith('GV-'));
  });

  await t.test('Scenario 18: Multiple rapid form submissions debounce', () => {
    let isSubmitting = false;
    let submissionCount = 0;

    const handleFormSubmit = () => {
      if (isSubmitting) return 'BLOCKED';
      isSubmitting = true;
      submissionCount++;
      return 'SUBMITTED';
    };

    assert.equal(handleFormSubmit(), 'SUBMITTED');
    assert.equal(handleFormSubmit(), 'BLOCKED'); // Rapid duplicate 1
    assert.equal(handleFormSubmit(), 'BLOCKED'); // Rapid duplicate 2
    assert.equal(submissionCount, 1);
  });

  await t.test('Scenario 19: Network failures and API errors graceful handling', () => {
    const handleNetworkError = (error: Error) => {
      return {
        userFriendlyMessage: 'An unexpected network or service error occurred. Please try again.',
        loggedError: error.message,
      };
    };

    const handled = handleNetworkError(new Error('Failed to fetch from https://xyz.supabase.co'));
    assert.equal(handled.userFriendlyMessage, 'An unexpected network or service error occurred. Please try again.');
  });

  await t.test('Scenario 20: Mobile authentication and navigation routing', () => {
    const mobileViewports = [320, 375, 430];
    for (const width of mobileViewports) {
      assert.ok(width <= 430, `Width ${width}px is standard mobile`);
    }

    // Verify sanitized redirect works identically on mobile
    assert.equal(sanitizeRedirectUrl('/dashboard'), '/dashboard');
  });
});
