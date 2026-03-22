import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { requireAuth } from '@/lib/admin';

const SLOT_COST = 5; // 보석 5개당 슬롯 +1
const MAX_LIMIT = 30;

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;

  const user = auth.user;

  if (user.wordbookLimit >= MAX_LIMIT) {
    return NextResponse.json({ error: `단어장 한도는 최대 ${MAX_LIMIT}개입니다.` }, { status: 400 });
  }

  if (user.gems < SLOT_COST) {
    return NextResponse.json({ error: `보석이 부족합니다. (필요: ${SLOT_COST}개, 보유: ${user.gems}개)` }, { status: 400 });
  }

  await db
    .update(users)
    .set({
      gems: user.gems - SLOT_COST,
      wordbookLimit: user.wordbookLimit + 1,
    })
    .where(eq(users.id, user.id));

  return NextResponse.json({
    ok: true,
    gems: user.gems - SLOT_COST,
    wordbookLimit: user.wordbookLimit + 1,
  });
}
