import Phaser from 'phaser';
import { getRandomFlavor, type RamenFlavor } from '../entities/RamenRecipes';

const W = 420, H = 360;

export class RamenScene extends Phaser.Scene {
  private flavor!: RamenFlavor;
  private currentStep = 0;
  private onComplete?: (success: boolean, flavorId: string) => void;
  private successCount = 0;
  private waitTimer = 0;
  private eatClicks = 0;
  private stepText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private mainGraphic!: Phaser.GameObjects.Text;
  private failCount = 0;
  private maxFails = 2;
  private active = false;

  constructor() {
    super({ key: 'RamenScene' });
  }

  init(data: { onComplete?: (success: boolean, flavorId: string) => void }) {
    this.onComplete = data.onComplete;
    this.flavor = getRandomFlavor();
    this.currentStep = 0;
    this.successCount = 0;
    this.eatClicks = 0;
    this.failCount = 0;
    this.active = false;
  }

  create() {
    const cx = W / 2, cy = H / 2;

    this.add.rectangle(cx, cy, W, H, 0x000000, 0.75).setCornerRadius(16);
    this.add.rectangle(cx, cy, W, H, 0x000000, 0).setStrokeStyle(2, this.flavor.color).setCornerRadius(16);

    // 标题
    this.add.text(cx, 18, `${this.flavor.emoji} ${this.flavor.name}`, {
      fontSize: '18px', color: this.flavor.color, fontFamily: '"Segoe UI", sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 38, this.flavor.description, {
      fontSize: '11px', color: '#64748b', fontFamily: '"Segoe UI", sans-serif',
    }).setOrigin(0.5);

    // 进度
    this.progressText = this.add.text(cx, 54, '', {
      fontSize: '11px', color: '#64748b', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // 主图形
    this.mainGraphic = this.add.text(cx, 130, '📦', { fontSize: '64px' }).setOrigin(0.5);
    this.tweens.add({ targets: this.mainGraphic, scaleX: { from: 0.9, to: 1 }, scaleY: { from: 0.9, to: 1 }, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // 步骤名
    this.stepText = this.add.text(cx, 195, '', {
      fontSize: '16px', color: '#e2e8f0', fontFamily: '"Segoe UI", sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    // 操作提示
    this.instructionText = this.add.text(cx, 225, '', {
      fontSize: '12px', color: '#94a3b8', fontFamily: '"Segoe UI", sans-serif',
    }).setOrigin(0.5);

    // 难度
    const stars = '⭐'.repeat(this.flavor.difficulty) + '☆'.repeat(Math.max(0, 5 - this.flavor.difficulty));
    this.add.text(cx, 248, stars, { fontSize: '14px' }).setOrigin(0.5);

    // 关闭
    const closeBtn = this.add.text(W - 16, 14, '✕', { fontSize: '18px', color: '#64748b' }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeScene(false));

    // 点击区
    const clickZone = this.add.rectangle(cx, 140, W - 40, 130, 0x000000, 0).setInteractive({ useHandCursor: true });
    clickZone.on('pointerdown', () => this.handleClick());

    this.showStep(0);
    this.active = true;
  }

  private showStep(index: number) {
    if (index >= this.flavor.steps.length) {
      this.closeScene(true);
      return;
    }

    this.currentStep = index;
    const step = this.flavor.steps[index];

    if (step.clickTarget && step.id !== this.flavor.steps[index - 1]?.id) {
      this.eatClicks = 0;
    }

    this.progressText.setText(`第 ${index + 1} / ${this.flavor.steps.length} 步`);
    this.stepText.setText(`${step.emoji} ${step.label}`);
    this.instructionText.setText(step.instruction);

    if (step.id === 'wait') {
      this.waitTimer = 0;
      this.mainGraphic.setText('⏳');
    } else if (step.id === 'eat' || step.id === '挑战' || step.id === '享用') {
      this.mainGraphic.setText(this.flavor.emoji);
      this.instructionText.setText(`连点吃面！(${this.eatClicks}/${step.clickTarget || 6})`);
    } else {
      this.mainGraphic.setText(step.emoji);
    }
  }

  private handleClick() {
    if (!this.active || this.currentStep >= this.flavor.steps.length) return;
    const step = this.flavor.steps[this.currentStep];

    if (step.id === 'wait') return;

    if (step.id === 'eat' || step.id === '挑战' || step.id === '享用') {
      this.eatClicks++;
      this.instructionText.setText(`连点吃面！(${this.eatClicks}/${step.clickTarget || 6})`);
      this.mainGraphic.setScale(1.2);
      this.time.delayedCall(80, () => this.mainGraphic.setScale(1));

      if (this.eatClicks >= (step.clickTarget || 6)) {
        this.successCount++;
        this.showFeedback('✅', '#34d399');
      }
      return;
    }

    if (step.id === '揉面' && step.clickTarget) {
      this.eatClicks = (this.eatClicks || 0) + 1;
      this.instructionText.setText(`快速点击揉面！(${this.eatClicks}/${step.clickTarget})`);
      this.mainGraphic.setScale(1.1);
      this.time.delayedCall(80, () => this.mainGraphic.setScale(1));
      if (this.eatClicks >= step.clickTarget) {
        this.successCount++;
        this.showFeedback('✅', '#34d399');
      }
      return;
    }

    if (Math.random() < step.failChance) {
      this.failCount++;
      this.showFeedback('❌ 手滑了！', '#ef4444');
      if (this.failCount >= this.maxFails) {
        this.closeScene(false);
        return;
      }
    } else {
      this.successCount++;
      this.showFeedback('✅', '#34d399');
    }
  }

  private showFeedback(text: string, color: string) {
    const cx = W / 2, cy = H / 2;
    const fb = this.add.text(cx, cy, text, { fontSize: '36px', color, fontFamily: '"Segoe UI", sans-serif' }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({
      targets: fb, alpha: 1, y: cy - 40, duration: 400, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: fb, alpha: 0, duration: 200,
          onComplete: () => { fb.destroy(); this.showStep(this.currentStep + 1); },
        });
      },
    });
  }

  update(_time: number, delta: number) {
    if (!this.active || this.currentStep >= this.flavor.steps.length) return;
    const step = this.flavor.steps[this.currentStep];
    if (step.id === 'wait') {
      this.waitTimer += delta / 1000;
      const remaining = Math.max(0, (step.waitTime || 3) - this.waitTimer);
      this.instructionText.setText(`等待 ${remaining.toFixed(1)} 秒...`);
      if (remaining <= 0) {
        this.successCount++;
        this.mainGraphic.setText('✅');
        this.showStep(this.currentStep + 1);
      }
    }
  }

  private closeScene(success: boolean) {
    this.active = false;
    this.onComplete?.(success, this.flavor.id);
    this.scene.stop();
  }
}
