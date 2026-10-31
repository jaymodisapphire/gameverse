import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      const isMasterAdminCookie =
        request.cookies.get('gameverse_admin_session')?.value === 'true';
      if (!isMasterAdminCookie) {
        return NextResponse.json(
          { error: 'Unauthorized: Demo administrator session required.' },
          { status: 403 }
        );
      }
      return NextResponse.json({ requests: [] });
    }

    const isMasterAdminCookie =
      request.cookies.get('gameverse_admin_session')?.value === 'true';

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let isAuthorized = isMasterAdminCookie;
    if (!isAuthorized && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.is_admin || profile?.role === 'admin') {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: Administrator privileges required.' },
        { status: 403 }
      );
    }

    // Fetch chip requests
    const { data: requests, error } = await supabase
      .from('chip_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !requests) {
      return NextResponse.json({ requests: [] });
    }

    // Fetch requester profiles
    const userIds = Array.from(new Set(requests.map((r) => r.requester_user_id)));
    const profileMap = new Map<string, { username: string; player_id: string }>();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, player_id')
        .in('id', userIds);

      if (profiles) {
        profiles.forEach((p) => profileMap.set(p.id, p));
      }
    }

    const formatted = requests.map((r) => ({
      id: r.id,
      requesterUserId: r.requester_user_id,
      requesterUsername: profileMap.get(r.requester_user_id)?.username || 'Player',
      requesterPlayerId: profileMap.get(r.requester_user_id)?.player_id || 'GV-000000',
      requestedAmount: Number(r.requested_amount),
      status: r.status,
      requestMessage: r.request_message,
      adminResponse: r.admin_response,
      reviewedBy: r.reviewed_by,
      reviewedAt: r.reviewed_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({ requests: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
