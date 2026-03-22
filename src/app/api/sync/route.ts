import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { wordbooks, words, wordStats, testRecords, conqueredPresets } from '@/lib/db/schema';
import { requireAuth } from '@/lib/admin';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;

  const userId = auth.user.id;
  const body = await request.json();
  const { wordBooks, wordStats: stats, testHistory, conqueredPresets: conquered } = body;

  try {
    await db.transaction(async (tx) => {
      // 1. Clear existing data
      const userWordbooks = await tx.select({ id: wordbooks.id }).from(wordbooks).where(eq(wordbooks.userId, userId));
      for (const wb of userWordbooks) {
        await tx.delete(words).where(eq(words.wordbookId, wb.id));
      }
      await tx.delete(wordbooks).where(eq(wordbooks.userId, userId));
      await tx.delete(wordStats).where(eq(wordStats.userId, userId));
      await tx.delete(testRecords).where(eq(testRecords.userId, userId));
      await tx.delete(conqueredPresets).where(eq(conqueredPresets.userId, userId));

      // 2. Insert wordbooks with words
      if (wordBooks && wordBooks.length > 0) {
        for (let i = 0; i < wordBooks.length; i++) {
          const wb = wordBooks[i];
          await tx.insert(wordbooks).values({
            id: wb.id,
            userId,
            name: wb.name,
            isPreset: wb.isPreset ? 1 : 0,
            sortOrder: i,
            createdAt: wb.createdAt || new Date().toISOString(),
          });

          if (wb.words && wb.words.length > 0) {
            await tx.insert(words).values(
              wb.words.map((w: { id: string; en: string; ko: string; example?: string; mnemonic?: string }, j: number) => ({
                id: w.id,
                wordbookId: wb.id,
                en: w.en,
                ko: w.ko,
                example: w.example || null,
                mnemonic: w.mnemonic || null,
                sortOrder: j,
              }))
            );
          }
        }
      }

      // 3. Insert stats
      if (stats && Object.keys(stats).length > 0) {
        for (const [wordId, stat] of Object.entries(stats) as [string, { correct: number; wrong: number; lastTested?: string }][]) {
          await tx.insert(wordStats).values({
            userId,
            wordId,
            correct: stat.correct,
            wrong: stat.wrong,
            lastTested: stat.lastTested || null,
          });
        }
      }

      // 4. Insert test records
      if (testHistory && testHistory.length > 0) {
        for (const record of testHistory) {
          await tx.insert(testRecords).values({
            id: record.id,
            userId,
            wordbookId: record.wordBookId,
            wordbookName: record.wordBookName,
            date: record.date,
            score: record.score,
            total: record.total,
            wrongWordIds: JSON.stringify(record.wrongWordIds),
          });
        }
      }

      // 5. Insert conquered presets
      if (conquered && conquered.length > 0) {
        for (const presetName of conquered) {
          try {
            await tx.insert(conqueredPresets).values({ userId, presetName });
          } catch {
            // ignore duplicates
          }
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Sync error:', err);
    return NextResponse.json({ error: '동기화에 실패했습니다.' }, { status: 500 });
  }
}
