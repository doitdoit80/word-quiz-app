import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/admin';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const userId = parseInt(id, 10);
  const { amount } = await request.json();

  if (typeof amount !== 'number' || !Number.isInteger(amount)) {
    return NextResponse.json({ error: '올바른 수량을 입력해주세요.' }, { status: 400 });
  }

  const target = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!target) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  const newGems = Math.max(0, target.gems + amount);

  await db.update(users).set({ gems: newGems }).where(eq(users.id, userId));

  return NextResponse.json({ gems: newGems });
}
