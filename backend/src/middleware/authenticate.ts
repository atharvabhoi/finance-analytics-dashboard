import { NextFunction, Request, Response } from 'express';
import { AuthTokenPayload, verifyAuthToken } from '../services/authService.js';

export interface AuthenticatedRequest extends Request {
  auth?: AuthTokenPayload;
}

export function requireAuthentication(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): void {
  const authorization = request.get('authorization');
  const [scheme, token] = authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    response.status(401).json({ message: 'Authentication is required.' });
    return;
  }

  try {
    request.auth = verifyAuthToken(token);
    next();
  } catch {
    response.status(401).json({ message: 'Authentication is required.' });
  }
}
