import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import {
  PlayerWallet,
  ChipTransaction,
  ChipRequest,
  AdminPlayerView,
} from './types';

const DEMO_WALLET_PREFIX = 'gameverse_demo_wallet_';
const DEMO_TX_PREFIX = 'gameverse_demo_tx_';
const DEMO_REQ_KEY = 'gameverse_demo_chip_requests';

/**
 * Gets or initializes a player's virtual chip wallet.
 * Guarantees that every new player receives 100,000 free virtual chips once.
 */
export async function getPlayerWallet(userId: string): Promise<PlayerWallet> {
  if (!isSupabaseConfigured()) {
    return getDemoWallet(userId);
  }

  const supabase = createClient();

  try {
    // 1. Try to fetch existing wallet
    const { data, error } = await supabase
      .from('player_wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data && !error) {
      return {
        id: data.id,
        userId: data.user_id,
        balance: Number(data.balance),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    // 2. If no wallet or initial load, invoke grant_starting_chips RPC
    const { data: grantData, error: grantError } = await supabase.rpc('grant_starting_chips', {
      p_user_id: userId,
    });

    if (grantData && !grantError) {
      return {
        userId,
        balance: Number(grantData.balance),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Fallback if RPC call failed
    return getDemoWallet(userId);
  } catch (err) {
    console.error('Failed to get player wallet from Supabase:', err);
    return getDemoWallet(userId);
  }
}

/**
 * Demo / Offline Wallet Handler (Ensures 100,000 starting grant idempotently)
 */
function getDemoWallet(userId: string): PlayerWallet {
  try {
    const key = `${DEMO_WALLET_PREFIX}${userId}`;
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;

    if (raw) {
      return JSON.parse(raw);
    }

    // First time player setup: grant exactly 100,000 virtual chips
    const startingWallet: PlayerWallet = {
      userId,
      balance: 100000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(startingWallet));

      // Record transaction
      const txKey = `${DEMO_TX_PREFIX}${userId}`;
      const startingTx: ChipTransaction = {
        id: `tx-start-${userId}`,
        userId,
        amount: 100000,
        balanceBefore: 0,
        balanceAfter: 100000,
        transactionType: 'starting_grant',
        idempotencyKey: `starting_grant_${userId}`,
        reason: 'Welcome to GAMEVERSE: 100,000 Free Virtual Starting Chips',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(txKey, JSON.stringify([startingTx]));
    }

    return startingWallet;
  } catch {
    return {
      userId,
      balance: 100000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Retrieves the full transaction ledger for a player.
 */
export async function getTransactionHistory(userId: string): Promise<ChipTransaction[]> {
  if (!isSupabaseConfigured()) {
    try {
      const txKey = `${DEMO_TX_PREFIX}${userId}`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(txKey) : null;
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('chip_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((t: any) => ({
      id: t.id,
      userId: t.user_id,
      amount: Number(t.amount),
      balanceBefore: Number(t.balance_before),
      balanceAfter: Number(t.balance_after),
      transactionType: t.transaction_type,
      referenceId: t.reference_id,
      idempotencyKey: t.idempotency_key,
      performedBy: t.performed_by,
      reason: t.reason,
      createdAt: t.created_at,
    }));
  } catch (err) {
    console.error('Failed to get transactions:', err);
    return [];
  }
}

/**
 * Submits a new chip request from a player to the admin.
 */
export async function submitChipRequest(
  userId: string,
  username: string,
  amount: number,
  message: string
): Promise<{ success: boolean; error?: string; request?: ChipRequest }> {
  if (amount <= 0 || amount > 1000000) {
    return { success: false, error: 'Requested amount must be between 1,000 and 1,000,000 virtual chips.' };
  }

  if (!isSupabaseConfigured()) {
    // Demo mode persistence
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(DEMO_REQ_KEY) : null;
      const list: ChipRequest[] = raw ? JSON.parse(raw) : [];

      const newReq: ChipRequest = {
        id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        requesterUserId: userId,
        requesterUsername: username,
        requestedAmount: Math.floor(amount),
        status: 'pending',
        requestMessage: message.trim() || 'Request for virtual chips',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      list.unshift(newReq);
      if (typeof window !== 'undefined') {
        localStorage.setItem(DEMO_REQ_KEY, JSON.stringify(list));
      }
      return { success: true, request: newReq };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('chip_requests')
      .insert({
        requester_user_id: userId,
        requested_amount: Math.floor(amount),
        status: 'pending',
        request_message: message.trim() || 'Request for virtual chips',
      })
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to submit chip request' };
    }

    return {
      success: true,
      request: {
        id: data.id,
        requesterUserId: data.requester_user_id,
        requestedAmount: Number(data.requested_amount),
        status: data.status,
        requestMessage: data.request_message,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error submitting request' };
  }
}

/**
 * Retrieves chip requests created by the current player.
 */
export async function getPlayerChipRequests(userId: string): Promise<ChipRequest[]> {
  if (!isSupabaseConfigured()) {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(DEMO_REQ_KEY) : null;
      const list: ChipRequest[] = raw ? JSON.parse(raw) : [];
      return list.filter((r) => r.requesterUserId === userId);
    } catch {
      return [];
    }
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('chip_requests')
      .select('*')
      .eq('requester_user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((r: any) => ({
      id: r.id,
      requesterUserId: r.requester_user_id,
      requestedAmount: Number(r.requested_amount),
      status: r.status,
      requestMessage: r.request_message,
      adminResponse: r.admin_response,
      reviewedBy: r.reviewed_by,
      reviewedAt: r.reviewed_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  } catch {
    return [];
  }
}

/**
 * ADMIN: Searches players for chip management.
 */
export async function adminSearchPlayers(query: string = ''): Promise<AdminPlayerView[]> {
  const q = query.toLowerCase().trim();

  if (!isSupabaseConfigured()) {
    // Demo accounts
    const demoPlayers: AdminPlayerView[] = [
      {
        userId: 'demo-user-1',
        username: 'CyberKnight_99',
        playerId: 'GV-849201',
        email: 'cyberknight@gameverse.gg',
        balance: 100000,
        level: 4,
        totalGames: 12,
        isAdmin: true,
        createdAt: '2026-10-28T12:00:00Z',
      },
      {
        userId: 'demo-user-2',
        username: 'NeonValkyrie',
        playerId: 'GV-774912',
        email: 'valkyrie@gameverse.gg',
        balance: 85000,
        level: 2,
        totalGames: 8,
        isAdmin: false,
        createdAt: '2026-10-29T15:30:00Z',
      },
      {
        userId: 'demo-user-3',
        username: 'ShadowRogue',
        playerId: 'GV-339104',
        email: 'shadow@gameverse.gg',
        balance: 240000,
        level: 6,
        totalGames: 26,
        isAdmin: false,
        createdAt: '2026-10-30T09:15:00Z',
      },
    ];

    if (!q) return demoPlayers;
    return demoPlayers.filter(
      (p) =>
        p.username.toLowerCase().includes(q) ||
        p.playerId.toLowerCase().includes(q) ||
        (p.email && p.email.toLowerCase().includes(q))
    );
  }

  const supabase = createClient();
  try {
    let req = supabase.from('profiles').select('*, player_wallets(balance)');
    if (q) {
      req = req.or(`username.ilike.%${q}%,player_id.ilike.%${q}%`);
    }

    const { data, error } = await req.limit(20);
    if (error || !data) return [];

    return data.map((p: any) => ({
      userId: p.id,
      username: p.username,
      playerId: p.player_id,
      avatarUrl: p.avatar_url,
      balance: p.player_wallets?.[0]?.balance ? Number(p.player_wallets[0].balance) : 100000,
      level: p.level || 1,
      totalGames: p.total_games || 0,
      isAdmin: Boolean(p.is_admin),
      createdAt: p.created_at,
    }));
  } catch {
    return [];
  }
}

/**
 * ADMIN: Atomically grants virtual chips to a player.
 */
export async function adminGrantChips(
  adminId: string,
  targetUserId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  if (amount <= 0 || amount > 10000000) {
    return { success: false, error: 'Amount must be between 1 and 10,000,000 virtual chips.' };
  }

  const idempotencyKey = `admin_grant_${Date.now()}_${targetUserId}_${Math.random().toString(36).substring(2, 6)}`;

  if (!isSupabaseConfigured()) {
    // Demo mode grant
    try {
      const key = `${DEMO_WALLET_PREFIX}${targetUserId}`;
      const wallet = getDemoWallet(targetUserId);
      const prevBal = wallet.balance;
      const newBal = prevBal + amount;

      wallet.balance = newBal;
      wallet.updatedAt = new Date().toISOString();
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(wallet));

        const txKey = `${DEMO_TX_PREFIX}${targetUserId}`;
        const raw = localStorage.getItem(txKey);
        const txList: ChipTransaction[] = raw ? JSON.parse(raw) : [];
        txList.unshift({
          id: `tx-${Date.now()}`,
          userId: targetUserId,
          amount,
          balanceBefore: prevBal,
          balanceAfter: newBal,
          transactionType: 'admin_grant',
          performedBy: adminId,
          reason: reason || 'Admin grant',
          idempotencyKey,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem(txKey, JSON.stringify(txList));
      }

      return { success: true, newBalance: newBal };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc('admin_grant_chips', {
      p_admin_id: adminId,
      p_target_user_id: targetUserId,
      p_amount: Math.floor(amount),
      p_reason: reason.trim() || 'Admin virtual chip grant',
      p_idempotency_key: idempotencyKey,
    });

    if (error || !data || !data.success) {
      return { success: false, error: error?.message || data?.error || 'Failed to grant chips' };
    }

    return { success: true, newBalance: Number(data.balance) };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error granting chips' };
  }
}

/**
 * ADMIN: Gets all pending chip requests for review.
 */
export async function adminGetPendingRequests(): Promise<ChipRequest[]> {
  if (!isSupabaseConfigured()) {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(DEMO_REQ_KEY) : null;
      const list: ChipRequest[] = raw ? JSON.parse(raw) : [];
      return list;
    } catch {
      return [];
    }
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('chip_requests')
      .select('*, profiles:requester_user_id(username, player_id)')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((r: any) => ({
      id: r.id,
      requesterUserId: r.requester_user_id,
      requesterUsername: r.profiles?.username || 'Player',
      requestedAmount: Number(r.requested_amount),
      status: r.status,
      requestMessage: r.request_message,
      adminResponse: r.admin_response,
      reviewedBy: r.reviewed_by,
      reviewedAt: r.reviewed_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  } catch {
    return [];
  }
}

/**
 * ADMIN: Approves or rejects a chip request.
 * Enforces atomic credit and idempotent state transition.
 */
export async function adminReviewRequest(
  adminId: string,
  requestId: string,
  action: 'approve' | 'reject',
  responseText: string = ''
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  if (!isSupabaseConfigured()) {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(DEMO_REQ_KEY) : null;
      const list: ChipRequest[] = raw ? JSON.parse(raw) : [];
      const item = list.find((r) => r.id === requestId);

      if (!item) return { success: false, error: 'Request not found' };
      if (item.status !== 'pending') return { success: false, error: `Request already ${item.status}` };

      item.status = action === 'approve' ? 'approved' : 'rejected';
      item.adminResponse = responseText;
      item.reviewedBy = adminId;
      item.reviewedAt = new Date().toISOString();
      item.updatedAt = new Date().toISOString();

      let targetNewBal: number | undefined;

      if (action === 'approve') {
        const wallet = getDemoWallet(item.requesterUserId);
        const prevBal = wallet.balance;
        const newBal = prevBal + item.requestedAmount;
        wallet.balance = newBal;
        targetNewBal = newBal;

        if (typeof window !== 'undefined') {
          localStorage.setItem(`${DEMO_WALLET_PREFIX}${item.requesterUserId}`, JSON.stringify(wallet));

          const txKey = `${DEMO_TX_PREFIX}${item.requesterUserId}`;
          const txRaw = localStorage.getItem(txKey);
          const txList: ChipTransaction[] = txRaw ? JSON.parse(txRaw) : [];
          txList.unshift({
            id: `tx-appr-${requestId}`,
            userId: item.requesterUserId,
            amount: item.requestedAmount,
            balanceBefore: prevBal,
            balanceAfter: newBal,
            transactionType: 'approved_request',
            referenceId: requestId,
            idempotencyKey: `req_approval_${requestId}`,
            performedBy: adminId,
            reason: responseText || `Approved request for ${item.requestedAmount} chips`,
            createdAt: new Date().toISOString(),
          });
          localStorage.setItem(txKey, JSON.stringify(txList));
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(DEMO_REQ_KEY, JSON.stringify(list));
      }

      return { success: true, newBalance: targetNewBal };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc('admin_review_chip_request', {
      p_admin_id: adminId,
      p_request_id: requestId,
      p_action: action,
      p_response: responseText.trim() || `${action === 'approve' ? 'Approved' : 'Rejected'} by admin`,
    });

    if (error || !data || !data.success) {
      return { success: false, error: error?.message || data?.error || 'Review operation failed' };
    }

    return {
      success: true,
      newBalance: data.new_balance ? Number(data.new_balance) : undefined,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error reviewing request' };
  }
}
