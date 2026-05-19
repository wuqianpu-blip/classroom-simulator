import Phaser from 'phaser';
import type { QuizTask } from '../entities/TeachingManager';

const W = 450;
const H = 320;

export class QuizScene extends Phaser.Scene {
  private quiz!: QuizTask;
  private onComplete?: (correct: boolean) => void;

  constructor() {
    super({ key: 'QuizScene' });
  }

  init(data: { quiz: QuizTask; onComplete: (correct: boolean) => void }) {
    this.quiz = data.quiz;
    this.onComplete = data.onComplete;
  }

  create() {
    const cx = W / 2;
    const q = this.quiz;

    this.add.rectangle(cx, H / 2, W, H, 0x0f0f23, 0.92).setRounded(16);
    this.add.rectangle(cx, H / 2, W, H, 0x000000, 0).setStrokeStyle(2, 0x6366f1).setRounded(16);

    this.add.text(cx, 24, '👩‍🏫 老师提问', {
      fontSize: '16px', color: '#818cf8', fontFamily: '"Segoe UI", sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 60, q.question, {
      fontSize: '15px', color: '#e2e8f0', fontFamily: '"Segoe UI", sans-serif',
      align: 'center', wordWrap: { width: W - 60 },
    }).setOrigin(0.5);

    const gap = 44;
    const startY = 100;

    q.options.forEach((opt, i) => {
      const y = startY + i * gap;
      const bg = this.add.rectangle(cx, y, W - 60, 36, 0x1e293b, 0.8).setRounded(8);
      bg.setStrokeStyle(1, 0x475569);
      bg.setInteractive({ useHandCursor: true });

      const letters = ['A', 'B', 'C', 'D'];
      this.add.text(cx - (W - 60) / 2 + 14, y, `${letters[i]}.`, {
        fontSize: '13px', color: '#818cf8', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      this.add.text(cx - (W - 60) / 2 + 40, y, opt, {
        fontSize: '13px', color: '#cbd5e1', fontFamily: '"Segoe UI", sans-serif',
      }).setOrigin(0, 0.5);

      bg.on('pointerover', () => { bg.setFillStyle(0x334155, 0.9); });
      bg.on('pointerout', () => { bg.setFillStyle(0x1e293b, 0.8); });

      bg.on('pointerdown', () => {
        const correct = i === q.answer;

        this.add.text(cx, H - 80, correct ? '✅ 回答正确！' : '❌ 回答错误', {
          fontSize: '16px', color: correct ? '#34d399' : '#ef4444',
          fontFamily: '"Segoe UI", sans-serif', fontStyle: 'bold',
        }).setOrigin(0.5);

        bg.setStrokeStyle(2, correct ? 0x34d399 : 0xef4444);

        this.time.delayedCall(1200, () => {
          this.onComplete?.(correct);
          this.scene.stop();
        });
      });
    });
  }
}
