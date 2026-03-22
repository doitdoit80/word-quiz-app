import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const { name, phone } = await request.json();

    if (!name || !phone) {
      return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedPhone = phone.replace(/[^0-9]/g, '');

    const user = await db
      .select({ email: users.email, createdAt: users.createdAt })
      .from(users)
      .where(and(eq(users.name, trimmedName), eq(users.phone, trimmedPhone)))
      .get();

    if (!user) {
      return NextResponse.json({ error: '일치하는 계정을 찾을 수 없습니다.' }, { status: 404 });
    }

    // Mask email: show all except last 4 chars of local part, replace those with ****
    const [local, domain] = user.email.split('@');
    const showCount = Math.max(0, local.length - 4);
    const maskedEmail = local.slice(0, showCount) + '****' + '@' + domain;

    return NextResponse.json({
      email: user.email,
      maskedEmail,
      createdAt: user.createdAt,
    });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
