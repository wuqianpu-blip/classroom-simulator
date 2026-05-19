import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useState, useEffect } from 'react';

interface GameResult {
  userId: string;
  nickname: string;
  role: 'teacher' | 'student';
  caughtCount: number;
  finalRisk: number;
  teachingProgress?: number;
}

export function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const results = (location.state as any)?.results as GameResult[] || [];
  const roomCode = (location.state as any)?.roomCode || '';

  const [xpEarned, setXpEarned] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);

  useEffect(() => {
    const myResult = results.find((r) => r.userId === userId);
    if (myResult) {
      if (myResult.role === 'teacher') {
        const progress = myResult.teachingProgress || 0;
        setXpEarned(Math.round(progress * 1.5 + 10));
        setCoinsEarned(Math.round(progress + 5));
      } else {
        const caughtPenalty = myResult.caughtCount * 5;
        const riskBonus = Math.max(0, 100 - myResult.finalRisk);
        setXpEarned(Math.round(riskBonus * 0.5 - caughtPenalty * 0.5 + 10));
        setCoinsEarned(Math.round(riskBonus * 0.3 - caughtPenalty * 0.3 + 5));
      }
    }
  }, [results, userId]);

  const grade = (xp: number): { label: string; color: string; stars: string } => {
    if (xp >= 50) return { label: 'S', color: '#fbbf24', stars: '⭐⭐⭐' };
    if (xp >= 35) return { label: 'A', color: '#34d399', stars: '⭐⭐' };
    if (xp >= 20) return { label: 'B', color: '#60a5fa', stars: '⭐' };
    return { label: 'C', color: '#94a3b8', stars: '' };
  };

  const myResult = results.find((r) => r.userId === userId);
  const gradeInfo = grade(xpEarned);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      fontFamily: '"Segoe UI", system-ui, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '40px',
        width: '500px',
        maxWidth: '90vw',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>下课了！</h1>
        <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 24px', fontFamily: 'monospace' }}>
          {roomCode} · {myResult?.role === 'teacher' ? '👩‍🏫 老师视角' : '🎒 学生视角'}
        </p>

        {/* 评分展示 */}
        <div style={{
          width: '100px', height: '100px', borderRadius: '50%',
          border: `4px solid ${gradeInfo.color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          background: `radial-gradient(circle, ${gradeInfo.color}22, transparent)`,
        }}>
          <span style={{ fontSize: '36px', color: gradeInfo.color, fontWeight: 800 }}>{gradeInfo.label}</span>
        </div>
        <div style={{ fontSize: '18px', marginBottom: '16px' }}>{gradeInfo.stars}</div>

        {/* 经验/金币 */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '16px 24px',
            flex: 1,
          }}>
            <div style={{ fontSize: '24px', color: '#c084fc', fontWeight: 700 }}>+{xpEarned}</div>
            <div style={{ color: '#64748b', fontSize: '12px' }}>✨ 经验</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '16px 24px',
            flex: 1,
          }}>
            <div style={{ fontSize: '24px', color: '#fbbf24', fontWeight: 700 }}>+{coinsEarned}</div>
            <div style={{ color: '#64748b', fontSize: '12px' }}>🪙 金币</div>
          </div>
        </div>

        {/* 详细统计 */}
        {myResult && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
          }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              详细统计
            </div>
            {myResult.role === 'teacher' ? (
              <div style={{ display: 'flex', justifyContent: 'space-around', color: '#e2e8f0', fontSize: '14px' }}>
                <div>📊 教学进度 <span style={{ color: '#818cf8', fontWeight: 600 }}>{myResult.teachingProgress ?? 0}%</span></div>
                <div>🚨 抓住学生 <span style={{ color: '#f472b6', fontWeight: 600 }}>{results.filter(r => r.caughtCount > 0).length}人</span></div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-around', color: '#e2e8f0', fontSize: '14px' }}>
                <div>🚨 被抓 <span style={{ color: '#ef4444', fontWeight: 600 }}>{myResult.caughtCount}次</span></div>
                <div>📊 最终风险 <span style={{ color: '#fbbf24', fontWeight: 600 }}>{myResult.finalRisk}%</span></div>
              </div>
            )}
          </div>
        )}

        {/* 所有玩家 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '8px' }}>玩家排名</div>
          {results.sort((a, b) => {
            if (a.role !== b.role) return a.role === 'teacher' ? -1 : 1;
            const scoreA = a.role === 'teacher' ? (a.teachingProgress || 0) : (100 - a.finalRisk - a.caughtCount * 10);
            const scoreB = b.role === 'teacher' ? (b.teachingProgress || 0) : (100 - b.finalRisk - b.caughtCount * 10);
            return scoreB - scoreA;
          }).map((r, i) => (
            <div key={r.userId} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', marginBottom: '4px', borderRadius: '8px',
              background: r.userId === userId ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>#{i + 1}</span>
                <div>
                  <span style={{ color: '#e2e8f0', fontSize: '14px' }}>{r.nickname}</span>
                  <span style={{ color: '#64748b', fontSize: '11px', marginLeft: '6px' }}>
                    {r.role === 'teacher' ? '👩‍🏫' : '🎒'}
                  </span>
                </div>
              </div>
              <span style={{
                color: r.role === 'teacher' ? '#818cf8' : '#f472b6',
                fontSize: '13px', fontWeight: 600,
              }}>
                {r.role === 'teacher' ? `${r.teachingProgress || 0}%` : `${Math.max(0, 100 - r.finalRisk - r.caughtCount * 10)}分`}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={() => navigate('/lobby')} style={{
            padding: '12px 28px', border: 'none', borderRadius: '12px',
            background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
            color: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: 600,
          }}>
            返回大厅
          </button>
          <button onClick={() => navigate('/')} style={{
            padding: '12px 28px', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px', background: 'transparent',
            color: '#94a3b8', cursor: 'pointer', fontSize: '15px',
          }}>
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
