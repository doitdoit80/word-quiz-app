import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/admin';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const userId = parseInt(id, 10);

  if (auth.admin.id === userId) {
    return NextResponse.json({ error: '자기 자신은 삭제할 수 없습니다.' }, { status: 400 });
  }

  const target = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!target) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  await db.delete(users).where(eq(users.id, userId));
  return NextResponse.json({ ok: true });
}
