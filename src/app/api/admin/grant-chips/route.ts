import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetUserId, amount, reason, idempotencyKey } = body;

    if (!targetUserId || typeof amount !== 'number' || amount <= 0 || amount > 10000000) {
      return NextResponse.json(
        { error: 'Invalid parameters. Amount must be between 1 and 10,000,000.' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        amount,
        balance: 100000 + amount,
        message: 'Demo mode grant committed',
      });
    }

    const isMasterAdminCookie =
      request.cookies.get('gameverse_admin_session')?.value === 'true';

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let isAuthorized = isMasterAdminCookie;
    let effectiveAdminId: string | null = null;

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.is_admin) {
        isAuthorized = true;
        effectiveAdminId = user.id;
      }
    } else if (isMasterAdminCookie) {
      const { data: adminProf } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_admin', true)
        .maybeSingle();

      effectiveAdminId = adminProf?.id || '932e9f53-0e8b-4447-a59e-c98fd7b324d0';
    }

    if (!isAuthorized || !effectiveAdminId) {
      return NextResponse.json(
        { error: 'Forbidden: Administrator privileges required.' },
        { status: 403 }
      );
    }

    // Call atomic stored procedure
    const finalKey =
      idempotencyKey || `admin_grant_${Date.now()}_${targetUserId}_${Math.random().toString(36).substring(2, 6)}`;

    const { data, error } = await supabase.rpc('admin_grant_chips', {
      p_admin_id: effectiveAdminId,
      p_target_user_id: targetUserId,
      p_amount: Math.floor(amount),
      p_reason: (reason || 'Admin virtual chip grant').trim().substring(0, 200),
      p_idempotency_key: finalKey,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data.success) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
