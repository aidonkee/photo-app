import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is not set. Application cannot start securely.');
}
const key = new TextEncoder().encode(SECRET_KEY);

export type SessionPayload = {
  userId: string;
  role: string;
  schoolId?: string;
  classId?: string;
  expiresAt: Date;
};

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch (error) {
    console.error('Failed to verify session:', error);
    return null;
  }
}

export async function createSession(
  userId: string,
  role: string,
  schoolId?: string,
  classId?: string
) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const payload: SessionPayload = {
    userId,
    role,
    schoolId,
    classId,
    expiresAt,
  };

  const session = await encrypt(payload);
  const cookieStore = await cookies();

  cookieStore.set('session_token', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session_token');
}


export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) return null;

  return await decrypt(token);
}

/**
 * Sign a school access token
 * Generates a short 16-character HMAC signature for the slug
 */
export async function signSchoolAccess(slug: string) {
  const msgUint8 = new TextEncoder().encode(slug);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgUint8);

  // Convert buffer to hex and truncate to 16 chars (8 bytes of entropy)
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

/**
 * Verify a school access token
 * Supports both new short HMAC signatures and legacy JWT tokens
 */
export async function verifySchoolAccess(slug: string, token: string) {
  if (!token) return false;

  try {
    // 1. Try verify as new short signature
    const expectedShort = await signSchoolAccess(slug);
    if (token === expectedShort) return true;

    // 2. Fallback to legacy JWT verification if it looks like a JWT
    if (token.includes('.')) {
      const { payload } = await jwtVerify(token, key, {
        algorithms: ['HS256'],
      });
      return (payload as { slug: string }).slug === slug;
    }

    return false;
  } catch (error) {
    return false;
  }
}