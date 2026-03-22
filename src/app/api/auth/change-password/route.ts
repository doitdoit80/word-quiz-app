import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: '새 비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });
    }

    const user = await db.select().from(users).where(eq(users.id, payload.userId)).get();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, { status: 400 });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, payload.userId));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
