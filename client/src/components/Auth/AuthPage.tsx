import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function AuthPage() {
  const [nickname, setNickname] = useState('');
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setUser(nickname.trim(), userId);
    navigate('/lobby');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Segoe UI", system-ui, sans-serif',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px',
        padding: '40px', width: '400px', maxWidth: '90vw',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎒</div>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '700', margin: 0 }}>上课模拟器</h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: '8px 0 24px' }}>Classroom Simulator</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            placeholder="输入你的昵称"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            style={{
              padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '16px',
              outline: 'none', textAlign: 'center',
            }}
          />
          <button type="submit" style={{
            padding: '14px', border: 'none', borderRadius: '12px',
            background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
            color: '#fff', fontSize: '16px', fontWeight: '600', cursor: 'pointer',
          }}>
            进入教室
          </button>
        </form>
      </div>
    </div>
  );
}
