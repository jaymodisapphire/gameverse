import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        granted: true,
        amount: 100000,
        balance: 100000,
        message: 'Demo mode starting chips granted',
      });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call atomic idempotent RPC
    const { data, error } = await supabase.rpc('grant_starting_chips', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Failed to grant starting chips:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Starting grant route error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
