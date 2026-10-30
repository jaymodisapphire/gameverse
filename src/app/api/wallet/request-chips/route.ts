import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, message } = body;

    if (typeof amount !== 'number' || amount <= 0 || amount > 1000000) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be between 1,000 and 1,000,000 virtual chips.' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        request: {
          id: `req-${Date.now()}`,
          requestedAmount: amount,
          status: 'pending',
          requestMessage: message || 'Bonus chips request',
          createdAt: new Date().toISOString(),
        },
      });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Authentication required.' }, { status: 401 });
    }

    // Check rate limit: user cannot have more than 3 pending requests
    const { count, error: countErr } = await supabase
      .from('chip_requests')
      .select('*', { count: 'exact', head: true })
      .eq('requester_user_id', user.id)
      .eq('status', 'pending');

    if (count && count >= 3) {
      return NextResponse.json(
        { error: 'You already have 3 pending requests. Please wait for an admin to review them.' },
        { status: 429 }
      );
    }

    const { data, error } = await supabase
      .from('chip_requests')
      .insert({
        requester_user_id: user.id,
        requested_amount: Math.floor(amount),
        status: 'pending',
        request_message: (message || '').trim().substring(0, 300),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, request: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
