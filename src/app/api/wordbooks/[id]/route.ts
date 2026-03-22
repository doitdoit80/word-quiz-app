import { NextRequest, NextResponse } from 'next/server';
import { eq, and, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { wordbooks, words, wordStats, testRecords } from '@/lib/db/schema';
import { requireAuth } from '@/lib/admin';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  const wb = await db
    .select()
    .from(wordbooks)
    .where(and(eq(wordbooks.id, id), eq(wordbooks.userId, auth.user.id)))
    .get();

  if (!wb) {
    return NextResponse.json({ error: '단어장을 찾을 수 없습니다.' }, { status: 404 });
  }

  const wbWords = await db
    .select()
    .from(words)
    .where(eq(words.wordbookId, id))
    .orderBy(asc(words.sortOrder));

  return NextResponse.json({
    id: wb.id,
    name: wb.name,
    isPreset: wb.isPreset === 1,
    createdAt: wb.createdAt,
    words: wbWords.map((w) => ({
      id: w.id,
      en: w.en,
      ko: w.ko,
      example: w.example || undefined,
      mnemonic: w.mnemonic || undefined,
    })),
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const body = await request.json();

  const wb = await db
    .select()
    .from(wordbooks)
    .where(and(eq(wordbooks.id, id), eq(wordbooks.userId, auth.user.id)))
    .get();

  if (!wb) {
    return NextResponse.json({ error: '단어장을 찾을 수 없습니다.' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;

  if (Object.keys(updates).length > 0) {
    await db.update(wordbooks).set(updates).where(eq(wordbooks.id, id));
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  const wb = await db
    .select()
    .from(wordbooks)
    .where(and(eq(wordbooks.id, id), eq(wordbooks.userId, auth.user.id)))
    .get();

  if (!wb) {
    return NextResponse.json({ error: '단어장을 찾을 수 없습니다.' }, { status: 404 });
  }

  // Get word IDs for stat cleanup
  const wbWords = await db.select({ id: words.id }).from(words).where(eq(words.wordbookId, id));
  const wordIds = wbWords.map((w) => w.id);

  // Delete words
  await db.delete(words).where(eq(words.wordbookId, id));

  // Delete stats for those words
  if (wordIds.length > 0) {
    for (const wordId of wordIds) {
      await db.delete(wordStats).where(
        and(eq(wordStats.userId, auth.user.id), eq(wordStats.wordId, wordId))
      );
    }
  }

  // Delete test records for this wordbook
  await db.delete(testRecords).where(
    and(eq(testRecords.userId, auth.user.id), eq(testRecords.wordbookId, id))
  );

  // Delete wordbook
  await db.delete(wordbooks).where(eq(wordbooks.id, id));

  return NextResponse.json({ ok: true });
}
