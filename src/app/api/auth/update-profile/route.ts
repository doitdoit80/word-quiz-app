import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, phone } = await request.json();
    const trimmedName = name?.trim();
    const trimmedPhone = phone?.replace(/[^0-9]/g, '');

    if (!trimmedName) {
      return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 });
    }

    if (!trimmedPhone.startsWith('010') || trimmedPhone.length !== 11) {
      return NextResponse.json({ error: '핸드폰 번호는 010으로 시작하는 11자리여야 합니다.' }, { status: 400 });
    }

    await db.update(users).set({ name: trimmedName, phone: trimmedPhone }).where(eq(users.id, payload.userId));

    const user = await db.select().from(users).where(eq(users.id, payload.userId)).get();

    return NextResponse.json({
      user: { id: user!.id, email: user!.email, name: user!.name, phone: user!.phone, role: user!.role, gems: user!.gems, wordbookLimit: user!.wordbookLimit },
    });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
