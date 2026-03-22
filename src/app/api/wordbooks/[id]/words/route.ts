import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { wordbooks, words } from '@/lib/db/schema';
import { requireAuth } from '@/lib/admin';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;

  const { id: wordbookId } = await params;

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
  const wordList = Array.isArray(body) ? body : [body];

  // Check word limit (100 per wordbook)
  const existing = await db.select({ id: words.id }).from(words).where(eq(words.wordbookId, wordbookId));
  if (existing.length + wordList.length > 100) {
    return NextResponse.json({ error: '단어장당 최대 100개까지 추가할 수 있습니다.' }, { status: 400 });
  }

  const startOrder = existing.length;
  await db.insert(words).values(
    wordList.map((w: { id: string; en: string; ko: string; example?: string; mnemonic?: string }, i: number) => ({
      id: w.id,
      wordbookId,
      en: w.en,
      ko: w.ko,
      example: w.example || null,
      mnemonic: w.mnemonic || null,
      sortOrder: startOrder + i,
    }))
  );

  return NextResponse.json({ ok: true });
}
