import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const contactRouter = Router();

function formatContact(c: any) {
  return {
    id: c.id,
    user_id: c.userId,
    name: c.name,
    phone_numbers: c.phoneNumbers || [],
    emails: c.emails || [],
    properties: c.properties || {},
    created_at: c.createdAt?.toISOString(),
    updated_at: c.updatedAt?.toISOString(),
  };
}

// 1. List contacts (with search, pagination, sorting)
contactRouter.get('/v1/contacts', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      query,
      skip = '0',
      limit = '50',
      sort_by = 'name',
      sort_descending = 'false',
    } = req.query;

    const where: any = {
      userId: req.user!.id,
    };

    if (query) {
      where.OR = [
        { name: { contains: String(query).trim() } },
      ];
    }

    const skipNum = Math.max(0, parseInt(String(skip), 10) || 0);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50));
    const sortField = sort_by === 'updated_at' ? 'updatedAt' : 'name';
    const sortOrder = sort_descending === 'true' ? 'desc' : 'asc';

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip: skipNum,
        take: limitNum,
        orderBy: { [sortField]: sortOrder },
      }),
      prisma.contact.count({ where }),
    ]);

    return res.status(200).json({
      status: 'success',
      total,
      data: contacts.map(formatContact),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. Create single contact
contactRouter.post('/v1/contacts', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, phone_numbers, emails = [], properties = {} } = req.body;

    if (!name || !Array.isArray(phone_numbers) || phone_numbers.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and at least one phone number in phone_numbers are required',
      });
    }

    const cleanPhones = phone_numbers.map((p: any) => String(p).trim()).filter(Boolean);

    const contact = await prisma.contact.create({
      data: {
        id: uuidv4(),
        userId: req.user!.id,
        name: name.trim(),
        phoneNumbers: cleanPhones,
        emails: Array.isArray(emails) ? emails.map((e: any) => String(e).trim()).filter(Boolean) : [],
        properties: properties,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Contact created successfully',
      data: formatContact(contact),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 3. Batch import contacts (JSON array or uploaded list)
contactRouter.post('/v1/contacts/upload', requireAuth, async (req: Request, res: Response) => {
  try {
    const { contacts } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'contacts array is required for batch upload',
      });
    }

    const imported = [];
    for (const c of contacts) {
      if (!c.name || !c.phone_numbers) continue;
      const cleanPhones = Array.isArray(c.phone_numbers)
        ? c.phone_numbers.map((p: any) => String(p).trim()).filter(Boolean)
        : [String(c.phone_numbers).trim()];

      const record = await prisma.contact.create({
        data: {
          id: uuidv4(),
          userId: req.user!.id,
          name: c.name.trim(),
          phoneNumbers: cleanPhones,
          emails: Array.isArray(c.emails) ? c.emails : [],
          properties: c.properties || {},
        },
      });
      imported.push(formatContact(record));
    }

    return res.status(200).json({
      status: 'success',
      message: `${imported.length} contacts imported successfully`,
      data: imported,
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 4. Update contact
contactRouter.put('/v1/contacts/:contactId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;
    const { name, phone_numbers, emails, properties } = req.body;

    const existing = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId: req.user!.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        status: 'fail',
        message: `Contact with ID [${contactId}] not found`,
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone_numbers !== undefined && Array.isArray(phone_numbers)) {
      updateData.phoneNumbers = phone_numbers.map((p: any) => String(p).trim()).filter(Boolean);
    }
    if (emails !== undefined && Array.isArray(emails)) {
      updateData.emails = emails.map((e: any) => String(e).trim()).filter(Boolean);
    }
    if (properties !== undefined) {
      updateData.properties = properties;
    }

    const updated = await prisma.contact.update({
      where: { id: contactId },
      data: updateData,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Contact updated successfully',
      data: formatContact(updated),
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// 5. Delete contact
contactRouter.delete('/v1/contacts/:contactId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;

    const existing = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId: req.user!.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        status: 'fail',
        message: `Contact with ID [${contactId}] not found`,
      });
    }

    await prisma.contact.delete({
      where: { id: contactId },
    });

    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

