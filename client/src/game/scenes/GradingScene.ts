import Phaser from 'phaser';

const W = 400;
const H = 300;

const PAPERS = [
  { id: 0, answer: '3+5=8', isCorrect: true },
  { id: 1, answer: '7×8=54', isCorrect: false },
  { id: 2, answer: '12÷4=3', isCorrect: true },
  { id: 3, answer: '9×6=56', isCorrect: false },
  { id: 4, answer: '25-17=8', isCorrect: true },
  { id: 5, answer: '15+27=42', isCorrect: true },
];

export class GradingScene extends Phaser.Scene {
  private currentPaper = 0;
  private correctCount = 0;
  private targetCorrect = 4;
  private onComplete?: (success: boolean) => void;
  private paperBg!: Phaser.GameObjects.Rectangle;
  private answerText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GradingScene' });
  }

  init(data: { onComplete: (success: boolean) => void }) {
    this.onComplete = data.onComplete;
    this.currentPaper = 0;
    this.correctCount = 0;
  }

  create() {
    const cx = W / 2, cy = H / 2;

    this.add.rectangle(cx, cy, W, H, 0x0f0f23, 0.92).setCornerRadius(16);
    this.add.rectangle(cx, cy, W, H, 0x000000, 0).setStrokeStyle(2, 0xfbbf24).setCornerRadius(16);

    this.add.text(cx, 20, '📝 批改作业', {
      fontSize: '18px', color: '#fbbf24', fontFamily: '"Segoe UI", sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.progressText = this.add.text(cx, 46, '', {
      fontSize: '12px', color: '#64748b', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.paperBg = this.add.rectangle(cx, cy - 10, W - 60, 140, 0x1e293b, 0.9).setCornerRadius(12);
    this.paperBg.setStrokeStyle(2, 0x475569);

    this.add.text(cx, cy - 50, '📄 同学作业', {
      fontSize: '12px', color: '#64748b', fontFamily: '"Segoe UI", sans-serif',
    }).setOrigin(0.5);

    this.answerText = this.add.text(cx, cy, '', {
      fontSize: '24px', color: '#e2e8f0', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(cx, cy + 50, '是否正确？', {
      fontSize: '13px', color: '#94a3b8', fontFamily: '"Segoe UI", sans-serif',
    }).setOrigin(0.5);

    const checkBtn = this.add.text(cx - 50, cy + 85, '✅ 正确', {
      fontSize: '16px', color: '#34d399', fontFamily: '"Segoe UI", sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const crossBtn = this.add.text(cx + 50, cy + 85, '❌ 错误', {
      fontSize: '16px', color: '#ef4444', fontFamily: '"Segoe UI", sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    checkBtn.on('pointerdown', () => this.grade(true));
    crossBtn.on('pointerdown', () => this.grade(false));

    this.showPaper(0);
  }

  private showPaper(index: number) {
    if (index >= PAPERS.length) {
      this.onComplete?.(this.correctCount >= this.targetCorrect);
      this.scene.stop();
      return;
    }
    this.currentPaper = index;
    const paper = PAPERS[index];
    this.answerText.setText(paper.answer);
    this.progressText.setText(`批改 ${index + 1} / ${PAPERS.length}  正确 ${this.correctCount}/${this.targetCorrect}`);
  }

  private grade(judgedCorrect: boolean) {
    const paper = PAPERS[this.currentPaper];
    const isRight = judgedCorrect === paper.isCorrect;

    if (isRight) {
      this.correctCount++;
      const fb = this.add.text(W / 2, H / 2 - 60, '✓', {
        fontSize: '32px', color: '#34d399', fontFamily: '"Segoe UI", sans-serif', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.tweens.add({ targets: fb, alpha: 0, y: fb.y - 20, duration: 500, onComplete: () => fb.destroy() });
    } else {
      const fb = this.add.text(W / 2, H / 2 - 60, '✗', {
        fontSize: '32px', color: '#ef4444', fontFamily: '"Segoe UI", sans-serif', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.tweens.add({ targets: fb, alpha: 0, y: fb.y - 20, duration: 500, onComplete: () => fb.destroy() });
    }

    this.time.delayedCall(400, () => this.showPaper(this.currentPaper + 1));
  }
}
