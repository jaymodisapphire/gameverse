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

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    // Server-side check if user has admin privileges
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profErr || !profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Administrator privileges required.' },
        { status: 403 }
      );
    }

    // Call atomic stored procedure
    const finalKey =
      idempotencyKey || `admin_grant_${Date.now()}_${targetUserId}_${Math.random().toString(36).substring(2, 6)}`;

    const { data, error } = await supabase.rpc('admin_grant_chips', {
      p_admin_id: user.id,
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
