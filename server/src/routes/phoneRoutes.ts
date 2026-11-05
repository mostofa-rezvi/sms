import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const phoneRouter = Router();

function formatPhone(phone: any) {
  return {
    id: phone.id,
    userId: phone.userId,
    user_id: phone.userId,
    phoneNumber: phone.phoneNumber,
    phone_number: phone.phoneNumber,
    fcmToken: phone.fcmToken,
    fcm_token: phone.fcmToken,
    sim: phone.sim,
    messagesPerMinute: phone.messagesPerMinute,
    messages_per_minute: phone.messagesPerMinute,
    maxSendAttempts: phone.maxSendAttempts,
    max_send_attempts: phone.maxSendAttempts,
    messageExpirationSeconds: phone.messageExpirationSeconds,
    message_expiration_seconds: phone.messageExpirationSeconds,
    missedCallAutoReply: phone.missedCallAutoReply,
    missed_call_auto_reply: phone.missedCallAutoReply,
    unarchiveThread: phone.unarchiveThread,
    unarchive_thread: phone.unarchiveThread,
    archiveNewOutgoingMessageThreads: phone.archiveNewOutgoingMessageThreads,
    archive_new_outgoing_message_threads: phone.archiveNewOutgoingMessageThreads,
    createdAt: phone.createdAt?.toISOString ? phone.createdAt.toISOString() : phone.createdAt,
    created_at: phone.createdAt?.toISOString ? phone.createdAt.toISOString() : phone.createdAt,
    updatedAt: phone.updatedAt?.toISOString ? phone.updatedAt.toISOString() : phone.updatedAt,
    updated_at: phone.updatedAt?.toISOString ? phone.updatedAt.toISOString() : phone.updatedAt,
  };
}

// List phones belonging to current user
phoneRouter.get('/v1/phones', requireAuth, async (req: Request, res: Response) => {
  try {
    const phones = await prisma.phone.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      status: 'success',
      data: phones.map(formatPhone),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// Register or update phone (used by mobile apps and dashboard)
phoneRouter.put('/v1/phones', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      phoneNumber,
      fcmToken,
      sim = 'SIM1',
      messagesPerMinute = 1,
      maxSendAttempts = 2,
      messageExpirationSeconds = 300,
      missedCallAutoReply,
      unarchiveThread = false,
      archiveNewOutgoingMessageThreads = false,
    } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'phoneNumber is required',
      });
    }

    const phone = await prisma.phone.upsert({
      where: {
        userId_phoneNumber: {
          userId: req.user!.id,
          phoneNumber: phoneNumber.trim(),
        },
      },
      update: {
        ...(fcmToken !== undefined ? { fcmToken } : {}),
        sim,
        messagesPerMinute,
        maxSendAttempts,
        messageExpirationSeconds,
        missedCallAutoReply,
        unarchiveThread,
        archiveNewOutgoingMessageThreads,
      },
      create: {
        id: uuidv4(),
        userId: req.user!.id,
        phoneNumber: phoneNumber.trim(),
        fcmToken,
        sim,
        messagesPerMinute,
        maxSendAttempts,
        messageExpirationSeconds,
        missedCallAutoReply,
        unarchiveThread,
        archiveNewOutgoingMessageThreads,
      },
    });

    return res.json({
      status: 'success',
      data: formatPhone(phone),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// Update FCM Token (Endpoint called by Android & Flutter mobile apps on Login)
phoneRouter.put('/v1/phones/fcm-token', requireAuth, async (req: Request, res: Response) => {
  try {
    const { phone_number, fcm_token, sim = 'SIM1' } = req.body;

    if (!phone_number) {
      return res.status(400).json({
        status: 'error',
        message: 'phone_number is required',
      });
    }

    const phone = await prisma.phone.upsert({
      where: {
        userId_phoneNumber: {
          userId: req.user!.id,
          phoneNumber: phone_number.trim(),
        },
      },
      update: {
        fcmToken: fcm_token || null,
        sim,
      },
      create: {
        id: uuidv4(),
        userId: req.user!.id,
        phoneNumber: phone_number.trim(),
        fcmToken: fcm_token || null,
        sim,
      },
    });

    // Also set as active phone for user if not already set
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { activePhoneId: phone.id },
    });

    return res.json({
      status: 'success',
      data: formatPhone(phone),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// Delete / unregister phone
phoneRouter.delete('/v1/phones/:phoneId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { phoneId } = req.params;

    await prisma.phone.deleteMany({
      where: {
        id: phoneId,
        userId: req.user!.id,
      },
    });

    return res.json({
      status: 'success',
      message: 'Phone deleted successfully',
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

