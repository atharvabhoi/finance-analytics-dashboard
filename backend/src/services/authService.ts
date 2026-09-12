import jwt, { JwtPayload } from 'jsonwebtoken';
import { getJwtExpiresIn, getJwtSecret } from '../config/environment.js';

export interface AuthTokenPayload {
  userId: string;
  email: string;
}

export function createAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(
    { email: payload.email },
    getJwtSecret(),
    { subject: payload.userId, expiresIn: getJwtExpiresIn() },
  );
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());

  if (
    typeof decoded === 'string' ||
    typeof decoded.sub !== 'string' ||
    typeof (decoded as JwtPayload).email !== 'string'
  ) {
    throw new Error('JWT payload is invalid.');
  }

  return { userId: decoded.sub, email: decoded.email as string };
}
