import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const statsRouter = Router();

// Aggregate stats for dashboard
statsRouter.get('/v1/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const [
      totalMessages,
      sentMessages,
      receivedMessages,
      pendingMessages,
      failedMessages,
      totalPhones,
      totalContacts,
      totalThreads,
    ] = await Promise.all([
      prisma.message.count({ where: { userId } }),
      prisma.message.count({ where: { userId, status: 'sent' } }),
      prisma.message.count({ where: { userId, type: 'mobile-originated' } }),
      prisma.message.count({ where: { userId, status: 'pending' } }),
      prisma.message.count({ where: { userId, status: 'failed' } }),
      prisma.phone.count({ where: { userId } }),
      prisma.contact.count({ where: { userId } }),
      prisma.messageThread.count({ where: { userId } }),
    ]);

    // Active phones (heartbeat within last 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const activeHeartbeats = await prisma.heartbeat.findMany({
      where: {
        userId,
        timestamp: { gte: fifteenMinutesAgo },
      },
      distinct: ['owner'],
    });

    return res.status(200).json({
      status: 'success',
      data: {
        total_messages: totalMessages,
        sent_messages: sentMessages,
        received_messages: receivedMessages,
        pending_messages: pendingMessages,
        failed_messages: failedMessages,
        total_phones: totalPhones,
        active_phones: activeHeartbeats.length,
        total_contacts: totalContacts,
        total_threads: totalThreads,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

