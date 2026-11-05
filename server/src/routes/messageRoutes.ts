import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const messageRouter = Router();

// Helper to format message response for consistency across SDKs/Apps
function formatMessage(msg: any) {
  return {
    id: msg.id,
    user_id: msg.userId,
    request_id: msg.requestId,
    owner: msg.owner,
    contact: msg.contact,
    content: msg.content,
    attachments: msg.attachments || [],
    encrypted: msg.encrypted,
    type: msg.type,
    status: msg.status,
    sim: msg.sim,
    send_duration: msg.sendDuration ? Number(msg.sendDuration) : null,
    request_received_at: msg.requestReceivedAt?.toISOString(),
    order_timestamp: msg.orderTimestamp?.toISOString(),
    sent_at: msg.sentAt?.toISOString() || null,
    delivered_at: msg.deliveredAt?.toISOString() || null,
    failed_at: msg.failedAt?.toISOString() || null,
    expired_at: msg.expiredAt?.toISOString() || null,
    received_at: msg.receivedAt?.toISOString() || null,
    failure_reason: msg.failureReason || null,
    send_attempt_count: msg.sendAttemptCount,
    max_send_attempts: msg.maxSendAttempts,
    created_at: msg.createdAt?.toISOString(),
    updated_at: msg.updatedAt?.toISOString(),
  };
}

// 1. Send single SMS message (Queued for mobile device to dispatch)
messageRouter.post('/v1/messages/send', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      from,
      to,
      content,
      sim = 'SIM1',
      attachments = [],
      encrypted = false,
      max_send_attempts = 2,
    } = req.body;

    if (!to || !content) {
      return res.status(400).json({
        status: 'error',
        message: 'Both "to" and "content" are required fields.',
      });
    }

    let ownerPhone = from ? from.trim() : null;

    if (!ownerPhone) {
      // Find default active phone for user
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { phones: { take: 1 } },
      });

      if (user?.activePhoneId) {
        const activePhone = await prisma.phone.findUnique({
          where: { id: user.activePhoneId },
        });
        if (activePhone) ownerPhone = activePhone.phoneNumber;
      }

      if (!ownerPhone && user?.phones?.length) {
        ownerPhone = user.phones[0].phoneNumber;
      }
    }

    if (!ownerPhone) {
      return res.status(400).json({
        status: 'error',
        message: 'No registered phone available to send this message. Please register a phone first.',
      });
    }

    const messageId = uuidv4();
    const cleanTo = to.trim();
    const now = new Date();

    const message = await prisma.message.create({
      data: {
        id: messageId,
        userId: req.user!.id,
        owner: ownerPhone,
        contact: cleanTo,
        content: content.trim(),
        attachments: attachments,
        encrypted: Boolean(encrypted),
        type: 'mobile-terminated',
        status: 'pending',
        sim: sim,
        maxSendAttempts: max_send_attempts,
        requestReceivedAt: now,
        orderTimestamp: now,
      },
    });

    // Upsert thread
    await prisma.messageThread.upsert({
      where: {
        userId_owner_contact: {
          userId: req.user!.id,
          owner: ownerPhone,
          contact: cleanTo,
        },
      },
      update: {
        lastMessageContent: content.trim(),
        lastMessageTimestamp: now,
        isArchived: false,
      },
      create: {
        id: uuidv4(),
        userId: req.user!.id,
        owner: ownerPhone,
        contact: cleanTo,
        lastMessageContent: content.trim(),
        lastMessageTimestamp: now,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'message added to queue',
      data: formatMessage(message),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. Bulk send SMS messages
messageRouter.post('/v1/messages/bulk-send', requireAuth, async (req: Request, res: Response) => {
  try {
    const { from, to, content, sim = 'SIM1' } = req.body;

    if (!Array.isArray(to) || to.length === 0 || !content) {
      return res.status(400).json({
        status: 'error',
        message: '"to" must be a non-empty array of phone numbers and "content" is required.',
      });
    }

    let ownerPhone = from ? from.trim() : null;
    if (!ownerPhone) {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { phones: { take: 1 } },
      });
      if (user?.activePhoneId) {
        const active = await prisma.phone.findUnique({ where: { id: user.activePhoneId } });
        if (active) ownerPhone = active.phoneNumber;
      }
      if (!ownerPhone && user?.phones?.length) {
        ownerPhone = user.phones[0].phoneNumber;
      }
    }

    if (!ownerPhone) {
      return res.status(400).json({
        status: 'error',
        message: 'No registered phone available to send messages.',
      });
    }

    const now = new Date();
    const createdMessages = [];

    for (const recipient of to) {
      const cleanContact = String(recipient).trim();
      const message = await prisma.message.create({
        data: {
          id: uuidv4(),
          userId: req.user!.id,
          owner: ownerPhone,
          contact: cleanContact,
          content: content.trim(),
          sim,
          type: 'mobile-terminated',
          status: 'pending',
          requestReceivedAt: now,
          orderTimestamp: now,
        },
      });

      await prisma.messageThread.upsert({
        where: {
          userId_owner_contact: {
            userId: req.user!.id,
            owner: ownerPhone,
            contact: cleanContact,
          },
        },
        update: {
          lastMessageContent: content.trim(),
          lastMessageTimestamp: now,
          isArchived: false,
        },
        create: {
          id: uuidv4(),
          userId: req.user!.id,
          owner: ownerPhone,
          contact: cleanContact,
          lastMessageContent: content.trim(),
          lastMessageTimestamp: now,
        },
      });

      createdMessages.push(formatMessage(message));
    }

    return res.status(200).json({
      status: 'success',
      message: `${createdMessages.length} out of ${to.length} messages processed successfully`,
      data: createdMessages,
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 3. Outstanding message polling (Called by Mobile App when awake / receiving FCM notification)
messageRouter.get('/v1/messages/outstanding', requireAuth, async (req: Request, res: Response) => {
  try {
    const messageId = req.query.message_id as string | undefined;

    if (messageId) {
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          userId: req.user!.id,
        },
      });

      if (!message) {
        return res.status(404).json({
          status: 'fail',
          message: `Cannot find outstanding message with ID [${messageId}]`,
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'outstanding message fetched successfully',
        data: formatMessage(message),
      });
    }

    // If no specific messageId, find oldest pending message for user's phones
    const message = await prisma.message.findFirst({
      where: {
        userId: req.user!.id,
        status: 'pending',
      },
      orderBy: { orderTimestamp: 'asc' },
    });

    if (!message) {
      return res.status(404).json({
        status: 'fail',
        message: 'No outstanding messages found',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'outstanding message fetched successfully',
      data: formatMessage(message),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 4. Mobile app reports incoming SMS
messageRouter.post('/v1/messages/receive', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      content,
      from,
      to,
      sim = 'SIM1',
      timestamp,
      encrypted = false,
      attachments = [],
    } = req.body;

    if (!from || !to || content === undefined) {
      return res.status(400).json({
        status: 'error',
        message: '"from", "to", and "content" are required.',
      });
    }

    const messageTime = timestamp ? new Date(timestamp) : new Date();

    // Check if duplicate already exists (same from, to, content, timestamp within 5s)
    const existing = await prisma.message.findFirst({
      where: {
        userId: req.user!.id,
        owner: to.trim(),
        contact: from.trim(),
        content: content.trim(),
        type: 'mobile-originated',
        createdAt: {
          gte: new Date(messageTime.getTime() - 5000),
          lte: new Date(messageTime.getTime() + 5000),
        },
      },
    });

    if (existing) {
      return res.status(200).json({
        status: 'success',
        message: 'message received successfully (duplicate ignored)',
        data: formatMessage(existing),
      });
    }

    const message = await prisma.message.create({
      data: {
        id: uuidv4(),
        userId: req.user!.id,
        owner: to.trim(),     // The local phone number receiving SMS
        contact: from.trim(), // Remote sender
        content: content.trim(),
        attachments,
        encrypted: Boolean(encrypted),
        type: 'mobile-originated',
        status: 'received',
        sim,
        receivedAt: messageTime,
        requestReceivedAt: messageTime,
        orderTimestamp: messageTime,
      },
    });

    // Upsert thread
    await prisma.messageThread.upsert({
      where: {
        userId_owner_contact: {
          userId: req.user!.id,
          owner: to.trim(),
          contact: from.trim(),
        },
      },
      update: {
        lastMessageContent: content.trim(),
        lastMessageTimestamp: messageTime,
        isArchived: false,
      },
      create: {
        id: uuidv4(),
        userId: req.user!.id,
        owner: to.trim(),
        contact: from.trim(),
        lastMessageContent: content.trim(),
        lastMessageTimestamp: messageTime,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'message received successfully',
      data: formatMessage(message),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 5. Mobile app reports event (SENT, DELIVERED, FAILED)
messageRouter.post('/v1/messages/:messageId/events', requireAuth, async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { event_name, reason, timestamp } = req.body;

    if (!event_name) {
      return res.status(400).json({
        status: 'error',
        message: 'event_name is required',
      });
    }

    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        userId: req.user!.id,
      },
    });

    if (!message) {
      return res.status(404).json({
        status: 'fail',
        message: `cannot find message with ID [${messageId}]`,
      });
    }

    const eventTime = timestamp ? new Date(timestamp) : new Date();
    const updateData: any = {};

    switch (event_name.toUpperCase()) {
      case 'SENDING':
        updateData.status = 'sending';
        updateData.sendAttemptCount = message.sendAttemptCount + 1;
        break;
      case 'SENT':
        updateData.status = 'sent';
        updateData.sentAt = eventTime;
        break;
      case 'DELIVERED':
        updateData.status = 'delivered';
        updateData.deliveredAt = eventTime;
        break;
      case 'FAILED':
        updateData.status = 'failed';
        updateData.failedAt = eventTime;
        updateData.failureReason = reason || 'Unknown failure on mobile device';
        break;
      default:
        break;
    }

    const updated = await prisma.message.update({
      where: { id: message.id },
      data: updateData,
    });

    return res.status(200).json({
      status: 'success',
      message: 'message event stored successfully',
      data: formatMessage(updated),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 6. Report missed call
messageRouter.post('/v1/messages/calls/missed', requireAuth, async (req: Request, res: Response) => {
  try {
    const { from, to, timestamp } = req.body;
    const eventTime = timestamp ? new Date(timestamp) : new Date();

    const message = await prisma.message.create({
      data: {
        id: uuidv4(),
        userId: req.user!.id,
        owner: to ? to.trim() : 'Unknown',
        contact: from ? from.trim() : 'Unknown',
        content: 'Missed Call',
        type: 'call/missed',
        status: 'delivered',
        receivedAt: eventTime,
        orderTimestamp: eventTime,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'missed call recorded',
      data: formatMessage(message),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 7. Get messages list (with pagination, contact, owner, status filtering)
messageRouter.get('/v1/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      owner,
      contact,
      status,
      query,
      skip = '0',
      limit = '50',
    } = req.query;

    const where: any = {
      userId: req.user!.id,
    };

    if (owner) where.owner = String(owner).trim();
    if (contact) where.contact = String(contact).trim();
    if (status) where.status = String(status).trim();
    if (query) {
      where.OR = [
        { content: { contains: String(query).trim() } },
        { contact: { contains: String(query).trim() } },
      ];
    }

    const skipNum = Math.max(0, parseInt(String(skip), 10) || 0);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50));

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip: skipNum,
        take: limitNum,
        orderBy: { orderTimestamp: 'desc' },
      }),
      prisma.message.count({ where }),
    ]);

    return res.status(200).json({
      status: 'success',
      message: `fetched ${messages.length} messages`,
      total,
      data: messages.map(formatMessage),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 8. Search messages
messageRouter.get('/v1/messages/search', requireAuth, async (req: Request, res: Response) => {
  try {
    const { query, skip = '0', limit = '20' } = req.query;

    if (!query) {
      return res.status(400).json({
        status: 'error',
        message: 'query parameter is required',
      });
    }

    const skipNum = Math.max(0, parseInt(String(skip), 10) || 0);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));

    const where = {
      userId: req.user!.id,
      OR: [
        { content: { contains: String(query).trim() } },
        { contact: { contains: String(query).trim() } },
        { owner: { contains: String(query).trim() } },
      ],
    };

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip: skipNum,
        take: limitNum,
        orderBy: { orderTimestamp: 'desc' },
      }),
      prisma.message.count({ where }),
    ]);

    return res.status(200).json({
      status: 'success',
      total,
      data: messages.map(formatMessage),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 9. Get single message
messageRouter.get('/v1/messages/:messageId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        userId: req.user!.id,
      },
    });

    if (!message) {
      return res.status(404).json({
        status: 'fail',
        message: `cannot find message with ID [${messageId}]`,
      });
    }

    return res.status(200).json({
      status: 'success',
      data: formatMessage(message),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 10. Delete single message
messageRouter.delete('/v1/messages/:messageId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    const existing = await prisma.message.findFirst({
      where: {
        id: messageId,
        userId: req.user!.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        status: 'fail',
        message: `cannot find message with ID [${messageId}]`,
      });
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

