import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRoomStore } from '../../store/roomStore';
import { connectSocket, getSocket } from '../../services/socket';
import { useNavigate } from 'react-router-dom';

export function LobbyPage() {
  const { nickname, userId, clear } = useAuthStore();
  const { rooms, currentRoom, fetchRooms, createRoom, setCurrentRoom, players, setPlayers } = useRoomStore();
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const fetched = useRef(false);
  const socket = getSocket();

  useEffect(() => {
    if (!fetched.current) {
      fetchRooms();
      fetched.current = true;
    }
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  useEffect(() => {
    socket.on('room:players', (data) => {
      setPlayers(data.players);
    });

    socket.on('game:start', (data) => {
      navigate(`/game/${currentRoom?.code || data.roomCode}`);
    });

    return () => {
      socket.off('room:players');
      socket.off('game:start');
    };
  }, [currentRoom]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    const room = await createRoom(roomName, userId, nickname);
    setShowCreate(false);
    setRoomName('');
    joinRoom(room.code);
  };

  const joinRoom = (code: string) => {
    connectSocket();
    socket.emit('room:join', {
      roomCode: code,
      user: { userId, nickname },
    });
    setInRoom(true);
  };

  const handleLeave = () => {
    socket.emit('room:leave');
    setInRoom(false);
    setReady(false);
    setCurrentRoom(null);
  };

  const toggleReady = () => {
    const newReady = !ready;
    setReady(newReady);
    socket.emit('room:ready', { ready: newReady });
  };

  const handleStart = () => {
    socket.emit('room:start');
  };

  const isHost = players[0]?.userId === userId;
  const allReady = players.length >= 2 && players.every((p) => p.ready);

  const boxStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '24px',
  };

  const btn = (color: string, label: string, onClick: () => void, disabled = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 20px',
        border: 'none',
        borderRadius: '10px',
        background: disabled ? '#334155' : color,
        color: disabled ? '#64748b' : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: 600,
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );

  if (inRoom) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        fontFamily: '"Segoe UI", system-ui, sans-serif',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ ...boxStyle, width: '450px', maxWidth: '90vw' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '36px' }}>🏫</div>
            <h2 style={{ color: '#e2e8f0', margin: '8px 0' }}>{currentRoom?.name || '房间'}</h2>
            <div style={{ color: '#c084fc', fontFamily: 'monospace', fontSize: '13px' }}>
              房间号: {currentRoom?.code || '---'}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              玩家 ({players.length}/8)
            </div>
            {players.map((p, i) => (
              <div key={p.userId} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                marginBottom: '6px',
                borderRadius: '10px',
                background: i === 0 ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${i === 0 ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: p.userId === userId ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', color: '#fff', fontWeight: 600,
                  }}>
                    {p.nickname[0]}
                  </div>
                  <div>
                    <div style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 500 }}>
                      {p.nickname} {p.userId === userId && '(我)'}
                    </div>
                    {i === 0 && <div style={{ color: '#818cf8', fontSize: '11px' }}>👩‍🏫 房主</div>}
                  </div>
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: '12px',
                  background: p.ready ? 'rgba(52,211,153,0.2)' : 'rgba(100,116,139,0.2)',
                  color: p.ready ? '#34d399' : '#64748b',
                }}>
                  {p.ready ? '✅ 已准备' : '⏳ 未准备'}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {btn(ready ? '#64748b' : '#6366f1', ready ? '✅ 已准备' : '准备', toggleReady)}
            {isHost && btn(
              allReady ? '#ec4899' : '#334155',
              '🚀 开始游戏',
              handleStart,
              !allReady
            )}
            {btn('#ef4444', '退出', handleLeave)}
          </div>

          {!allReady && isHost && (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', marginTop: '12px' }}>
              等待所有玩家准备...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      fontFamily: '"Segoe UI", system-ui, sans-serif',
      padding: '24px',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>🎒</span>
            <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: 0 }}>上课模拟器</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>
              {nickname}
            </span>
            <button onClick={clear} style={{
              padding: '8px 14px', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px', background: 'rgba(255,255,255,0.05)',
              color: '#94a3b8', cursor: 'pointer', fontSize: '13px',
            }}>退出</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => setShowCreate(true)} style={{
            padding: '10px 20px', border: 'none', borderRadius: '10px',
            background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
            color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
          }}>✨ 创建房间</button>
          <button onClick={fetchRooms} style={{
            padding: '10px 20px', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px', background: 'rgba(255,255,255,0.05)',
            color: '#94a3b8', cursor: 'pointer', fontSize: '14px',
          }}>↻ 刷新</button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} style={{ ...boxStyle, marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              style={{
                flex: 1, padding: '12px 16px', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px',
                outline: 'none',
              }}
              placeholder="房间名称"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
            />
            <button type="submit" style={{
              padding: '10px 20px', border: 'none', borderRadius: '10px',
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              color: '#fff', cursor: 'pointer', fontWeight: 600,
            }}>创建</button>
            <button type="button" onClick={() => setShowCreate(false)} style={{
              padding: '10px 20px', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px', background: 'transparent', color: '#94a3b8', cursor: 'pointer',
            }}>取消</button>
          </form>
        )}

        <div style={{ ...boxStyle }}>
          <div style={{ padding: '0 0 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
            游戏房间 ({rooms.length})
          </div>
          {rooms.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏫</div>
              <p style={{ margin: 0, fontSize: '15px' }}>暂无房间，创建一个吧！</p>
            </div>
          ) : (
            rooms.map((room) => (
              <div key={room.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div>
                  <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '15px' }}>📗 {room.name}</div>
                  <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
                    房间号: <span style={{ color: '#c084fc', fontFamily: 'monospace' }}>{room.code}</span>
                  </div>
                </div>
                <button onClick={() => joinRoom(room.code)} style={{
                  padding: '8px 18px', border: 'none', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                  color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                }}>加入</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
