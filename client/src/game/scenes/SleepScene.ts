import Phaser from 'phaser';
import { DREAM_THEMES } from '../entities/DreamThemes';

const W = 400, H = 300;
const THEME_KEYS = Object.keys(DREAM_THEMES);

export class SleepScene extends Phaser.Scene {
  private onComplete?: (dreamIndex: number) => void;
  private dreamIndex = 0;
  private themeKey = 'playground';

  constructor() {
    super({ key: 'SleepScene' });
  }

  init(data: { onComplete?: (index: number) => void }) {
    this.onComplete = data.onComplete;
    this.dreamIndex = Math.floor(Math.random() * THEME_KEYS.length);
    this.themeKey = THEME_KEYS[this.dreamIndex];
  }

  create() {
    const cx = W / 2, cy = H / 2;
    const theme = DREAM_THEMES[this.themeKey];

    this.add.rectangle(cx, cy, W, H, 0x0f0f23, 0.95).setCornerRadius(16);
    this.add.rectangle(cx, cy, W, H, 0x000000, 0).setStrokeStyle(2, 0xa78bfa).setCornerRadius(16);

    const stars = ['✦', '✧', '⭐', '🌟', '✨'];
    stars.forEach((s) => {
      const st = this.add.text(Phaser.Math.Between(30, W - 30), Phaser.Math.Between(30, H - 30), s, { fontSize: `${Phaser.Math.Between(10, 20)}px` }).setAlpha(0);
      this.tweens.add({ targets: st, alpha: { from: 0, to: 0.6 }, duration: 500 + Math.random() * 500, delay: Math.random() * 500, yoyo: true, repeat: -1 });
    });

    this.add.text(cx, 45, '😴 进入梦乡...', { fontSize: '14px', color: '#64748b', fontFamily: '"Segoe UI", sans-serif' }).setOrigin(0.5);
    this.add.text(cx, 105, theme.name === '游乐世界' ? '🎠' : theme.name === '美食世界' ? '🍰' : theme.name === '太空世界' ? '🚀' : theme.name === '海底世界' ? '🐠' : '🌸', { fontSize: '56px' }).setOrigin(0.5);

    const nameText = this.add.text(cx, 170, `✦ ${theme.name} ✦`, { fontSize: '20px', color: theme.accentColor, fontFamily: '"Segoe UI", sans-serif', fontStyle: 'bold' }).setOrigin(0.5);
    this.tweens.add({ targets: nameText, alpha: { from: 0.6, to: 1 }, duration: 800, yoyo: true, repeat: -1 });

    const descMap: Record<string, string> = {
      游乐世界: '过山车、旋转木马、摩天轮...',
      美食世界: '甜甜圈山、奶茶河、饼干小屋！',
      太空世界: '和星星一起飞行在宇宙中...',
      海底世界: '珊瑚、海豚、沉船宝藏！',
      花园世界: '开满鲜花、蝴蝶飞舞的仙境',
    };
    this.add.text(cx, 210, descMap[theme.name] || '', { fontSize: '13px', color: '#94a3b8', fontFamily: '"Segoe UI", sans-serif' }).setOrigin(0.5);

    this.add.text(cx, 250, '正在进入...', { fontSize: '12px', color: '#818cf8', fontFamily: 'monospace' }).setOrigin(0.5);

    this.time.delayedCall(1500, () => {
      this.scene.stop();
      this.scene.get('ClassroomScene')?.scene?.pause();
      this.scene.launch('DreamScene', {
        theme: this.themeKey,
        onComplete: (_shards: number) => {
          this.scene.get('ClassroomScene')?.scene?.resume();
          this.onComplete?.(this.dreamIndex);
        },
      });
    });
  }
}
