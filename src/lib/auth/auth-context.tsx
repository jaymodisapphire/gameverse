'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { UserProfile } from '@/types';
import { generatePlayerId } from './validation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  demoMode: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ data?: any; error?: string | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ data?: any; error?: string | null }>;
  signInWithOAuth: (provider: 'google') => Promise<{ data?: any; error?: string | null }>;
  signOut: () => Promise<{ error?: string | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error?: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error?: string | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ data?: UserProfile; error?: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const supabase = createClient();

  // Fetch or create profile lazily
  const fetchProfile = useCallback(async (userId: string, fallbackUsername?: string) => {
    if (!configured) {
      // In demo mode, load from localStorage if available
      try {
        const saved = localStorage.getItem(`gameverse_demo_profile_${userId}`);
        if (saved) {
          setProfile(JSON.parse(saved));
          return;
        }
      } catch {}
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setProfile(data as UserProfile);
      } else if (error && error.code === 'PGRST116') {
        // Profile not found: trigger lazy recovery creation
        const newPlayerId = generatePlayerId();
        const username = fallbackUsername || `Player_${userId.substring(0, 5)}`;
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username,
            player_id: newPlayerId,
            avatar_url: 'GV',
            level: 1,
            xp: 0,
            wins: 0,
            losses: 0,
            total_games: 0,
          })
          .select()
          .single();

        if (newProfile && !insertError) {
          setProfile(newProfile as UserProfile);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  }, [configured, supabase]);

  // Initial session restoration
  useEffect(() => {
    const isConfig = isSupabaseConfigured();
    setConfigured(isConfig);

    if (isConfig) {
      // Supabase is configured: restore real session
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          fetchProfile(currentSession.user.id);
        }
        setIsLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          if (newSession?.user) {
            await fetchProfile(newSession.user.id);
          } else {
            setProfile(null);
          }
          setIsLoading(false);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Supabase is not configured yet (Demo Mode)
      setDemoMode(true);
      try {
        const demoUserJson = localStorage.getItem('gameverse_demo_user');
        const demoProfileJson = localStorage.getItem('gameverse_demo_profile');
        if (demoUserJson && demoProfileJson) {
          setUser(JSON.parse(demoUserJson));
          setProfile(JSON.parse(demoProfileJson));
        }
      } catch {}
      setIsLoading(false);
    }
  }, [fetchProfile, supabase]);

  // Sign Up
  const signUp = async (email: string, password: string, username: string) => {
    if (!configured) {
      // Demo Mode Registration
      const mockId = 'demo-' + Math.random().toString(36).substring(2, 9);
      const mockPlayerId = generatePlayerId();
      const mockUser = {
        id: mockId,
        email,
        app_metadata: {},
        user_metadata: { username },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;

      const mockProfile: UserProfile = {
        id: mockId,
        username,
        player_id: mockPlayerId,
        avatar_url: 'GV',
        level: 1,
        xp: 0,
        wins: 0,
        losses: 0,
        total_games: 0,
        created_at: new Date().toISOString(),
      };

      try {
        localStorage.setItem('gameverse_demo_user', JSON.stringify(mockUser));
        localStorage.setItem('gameverse_demo_profile', JSON.stringify(mockProfile));
      } catch {}

      setUser(mockUser);
      setProfile(mockProfile);
      return { data: { user: mockUser }, error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        await fetchProfile(data.user.id, username);
      }

      return { data, error: null };
    } catch (err: any) {
      return { error: err.message || 'An unexpected registration error occurred.' };
    }
  };

  // Sign In with Password
  const signInWithPassword = async (email: string, password: string) => {
    if (!configured) {
      // Demo Mode Login
      const isAdmin = email.toLowerCase().includes('admin');
      const mockId = isAdmin ? 'admin-root' : 'demo-user-1';
      const mockUser = {
        id: mockId,
        email,
        app_metadata: {},
        user_metadata: { username: isAdmin ? 'Admin' : email.split('@')[0] },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;

      const mockProfile: UserProfile = {
        id: mockId,
        username: isAdmin ? 'Admin' : email.split('@')[0],
        player_id: isAdmin ? 'GV-ADMIN01' : 'GV-849201',
        avatar_url: 'GV',
        level: isAdmin ? 99 : 5,
        xp: isAdmin ? 99999 : 450,
        wins: isAdmin ? 100 : 12,
        losses: 3,
        total_games: isAdmin ? 103 : 15,
        is_admin: isAdmin,
        role: isAdmin ? 'admin' : 'player',
        created_at: new Date().toISOString(),
      };

      try {
        localStorage.setItem('gameverse_demo_user', JSON.stringify(mockUser));
        localStorage.setItem('gameverse_demo_profile', JSON.stringify(mockProfile));
      } catch {}

      setUser(mockUser);
      setProfile(mockProfile);
      return { data: { user: mockUser }, error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        await fetchProfile(data.user.id);
      }

      return { data, error: null };
    } catch (err: any) {
      return { error: err.message || 'An unexpected login error occurred.' };
    }
  };

  // Sign In with OAuth (Google)
  const signInWithOAuth = async (provider: 'google') => {
    if (!configured) {
      // Demo Mode OAuth Simulation
      const mockId = 'demo-google-user';
      const mockUser = {
        id: mockId,
        email: 'player@gmail.com',
        app_metadata: { provider: 'google' },
        user_metadata: { full_name: 'Gamer Pro', username: 'GoogleGamer' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;

      const mockProfile: UserProfile = {
        id: mockId,
        username: 'GoogleGamer',
        player_id: 'GV-992104',
        avatar_url: 'GG',
        level: 10,
        xp: 1200,
        wins: 48,
        losses: 14,
        total_games: 62,
        created_at: new Date().toISOString(),
      };

      try {
        localStorage.setItem('gameverse_demo_user', JSON.stringify(mockUser));
        localStorage.setItem('gameverse_demo_profile', JSON.stringify(mockProfile));
      } catch {}

      setUser(mockUser);
      setProfile(mockProfile);
      return { data: { url: '/dashboard' }, error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { error: error.message };
      }

      return { data, error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to initialize Google login.' };
    }
  };

  // Sign Out
  const signOut = async () => {
    if (!configured) {
      try {
        localStorage.removeItem('gameverse_demo_user');
        localStorage.removeItem('gameverse_demo_profile');
      } catch {}
      setUser(null);
      setProfile(null);
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      return { error: error?.message || null };
    } catch (err: any) {
      return { error: err.message || 'Failed to sign out.' };
    }
  };

  // Password Reset Request
  const resetPasswordForEmail = async (email: string) => {
    if (!configured) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to send password reset email.' };
    }
  };

  // Update Password
  const updatePassword = async (newPassword: string) => {
    if (!configured) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to update password.' };
    }
  };

  // Resend Email Verification
  const resendVerificationEmail = async (email: string) => {
    if (!configured) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to resend confirmation email.' };
    }
  };

  // Update Profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { error: 'You must be logged in to update your profile.' };
    }

    if (!configured) {
      const updated = { ...(profile || {}), ...updates } as UserProfile;
      setProfile(updated);
      try {
        localStorage.setItem('gameverse_demo_profile', JSON.stringify(updated));
      } catch {}
      return { data: updated, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      setProfile(data as UserProfile);
      return { data: data as UserProfile, error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to update profile.' };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isConfigured: configured,
        demoMode,
        signUp,
        signInWithPassword,
        signInWithOAuth,
        signOut,
        resetPasswordForEmail,
        updatePassword,
        resendVerificationEmail,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
