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

export function setAuthCookie(token: string, rememberMe = true): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const maxAge = rememberMe ? `; Max-Age=${60 * 60 * 24 * 7}` : '';
  return `${AUTH_COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/${maxAge}${secure}`;
}

export function removeAuthCookie(): string {
  return `${AUTH_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}
