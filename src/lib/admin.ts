import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function requireAuth(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const payload = await verifyToken(token);
  if (!payload) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const user = await db.select().from(users).where(eq(users.id, payload.userId)).get();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  return { user };
}

export async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const payload = await verifyToken(token);
  if (!payload) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const user = await db.select().from(users).where(eq(users.id, payload.userId)).get();
  if (!user || user.role !== 'admin') {
    return { error: NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 }) };
  }

  return { admin: user };
}
