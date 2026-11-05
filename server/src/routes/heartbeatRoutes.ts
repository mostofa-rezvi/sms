import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const heartbeatRouter = Router();

function formatHeartbeat(hb: any) {
  return {
    id: hb.id,
    user_id: hb.userId,
    owner: hb.owner,
    version: hb.version,
    charging: hb.charging,
    timestamp: hb.timestamp?.toISOString(),
    created_at: hb.createdAt?.toISOString(),
  };
}

// 1. Register heartbeat (Called by mobile app every few minutes or on SMS send/receive)
heartbeatRouter.post('/v1/heartbeats', requireAuth, async (req: Request, res: Response) => {
  try {
    const { phone_numbers, charging = false } = req.body;
    const clientVersion = (req.headers['x-client-version'] as string) || '1.0.0';

    if (!Array.isArray(phone_numbers) || phone_numbers.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'phone_numbers must be a non-empty array of phone numbers',
      });
    }

    const now = new Date();
    const createdList = [];

    for (const rawPhone of phone_numbers) {
      const phoneNumber = String(rawPhone).trim();
      const hb = await prisma.heartbeat.create({
        data: {
          id: uuidv4(),
          userId: req.user!.id,
          owner: phoneNumber,
          version: clientVersion,
          charging: Boolean(charging),
          timestamp: now,
        },
      });

      // Update phone record to keep track of its last active time
      await prisma.phone.updateMany({
        where: {
          userId: req.user!.id,
          phoneNumber: phoneNumber,
        },
        data: {
          updatedAt: now,
        },
      });

      createdList.push(formatHeartbeat(hb));
    }

    return res.status(201).json({
      status: 'success',
      message: `[${createdList.length}] heartbeats received successfully`,
      data: createdList,
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. Get heartbeats list
heartbeatRouter.get('/v1/heartbeats', requireAuth, async (req: Request, res: Response) => {
  try {
    const { owner, skip = '0', limit = '20' } = req.query;

    const where: any = {
      userId: req.user!.id,
    };

    if (owner) {
      where.owner = String(owner).trim();
    }

    const skipNum = Math.max(0, parseInt(String(skip), 10) || 0);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));

    const [heartbeats, total] = await Promise.all([
      prisma.heartbeat.findMany({
        where,
        skip: skipNum,
        take: limitNum,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.heartbeat.count({ where }),
    ]);

    return res.status(200).json({
      status: 'success',
      total,
      data: heartbeats.map(formatHeartbeat),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

