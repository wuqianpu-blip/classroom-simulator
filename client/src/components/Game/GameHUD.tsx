import { GameBridge } from '../../game/GameBridge';

interface GameHUDProps {
  roomCode?: string;
  onLeave: () => void;
  role: 'teacher' | 'student';
  timeLeft: number;
}

export function GameHUD({ roomCode, onLeave, role, timeLeft }: GameHUDProps) {
  const trigger = (action: string) => GameBridge.getInstance().triggerAction(action);

  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;
  const timerStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  const isUrgent = timeLeft <= 60;

  const btn = (color: string, label: string, action: string, small?: boolean) => (
    <button
      onClick={() => trigger(action)}
      style={{
        padding: small ? '6px 12px' : '10px 18px',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '12px',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(10px)',
        color: '#e2e8f0',
        cursor: 'pointer',
        fontSize: small ? '11px' : '13px',
        fontWeight: 500,
        borderBottom: `3px solid ${color}`,
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      pointerEvents: 'none', fontFamily: '"Segoe UI", system-ui, sans-serif',
    }}>
      {/* Top bar */}
      <div style={{
        padding: '10px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', pointerEvents: 'auto' }}>
          <button onClick={onLeave} style={{
            padding: '6px 12px', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px', background: 'rgba(0,0,0,0.3)',
            color: '#94a3b8', cursor: 'pointer', fontSize: '12px',
          }}>← 退出</button>
          <div style={{
            background: role === 'teacher' ? 'rgba(99,102,241,0.2)' : 'rgba(236,72,153,0.2)',
            border: `1px solid ${role === 'teacher' ? 'rgba(99,102,241,0.3)' : 'rgba(236,72,153,0.3)'}`,
            borderRadius: '8px', padding: '4px 12px', fontSize: '12px',
            color: role === 'teacher' ? '#818cf8' : '#f472b6',
            fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span>{role === 'teacher' ? '👩‍🏫' : '🎒'}</span>
            <span>{roomCode || '---'}</span>
          </div>
        </div>

        <div style={{
          fontSize: '16px', fontWeight: 700, fontFamily: 'monospace',
          color: isUrgent ? '#ef4444' : '#e2e8f0',
          background: 'rgba(0,0,0,0.3)', padding: '4px 12px', borderRadius: '8px',
        }}>
          ⏱ {timerStr}
        </div>
      </div>

      {/* Teacher skill bar */}
      {role === 'teacher' && (
        <div style={{
          position: 'absolute', top: '56px', left: '12px',
          display: 'flex', gap: '4px', pointerEvents: 'auto', flexDirection: 'column',
        }}>
          <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', marginBottom: '2px' }}>⚡ 技能</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {btn('#818cf8', '🔍 扫描', 'scan', true)}
            {btn('#fbbf24', '🎯 粉笔', 'chalk', true)}
            {btn('#34d399', '📢 点名', 'call', true)}
            {btn('#60a5fa', '⏸ 暂停', 'freeze', true)}
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      <div style={{
        position: 'absolute', bottom: '40px', left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', gap: '8px', pointerEvents: 'auto',
      }}>
        {role === 'teacher' ? (
          <>
            {btn('#ef4444', '🚨 抓人', 'catch')}
            {btn('#fbbf24', '📖 发起提问', 'quiz')}
          </>
        ) : (
          <>
            {btn('#f472b6', '😴 睡觉', 'sleep')}
            {btn('#60a5fa', '📱 手机', 'phone')}
            {btn('#34d399', '🍜 偷吃', 'eat')}
            {btn('#fbbf24', '📝 传纸条', 'note')}
          </>
        )}
      </div>

      <div style={{
        position: 'absolute', bottom: '12px', left: 0, right: 0,
        textAlign: 'center', color: 'rgba(255,255,255,0.2)',
        fontSize: '10px', fontFamily: 'monospace' as const,
      }}>
        {role === 'teacher' ? 'WASD移动 · 靠近学生抓人 · 完成教学任务' : '做小动作获取分数 · 别被老师发现！'}
      </div>
    </div>
  );
}
