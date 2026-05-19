import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useRoomStore } from '../../store/roomStore';
import { getSocket, disconnectSocket } from '../../services/socket';
import { PhaserGame } from '../../game/PhaserGame';
import { GameHUD } from './GameHUD';
import { GameBridge } from '../../game/GameBridge';

interface GameResult {
  userId: string;
  nickname: string;
  role: 'teacher' | 'student';
  caughtCount: number;
  finalRisk: number;
  teachingProgress?: number;
}

export function GamePage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setPlayers } = useRoomStore();
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [timeLeft, setTimeLeft] = useState(600);
  const [, setResults] = useState<GameResult[]>([]);
  const socket = getSocket();

  useEffect(() => {
    if (!roomCode || !user) return;

    socket.emit('room:join', {
      roomCode,
      user: { userId: user.id, nickname: user.nickname, avatar: user.avatar },
    });

    socket.on('room:players', (data) => {
      setPlayers(data.players);
    });

    socket.on('game:start', (data) => {
      setRole(data.teacherId === user.id ? 'teacher' : 'student');
      setGameState('playing');
      setTimeLeft(data.duration);
    });

    socket.on('game:tick', (data) => {
      setTimeLeft(data.timeLeft);
    });

    socket.on('game:finished', (data) => {
      setGameState('finished');
      setResults(data.results);
      setTimeout(() => navigate('/result', { state: { results: data.results, roomCode } }), 2000);
    });

    // Sync teacher position
    const bridge = GameBridge.getInstance();
    bridge.onTeacherMove((x, y) => {
      socket.emit('teacher:move', { x, y });
    });

    bridge.onStudentAction((action) => {
      socket.emit('student:action', { action });
    });

    bridge.onRiskChange((risk) => {
      socket.emit('student:risk', { risk });
    });

    return () => {
      socket.off('room:players');
      socket.off('game:start');
      socket.off('game:tick');
      socket.off('game:finished');
      disconnectSocket();
    };
  }, [roomCode, user]);

  const handleLeave = () => {
    navigate('/lobby');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <PhaserGame roomCode={roomCode} role={role} timeLeft={timeLeft} />
      <GameHUD
        roomCode={roomCode}
        onLeave={handleLeave}
        role={role}
        timeLeft={timeLeft}
      />
    </div>
  );
}
