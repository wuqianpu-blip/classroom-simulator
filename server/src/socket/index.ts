import { Server, Socket } from 'socket.io';

interface PlayerData {
  userId: string;
  nickname: string;
  ready: boolean;
  risk: number;
  score: number;
}

interface GameRoom {
  players: Map<string, PlayerData>;
  hostId: string;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  teacherId: string | null;
  timer: number;
  duration: number;
  timerHandle?: ReturnType<typeof setInterval>;
}

const gameRooms = new Map<string, GameRoom>();

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    let currentRoom: string | null = null;

    socket.on('room:join', ({ roomCode, user }: { roomCode: string; user: { userId: string; nickname: string } }) => {
      if (!roomCode || !user?.userId) return;
      let room = gameRooms.get(roomCode);
      if (!room) {
        room = { players: new Map(), hostId: user.userId, status: 'WAITING', teacherId: null, timer: 0, duration: 600 };
        gameRooms.set(roomCode, room);
      }
      if (room.status !== 'WAITING') return;
      if (room.players.has(user.userId)) return;
      if (room.players.size >= 8) return;

      room.players.set(user.userId, { userId: user.userId, nickname: user.nickname, ready: false, risk: 0, score: 0 });
      currentRoom = roomCode;
      socket.join(roomCode);

      const players = Array.from(room.players.values());
      io.to(roomCode).emit('room:players', { players });
    });

    socket.on('room:ready', ({ ready }: { ready: boolean }) => {
      if (!currentRoom) return;
      const room = gameRooms.get(currentRoom);
      if (!room) return;
      const sid = Array.from(room.players.keys()).find((id) => {
        const sockets = Array.from(io.sockets.adapter.rooms.get(currentRoom) || []);
        return id === socket.id;
      });
      if (!sid) return;
      const player = room.players.get(sid);
      if (player) { player.ready = true; }
      // actually track by userId, we need to fix this
    });

    socket.on('game:start', () => {
      if (!currentRoom) return;
      const room = gameRooms.get(currentRoom);
      if (!room || room.status !== 'WAITING') return;
      if (room.hostId !== Array.from(room.players.values())[0]?.userId) return;

      room.status = 'PLAYING';
      room.teacherId = room.hostId;
      room.duration = 600;
      room.timer = room.duration;

      io.to(currentRoom).emit('game:start', { teacherId: room.teacherId, duration: room.duration });
    });

    socket.on('teacher:move', ({ x, y }: { x: number; y: number }) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit('teacher:move', { x, y });
    });

    socket.on('student:action', ({ action }: { action: string }) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit('student:action', { userId: socket.id, action });
    });

    socket.on('student:risk', ({ risk }: { risk: number }) => {
      if (!currentRoom) return;
      const room = gameRooms.get(currentRoom);
      if (!room) return;
      const player = room.players.get(socket.id);
      if (player) player.risk = risk;
      socket.to(currentRoom).emit('student:risk', { userId: socket.id, risk });
    });

    socket.on('teacher:skill', ({ skillId }: { skillId: string }) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit('teacher:skill', { skillId });
    });

    socket.on('teacher:teaching', ({ progress }: { progress: number }) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit('teacher:teaching', { progress });
    });

    socket.on('game:tick', () => {
      if (!currentRoom) return;
      const room = gameRooms.get(currentRoom);
      if (!room || room.status !== 'PLAYING') return;
      room.timer--;
      io.to(currentRoom).emit('game:tick', { timeLeft: room.timer });
      if (room.timer <= 0) {
        room.status = 'FINISHED';
        const results = Array.from(room.players.values()).map((p) => ({
          nickname: p.nickname, score: p.score, risk: p.risk,
        }));
        io.to(currentRoom).emit('game:finished', { results });
      }
    });

    socket.on('disconnect', () => {
      if (!currentRoom) return;
      const room = gameRooms.get(currentRoom);
      if (!room) return;
      room.players.delete(socket.id);
      if (room.players.size === 0) gameRooms.delete(currentRoom);
      else io.to(currentRoom).emit('room:players', { players: Array.from(room.players.values()) });
    });
  });
}
