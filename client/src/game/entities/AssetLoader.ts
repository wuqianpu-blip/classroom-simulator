import Phaser from 'phaser';

export const ASSET_PATHS = {
  characters: '/assets/characters/',
  classroom: '/assets/classroom/',
  food: '/assets/food/',
  ui: '/assets/ui/',
  effects: '/assets/effects/',
  sounds: '/assets/sounds/',
};

// 占位符色块生成 - 用于无素材时的回退
export function createPlaceholderTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  color: number
) {
  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.fillRect(0, 0, width, height);
  g.generateTexture(key, width, height);
  g.destroy();
}

export function createPlaceholderCircle(
  scene: Phaser.Scene,
  key: string,
  radius: number,
  color: number
) {
  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.fillCircle(radius, radius, radius);
  g.generateTexture(key, radius * 2, radius * 2);
  g.destroy();
}

// 素材占位符生成
export function generatePlaceholderAssets(scene: Phaser.Scene) {
  // 学生角色 (32x32)
  const studentColors = [0xf472b6, 0x60a5fa, 0x34d399, 0xfbbf24, 0xa78bfa, 0xfb923c];
  studentColors.forEach((color, i) => {
    createPlaceholderCircle(scene, `student_${i}`, 16, color);
  });

  // 老师角色 (36x36)
  createPlaceholderCircle(scene, 'teacher', 18, 0x6366f1);

  // 教室元素
  createPlaceholderTexture(scene, 'desk', 50, 28, 0x7c3aed);
  createPlaceholderTexture(scene, 'chair', 16, 10, 0x6d28d9);
  createPlaceholderTexture(scene, 'chalkboard', 340, 80, 0x1e3a5f);

  // 食物
  createPlaceholderCircle(scene, 'ramen', 20, 0x34d399);
  createPlaceholderCircle(scene, 'phone', 16, 0x60a5fa);

  // UI
  createPlaceholderTexture(scene, 'btn_bg', 100, 40, 0x6366f1);
}
