import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { ClassroomScene } from './scenes/ClassroomScene';
import { RamenScene } from './scenes/RamenScene';
import { PhoneScene } from './scenes/PhoneScene';
import { SleepScene } from './scenes/SleepScene';
import { QuizScene } from './scenes/QuizScene';
import { GradingScene } from './scenes/GradingScene';
import { DreamScene } from './scenes/DreamScene';

interface PhaserGameProps {
  roomCode?: string;
  role?: 'teacher' | 'student';
  timeLeft?: number;
}

export function PhaserGame({ role, timeLeft }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: containerRef.current,
      backgroundColor: '#1a1a2e',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [BootScene, ClassroomScene, RamenScene, PhoneScene, SleepScene, QuizScene, GradingScene, DreamScene],
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (gameRef.current?.scene.isActive('ClassroomScene')) {
      const classroom = gameRef.current.scene.getScene('ClassroomScene') as ClassroomScene;
      if (role) classroom.setPlayerRole(role);
      if (timeLeft !== undefined) classroom.setGameTime(timeLeft);
    }
  }, [role, timeLeft]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
  );
}
