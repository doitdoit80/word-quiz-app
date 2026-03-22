import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/admin';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('error' in auth) return auth.error;

  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    phone: users.phone,
    role: users.role,
    gems: users.gems,
    createdAt: users.createdAt,
  }).from(users);

  return NextResponse.json({ users: allUsers });
}
