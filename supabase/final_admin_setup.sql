-- ==============================================================================
-- GAMEVERSE: FINAL SINGLE-FILE ADMIN ACCOUNT SETUP
-- Purpose: Creates or updates the Master Admin in Supabase Auth & Public Profiles
-- Credentials:
--   Email: admin@gameverse.com
--   Password: Admin@Gameverse2026!
-- ==============================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Ensure role and is_admin columns exist on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player';

-- 3. Create or update Master Admin in auth.users and auth.identities
DO $$
DECLARE
    v_admin_id UUID;
    v_admin_email TEXT := 'admin@gameverse.com';
    v_admin_password TEXT := 'Admin@Gameverse2026!';
    v_encrypted_pw TEXT;
BEGIN
    -- Encrypt the password using bcrypt
    v_encrypted_pw := crypt(v_admin_password, gen_salt('bf'));

    -- Check if user already exists in auth.users
    SELECT id INTO v_admin_id FROM auth.users WHERE email = v_admin_email;

    IF v_admin_id IS NULL THEN
        -- Generate new UUID for the admin user
        v_admin_id := gen_random_uuid();

        -- Insert into auth.users
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            role,
            aud,
            confirmation_token
        ) VALUES (
            v_admin_id,
            '00000000-0000-0000-0000-000000000000',
            v_admin_email,
            v_encrypted_pw,
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"username":"admin","player_id":"GV-000001"}'::jsonb,
            now(),
            now(),
            'authenticated',
            'authenticated',
            ''
        );

        -- Safe insert into auth.identities for GoTrue email provider support
        BEGIN
            INSERT INTO auth.identities (
                id,
                user_id,
                identity_data,
                provider,
                provider_id,
                last_sign_in_at,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid()::text,
                v_admin_id,
                jsonb_build_object('sub', v_admin_id::text, 'email', v_admin_email),
                'email',
                v_admin_id::text,
                now(),
                now(),
                now()
            )
            ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Identities table insert skipped or auto-handled: %', SQLERRM;
        END;

    ELSE
        -- Update password, confirm email if user already existed
        UPDATE auth.users
        SET 
            encrypted_password = v_encrypted_pw,
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            updated_at = now()
        WHERE id = v_admin_id;
    END IF;

    -- Ensure public.profiles has the full admin profile
    INSERT INTO public.profiles (
        id,
        username,
        player_id,
        avatar_url,
        level,
        xp,
        wins,
        losses,
        total_games,
        is_online,
        is_admin,
        role
    ) VALUES (
        v_admin_id,
        'admin',
        'GV-000001',
        '👑',
        99,
        99999,
        500,
        10,
        510,
        false,
        true,
        'admin'
    )
    ON CONFLICT (id) DO UPDATE SET
        is_admin = true,
        role = 'admin',
        level = 99,
        username = 'admin',
        updated_at = now();

    -- Ensure player_wallets has 1,000,000 chips
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'player_wallets') THEN
        INSERT INTO public.player_wallets (
            user_id,
            balance,
            created_at,
            updated_at
        ) VALUES (
            v_admin_id,
            1000000,
            now(),
            now()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            balance = 1000000,
            updated_at = now();
    END IF;

    RAISE NOTICE '✅ GAMEVERSE Master Admin (%) successfully created/updated with ID %', v_admin_email, v_admin_id;
END $$;
