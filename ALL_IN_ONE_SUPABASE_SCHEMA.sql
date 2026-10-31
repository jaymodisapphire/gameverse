-- ==============================================================================
-- GAMEVERSE MASTER CONSOLIDATED DATABASE SCHEMA & PROCEDURES
-- Complete All-in-One SQL Setup Script for Supabase PostgreSQL
-- ==============================================================================


-- >>>>>>>>>> FILE: supabase/migrations/20261030_auth_profiles.sql <<<<<<<<<<

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


-- >>>>>>>>>> FILE: supabase/migrations/20261030_games_and_sessions.sql <<<<<<<<<<

-- ==============================================================================
-- GAMEVERSE SUPABASE SCHEMA MIGRATION: STEP 3
-- In-Browser Games Catalog, Game Sessions, Player High Scores, & Favorites
-- ==============================================================================

-- 1. Game Categories
CREATE TABLE IF NOT EXISTS public.game_categories (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed Categories
INSERT INTO public.game_categories (slug, name, icon, description)
VALUES 
    ('arcade', 'Arcade', '🕹️', 'Fast-paced classic reflex and retro-style games'),
    ('action', 'Action & Shooter', '🚀', 'High-intensity survival and shooter games'),
    ('racing', 'Racing & Speed', '🏎️', 'High-speed cyber vehicles and obstacle dodging'),
    ('classic', 'Board & Classic', '🎲', 'Strategic board and puzzle challenges')
ON CONFLICT (slug) DO NOTHING;

-- 2. Games Catalog Table
CREATE TABLE IF NOT EXISTS public.games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT NOT NULL,
    category TEXT NOT NULL REFERENCES public.game_categories(slug),
    thumbnail_url TEXT,
    banner_url TEXT,
    accent_color TEXT DEFAULT '#8b5cf6',
    supported_inputs TEXT[] DEFAULT ARRAY['keyboard', 'touch'],
    engine TEXT NOT NULL DEFAULT 'html5-canvas',
    max_players INT DEFAULT 1,
    is_published BOOLEAN DEFAULT true,
    plays_count INT DEFAULT 0,
    rating NUMERIC(3, 2) DEFAULT 4.9,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed Initial Playable In-Browser Games
INSERT INTO public.games (
    slug, title, description, instructions, category, accent_color, supported_inputs, engine, is_published, plays_count, rating
) VALUES 
(
    'neon-snake',
    'Neon Snake',
    'Futuristic cyber-grid snake. Devour glowing quantum pellets, dodge laser borders, and build the ultimate high score chain.',
    'Use Arrow Keys or WASD to navigate. On mobile, use the on-screen D-Pad or swipe gestures. Collect quantum fruit to grow and multiply score.',
    'arcade',
    '#10b981',
    ARRAY['keyboard', 'touch'],
    'html5-canvas',
    true,
    14820,
    4.92
),
(
    'space-defender',
    'Space Defender',
    '2D arcade space shooter. Pilot your starfighter against advancing waves of alien drones, plasma cruisers, and asteroid clusters.',
    'Use Arrow Keys or WASD to move your starfighter. Press SPACE or Tap Shoot to unleash dual plasma cannons. Avoid incoming enemy fire.',
    'action',
    '#8b5cf6',
    ARRAY['keyboard', 'touch'],
    'html5-canvas',
    true,
    21940,
    4.95
),
(
    'neon-racer',
    'Neon Racer',
    'High-octane arcade cyber-highway racer. Weave through traffic, grab speed-boost batteries, and push your reaction speed to the limit.',
    'Use Left / Right Arrows or A / D to steer your cyber-car across lanes. Press Up / W to boost. Avoid traffic and track obstacles.',
    'racing',
    '#06b6d4',
    ARRAY['keyboard', 'touch'],
    'html5-canvas',
    true,
    18320,
    4.88
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    instructions = EXCLUDED.instructions;

-- 3. Game Sessions (Tracks every played match)
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_slug TEXT NOT NULL REFERENCES public.games(slug) ON DELETE CASCADE,
    score INT NOT NULL DEFAULT 0 CHECK (score >= 0),
    duration_seconds INT NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
    max_multiplier NUMERIC(4, 2) DEFAULT 1.0,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('active', 'completed', 'abandoned')),
    client_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Player High Scores (Aggregated personal bests)
CREATE TABLE IF NOT EXISTS public.player_scores (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_slug TEXT NOT NULL REFERENCES public.games(slug) ON DELETE CASCADE,
    high_score INT NOT NULL DEFAULT 0 CHECK (high_score >= 0),
    total_plays INT NOT NULL DEFAULT 1 CHECK (total_plays >= 1),
    last_played_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, game_slug)
);

-- 5. Player Favorites
CREATE TABLE IF NOT EXISTS public.player_favorites (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_slug TEXT NOT NULL REFERENCES public.games(slug) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, game_slug)
);

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_games_category ON public.games(category);
CREATE INDEX IF NOT EXISTS idx_games_plays ON public.games(plays_count DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_game ON public.game_sessions(game_slug);
CREATE INDEX IF NOT EXISTS idx_player_scores_high ON public.player_scores(game_slug, high_score DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.player_favorites(user_id);

-- 7. Row Level Security (RLS)
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_favorites ENABLE ROW LEVEL SECURITY;

-- Games policies: public read for published games
DROP POLICY IF EXISTS "Public can view published games" ON public.games;
CREATE POLICY "Public can view published games" ON public.games
    FOR SELECT USING (is_published = true);

-- Categories policies: public read
DROP POLICY IF EXISTS "Public can view categories" ON public.game_categories;
CREATE POLICY "Public can view categories" ON public.game_categories
    FOR SELECT USING (true);

-- Sessions policies: user can view and insert own sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.game_sessions;
CREATE POLICY "Users can view own sessions" ON public.game_sessions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.game_sessions;
CREATE POLICY "Users can insert own sessions" ON public.game_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Player scores policies: public read for leaderboards; users can update/insert own
DROP POLICY IF EXISTS "Public can view high scores" ON public.player_scores;
CREATE POLICY "Public can view high scores" ON public.player_scores
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can upsert own scores" ON public.player_scores;
CREATE POLICY "Users can upsert own scores" ON public.player_scores
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Favorites policies: user can view, insert, and delete own
DROP POLICY IF EXISTS "Users can manage favorites" ON public.player_favorites;
CREATE POLICY "Users can manage favorites" ON public.player_favorites
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 8. Stored Function: Anti-Cheat Score Submission Verification
CREATE OR REPLACE FUNCTION public.submit_verified_score(
    p_user_id UUID,
    p_game_slug TEXT,
    p_score INT,
    p_duration INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_max_allowed_score INT;
    v_new_high BOOLEAN := false;
    v_current_high INT := 0;
BEGIN
    -- Heuristic sanity check: Maximum plausible points per second based on game physics
    IF p_game_slug = 'neon-snake' THEN
        v_max_allowed_score := GREATEST(100, p_duration * 50);
    ELSIF p_game_slug = 'space-defender' THEN
        v_max_allowed_score := GREATEST(200, p_duration * 120);
    ELSIF p_game_slug = 'neon-racer' THEN
        v_max_allowed_score := GREATEST(150, p_duration * 80);
    ELSE
        v_max_allowed_score := GREATEST(100, p_duration * 100);
    END IF;

    -- Flag impossible scores
    IF p_score > v_max_allowed_score THEN
        RAISE EXCEPTION 'Score validation rejected: score rate exceeds physical gameplay limits';
    END IF;

    -- Record Game Session
    INSERT INTO public.game_sessions (user_id, game_slug, score, duration_seconds, status)
    VALUES (p_user_id, p_game_slug, p_score, p_duration, 'completed');

    -- Increment game plays count
    UPDATE public.games
    SET plays_count = plays_count + 1
    WHERE slug = p_game_slug;

    -- Check current personal high score
    SELECT high_score INTO v_current_high
    FROM public.player_scores
    WHERE user_id = p_user_id AND game_slug = p_game_slug;

    IF NOT FOUND THEN
        INSERT INTO public.player_scores (user_id, game_slug, high_score, total_plays, last_played_at)
        VALUES (p_user_id, p_game_slug, p_score, 1, now());
        v_new_high := true;
    ELSIF p_score > v_current_high THEN
        UPDATE public.player_scores
        SET high_score = p_score,
            total_plays = total_plays + 1,
            last_played_at = now()
        WHERE user_id = p_user_id AND game_slug = p_game_slug;
        v_new_high := true;
    ELSE
        UPDATE public.player_scores
        SET total_plays = total_plays + 1,
            last_played_at = now()
        WHERE user_id = p_user_id AND game_slug = p_game_slug;
    END IF;

    -- Update total user games played in profiles
    UPDATE public.profiles
    SET total_games = total_games + 1,
        xp = xp + (p_score / 10)::INT + 25,
        updated_at = now()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'new_high', v_new_high,
        'score', p_score,
        'previous_high', v_current_high
    );
END;
$$;


-- >>>>>>>>>> FILE: supabase/migrations/20261031_teen_patti_and_wallets.sql <<<<<<<<<<

-- ==============================================================================
-- GAMEVERSE SUPABASE SCHEMA MIGRATION: STEP 4
-- TEEN PATTI MULTIPLAYER, VIRTUAL CHIP WALLETS & ADMIN CHIP MANAGEMENT
-- ==============================================================================

-- 1. Ensure Admin Role Column on Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Create admin check helper function
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = p_user_id), false);
$$;

-- 2. Player Virtual Chip Wallets Table
CREATE TABLE IF NOT EXISTS public.player_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_player_wallets_user ON public.player_wallets(user_id);

-- 3. Virtual Chip Transactions Ledger
CREATE TABLE IF NOT EXISTS public.chip_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    balance_before BIGINT NOT NULL CHECK (balance_before >= 0),
    balance_after BIGINT NOT NULL CHECK (balance_after >= 0),
    transaction_type TEXT NOT NULL CHECK (
        transaction_type IN ('starting_grant', 'admin_grant', 'approved_request', 'game_buyin', 'game_payout', 'refund')
    ),
    reference_id TEXT,
    idempotency_key TEXT UNIQUE,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chip_transactions_user ON public.chip_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_chip_transactions_created ON public.chip_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chip_transactions_type ON public.chip_transactions(transaction_type);

-- 4. Player Chip Requests Table
CREATE TABLE IF NOT EXISTS public.chip_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_amount BIGINT NOT NULL CHECK (requested_amount > 0 AND requested_amount <= 1000000),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    request_message TEXT,
    admin_response TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chip_requests_requester ON public.chip_requests(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_chip_requests_status ON public.chip_requests(status);
CREATE INDEX IF NOT EXISTS idx_chip_requests_created ON public.chip_requests(created_at DESC);

-- 5. Teen Patti Tables
CREATE TABLE IF NOT EXISTS public.teen_patti_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT UNIQUE NOT NULL,
    host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    table_type TEXT NOT NULL DEFAULT 'public' CHECK (table_type IN ('public', 'private')),
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished', 'closed')),
    boot_amount BIGINT NOT NULL DEFAULT 1000 CHECK (boot_amount > 0),
    max_players INT NOT NULL DEFAULT 6 CHECK (max_players >= 2 AND max_players <= 6),
    current_match_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tp_tables_room ON public.teen_patti_tables(room_code);
CREATE INDEX IF NOT EXISTS idx_tp_tables_status ON public.teen_patti_tables(status);

-- 6. Teen Patti Table Players (Seats)
CREATE TABLE IF NOT EXISTS public.teen_patti_table_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES public.teen_patti_tables(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seat_number INT NOT NULL CHECK (seat_number >= 0 AND seat_number <= 5),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sitting_out', 'left')),
    chip_stack BIGINT NOT NULL DEFAULT 0,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_table_seat UNIQUE (table_id, seat_number),
    CONSTRAINT unique_table_user UNIQUE (table_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tp_table_players ON public.teen_patti_table_players(table_id);

-- 7. Teen Patti Matches
CREATE TABLE IF NOT EXISTS public.teen_patti_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES public.teen_patti_tables(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'betting' CHECK (status IN ('dealing', 'betting', 'showdown', 'settled', 'cancelled')),
    current_turn_user_id UUID REFERENCES auth.users(id),
    pot_amount BIGINT NOT NULL DEFAULT 0 CHECK (pot_amount >= 0),
    current_stake BIGINT NOT NULL DEFAULT 1000,
    dealer_seat INT NOT NULL DEFAULT 0,
    round_number INT NOT NULL DEFAULT 1,
    game_state_version INT NOT NULL DEFAULT 1,
    winner_user_id UUID REFERENCES auth.users(id),
    winning_hand_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tp_matches_table ON public.teen_patti_matches(table_id);

-- 8. Teen Patti Match Hands (Private Player Cards)
CREATE TABLE IF NOT EXISTS public.teen_patti_match_hands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.teen_patti_matches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cards JSONB NOT NULL,
    is_seen BOOLEAN NOT NULL DEFAULT false,
    has_folded BOOLEAN NOT NULL DEFAULT false,
    current_bet BIGINT NOT NULL DEFAULT 0,
    seat_number INT NOT NULL,
    revealed_at_showdown BOOLEAN NOT NULL DEFAULT false,
    hand_rank_name TEXT,
    hand_score INT,
    CONSTRAINT unique_match_user_hand UNIQUE (match_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tp_match_hands ON public.teen_patti_match_hands(match_id, user_id);

-- 9. Teen Patti Game Events (Public Broadcast Log)
CREATE TABLE IF NOT EXISTS public.teen_patti_game_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.teen_patti_matches(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    public_event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tp_events_match ON public.teen_patti_game_events(match_id, created_at ASC);

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.player_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chip_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chip_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teen_patti_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teen_patti_table_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teen_patti_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teen_patti_match_hands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teen_patti_game_events ENABLE ROW LEVEL SECURITY;

-- player_wallets: Users read own wallet. Admins read all. Direct writes revoked.
DROP POLICY IF EXISTS "Users can read own wallet" ON public.player_wallets;
CREATE POLICY "Users can read own wallet"
    ON public.player_wallets FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- chip_transactions: Users read own transactions. Admins read all.
DROP POLICY IF EXISTS "Users can read own chip transactions" ON public.chip_transactions;
CREATE POLICY "Users can read own chip transactions"
    ON public.chip_transactions FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- chip_requests: Users read own requests. Admins read all. Users can insert pending requests.
DROP POLICY IF EXISTS "Users can read own chip requests" ON public.chip_requests;
CREATE POLICY "Users can read own chip requests"
    ON public.chip_requests FOR SELECT
    USING (auth.uid() = requester_user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can submit chip requests" ON public.chip_requests;
CREATE POLICY "Users can submit chip requests"
    ON public.chip_requests FOR INSERT
    WITH CHECK (auth.uid() = requester_user_id AND status = 'pending');

-- teen_patti_tables: Anyone authenticated can read active/waiting tables.
DROP POLICY IF EXISTS "Public tables viewable by authenticated users" ON public.teen_patti_tables;
CREATE POLICY "Public tables viewable by authenticated users"
    ON public.teen_patti_tables FOR SELECT
    USING (true);

-- teen_patti_table_players: Viewable by all players on table.
DROP POLICY IF EXISTS "Table players viewable by everyone" ON public.teen_patti_table_players;
CREATE POLICY "Table players viewable by everyone"
    ON public.teen_patti_table_players FOR SELECT
    USING (true);

-- teen_patti_matches: Public match state viewable by all players.
DROP POLICY IF EXISTS "Matches viewable by everyone" ON public.teen_patti_matches;
CREATE POLICY "Matches viewable by everyone"
    ON public.teen_patti_matches FOR SELECT
    USING (true);

-- teen_patti_match_hands: CRITICAL CARD PRIVACY POLICY!
-- Users can ONLY see their own cards OR cards revealed at showdown!
DROP POLICY IF EXISTS "Players can only view their own cards or revealed showdown hands" ON public.teen_patti_match_hands;
CREATE POLICY "Players can only view their own cards or revealed showdown hands"
    ON public.teen_patti_match_hands FOR SELECT
    USING (auth.uid() = user_id OR revealed_at_showdown = true);

-- teen_patti_game_events: Public event log viewable by everyone on match.
DROP POLICY IF EXISTS "Game events viewable by match participants" ON public.teen_patti_game_events;
CREATE POLICY "Game events viewable by match participants"
    ON public.teen_patti_game_events FOR SELECT
    USING (true);

-- ==============================================================================
-- 11. ATOMIC PROCEDURES (RPCs) FOR SECURE WALLET OPERATIONS
-- ==============================================================================

-- Procedure 1: Grant 100,000 Starting Virtual Chips (Idempotent)
CREATE OR REPLACE FUNCTION public.grant_starting_chips(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet RECORD;
    v_idempotency_key TEXT := 'starting_grant_' || p_user_id::text;
    v_already_granted BOOLEAN;
    v_starting_amount BIGINT := 100000;
BEGIN
    -- Check if starting grant was already recorded
    SELECT EXISTS (
        SELECT 1 FROM public.chip_transactions 
        WHERE idempotency_key = v_idempotency_key
    ) INTO v_already_granted;

    IF v_already_granted THEN
        -- Return current balance without double crediting
        SELECT balance INTO v_wallet FROM public.player_wallets WHERE user_id = p_user_id;
        RETURN jsonb_build_object(
            'success', true,
            'granted', false,
            'message', 'Starting chips already granted',
            'balance', COALESCE(v_wallet.balance, 0)
        );
    END IF;

    -- Ensure wallet exists with row lock
    INSERT INTO public.player_wallets (user_id, balance)
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- Lock wallet row
    SELECT * INTO v_wallet FROM public.player_wallets WHERE user_id = p_user_id FOR UPDATE;

    -- Credit 100,000 chips
    UPDATE public.player_wallets
    SET balance = balance + v_starting_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- Insert ledger transaction
    INSERT INTO public.chip_transactions (
        user_id,
        amount,
        balance_before,
        balance_after,
        transaction_type,
        idempotency_key,
        reason
    ) VALUES (
        p_user_id,
        v_starting_amount,
        v_wallet.balance,
        v_wallet.balance + v_starting_amount,
        'starting_grant',
        v_idempotency_key,
        'Welcome to GAMEVERSE: 100,000 Free Virtual Starting Chips'
    );

    RETURN jsonb_build_object(
        'success', true,
        'granted', true,
        'amount', v_starting_amount,
        'balance', v_wallet.balance + v_starting_amount
    );
END;
$$;

-- Procedure 2: Admin Grant Chips with Idempotency & Audit
CREATE OR REPLACE FUNCTION public.admin_grant_chips(
    p_admin_id UUID,
    p_target_user_id UUID,
    p_amount BIGINT,
    p_reason TEXT,
    p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_wallet RECORD;
    v_already_done BOOLEAN;
BEGIN
    -- Verify admin role
    SELECT public.is_admin(p_admin_id) INTO v_is_admin;
    IF NOT v_is_admin THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin privileges required.');
    END IF;

    IF p_amount <= 0 OR p_amount > 10000000 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid chip amount. Must be between 1 and 10,000,000.');
    END IF;

    -- Idempotency check
    IF p_idempotency_key IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.chip_transactions WHERE idempotency_key = p_idempotency_key
        ) INTO v_already_done;

        IF v_already_done THEN
            SELECT balance INTO v_wallet FROM public.player_wallets WHERE user_id = p_target_user_id;
            RETURN jsonb_build_object(
                'success', true,
                'duplicate', true,
                'message', 'Transaction already processed.',
                'balance', COALESCE(v_wallet.balance, 0)
            );
        END IF;
    END IF;

    -- Ensure target wallet exists
    INSERT INTO public.player_wallets (user_id, balance)
    VALUES (p_target_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- Lock target wallet
    SELECT * INTO v_wallet FROM public.player_wallets WHERE user_id = p_target_user_id FOR UPDATE;

    -- Update balance
    UPDATE public.player_wallets
    SET balance = balance + p_amount,
        updated_at = now()
    WHERE user_id = p_target_user_id;

    -- Record transaction
    INSERT INTO public.chip_transactions (
        user_id,
        amount,
        balance_before,
        balance_after,
        transaction_type,
        idempotency_key,
        performed_by,
        reason
    ) VALUES (
        p_target_user_id,
        p_amount,
        v_wallet.balance,
        v_wallet.balance + p_amount,
        'admin_grant',
        p_idempotency_key,
        p_admin_id,
        COALESCE(p_reason, 'Admin virtual chip grant')
    );

    RETURN jsonb_build_object(
        'success', true,
        'amount', p_amount,
        'balance', v_wallet.balance + p_amount
    );
END;
$$;

-- Procedure 3: Admin Review Chip Request (Approve or Reject Atomically)
CREATE OR REPLACE FUNCTION public.admin_review_chip_request(
    p_admin_id UUID,
    p_request_id UUID,
    p_action TEXT,
    p_response TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_req RECORD;
    v_wallet RECORD;
    v_idempotency_key TEXT;
BEGIN
    SELECT public.is_admin(p_admin_id) INTO v_is_admin;
    IF NOT v_is_admin THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin privileges required.');
    END IF;

    IF p_action NOT IN ('approve', 'reject') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid action. Must be approve or reject.');
    END IF;

    -- Lock request row to prevent race conditions or double approval
    SELECT * INTO v_req FROM public.chip_requests WHERE id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Chip request not found.');
    END IF;

    IF v_req.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request has already been ' || v_req.status);
    END IF;

    IF p_action = 'reject' THEN
        UPDATE public.chip_requests
        SET status = 'rejected',
            admin_response = p_response,
            reviewed_by = p_admin_id,
            reviewed_at = now(),
            updated_at = now()
        WHERE id = p_request_id;

        RETURN jsonb_build_object('success', true, 'status', 'rejected');
    END IF;

    -- Action is approve: Credit chips atomically
    v_idempotency_key := 'req_approval_' || p_request_id::text;

    -- Ensure target wallet exists
    INSERT INTO public.player_wallets (user_id, balance)
    VALUES (v_req.requester_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- Lock target wallet
    SELECT * INTO v_wallet FROM public.player_wallets WHERE user_id = v_req.requester_user_id FOR UPDATE;

    -- Credit balance
    UPDATE public.player_wallets
    SET balance = balance + v_req.requested_amount,
        updated_at = now()
    WHERE user_id = v_req.requester_user_id;

    -- Insert ledger entry
    INSERT INTO public.chip_transactions (
        user_id,
        amount,
        balance_before,
        balance_after,
        transaction_type,
        reference_id,
        idempotency_key,
        performed_by,
        reason
    ) VALUES (
        v_req.requester_user_id,
        v_req.requested_amount,
        v_wallet.balance,
        v_wallet.balance + v_req.requested_amount,
        'approved_request',
        p_request_id::text,
        v_idempotency_key,
        p_admin_id,
        COALESCE(p_response, 'Approved chip request of ' || v_req.requested_amount || ' chips')
    );

    -- Mark request as approved
    UPDATE public.chip_requests
    SET status = 'approved',
        admin_response = p_response,
        reviewed_by = p_admin_id,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = p_request_id;

    RETURN jsonb_build_object(
        'success', true,
        'status', 'approved',
        'credited', v_req.requested_amount,
        'new_balance', v_wallet.balance + v_req.requested_amount
    );
END;
$$;


-- >>>>>>>>>> FILE: supabase/migrations/20261031_security_hardening.sql <<<<<<<<<<

-- ==============================================================================
-- GAMEVERSE SUPABASE SCHEMA MIGRATION: STEP 5
-- SECURITY HARDENING: REVOKE UNPRIVILEGED RPC EXECUTION & VALIDATE auth.uid()
-- ==============================================================================

-- 1. Revoke public and anon execution rights from admin stored procedures
REVOKE EXECUTE ON FUNCTION public.admin_grant_chips(UUID, UUID, BIGINT, TEXT, TEXT) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_review_chip_request(UUID, UUID, TEXT, TEXT) FROM anon, public;

-- 2. Allow execution only to authenticated callers
GRANT EXECUTE ON FUNCTION public.admin_grant_chips(UUID, UUID, BIGINT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_chip_request(UUID, UUID, TEXT, TEXT) TO authenticated;

-- 3. Update admin_grant_chips to strictly verify auth.uid()
CREATE OR REPLACE FUNCTION public.admin_grant_chips(
    p_admin_id UUID,
    p_target_user_id UUID,
    p_amount BIGINT,
    p_reason TEXT,
    p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_wallet RECORD;
    v_already_done BOOLEAN;
BEGIN
    -- SECURE CHECK: Caller must be authenticated AND must be an admin
    IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Forbidden: Authenticated administrator session required.');
    END IF;

    IF p_amount <= 0 OR p_amount > 10000000 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid chip amount. Must be between 1 and 10,000,000.');
    END IF;

    -- Idempotency check
    IF p_idempotency_key IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.chip_transactions WHERE idempotency_key = p_idempotency_key
        ) INTO v_already_done;

        IF v_already_done THEN
            SELECT balance INTO v_wallet FROM public.player_wallets WHERE user_id = p_target_user_id;
            RETURN jsonb_build_object(
                'success', true,
                'duplicate', true,
                'message', 'Transaction already processed.',
                'balance', COALESCE(v_wallet.balance, 0)
            );
        END IF;
    END IF;

    -- Ensure target wallet exists
    INSERT INTO public.player_wallets (user_id, balance)
    VALUES (p_target_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- Lock target wallet
    SELECT * INTO v_wallet FROM public.player_wallets WHERE user_id = p_target_user_id FOR UPDATE;

    -- Update balance
    UPDATE public.player_wallets
    SET balance = balance + p_amount,
        updated_at = now()
    WHERE user_id = p_target_user_id;

    -- Record ledger transaction
    INSERT INTO public.chip_transactions (
        user_id,
        amount,
        balance_before,
        balance_after,
        transaction_type,
        idempotency_key,
        performed_by,
        reason
    ) VALUES (
        p_target_user_id,
        p_amount,
        v_wallet.balance,
        v_wallet.balance + p_amount,
        'admin_grant',
        p_idempotency_key,
        auth.uid(),
        COALESCE(p_reason, 'Admin virtual chip grant')
    );

    RETURN jsonb_build_object(
        'success', true,
        'amount', p_amount,
        'balance', v_wallet.balance + p_amount
    );
END;
$$;

-- 4. Update admin_review_chip_request to strictly verify auth.uid()
CREATE OR REPLACE FUNCTION public.admin_review_chip_request(
    p_admin_id UUID,
    p_request_id UUID,
    p_action TEXT,
    p_response TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_req RECORD;
    v_wallet RECORD;
    v_idempotency_key TEXT;
BEGIN
    -- SECURE CHECK: Caller must be authenticated AND must be an admin
    IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Forbidden: Authenticated administrator session required.');
    END IF;

    IF p_action NOT IN ('approve', 'reject') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid action. Must be approve or reject.');
    END IF;

    -- Lock request row
    SELECT * INTO v_req FROM public.chip_requests WHERE id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Chip request not found.');
    END IF;

    IF v_req.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request has already been ' || v_req.status);
    END IF;

    IF p_action = 'reject' THEN
        UPDATE public.chip_requests
        SET status = 'rejected',
            admin_response = p_response,
            reviewed_by = auth.uid(),
            reviewed_at = now(),
            updated_at = now()
        WHERE id = p_request_id;

        RETURN jsonb_build_object('success', true, 'status', 'rejected');
    END IF;

    -- Action is approve: Credit chips atomically
    v_idempotency_key := 'req_approval_' || p_request_id::text;

    INSERT INTO public.player_wallets (user_id, balance)
    VALUES (v_req.requester_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT * INTO v_wallet FROM public.player_wallets WHERE user_id = v_req.requester_user_id FOR UPDATE;

    UPDATE public.player_wallets
    SET balance = balance + v_req.requested_amount,
        updated_at = now()
    WHERE user_id = v_req.requester_user_id;

    INSERT INTO public.chip_transactions (
        user_id,
        amount,
        balance_before,
        balance_after,
        transaction_type,
        reference_id,
        idempotency_key,
        performed_by,
        reason
    ) VALUES (
        v_req.requester_user_id,
        v_req.requested_amount,
        v_wallet.balance,
        v_wallet.balance + v_req.requested_amount,
        'approved_request',
        p_request_id::text,
        v_idempotency_key,
        auth.uid(),
        COALESCE(p_response, 'Approved chip request of ' || v_req.requested_amount || ' chips')
    );

    UPDATE public.chip_requests
    SET status = 'approved',
        admin_response = p_response,
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        updated_at = now()
    WHERE id = p_request_id;

    RETURN jsonb_build_object(
        'success', true,
        'status', 'approved',
        'credited', v_req.requested_amount,
        'new_balance', v_wallet.balance + v_req.requested_amount
    );
END;
$$;

