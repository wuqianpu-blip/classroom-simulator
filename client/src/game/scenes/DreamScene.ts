import Phaser from 'phaser';
import { DREAM_THEMES, type DreamTheme } from '../entities/DreamThemes';
import { soundManager } from '../entities/SoundManager';

const W = 800, H = 600;

interface Shard {
  x: number; y: number; graphic: Phaser.GameObjects.Arc; collected: boolean;
}

interface MascotObj {
  x: number; y: number; emoji: string; name: string; dialog: string;
  graphic: Phaser.GameObjects.Text; label: Phaser.GameObjects.Text; talked: boolean;
}

export class DreamScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private speed = 200;
  private shards: Shard[] = [];
  private shardCount = 0;
  private shardTotal = 0;
  private shardText!: Phaser.GameObjects.Text;
  private mascots: MascotObj[] = [];
  private dialogBox: Phaser.GameObjects.Container | null = null;
  private rides: Phaser.GameObjects.Container[] = [];
  private onComplete?: (shards: number, theme: string) => void;
  private theme!: DreamTheme;
  private themeKey = 'playground';
  private stars: Phaser.GameObjects.Arc[] = [];

  constructor() {
    super({ key: 'DreamScene' });
  }

  init(data: { theme?: string; onComplete?: (shards: number, theme: string) => void }) {
    this.themeKey = DREAM_THEMES[data.theme || ''] ? data.theme! : 'playground';
    this.theme = DREAM_THEMES[this.themeKey];
    this.onComplete = data.onComplete;
    this.shardCount = 0;
    this.rides = [];
    this.shards = [];
    this.mascots = [];
    this.stars = [];
  }

  create() {
    soundManager.play('dream');
    this.cameras.main.setBackgroundColor(this.theme.bgColor);
    this.buildFloor();
    this.buildDecorations();
    this.buildRides();
    this.buildMascots();
    this.spawnShards();
    this.buildStars();
    this.createPlayer();
    this.setupInput();
    this.createHUD();
    this.cameras.main.fadeIn(800);
  }

  update(_time: number, delta: number) {
    this.handleMovement(delta);
    this.updateRides(delta);
    this.checkShardCollection();
    this.checkMascotProximity();
  }

  /* ────── 地图 ────── */

  private buildFloor() {
    this.add.rectangle(W / 2, H / 2, W - 20, H - 20, this.theme.floorColor).setStrokeStyle(2, this.theme.floorColor + 0x222222);
    for (let x = 20; x < W; x += 32) {
      for (let y = 20; y < H; y += 32) {
        const shade = (Math.floor(x / 32) + Math.floor(y / 32)) % 2 === 0 ? this.theme.floorAlt : this.theme.floorColor;
        this.add.rectangle(x, y, 30, 30, shade).setAlpha(0.4);
      }
    }
    this.add.rectangle(W / 2, 10, W - 20, 20, 0x000000, 0.3);
    this.add.rectangle(W / 2, H - 10, W - 20, 20, 0x000000, 0.3);
    this.add.rectangle(10, H / 2, 20, H - 20, 0x000000, 0.3);
    this.add.rectangle(W - 10, H / 2, 20, H - 20, 0x000000, 0.3);
  }

  private buildDecorations() {
    this.theme.decorations.forEach((d) => {
      const el = this.add.text(d.x, d.y, d.emoji, { fontSize: `${d.size}px` }).setOrigin(0.5).setAlpha(0.8);
      this.tweens.add({ targets: el, y: d.y - 3, duration: 2000 + Math.random() * 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
  }

  private buildStars() {
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(20, W - 20), y = Phaser.Math.Between(20, H - 20);
      const star = this.add.circle(x, y, Phaser.Math.Between(1, 2), 0xffd700, 0.5);
      this.tweens.add({ targets: star, alpha: { from: 0.1, to: 0.6 }, duration: 1000 + Math.random() * 2000, yoyo: true, repeat: -1 });
      this.stars.push(star);
    }
  }

  /* ────── 游乐设施 ────── */

  private buildRides() {
    this.theme.rides.forEach((r) => {
      if (r.type === 'ferris') this.buildFerrisWheel(r.x, r.y);
      if (r.type === 'carousel') this.buildCarousel(r.x, r.y);
      if (r.type === 'roller') this.buildRollerCoaster(r.x, r.y);
    });
  }

  private buildFerrisWheel(cx: number, cy: number) {
    const c = this.add.container(cx, cy);
    const stand = this.add.graphics(); stand.lineStyle(4, 0x64748b);
    stand.beginPath(); stand.moveTo(0, 0); stand.lineTo(-8, 40);
    stand.moveTo(0, 0); stand.lineTo(8, 40); stand.strokePath(); c.add(stand);
    const wheel = this.add.graphics(); wheel.lineStyle(2, 0x818cf8, 0.8);
    wheel.strokeCircle(0, 0, 35);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, ex = Math.cos(a) * 35, ey = Math.sin(a) * 35;
      wheel.lineBetween(0, 0, ex, ey);
      c.add(this.add.rectangle(ex, ey, 6, 8, 0x60a5fa, 0.8));
    }
    c.add(wheel); c.add(this.add.circle(0, 0, 5, 0xfbbf24));
    this.add.text(cx, cy + 50, `🎡 ${this.theme.name}摩天轮`, { fontSize: '10px', color: '#94a3b8', fontFamily: '"Segoe UI", sans-serif' }).setOrigin(0.5);
    c.setData('angle', 0);
    const zone = this.add.circle(cx, cy, 50, 0x000000, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.showDialog(`🎡 坐上了${this.theme.name}的摩天轮！\n俯瞰整个梦幻美景~ ✨ 碎片+2`));
    this.rides.push(c);
  }

  private buildCarousel(cx: number, cy: number) {
    const c = this.add.container(cx, cy);
    c.add(this.add.rectangle(0, 20, 60, 8, 0xec4899, 0.6).setRounded(4));
    c.add(this.add.rectangle(0, -20, 55, 6, 0xf472b6, 0.7).setRounded(3));
    const animals = ['🐴', '🦄', '🐯', '🐰'];
    animals.forEach((a, i) => {
      const angle = (i / 4) * Math.PI * 2;
      c.add(this.add.text(Math.cos(angle) * 20, Math.sin(angle) * 20, a, { fontSize: '16px' }));
    });
    c.add(this.add.rectangle(0, 0, 3, 40, 0xfbbf24));
    this.add.text(cx, cy + 35, `🎠 旋转木马`, { fontSize: '10px', color: '#94a3b8', fontFamily: '"Segoe UI", sans-serif' }).setOrigin(0.5);
    c.setData('angle', 0);
    const zone = this.add.circle(cx, cy, 50, 0x000000, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.showDialog(`🎠 旋转木马转起来了！\n好快乐~ ✨ 碎片+2`));
    this.rides.push(c);
  }

  private buildRollerCoaster(cx: number, cy: number) {
    const c = this.add.container(cx, cy);
    const track = this.add.graphics(); track.lineStyle(3, 0x6366f1, 0.7);
    track.beginPath(); track.moveTo(-50, 0); track.lineTo(-30, -30); track.lineTo(0, -40);
    track.lineTo(30, -30); track.lineTo(50, 0); track.lineTo(30, 30); track.lineTo(0, 40);
    track.lineTo(-30, 30); track.lineTo(-50, 0); track.strokePath(); c.add(track);
    const car = this.add.text(-50, 0, '🚂', { fontSize: '16px' }); c.add(car);
    c.setData('car', car); c.setData('trackProgress', 0);
    this.add.text(cx, cy + 55, '🎢 过山车', { fontSize: '10px', color: '#94a3b8', fontFamily: '"Segoe UI", sans-serif' }).setOrigin(0.5);
    const zone = this.add.circle(cx, cy, 55, 0x000000, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.showDialog(`🎢 过山车太刺激了！\n在${this.theme.name}里飞驰！✨ 碎片+2`));
    this.rides.push(c);
  }

  private updateRides(delta: number) {
    this.rides.forEach((ride) => {
      const wheel = ride.getAt(1) as Phaser.GameObjects.Graphics;
      if (wheel) { const a = (ride.getData('angle') || 0) + delta * 0.0003; ride.setData('angle', a); wheel.setAngle(a * 180 / Math.PI); }
      const car = ride.getData('car') as Phaser.GameObjects.Text;
      if (car) {
        const p = (ride.getData('trackProgress') || 0) + delta * 0.0003;
        ride.setData('trackProgress', p % 1);
        const a = (p % 1) * Math.PI * 2;
        car.x = Math.cos(a) * 40; car.y = Math.sin(a) * 40;
      }
    });
  }

  /* ────── 动物人偶 ────── */

  private buildMascots() {
    this.theme.mascots.forEach((m) => {
      const g = this.add.text(m.x, m.y, m.emoji, { fontSize: '32px' }).setOrigin(0.5);
      const l = this.add.text(m.x, m.y + 22, m.name, { fontSize: '10px', color: '#94a3b8', fontFamily: '"Segoe UI", sans-serif' }).setOrigin(0.5);
      this.tweens.add({ targets: g, y: m.y - 3, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const zone = this.add.circle(m.x, m.y, 30, 0x000000, 0).setInteractive({ useHandCursor: true });
      const mascot: MascotObj = { ...m, graphic: g, label: l, talked: false };
      zone.on('pointerdown', () => this.talkToMascot(mascot));
      this.mascots.push(mascot);
    });
  }

  private talkToMascot(mascot: MascotObj) {
    if (!mascot.talked) { mascot.talked = true; this.shardCount = Math.min(this.shardCount + 1, this.shardTotal); this.updateShardText(); }
    this.showDialog(`🐾 ${mascot.name}说:\n${mascot.dialog}`);
  }

  /* ────── 碎片 ────── */

  private spawnShards() {
    this.shardTotal = this.theme.shardPositions.length;
    this.theme.shardPositions.forEach(([x, y]) => {
      const g = this.add.circle(x, y, 5, 0xffd700, 0.9).setStrokeStyle(1, 0xffec80);
      this.tweens.add({ targets: g, alpha: { from: 0.4, to: 1 }, scaleX: { from: 0.8, to: 1.2 }, scaleY: { from: 0.8, to: 1.2 }, duration: 800, yoyo: true, repeat: -1 });
      this.add.text(x, y, '✦', { fontSize: '8px', color: '#ffd700' }).setOrigin(0.5);
      this.tweens.add({ targets: g, y: y - 10, duration: 600, yoyo: true, repeat: -1 });
      this.shards.push({ x, y, graphic: g, collected: false });
    });
  }

  private checkShardCollection() {
    this.shards.forEach((shard) => {
      if (shard.collected) return;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, shard.x, shard.y) < 25) {
        shard.collected = true; shard.graphic.destroy();
        soundManager.play('coin');
        this.shardCount++; this.updateShardText();
        const pop = this.add.text(shard.x, shard.y, '+1 💎', { fontSize: '14px', color: '#ffd700', fontFamily: '"Segoe UI", sans-serif', fontStyle: 'bold' }).setOrigin(0.5);
        this.tweens.add({ targets: pop, alpha: 0, y: pop.y - 30, duration: 800, onComplete: () => pop.destroy() });
      }
    });
  }

  private checkMascotProximity() {
    this.mascots.forEach((m) => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, m.x, m.y);
      m.graphic.setAlpha(dist < 40 ? 1 : 0.6);
    });
  }

  /* ────── 对话框 ────── */

  private showDialog(message: string) {
    if (this.dialogBox) this.dialogBox.destroy();
    const cx = W / 2, cy = H / 2 + 80;
    const bg = this.add.rectangle(cx, cy, 350, 80, 0x0f0f2e, 0.92).setRounded(12).setStrokeStyle(1, 0x818cf8);
    const text = this.add.text(cx, cy, message, { fontSize: '11px', color: '#e2e8f0', fontFamily: '"Segoe UI", sans-serif', align: 'center', lineSpacing: 4 }).setOrigin(0.5);
    const closeBtn = this.add.text(cx + 155, cy - 30, '✕', { fontSize: '14px', color: '#64748b' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.dialogBox = this.add.container(0, 0, [bg, text, closeBtn]).setDepth(100);
    closeBtn.on('pointerdown', () => { this.dialogBox?.destroy(); this.dialogBox = null; });
    this.time.delayedCall(5000, () => { this.dialogBox?.destroy(); this.dialogBox = null; });
  }

  /* ────── 玩家 ────── */

  private createPlayer() {
    const body = this.add.circle(0, 3, 8, 0xf472b6).setStrokeStyle(1, 0x000000, 0.15);
    const head = this.add.circle(0, -10, 10, 0xfbbf24).setStrokeStyle(1, 0x000000, 0.15);
    this.player = this.add.container(100, 100, [
      body, head,
      this.add.circle(-3, -11, 2, 0x1e293b),
      this.add.circle(3, -11, 2, 0x1e293b),
      this.add.circle(0, -6, 1.5, 0x9d174d),
      this.add.text(0, 18, '我', { fontSize: '10px', color: '#e2e8f0', fontFamily: '"Segoe UI", sans-serif' }).setOrigin(0.5).setAlpha(0.8),
    ]).setDepth(10);
  }

  /* ────── 输入 ────── */

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  private handleMovement(delta: number) {
    let dx = 0, dy = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) dx = -1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) dx = 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) dy = -1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) dy = 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      this.player.x = Phaser.Math.Clamp(this.player.x + dx / len * this.speed * (delta / 1000), 20, W - 20);
      this.player.y = Phaser.Math.Clamp(this.player.y + dy / len * this.speed * (delta / 1000), 20, H - 20);
    }
  }

  /* ────── HUD ────── */

  private updateShardText() { this.shardText.setText(`💎 ${this.shardCount} / ${this.shardTotal}`); }

  private createHUD() {
    this.shardText = this.add.text(W - 16, 16, `💎 ${this.shardCount} / ${this.shardTotal}`, { fontSize: '14px', color: '#ffd700', fontFamily: '"Segoe UI", sans-serif', fontStyle: 'bold' }).setOrigin(1, 0).setDepth(50);
    this.add.text(16, 16, `✨ ${this.theme.name}`, { fontSize: '16px', color: this.theme.accentColor, fontFamily: '"Segoe UI", sans-serif', fontStyle: 'bold' }).setDepth(50);
    this.add.text(16, 38, '收集碎片·和朋友们聊天·坐游乐设施', { fontSize: '10px', color: '#64748b', fontFamily: '"Segoe UI", sans-serif' }).setDepth(50);
    const wakeBtn = this.add.text(16, H - 30, '🚪 醒来 (点击退出梦境)', { fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }).setInteractive({ useHandCursor: true }).setDepth(50);
    wakeBtn.on('pointerdown', () => this.wakeUp());
  }

  private wakeUp() {
    soundManager.play('bell');
    this.cameras.main.fadeOut(500);
    this.time.delayedCall(500, () => {
      this.onComplete?.(this.shardCount, this.themeKey);
      this.scene.stop();
    });
  }
}
