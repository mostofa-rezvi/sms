import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config/env.js';

export const userRouter = Router();

// Public: Login / Exchange API Key for Dashboard JWT (supports both /auth/login and /v1/users/login)
const handleLogin = async (req: Request, res: Response) => {
  try {
    const { apiKey, email } = req.body;

    if (!apiKey && !email) {
      return res.status(400).json({
        status: 'error',
        message: 'apiKey or email is required',
      });
    }

    let user = null;
    if (apiKey) {
      user = await prisma.user.findUnique({ where: { apiKey } });
    } else if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    }

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found with provided credentials',
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    const userData = {
      id: user.id,
      email: user.email,
      apiKey: user.apiKey,
      timezone: user.timezone,
      activePhoneId: user.activePhoneId,
      subscriptionName: user.subscriptionName,
      subscriptionStatus: user.subscriptionStatus,
      notificationMessageStatusEnabled: user.notificationMessageStatusEnabled,
      notificationWebhookEnabled: user.notificationWebhookEnabled,
      notificationHeartbeatEnabled: user.notificationHeartbeatEnabled,
      notificationNewsletterEnabled: user.notificationNewsletterEnabled,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      token,
      user: {
        id: user.id,
        email: user.email,
        apiKey: user.apiKey,
        timezone: user.timezone,
        subscriptionName: user.subscriptionName,
      },
    };

    return res.json({
      status: 'success',
      data: userData,
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

userRouter.post('/auth/login', handleLogin);
userRouter.post('/v1/users/login', handleLogin);

// Authenticated: Get Current User Profile
userRouter.get('/v1/users/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        phones: true,
      },
    });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    return res.json({
      status: 'success',
      data: user,
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// Authenticated: Update Current User Profile
userRouter.put('/v1/users/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const { timezone, activePhoneId } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(timezone ? { timezone } : {}),
        ...(activePhoneId !== undefined ? { activePhoneId } : {}),
      },
    });

    return res.json({
      status: 'success',
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// Authenticated: Rotate API Key
userRouter.post('/v1/users/rotate-api-key', requireAuth, async (req: Request, res: Response) => {
  try {
    const newApiKey = `ctp_${uuidv4().replace(/-/g, '')}`;

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: { apiKey: newApiKey },
    });

    return res.json({
      status: 'success',
      data: {
        apiKey: updated.apiKey,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// Authenticated: Update Notification Settings
userRouter.put('/v1/users/:userId/notifications', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      notificationMessageStatusEnabled,
      notificationWebhookEnabled,
      notificationHeartbeatEnabled,
      notificationNewsletterEnabled,
    } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(notificationMessageStatusEnabled !== undefined ? { notificationMessageStatusEnabled } : {}),
        ...(notificationWebhookEnabled !== undefined ? { notificationWebhookEnabled } : {}),
        ...(notificationHeartbeatEnabled !== undefined ? { notificationHeartbeatEnabled } : {}),
        ...(notificationNewsletterEnabled !== undefined ? { notificationNewsletterEnabled } : {}),
      },
    });

    return res.json({
      status: 'success',
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

