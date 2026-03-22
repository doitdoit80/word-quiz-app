import { NextRequest, NextResponse } from 'next/server';
import { eq, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { wordbooks, words } from '@/lib/db/schema';
import { requireAuth } from '@/lib/admin';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;

  const userWordbooks = await db
    .select()
    .from(wordbooks)
    .where(eq(wordbooks.userId, auth.user.id))
    .orderBy(asc(wordbooks.sortOrder));

  // Fetch words for each wordbook
  const result = await Promise.all(
    userWordbooks.map(async (wb) => {
      const wbWords = await db
        .select()
        .from(words)
        .where(eq(words.wordbookId, wb.id))
        .orderBy(asc(words.sortOrder));

      return {
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
      };
    })
  );

  return NextResponse.json({ wordbooks: result, wordbookLimit: auth.user.wordbookLimit });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;

  const body = await request.json();
  const { id, name, isPreset, createdAt, words: wordList } = body;

  // Check wordbook limit
  const existing = await db
    .select({ id: wordbooks.id })
    .from(wordbooks)
    .where(eq(wordbooks.userId, auth.user.id));

  if (existing.length >= auth.user.wordbookLimit) {
    return NextResponse.json(
      { error: `단어장은 최대 ${auth.user.wordbookLimit}개까지 만들 수 있습니다.` },
      { status: 400 }
    );
  }

  // Get next sort order
  const sortOrder = existing.length;

  await db.insert(wordbooks).values({
    id,
    userId: auth.user.id,
    name,
    isPreset: isPreset ? 1 : 0,
    sortOrder,
    createdAt: createdAt || new Date().toISOString(),
  });

  // Insert words if provided
  if (wordList && wordList.length > 0) {
    await db.insert(words).values(
      wordList.map((w: { id: string; en: string; ko: string; example?: string; mnemonic?: string }, i: number) => ({
        id: w.id,
        wordbookId: id,
        en: w.en,
        ko: w.ko,
        example: w.example || null,
        mnemonic: w.mnemonic || null,
        sortOrder: i,
      }))
    );
  }

  return NextResponse.json({ ok: true });
}
