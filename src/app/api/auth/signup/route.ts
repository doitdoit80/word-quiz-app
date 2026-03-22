import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { signToken, getAuthCookieOptions, AUTH_COOKIE_NAME, ADMIN_EMAIL } from '@/lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone } = await request.json();

    if (!email || !password || !name || !phone) {
      return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();
    const trimmedPhone = phone.replace(/[^0-9]/g, '');

    if (!EMAIL_RE.test(trimmedEmail)) {
      return NextResponse.json({ error: '올바른 이메일 형식이 아닙니다.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });
    }

    if (!trimmedName) {
      return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 });
    }

    if (!trimmedPhone.startsWith('010') || trimmedPhone.length !== 11) {
      return NextResponse.json({ error: '핸드폰 번호는 010으로 시작하는 11자리여야 합니다.' }, { status: 400 });
    }

    const existing = await db.select().from(users).where(eq(users.email, trimmedEmail)).get();
    if (existing) {
      return NextResponse.json({ error: '이미 등록된 이메일입니다.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const role = trimmedEmail === ADMIN_EMAIL ? 'admin' : 'user';

    const result = await db
      .insert(users)
      .values({ email: trimmedEmail, passwordHash, name: trimmedName, phone: trimmedPhone, role })
      .returning();

    const user = result[0];
    const token = await signToken({ userId: user.id, email: user.email });

    const response = NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role, gems: user.gems, wordbookLimit: user.wordbookLimit } },
      { status: 201 }
    );
    response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions(true));
    return response;
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
