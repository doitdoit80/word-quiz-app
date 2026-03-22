import { SignJWT, jwtVerify } from 'jose';

export const AUTH_COOKIE_NAME = 'auth-token';
export const ADMIN_EMAIL = 'doitdoit80@gmail.com';

interface JwtPayload {
  userId: number;
  email: string;
}

export function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET!);
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export function getAuthCookieOptions(rememberMe = true) {
  return {
    name: AUTH_COOKIE_NAME,
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    ...(rememberMe ? { maxAge: 60 * 60 * 24 * 7 } : {}),
  };
}
