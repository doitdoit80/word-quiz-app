import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { signToken, getAuthCookieOptions, AUTH_COOKIE_NAME, getSecret, ADMIN_EMAIL } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { token, phone } = await request.json();

    if (!token || !phone) {
      return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 });
    }

    const trimmedPhone = phone.replace(/[^0-9]/g, '');
    if (!trimmedPhone.startsWith('010') || trimmedPhone.length !== 11) {
      return NextResponse.json({ error: '핸드폰 번호는 010으로 시작하는 11자리여야 합니다.' }, { status: 400 });
    }

    // Verify temp token
    let payload;
    try {
      const result = await jwtVerify(token, getSecret());
      payload = result.payload as { email: string; name: string; purpose: string; remember: boolean };
    } catch {
      return NextResponse.json({ error: '링크가 만료되었습니다. 다시 시도해주세요.' }, { status: 400 });
    }

    if (payload.purpose !== 'google-signup') {
      return NextResponse.json({ error: '유효하지 않은 요청입니다.' }, { status: 400 });
    }

    // Check if user was already created
    const existing = await db.select().from(users).where(eq(users.email, payload.email)).get();
    if (existing) {
      return NextResponse.json({ error: '이미 가입된 이메일입니다.' }, { status: 409 });
    }

    // Create user
    const role = payload.email === ADMIN_EMAIL ? 'admin' : 'user';
    const randomHash = `google_oauth_${Date.now()}`;

    const result = await db
      .insert(users)
      .values({
        email: payload.email,
        passwordHash: randomHash,
        name: payload.name,
        phone: trimmedPhone,
        role,
      })
      .returning();

    const user = result[0];

    // Sign JWT
    const authToken = await signToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role, gems: user.gems, wordbookLimit: user.wordbookLimit },
    });
    response.cookies.set(AUTH_COOKIE_NAME, authToken, getAuthCookieOptions(!!payload.remember));
    return response;
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
