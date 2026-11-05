import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { config } from '../config/env.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  apiKey: string;
  timezone: string;
  subscriptionName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      phoneApiKey?: any;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Check for x-api-key header
    const apiKeyHeader = req.headers['x-api-key'] as string | undefined;
    
    // 2. Check for Authorization header
    const authHeader = req.headers['authorization'];
    let tokenOrKey: string | undefined = apiKeyHeader;

    if (!tokenOrKey && authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        tokenOrKey = authHeader.substring(7).trim();
      } else {
        tokenOrKey = authHeader.trim();
      }
    }

    if (!tokenOrKey) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please provide x-api-key or Authorization header.',
      });
    }

    // Try verifying as JWT session token first
    try {
      const decoded = jwt.verify(tokenOrKey, config.jwtSecret) as { userId: string; email: string };
      if (decoded && decoded.userId) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });

        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            apiKey: user.apiKey,
            timezone: user.timezone,
            subscriptionName: user.subscriptionName,
          };
          return next();
        }
      }
    } catch {
      // Not a JWT, proceed to test as API Key
    }

    // Check user API key
    const user = await prisma.user.findUnique({
      where: { apiKey: tokenOrKey },
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        apiKey: user.apiKey,
        timezone: user.timezone,
        subscriptionName: user.subscriptionName,
      };
      return next();
    }

    // Check dedicated phone API key
    const phoneKey = await prisma.phoneApiKey.findUnique({
      where: { apiKey: tokenOrKey },
      include: { user: true },
    });

    if (phoneKey && phoneKey.user) {
      req.user = {
        id: phoneKey.user.id,
        email: phoneKey.user.email,
        apiKey: phoneKey.user.apiKey,
        timezone: phoneKey.user.timezone,
        subscriptionName: phoneKey.user.subscriptionName,
      };
      req.phoneApiKey = phoneKey;
      return next();
    }

    return res.status(401).json({
      status: 'error',
      message: 'Invalid API key or session token.',
    });
  } catch (error) {
    next(error);
  }
}

