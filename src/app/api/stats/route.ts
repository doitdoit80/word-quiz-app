import { NextRequest, NextResponse } from 'next/server';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { wordStats } from '@/lib/db/schema';
import { requireAuth } from '@/lib/admin';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;

  const allStats = await db
    .select()
    .from(wordStats)
    .where(eq(wordStats.userId, auth.user.id));

  // Convert to Record<wordId, { correct, wrong, lastTested }>
  const statsMap: Record<string, { correct: number; wrong: number; lastTested?: string }> = {};
  for (const s of allStats) {
    statsMap[s.wordId] = {
      correct: s.correct,
      wrong: s.wrong,
      lastTested: s.lastTested || undefined,
    };
  }

  return NextResponse.json({ stats: statsMap });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;

  const { stats } = await request.json() as {
    stats: Record<string, { correct: number; wrong: number; lastTested?: string }>;
  };

  for (const [wordId, stat] of Object.entries(stats)) {
    const existing = await db
      .select()
      .from(wordStats)
      .where(and(eq(wordStats.userId, auth.user.id), eq(wordStats.wordId, wordId)))
      .get();

    if (existing) {
      await db
        .update(wordStats)
        .set({
          correct: stat.correct,
          wrong: stat.wrong,
          lastTested: stat.lastTested || null,
        })
        .where(eq(wordStats.id, existing.id));
    } else {
      await db.insert(wordStats).values({
        userId: auth.user.id,
        wordId,
        correct: stat.correct,
        wrong: stat.wrong,
        lastTested: stat.lastTested || null,
      });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;

  const { wordIds } = await request.json() as { wordIds: string[] };

  if (wordIds && wordIds.length > 0) {
    for (const wordId of wordIds) {
      await db.delete(wordStats).where(
        and(eq(wordStats.userId, auth.user.id), eq(wordStats.wordId, wordId))
      );
    }
  }

  return NextResponse.json({ ok: true });
}
