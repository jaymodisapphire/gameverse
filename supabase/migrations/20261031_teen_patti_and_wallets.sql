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
