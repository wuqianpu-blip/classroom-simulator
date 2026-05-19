import { Router, type Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware, type AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const roomRouter: Router = Router();

const createRoomSchema = z.object({
  name: z.string().min(1).max(30),
  maxPlayers: z.number().min(2).max(16).default(8),
  duration: z.number().min(60).max(1800).default(600),
});

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

roomRouter.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, maxPlayers, duration } = createRoomSchema.parse(req.body);
    let code: string;
    let attempts = 0;
    do {
      code = generateCode();
      const existing = await prisma.room.findUnique({ where: { code } });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    const room = await prisma.room.create({
      data: { name, code, maxPlayers, duration, hostId: req.userId! },
    });
    res.json({ room });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

roomRouter.get('/', authMiddleware, async (_req: AuthRequest, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { status: 'WAITING' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ rooms });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

roomRouter.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }
    res.json({ room });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});
