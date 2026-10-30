import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateScoreIntegrity } from '@/lib/games/sessions';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const { gameSlug, score, durationSeconds } = body;

    if (!gameSlug || typeof score !== 'number' || typeof durationSeconds !== 'number') {
      return NextResponse.json({ error: 'Invalid payload parameters' }, { status: 400 });
    }

    // Anti-cheat verification
    const check = validateScoreIntegrity(gameSlug, score, durationSeconds);
    if (!check.valid) {
      return NextResponse.json(
        { error: 'Anti-cheat violation: ' + check.reason },
        { status: 422 }
      );
    }

    // Call stored procedure
    const { data, error } = await supabase.rpc('submit_verified_score', {
      p_user_id: user.id,
      p_game_slug: gameSlug,
      p_score: Math.floor(score),
      p_duration: Math.max(1, Math.floor(durationSeconds)),
    });

    if (error) {
      // Fallback manual upsert if stored procedure isn't installed yet
      const { data: currentScore } = await supabase
        .from('player_scores')
        .select('high_score')
        .eq('user_id', user.id)
        .eq('game_slug', gameSlug)
        .maybeSingle();

      const prevHigh = currentScore?.high_score || 0;
      const isNewHigh = score > prevHigh;

      await supabase.from('player_scores').upsert(
        {
          user_id: user.id,
          game_slug: gameSlug,
          high_score: Math.max(score, prevHigh),
          last_played_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,game_slug' }
      );

      await supabase.from('game_sessions').insert({
        user_id: user.id,
        game_slug: gameSlug,
        score: Math.floor(score),
        duration_seconds: Math.floor(durationSeconds),
        status: 'completed',
      });

      return NextResponse.json({ success: true, new_high: isNewHigh, score });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Score submission server error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error processing game score' },
      { status: 500 }
    );
  }
}
