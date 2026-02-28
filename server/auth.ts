import 'dotenv/config';
import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

/**
 * Extend Express Session to include our user data.
 */
declare module 'express-session' {
    interface SessionData {
        userId: string;
        userRole: 'admin' | 'teacher' | 'student';
        user?: {
            id: string;
            username: string;
            email: string;
            role: string;
            profileId?: string;
        };
    }
}

/**
 * Middleware: Require authenticated session for protected routes.
 * Attaches session.userId and session.userRole for downstream handlers.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.session?.userId) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    next();
}

/**
 * Middleware: Require specific role(s) — must be used AFTER requireAuth.
 */
export function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.session?.userRole || !roles.includes(req.session.userRole)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        next();
    };
}
