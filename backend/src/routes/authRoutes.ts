import { Router } from 'express';
import { requireAuthentication, AuthenticatedRequest } from '../middleware/authenticate.js';
import { UserModel } from '../models/user.js';
import { createAuthToken } from '../services/authService.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const authRouter = Router();

authRouter.post('/login', async (request, response, next) => {
  try {
    const { email, password } = request.body as Record<string, unknown>;

    if (
      typeof email !== 'string' ||
      !emailPattern.test(email.trim()) ||
      typeof password !== 'string' ||
      password.length === 0
    ) {
      response.status(400).json({ message: 'A valid email and password are required.' });
      return;
    }

    const user = await UserModel.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
    if (!user || !(await user.verifyPassword(password))) {
      response.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const token = createAuthToken({ userId: user.id, email: user.email });
    response.status(200).json({ token, user: { id: user.id, email: user.email } });
  } catch (error: unknown) {
    next(error);
  }
});

authRouter.get('/me', requireAuthentication, async (request: AuthenticatedRequest, response, next) => {
  try {
    const user = await UserModel.findById(request.auth!.userId);
    if (!user) {
      response.status(401).json({ message: 'Authentication is required.' });
      return;
    }

    response.status(200).json({ user: { id: user.id, email: user.email } });
  } catch (error: unknown) {
    next(error);
  }
});
