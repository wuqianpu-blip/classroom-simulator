import type { Server as SocketIOServer, Socket } from 'socket.io';

interface PlayerData {
  userId: string;
  nickname: string;
  avatar: string;
  ready: boolean;
  role?: 'teacher' | 'student';
  seatIndex?: number;
}

interface GameState {
  status: 'waiting' | 'playing' | 'finished';
  players: Map<string, PlayerData>;
  teacherId: string | null;
  timeLeft: number;
  duration: number;
  teachingProgress: number;
  studentStates: Map<string, {
    action: string;
    risk: number;
    caughtCount: number;
  }>;
}

const rooms = new Map<string, GameState>();

function getOrCreateRoom(roomCode: string, duration = 600): GameState {
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, {
      status: 'waiting',
      players: new Map(),
      teacherId: null,
      timeLeft: duration,
      duration,
      teachingProgress: 0,
      studentStates: new Map(),
    });
  }
  return rooms.get(roomCode)!;
}

export function setupSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    let currentRoomCode: string | null = null;
    let currentUserId: string | null = null;

    socket.on('room:join', ({ roomCode, user }) => {
      if (!roomCode || !user?.userId) return;
      socket.join(roomCode);
      currentRoomCode = roomCode;
      currentUserId = user.userId;

      const room = getOrCreateRoom(roomCode);
      if (!room.players.has(user.userId)) {
        room.players.set(user.userId, {
          userId: user.userId,
          nickname: user.nickname,
          avatar: user.avatar,
          ready: false,
        });
        room.studentStates.set(user.userId, { action: 'idle', risk: 0, caughtCount: 0 });
      }

      io.to(roomCode).emit('room:players', {
        players: Array.from(room.players.values()),
      });
      io.to(roomCode).emit('room:state', serializeRoomState(room));
    });

    socket.on('room:leave', () => {
      if (currentRoomCode && currentUserId) {
        handleLeave(currentRoomCode, currentUserId);
      }
    });

    socket.on('room:ready', ({ ready }) => {
      if (!currentRoomCode || !currentUserId) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;
      const player = room.players.get(currentUserId);
      if (player) {
        player.ready = ready;
        io.to(currentRoomCode).emit('room:players', {
          players: Array.from(room.players.values()),
        });
      }
    });

    socket.on('room:start', () => {
      if (!currentRoomCode || !currentUserId) return;
      const room = rooms.get(currentRoomCode);
      if (!room || room.status !== 'waiting') return;

      const allReady = Array.from(room.players.values()).every((p) => p.ready);

      // Assign roles: first player is teacher, rest are students
      const playerList = Array.from(room.players.keys());
      room.teacherId = currentUserId;
      room.players.forEach((p, uid) => {
        p.role = uid === room.teacherId ? 'teacher' : 'student';
        const studentIdx = playerList.indexOf(uid);
        p.seatIndex = uid === room.teacherId ? -1 : studentIdx - 1;
      });

      room.status = 'playing';
      room.timeLeft = room.duration;

      io.to(currentRoomCode).emit('game:start', {
        teacherId: room.teacherId,
        players: Array.from(room.players.values()),
        duration: room.duration,
      });

      startGameTimer(io, currentRoomCode, room);
    });

    // Teacher actions sync
    socket.on('teacher:move', ({ x, y }) => {
      if (!currentRoomCode) return;
      socket.to(currentRoomCode).emit('teacher:moved', { userId: currentUserId, x, y });
    });

    socket.on('teacher:skill', ({ skillId }) => {
      if (!currentRoomCode) return;
      io.to(currentRoomCode).emit('teacher:skill_used', { userId: currentUserId, skillId });
    });

    // Student actions sync
    socket.on('student:action', ({ action }) => {
      if (!currentRoomCode || !currentUserId) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;
      const state = room.studentStates.get(currentUserId);
      if (state) {
        state.action = action;
        io.to(currentRoomCode).emit('student:action_changed', {
          userId: currentUserId,
          action,
        });
      }
    });

    socket.on('student:risk', ({ risk }) => {
      if (!currentRoomCode || !currentUserId) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;
      const state = room.studentStates.get(currentUserId);
      if (state) {
        state.risk = risk;
        socket.to(currentRoomCode).emit('student:risk_updated', {
          userId: currentUserId,
          risk,
        });
      }
    });

    // Teaching progress sync
    socket.on('teacher:progress', ({ progress }) => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (room) {
        room.teachingProgress = progress;
        io.to(currentRoomCode).emit('teacher:progress_updated', { progress });
      }
    });

    // Catch student
    socket.on('teacher:catch', ({ studentId }) => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;
      const state = room.studentStates.get(studentId);
      if (state) {
        state.caughtCount++;
        state.action = 'idle';
        state.risk = 0;
        io.to(currentRoomCode).emit('student:caught', { studentId, count: state.caughtCount });
      }
    });

    socket.on('disconnect', () => {
      if (currentRoomCode && currentUserId) {
        handleLeave(currentRoomCode, currentUserId);
      }
    });
  });
}

function handleLeave(roomCode: string, userId: string) {
  const room = rooms.get(roomCode);
  if (!room) return;
  room.players.delete(userId);
  room.studentStates.delete(userId);
  if (room.players.size === 0) {
    rooms.delete(roomCode);
  }
}

function startGameTimer(io: SocketIOServer, roomCode: string, room: GameState) {
  const interval = setInterval(() => {
    const r = rooms.get(roomCode);
    if (!r || r.status === 'finished') {
      clearInterval(interval);
      return;
    }
    r.timeLeft--;
    io.to(roomCode).emit('game:tick', { timeLeft: r.timeLeft });

    if (r.timeLeft <= 0) {
      r.status = 'finished';
      clearInterval(interval);

      const results = Array.from(r.players.values()).map((p) => ({
        userId: p.userId,
        nickname: p.nickname,
        role: p.role,
        caughtCount: r.studentStates.get(p.userId)?.caughtCount ?? 0,
        finalRisk: r.studentStates.get(p.userId)?.risk ?? 0,
        teachingProgress: p.role === 'teacher' ? r.teachingProgress : undefined,
      }));

      io.to(roomCode).emit('game:finished', { results });
    }
  }, 1000);
}

function serializeRoomState(room: GameState) {
  return {
    status: room.status,
    playerCount: room.players.size,
    teacherId: room.teacherId,
    timeLeft: room.timeLeft,
    teachingProgress: room.teachingProgress,
  };
}
