// backend/src/presentation/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/environment';

export interface AuthRequest extends Request {
  user?: { id: number; username: string; email: string };
  userId?: number;
  username?: string;
  email?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: number;
      username: string;
      email: string;
    };

    req.userId = decoded.userId;
    req.username = decoded.username;
    req.email = decoded.email;
    req.user = { id: decoded.userId, username: decoded.username, email: decoded.email };

    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
