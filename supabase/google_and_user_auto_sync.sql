-- ==============================================================================
-- GAMEVERSE: AUTOMATIC USER, GOOGLE OAUTH & CHIP WALLET TRIGGER
-- Purpose:
-- 1. Automatically extracts Name, Email, and Google Profile Picture from Google OAuth
-- 2. If user already exists, logs them in seamlessly without creating duplicates
-- 3. If new user, automatically creates Profile & Player Wallet with 100,000 free chips
-- ==============================================================================

-- 1. Create / Update the trigger function on public
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    raw_username TEXT;
    final_username TEXT;
    raw_avatar TEXT;
    generated_pid TEXT;
    username_taken BOOLEAN;
    counter INT := 0;
BEGIN
    -- 1. Extract Full Name / Name from Google OAuth metadata, or username, or fallback to email local part
    raw_username := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
        split_part(NEW.email, '@', 1)
    );

    -- 2. Extract Google profile picture / avatar
    raw_avatar := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'avatar_url'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'picture'), ''),
        '👑'
    );

    -- 3. Sanitize username: replace spaces and special characters with underscore
    raw_username := regexp_replace(raw_username, '[^a-zA-Z0-9_]', '_', 'g');

    IF char_length(raw_username) < 3 THEN
        raw_username := 'Player_' || substr(NEW.id::TEXT, 1, 4);
    END IF;

    IF char_length(raw_username) > 18 THEN
        raw_username := substr(raw_username, 1, 18);
    END IF;

    -- 4. Guarantee unique username
    final_username := raw_username;
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM public.profiles WHERE username = final_username AND id <> NEW.id
        ) INTO username_taken;

        EXIT WHEN NOT username_taken OR counter > 50;

        counter := counter + 1;
        final_username := substr(raw_username, 1, 14) || '_' || counter::TEXT;
    END LOOP;

    -- 5. Generate unique 6-digit Player ID
    generated_pid := public.generate_unique_player_id();

    -- 6. Insert into public.profiles (or update avatar if user already exists)
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
        is_online
    ) VALUES (
        NEW.id,
        final_username,
        generated_pid,
        raw_avatar,
        1,
        0,
        0,
        0,
        0,
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        avatar_url = CASE 
            WHEN public.profiles.avatar_url IS NULL OR public.profiles.avatar_url IN ('GV', '👑')
            THEN EXCLUDED.avatar_url 
            ELSE public.profiles.avatar_url 
        END,
        is_online = true,
        updated_at = now();

    -- 7. Automatically create Player Wallet with 100,000 Free Virtual Chips
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'player_wallets') THEN
        INSERT INTO public.player_wallets (
            user_id,
            balance,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            100000,
            now(),
            now()
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    -- 8. Record the Welcome Chip Grant Transaction in Ledger
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chip_transactions') THEN
        INSERT INTO public.chip_transactions (
            user_id,
            amount,
            balance_before,
            balance_after,
            transaction_type,
            idempotency_key,
            reason
        ) VALUES (
            NEW.id,
            100000,
            0,
            100000,
            'starting_grant',
            'auto_grant_' || NEW.id::TEXT,
            'Welcome to GAMEVERSE: 100,000 Free Starting Chips'
        )
        ON CONFLICT (idempotency_key) DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Automatic profile/wallet creation error for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 2. Attach Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill: If any existing users in auth.users are missing profile or wallet, create them now!
DO $$
DECLARE
    u RECORD;
BEGIN
    FOR u IN SELECT * FROM auth.users LOOP
        -- Ensure profile exists
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id) THEN
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
                is_online
            ) VALUES (
                u.id,
                COALESCE(
                    NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
                    NULLIF(TRIM(u.raw_user_meta_data->>'name'), ''),
                    NULLIF(TRIM(u.raw_user_meta_data->>'username'), ''),
                    split_part(u.email, '@', 1)
                ),
                public.generate_unique_player_id(),
                COALESCE(
                    NULLIF(TRIM(u.raw_user_meta_data->>'avatar_url'), ''),
                    NULLIF(TRIM(u.raw_user_meta_data->>'picture'), ''),
                    '👑'
                ),
                1, 0, 0, 0, 0, false
            )
            ON CONFLICT (id) DO NOTHING;
        END IF;

        -- Ensure wallet exists with 100,000 chips
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'player_wallets') THEN
            INSERT INTO public.player_wallets (user_id, balance)
            VALUES (u.id, 100000)
            ON CONFLICT (user_id) DO NOTHING;
        END IF;
    END LOOP;
END $$;
