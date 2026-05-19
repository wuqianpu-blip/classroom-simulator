import Phaser from 'phaser';

const W = 300;
const H = 400;

export class PhoneScene extends Phaser.Scene {
  private score = 0;
  private targetScore = 10;
  private timeLeft = 15;
  private timerText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private targets: Phaser.GameObjects.Arc[] = [];
  private spawnTimer = 0;
  private onComplete?: (success: boolean) => void;

  constructor() {
    super({ key: 'PhoneScene' });
  }

  init(data: { onComplete?: (success: boolean) => void }) {
    this.onComplete = data.onComplete;
    this.score = 0;
    this.timeLeft = 15;
    this.targets = [];
  }

  create() {
    const cx = W / 2, cy = H / 2;

    this.add.rectangle(cx, cy, W, H, 0x000000, 0.85).setCornerRadius(16);
    this.add.rectangle(cx, cy, W, H, 0x000000, 0).setStrokeStyle(2, 0x60a5fa).setCornerRadius(16);

    this.add.text(cx, 20, '📱 玩手机', {
      fontSize: '18px', color: '#60a5fa', fontFamily: '"Segoe UI", sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.timerText = this.add.text(W - 16, 16, '⏱ 15', {
      fontSize: '14px', color: '#e2e8f0', fontFamily: 'monospace',
    }).setOrigin(1, 0);

    this.scoreText = this.add.text(16, 16, `⭐ ${this.score}/${this.targetScore}`, {
      fontSize: '14px', color: '#fbbf24', fontFamily: '"Segoe UI", sans-serif',
    }).setOrigin(0, 0);

    this.add.text(cx, 370, '点击彩色泡泡得分！', {
      fontSize: '11px', color: '#64748b', fontFamily: '"Segoe UI", sans-serif',
    }).setOrigin(0.5);

    const closeBtn = this.add.text(W - 16, 46, '✕ 关闭', {
      fontSize: '12px', color: '#64748b',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeScene(false));
  }

  update(_time: number, delta: number) {
    this.timeLeft -= delta / 1000;
    if (this.timeLeft <= 0) {
      this.closeScene(this.score >= this.targetScore);
      return;
    }

    this.timerText.setText(`⏱ ${Math.ceil(this.timeLeft)}`);
    this.scoreText.setText(`⭐ ${this.score}/${this.targetScore}`);

    this.spawnTimer += delta / 1000;
    if (this.spawnTimer > 0.8 && this.targets.length < 6) {
      this.spawnTimer = 0;
      this.spawnTarget();
    }

    // 移动目标
    this.targets.forEach((t) => {
      const speed = t.getData('speed') as number;
      const dir = t.getData('dir') as number;
      t.x += Math.cos(dir) * speed * (delta / 1000);
      t.y += Math.sin(dir) * speed * (delta / 1000);

      if (t.x < 20 || t.x > W - 20) {
        t.setData('dir', Math.PI - dir);
      }
      if (t.y < 60 || t.y > H - 30) {
        t.setData('dir', -dir);
      }

      t.x = Phaser.Math.Clamp(t.x, 20, W - 20);
      t.y = Phaser.Math.Clamp(t.y, 60, H - 30);
    });
  }

  private spawnTarget() {
    const colors = [0xf472b6, 0x60a5fa, 0x34d399, 0xfbbf24, 0xa78bfa, 0xfb923c];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const x = Phaser.Math.Between(40, W - 40);
    const y = Phaser.Math.Between(70, H - 50);
    const dir = Math.random() * Math.PI * 2;
    const speed = Phaser.Math.Between(30, 80);

    const target = this.add.circle(x, y, 18, color).setAlpha(0.9);
    target.setStrokeStyle(2, 0xffffff, 0.3);
    target.setData('speed', speed);
    target.setData('dir', dir);
    target.setInteractive({ useHandCursor: true });

    target.on('pointerdown', () => {
      this.score++;

      // 点击反馈
      const pop = this.add.circle(target.x, target.y, 22, color).setAlpha(0.5);
      this.tweens.add({
        targets: pop, scaleX: 1.8, scaleY: 1.8, alpha: 0, duration: 300,
        onComplete: () => pop.destroy(),
      });

      target.destroy();
      this.targets = this.targets.filter((t) => t !== target);

      if (this.score >= this.targetScore) {
        this.closeScene(true);
      }
    });

    this.targets.push(target);
  }

  private closeScene(success: boolean) {
    this.onComplete?.(success);
    this.scene.stop();
  }
}
