import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { conqueredPresets } from '@/lib/db/schema';
import { requireAuth } from '@/lib/admin';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;

  const presets = await db
    .select({ presetName: conqueredPresets.presetName })
    .from(conqueredPresets)
    .where(eq(conqueredPresets.userId, auth.user.id));

  return NextResponse.json({ presets: presets.map((p) => p.presetName) });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;

  const { presetName } = await request.json();

  // Upsert - ignore if already exists
  try {
    await db.insert(conqueredPresets).values({
      userId: auth.user.id,
      presetName,
    });
  } catch {
    // Already exists, ignore
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;

  const { presetName } = await request.json();

  await db.delete(conqueredPresets).where(
    and(eq(conqueredPresets.userId, auth.user.id), eq(conqueredPresets.presetName, presetName))
  );

  return NextResponse.json({ ok: true });
}
