import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const threadRouter = Router();

function formatThread(th: any) {
  return {
    id: th.id,
    user_id: th.userId,
    owner: th.owner,
    contact: th.contact,
    last_message_content: th.lastMessageContent,
    last_message_timestamp: th.lastMessageTimestamp?.toISOString(),
    is_archived: th.isArchived,
    created_at: th.createdAt?.toISOString(),
    updated_at: th.updatedAt?.toISOString(),
  };
}

// 1. Get message threads (conversations list)
threadRouter.get('/v1/message-threads', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      owner,
      query,
      skip = '0',
      limit = '50',
      is_archived,
    } = req.query;

    const where: any = {
      userId: req.user!.id,
    };

    if (owner) {
      where.owner = String(owner).trim();
    }

    if (is_archived !== undefined) {
      where.isArchived = is_archived === 'true';
    }

    if (query) {
      where.OR = [
        { contact: { contains: String(query).trim() } },
        { lastMessageContent: { contains: String(query).trim() } },
      ];
    }

    const skipNum = Math.max(0, parseInt(String(skip), 10) || 0);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50));

    const [threads, total] = await Promise.all([
      prisma.messageThread.findMany({
        where,
        skip: skipNum,
        take: limitNum,
        orderBy: { lastMessageTimestamp: 'desc' },
      }),
      prisma.messageThread.count({ where }),
    ]);

    return res.status(200).json({
      status: 'success',
      total,
      data: threads.map(formatThread),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. Get single message thread
threadRouter.get('/v1/message-threads/:threadId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;

    const thread = await prisma.messageThread.findFirst({
      where: {
        id: threadId,
        userId: req.user!.id,
      },
    });

    if (!thread) {
      return res.status(404).json({
        status: 'fail',
        message: `Thread with ID [${threadId}] not found`,
      });
    }

    return res.status(200).json({
      status: 'success',
      data: formatThread(thread),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 3. Update thread (e.g. archive / unarchive)
threadRouter.put('/v1/message-threads/:threadId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { is_archived } = req.body;

    const existing = await prisma.messageThread.findFirst({
      where: {
        id: threadId,
        userId: req.user!.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        status: 'fail',
        message: `Thread with ID [${threadId}] not found`,
      });
    }

    const updated = await prisma.messageThread.update({
      where: { id: threadId },
      data: {
        ...(is_archived !== undefined ? { isArchived: Boolean(is_archived) } : {}),
      },
    });

    return res.status(200).json({
      status: 'success',
      data: formatThread(updated),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 4. Delete thread and all its messages
threadRouter.delete('/v1/message-threads/:threadId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;

    const existing = await prisma.messageThread.findFirst({
      where: {
        id: threadId,
        userId: req.user!.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        status: 'fail',
        message: `Thread with ID [${threadId}] not found`,
      });
    }

    // Delete messages between owner and contact
    await prisma.message.deleteMany({
      where: {
        userId: req.user!.id,
        owner: existing.owner,
        contact: existing.contact,
      },
    });

    await prisma.messageThread.delete({
      where: { id: threadId },
    });

    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

