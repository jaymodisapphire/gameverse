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
