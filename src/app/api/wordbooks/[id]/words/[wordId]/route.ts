import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { wordbooks, words, wordStats } from '@/lib/db/schema';
import { requireAuth } from '@/lib/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; wordId: string }> }
) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;

  const { id: wordbookId, wordId } = await params;

  // Verify ownership
  const wb = await db
    .select()
    .from(wordbooks)
    .where(and(eq(wordbooks.id, wordbookId), eq(wordbooks.userId, auth.user.id)))
    .get();

  if (!wb) {
    return NextResponse.json({ error: '단어장을 찾을 수 없습니다.' }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.en !== undefined) updates.en = body.en;
  if (body.ko !== undefined) updates.ko = body.ko;
  if (body.example !== undefined) updates.example = body.example || null;
  if (body.mnemonic !== undefined) updates.mnemonic = body.mnemonic || null;

  await db.update(words).set(updates).where(
    and(eq(words.id, wordId), eq(words.wordbookId, wordbookId))
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; wordId: string }> }
) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;

  const { id: wordbookId, wordId } = await params;

  // Verify ownership
  const wb = await db
    .select()
    .from(wordbooks)
    .where(and(eq(wordbooks.id, wordbookId), eq(wordbooks.userId, auth.user.id)))
    .get();

  if (!wb) {
    return NextResponse.json({ error: '단어장을 찾을 수 없습니다.' }, { status: 404 });
  }

  await db.delete(words).where(and(eq(words.id, wordId), eq(words.wordbookId, wordbookId)));
  await db.delete(wordStats).where(
    and(eq(wordStats.userId, auth.user.id), eq(wordStats.wordId, wordId))
  );

  return NextResponse.json({ ok: true });
}
