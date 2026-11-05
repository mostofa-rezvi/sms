import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const webhookRouter = Router();

function formatWebhook(w: any) {
  return {
    id: w.id,
    user_id: w.userId,
    url: w.url,
    events: w.events || [],
    phone_numbers: w.phoneNumbers || [],
    signing_key: w.signingKey,
    created_at: w.createdAt?.toISOString(),
    updated_at: w.updatedAt?.toISOString(),
  };
}

// 1. List webhooks
webhookRouter.get('/v1/webhooks', requireAuth, async (req: Request, res: Response) => {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      status: 'success',
      data: webhooks.map(formatWebhook),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. Create webhook
webhookRouter.post('/v1/webhooks', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      url,
      events = ['message.received', 'message.sent', 'message.failed'],
      phone_numbers = [],
      signing_key,
    } = req.body;

    if (!url) {
      return res.status(400).json({
        status: 'error',
        message: 'url is required',
      });
    }

    const signingKey = signing_key || crypto.randomBytes(20).toString('hex');

    const webhook = await prisma.webhook.create({
      data: {
        id: uuidv4(),
        userId: req.user!.id,
        url: url.trim(),
        events: events,
        phoneNumbers: phone_numbers,
        signingKey: signingKey,
      },
    });

    return res.status(201).json({
      status: 'success',
      message: 'Webhook created successfully',
      data: formatWebhook(webhook),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 3. Update webhook
webhookRouter.put('/v1/webhooks/:webhookId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const { url, events, phone_numbers, signing_key } = req.body;

    const existing = await prisma.webhook.findFirst({
      where: {
        id: webhookId,
        userId: req.user!.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        status: 'fail',
        message: `Webhook with ID [${webhookId}] not found`,
      });
    }

    const updateData: any = {};
    if (url !== undefined) updateData.url = url.trim();
    if (events !== undefined && Array.isArray(events)) updateData.events = events;
    if (phone_numbers !== undefined && Array.isArray(phone_numbers)) updateData.phoneNumbers = phone_numbers;
    if (signing_key !== undefined) updateData.signingKey = signing_key;

    const updated = await prisma.webhook.update({
      where: { id: webhookId },
      data: updateData,
    });

    return res.status(200).json({
      status: 'success',
      data: formatWebhook(updated),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 4. Delete webhook
webhookRouter.delete('/v1/webhooks/:webhookId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;

    const existing = await prisma.webhook.findFirst({
      where: {
        id: webhookId,
        userId: req.user!.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        status: 'fail',
        message: `Webhook with ID [${webhookId}] not found`,
      });
    }

    await prisma.webhook.delete({
      where: { id: webhookId },
    });

    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});
