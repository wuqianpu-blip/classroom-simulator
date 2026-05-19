import { Router } from 'express';

interface Player {
  id: string;
  nickname: string;
}

interface Room {
  id: string;
  code: string;
  name: string;
  hostId: string;
  players: Player[];
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  maxPlayers: number;
  duration: number;
  createdAt: Date;
}

const rooms = new Map<string, Room>();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export const roomRouter: Router = Router();

roomRouter.get('/', (_req, res) => {
  const list = Array.from(rooms.values())
    .filter((r) => r.status === 'WAITING')
    .map(({ id, code, name, hostId, players, status, maxPlayers, duration, createdAt }) => ({
      id, code, name, hostId,
      playerCount: players.length,
      maxPlayers, status, duration, createdAt,
    }));
  res.json({ rooms: list });
});

roomRouter.get('/:code', (req, res) => {
  const room = Array.from(rooms.values()).find((r) => r.code === req.params.code);
  if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
  res.json({ room: { ...room, players: room.players } });
});

roomRouter.post('/', (req, res) => {
  const { name, hostId, hostNickname, maxPlayers = 8, duration = 600 } = req.body;
  if (!name || !hostId || !hostNickname) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  let code = generateCode();
  while (Array.from(rooms.values()).some((r) => r.code === code)) code = generateCode();

  const room: Room = {
    id: `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    code,
    name,
    hostId,
    players: [{ id: hostId, nickname: hostNickname }],
    status: 'WAITING',
    maxPlayers,
    duration,
    createdAt: new Date(),
  };
  rooms.set(room.id, room);
  res.json({ room: { ...room, players: room.players } });
});
