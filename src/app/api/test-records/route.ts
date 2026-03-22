import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { testRecords } from '@/lib/db/schema';
import { requireAuth } from '@/lib/admin';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;

  const records = await db
    .select()
    .from(testRecords)
    .where(eq(testRecords.userId, auth.user.id));

  return NextResponse.json({
    records: records.map((r) => ({
      id: r.id,
      wordBookId: r.wordbookId,
      wordBookName: r.wordbookName,
      date: r.date,
      score: r.score,
      total: r.total,
      wrongWordIds: JSON.parse(r.wrongWordIds),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;

  const body = await request.json();
  const { id, wordBookId, wordBookName, date, score, total, wrongWordIds } = body;

  await db.insert(testRecords).values({
    id,
    userId: auth.user.id,
    wordbookId: wordBookId,
    wordbookName: wordBookName,
    date,
    score,
    total,
    wrongWordIds: JSON.stringify(wrongWordIds),
  });

  return NextResponse.json({ ok: true });
}
