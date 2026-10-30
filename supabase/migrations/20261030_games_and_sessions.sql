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
