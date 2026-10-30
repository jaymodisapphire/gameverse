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

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    // Check admin permissions server-side
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
    const { data, error } = await supabase.rpc('admin_review_chip_request', {
      p_admin_id: user.id,
      p_request_id: requestId,
      p_action: action,
      p_response: (responseText || '').trim().substring(0, 200),
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
