import Phaser from 'phaser';
import { generatePlaceholderAssets } from '../entities/AssetLoader';
import { soundManager } from '../entities/SoundManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.add.rectangle(w / 2, h / 2, 200, 20, 0x333333);
    const fill = this.add.rectangle(w / 2 - 100, h / 2, 0, 18, 0xec4899);
    fill.setOrigin(0, 0.5);

    const text = this.add.text(w / 2, h / 2 - 40, '加载中...', {
      fontSize: '16px',
      color: '#94a3b8',
      fontFamily: '"Segoe UI", sans-serif',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      fill.width = 200 * value;
      text.setText(`加载中... ${Math.round(value * 100)}%`);
    });
  }

  create() {
    generatePlaceholderAssets(this);
    soundManager.init();
    this.scene.start('ClassroomScene');
  }
}
