import { SignOptions } from 'jsonwebtoken';

export const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

export function getJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret || jwtSecret === 'replace-with-a-long-random-secret') {
    throw new Error('JWT_SECRET must be configured with a secure value.');
  }

  return jwtSecret;
}

export function getJwtExpiresIn(): SignOptions['expiresIn'] {
  return (process.env.JWT_EXPIRES_IN ?? '1h') as SignOptions['expiresIn'];
}
