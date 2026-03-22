import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { wordbooks } from '@/lib/db/schema';
import { requireAuth } from '@/lib/admin';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;

  const { ids } = await request.json() as { ids: string[] };

  for (let i = 0; i < ids.length; i++) {
    await db.update(wordbooks).set({ sortOrder: i }).where(eq(wordbooks.id, ids[i]));
  }

  return NextResponse.json({ ok: true });
}
