import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, action, responseText } = body;

    if (!requestId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid parameters. Action must be approve or reject.' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        status: action === 'approve' ? 'approved' : 'rejected',
        message: 'Demo mode request reviewed',
      });
    }

    const isMasterAdminCookie =
      request.cookies.get('gameverse_admin_session')?.value === 'true';

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Verify admin access
    let isAuthorized = isMasterAdminCookie;
    let effectiveAdminId: string | null = user?.id || null;

    if (!isAuthorized && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, is_admin, role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.is_admin || profile?.role === 'admin') {
        isAuthorized = true;
        effectiveAdminId = profile.id;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized: Administrator privileges required.' },
        { status: 403 }
      );
    }

    // If master admin cookie, ensure we have an admin UUID for the audit column
    if (!effectiveAdminId) {
      const { data: anyAdmin } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_admin', true)
        .limit(1)
        .maybeSingle();
      effectiveAdminId = anyAdmin?.id || null;
    }

    // Call atomic stored procedure
    const { data, error } = await supabase.rpc('admin_review_chip_request', {
      p_admin_id: effectiveAdminId,
      p_request_id: requestId,
      p_action: action,
      p_response: (responseText || '').trim().substring(0, 200),
    });

    if (error) {
      // Direct fallback if RPC fails
      const { data: reqData } = await supabase
        .from('chip_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (reqData && reqData.status === 'pending') {
        if (action === 'approve') {
          // Credit user wallet
          const { data: currentWallet } = await supabase
            .from('player_wallets')
            .select('balance')
            .eq('user_id', reqData.requester_user_id)
            .maybeSingle();

          const prevBal = currentWallet ? Number(currentWallet.balance) : 0;
          const newBal = prevBal + Number(reqData.requested_amount);

          await supabase
            .from('player_wallets')
            .upsert({ user_id: reqData.requester_user_id, balance: newBal, updated_at: new Date().toISOString() });

          await supabase
            .from('chip_requests')
            .update({
              status: 'approved',
              admin_response: responseText || 'Approved by admin',
              reviewed_by: effectiveAdminId,
              reviewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', requestId);

          return NextResponse.json({ success: true, status: 'approved', new_balance: newBal });
        } else {
          await supabase
            .from('chip_requests')
            .update({
              status: 'rejected',
              admin_response: responseText || 'Rejected by admin',
              reviewed_by: effectiveAdminId,
              reviewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', requestId);

          return NextResponse.json({ success: true, status: 'rejected' });
        }
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data.success) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
