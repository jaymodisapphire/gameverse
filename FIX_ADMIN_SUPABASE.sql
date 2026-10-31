-- ==============================================================================
-- FIX ADMIN AUTH IN SUPABASE
-- Run this in Supabase SQL Editor if token?grant_type=password returns 500
-- ==============================================================================

-- Step 1: Remove corrupted direct SQL insert from auth tables
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@gameverse.com');
DELETE FROM auth.users WHERE email = 'admin@gameverse.com';

-- Step 2: Now create user admin@gameverse.com cleanly with all GoTrue columns
-- (Or create it directly from Supabase Dashboard > Authentication > Users > "Add user")
DO $$
DECLARE
    new_admin_id UUID := gen_random_uuid();
    encrypted_pw TEXT := crypt('Admin@Gameverse2026!', gen_salt('bf'));
BEGIN
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_admin_id,
        'authenticated',
        'authenticated',
        'admin@gameverse.com',
        encrypted_pw,
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"username":"admin"}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
    );

    -- Insert valid identity matching GoTrue schema
    INSERT INTO auth.identities (
        id,
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        new_admin_id::text,
        new_admin_id::text,
        new_admin_id,
        jsonb_build_object('sub', new_admin_id::text, 'email', 'admin@gameverse.com'),
        'email',
        now(),
        now(),
        now()
    );

    -- Ensure profile exists and is admin
    INSERT INTO public.profiles (
        id,
        username,
        player_id,
        avatar_url,
        level,
        is_admin,
        role
    ) VALUES (
        new_admin_id,
        'admin',
        'GV-179961',
        '👑',
        99,
        true,
        'admin'
    )
    ON CONFLICT (id) DO UPDATE SET
        is_admin = true,
        role = 'admin',
        level = 99;

    -- Ensure wallet exists with 1,000,000 chips
    INSERT INTO public.player_wallets (user_id, balance)
    VALUES (new_admin_id, 1000000)
    ON CONFLICT (user_id) DO UPDATE SET balance = 1000000;

    RAISE NOTICE 'Admin user created successfully with ID %', new_admin_id;
END $$;
