import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const phoneApiKeyRouter = Router();

function formatKey(k: any) {
  return {
    id: k.id,
    user_id: k.userId,
    name: k.name,
    api_key: k.apiKey,
    phone_numbers: k.phoneNumbers || [],
    phone_ids: k.phoneIds || [],
    created_at: k.createdAt?.toISOString(),
    updated_at: k.updatedAt?.toISOString(),
  };
}

// 1. List phone API keys
phoneApiKeyRouter.get('/v1/phone-api-keys', requireAuth, async (req: Request, res: Response) => {
  try {
    const keys = await prisma.phoneApiKey.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      status: 'success',
      data: keys.map(formatKey),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. Create phone API key (Scoped to specific phone numbers)
phoneApiKeyRouter.post('/v1/phone-api-keys', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, phone_numbers = [] } = req.body;

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'name is required',
      });
    }

    const generatedApiKey = 'ctp_pak_' + crypto.randomBytes(24).toString('hex');

    const key = await prisma.phoneApiKey.create({
      data: {
        id: uuidv4(),
        userId: req.user!.id,
        name: name.trim(),
        apiKey: generatedApiKey,
        phoneNumbers: phone_numbers,
      },
    });

    return res.status(201).json({
      status: 'success',
      message: 'Phone API Key generated successfully',
      data: formatKey(key),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 3. Delete phone API key
phoneApiKeyRouter.delete('/v1/phone-api-keys/:keyId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;

    const existing = await prisma.phoneApiKey.findFirst({
      where: {
        id: keyId,
        userId: req.user!.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        status: 'fail',
        message: `Phone API key with ID [${keyId}] not found`,
      });
    }

    await prisma.phoneApiKey.delete({
      where: { id: keyId },
    });

    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

