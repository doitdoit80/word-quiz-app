import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { getSecret } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: '새 비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });
    }

    // Verify reset token
    let payload;
    try {
      const result = await jwtVerify(token, getSecret());
      payload = result.payload as { userId: number; email: string; purpose: string; hs: string };
    } catch {
      return NextResponse.json({ error: '링크가 만료되었거나 유효하지 않습니다.' }, { status: 400 });
    }

    if (payload.purpose !== 'password-reset') {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 400 });
    }

    // Check if token was already used (password changed since token was issued)
    const user = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, payload.userId))
      .get();

    if (!user || user.passwordHash.slice(-10) !== payload.hs) {
      return NextResponse.json({ error: '이미 사용된 링크입니다. 새로 요청해주세요.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash }).where(eq(users.id, payload.userId));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
