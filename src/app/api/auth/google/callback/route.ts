import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { signToken, setAuthCookie, getSecret, ADMIN_EMAIL } from '@/lib/auth';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
}

interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const rememberMe = state === 'remember';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_failed`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${baseUrl}/login?error=google_failed`);
    }

    const tokens: GoogleTokenResponse = await tokenRes.json();

    // Get user info
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(`${baseUrl}/login?error=google_failed`);
    }

    const googleUser: GoogleUserInfo = await userInfoRes.json();
    const email = googleUser.email.toLowerCase().trim();

    // Find or create user
    let user = await db.select().from(users).where(eq(users.email, email)).get();

    if (!user) {
      // New user → redirect to complete-signup with temp token
      const tempToken = await new SignJWT({
        email,
        name: googleUser.name || email.split('@')[0],
        purpose: 'google-signup',
        remember: rememberMe,
      } as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('10m')
        .setIssuedAt()
        .sign(getSecret());

      return NextResponse.redirect(`${baseUrl}/complete-signup?token=${tempToken}`);
    }

    // Existing user → sign in directly
    const token = await signToken({ userId: user.id, email: user.email });

    const response = NextResponse.redirect(`${baseUrl}/`);
    response.headers.set('Set-Cookie', setAuthCookie(token, rememberMe));
    return response;
  } catch {
    return NextResponse.redirect(`${baseUrl}/login?error=google_failed`);
  }
}
