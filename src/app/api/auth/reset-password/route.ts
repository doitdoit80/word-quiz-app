import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { getSecret } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, phone } = await request.json();

    if (!email || !phone) {
      return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const trimmedPhone = phone.replace(/[^0-9]/g, '');

    const user = await db
      .select({ id: users.id, email: users.email, passwordHash: users.passwordHash, passwordResetAt: users.passwordResetAt })
      .from(users)
      .where(and(eq(users.email, trimmedEmail), eq(users.phone, trimmedPhone)))
      .get();

    if (!user) {
      return NextResponse.json({ error: '이메일 또는 핸드폰 번호가 일치하지 않습니다.' }, { status: 404 });
    }

    // Rate limit: 5 minutes between requests
    if (user.passwordResetAt) {
      const elapsed = Date.now() - new Date(user.passwordResetAt).getTime();
      const remaining = Math.ceil((5 * 60 * 1000 - elapsed) / 1000);
      if (remaining > 0) {
        const min = Math.floor(remaining / 60);
        const sec = remaining % 60;
        const timeStr = min > 0 ? `${min}분 ${sec}초` : `${sec}초`;
        return NextResponse.json({ error: `잠시 후 다시 시도해주세요. (${timeStr} 후 가능)` }, { status: 429 });
      }
    }

    // Include password hash snippet so token is invalidated after password change
    const hashSnippet = user.passwordHash.slice(-10);

    // Generate reset token (5 min expiry)
    const resetToken = await new SignJWT({ userId: user.id, email: user.email, purpose: 'password-reset', hs: hashSnippet })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('5m')
      .setIssuedAt()
      .sign(getSecret());

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    await sendPasswordResetEmail(user.email, resetUrl);

    // Record reset request time
    await db.update(users).set({ passwordResetAt: new Date().toISOString() }).where(eq(users.id, user.id));

    return NextResponse.json({ ok: true, message: '비밀번호 초기화 이메일을 발송했습니다.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
  }
}
