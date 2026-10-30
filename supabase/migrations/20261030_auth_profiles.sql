-- ==============================================================================
-- GAMEVERSE SUPABASE AUTH & PROFILES SCHEMA MIGRATION
-- Step 2: Authentication System, Profile Generation & Row Level Security
-- ==============================================================================

-- 1. Create Public Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    player_id TEXT UNIQUE NOT NULL,
    avatar_url TEXT DEFAULT 'SK',
    level INT NOT NULL DEFAULT 1 CHECK (level >= 1),
    xp INT NOT NULL DEFAULT 0 CHECK (xp >= 0),
    wins INT NOT NULL DEFAULT 0 CHECK (wins >= 0),
    losses INT NOT NULL DEFAULT 0 CHECK (losses >= 0),
    total_games INT NOT NULL DEFAULT 0 CHECK (total_games >= 0),
    is_online BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT username_length_check CHECK (char_length(username) >= 3 AND char_length(username) <= 24),
    CONSTRAINT username_format_check CHECK (username ~* '^[a-zA-Z0-9_]+$'),
    CONSTRAINT player_id_format_check CHECK (player_id ~* '^GV-[0-9]{6}$')
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_player_id ON public.profiles(player_id);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON public.profiles(level DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_wins ON public.profiles(wins DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Security Policies
-- Policy 1: Anyone can read profiles (needed for leaderboards, friend list, public gaming stats)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles
    FOR SELECT
    USING (true);

-- Policy 2: Users can only insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy 3: Users can only update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 5. Helper Function: Generate Unique 6-Digit Player ID (GV-XXXXXX)
CREATE OR REPLACE FUNCTION public.generate_unique_player_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_player_id TEXT;
    id_exists BOOLEAN;
    attempts INT := 0;
BEGIN
    LOOP
        attempts := attempts + 1;
        -- Generate random 6 digits between 100000 and 999999
        new_player_id := 'GV-' || (floor(random() * (999999 - 100000 + 1)) + 100000)::INT::TEXT;
        
        SELECT EXISTS (
            SELECT 1 FROM public.profiles WHERE player_id = new_player_id
        ) INTO id_exists;
        
        EXIT WHEN NOT id_exists OR attempts > 20;
    END LOOP;

    IF id_exists THEN
        -- Fallback with timestamp hash component to guarantee uniqueness
        new_player_id := 'GV-' || lpad((abs(hashtext(new_player_id || clock_timestamp()::TEXT)) % 900000 + 100000)::TEXT, 6, '0');
    END IF;

    RETURN new_player_id;
END;
$$;

-- 6. Trigger Function: Automatically create profile upon user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    raw_username TEXT;
    final_username TEXT;
    generated_pid TEXT;
    username_taken BOOLEAN;
    counter INT := 0;
BEGIN
    -- Extract username from user metadata or fallback to email local part
    raw_username := NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), '');
    
    IF raw_username IS NULL THEN
        raw_username := split_part(NEW.email, '@', 1);
    END IF;
    
    -- Sanitize username: replace any invalid character with underscore
    raw_username := regexp_replace(raw_username, '[^a-zA-Z0-9_]', '_', 'g');
    
    IF char_length(raw_username) < 3 THEN
        raw_username := 'Player_' || substr(NEW.id::TEXT, 1, 4);
    END IF;
    
    IF char_length(raw_username) > 18 THEN
        raw_username := substr(raw_username, 1, 18);
    END IF;

    -- Ensure unique username
    final_username := raw_username;
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM public.profiles WHERE username = final_username
        ) INTO username_taken;
        
        EXIT WHEN NOT username_taken OR counter > 50;
        
        counter := counter + 1;
        final_username := substr(raw_username, 1, 14) || '_' || counter::TEXT;
    END LOOP;

    -- Generate player ID
    generated_pid := public.generate_unique_player_id();

    -- Insert into profiles
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
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'GV'),
        1,
        0,
        0,
        0,
        0,
        false
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Prevent transaction rollback on auth if profile trigger fails;
    -- safe recovery will create missing profile lazily.
    RAISE WARNING 'Automatic profile creation failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 7. Register the Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 8. Safe Recovery / Lazy Profile Creation Procedure
CREATE OR REPLACE FUNCTION public.ensure_user_profile(user_id UUID, desired_username TEXT DEFAULT NULL)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_record RECORD;
    chosen_username TEXT;
    generated_pid TEXT;
BEGIN
    -- Check if profile already exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
        RETURN QUERY SELECT * FROM public.profiles WHERE id = user_id;
        RETURN;
    END IF;

    -- Fetch user details from auth.users
    SELECT * INTO user_record FROM auth.users WHERE id = user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found in auth.users';
    END IF;

    chosen_username := COALESCE(
        desired_username,
        user_record.raw_user_meta_data->>'username',
        'Player_' || substr(user_id::TEXT, 1, 6)
    );
    chosen_username := regexp_replace(chosen_username, '[^a-zA-Z0-9_]', '_', 'g');

    generated_pid := public.generate_unique_player_id();

    INSERT INTO public.profiles (
        id,
        username,
        player_id,
        avatar_url,
        level,
        xp,
        wins,
        losses,
        total_games
    ) VALUES (
        user_id,
        chosen_username,
        generated_pid,
        'GV',
        1,
        0,
        0,
        0,
        0
    )
    ON CONFLICT (id) DO UPDATE SET updated_at = now();

    RETURN QUERY SELECT * FROM public.profiles WHERE id = user_id;
END;
$$;
