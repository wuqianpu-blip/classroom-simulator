import Phaser from 'phaser';

export type CharacterRole = 'teacher' | 'student';
export type CharacterState = 'idle' | 'walk' | 'sleep' | 'phone' | 'eat';

const COLORS = {
  student: {
    body: [0xf472b6, 0x60a5fa, 0x34d399, 0xfbbf24, 0xa78bfa, 0xfb923c],
    head: [0xfbbf24, 0xfde68a, 0xfbd38d, 0xd4a574, 0xfca5a5, 0xf5d0b0],
  },
  teacher: { body: 0x6366f1, head: 0xfbbf24 },
};

export class Character extends Phaser.GameObjects.Container {
  public role: CharacterRole;
  public playerId: string;
  public nickname: string;
  private bodyGraphic: Phaser.GameObjects.Arc;
  private headGraphic: Phaser.GameObjects.Arc;
  private eyeL: Phaser.GameObjects.Arc;
  private eyeR: Phaser.GameObjects.Arc;
  private mouth: Phaser.GameObjects.Arc;
  private nameLabel: Phaser.GameObjects.Text;
  private bobTween?: Phaser.Tweens.Tween;
  private animTimer?: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    role: CharacterRole,
    playerId: string,
    nickname: string,
    colorIndex = 0
  ) {
    super(scene, x, y);
    this.role = role;
    this.playerId = playerId;
    this.nickname = nickname;

    const colors = role === 'teacher' ? COLORS.teacher : { head: COLORS.student.head[colorIndex % COLORS.student.head.length], body: COLORS.student.body[colorIndex % COLORS.student.body.length] };

    const isTeacher = role === 'teacher';
    const headRadius = isTeacher ? 12 : 10;
    const bodyRadius = isTeacher ? 10 : 8;
    const bodyY = isTeacher ? 4 : 3;

    this.headGraphic = scene.add.circle(0, -bodyY - headRadius, headRadius, colors.head);
    this.headGraphic.setStrokeStyle(1, 0x000000, 0.15);

    this.eyeL = scene.add.circle(-3, -bodyY - headRadius - 1, 2, 0x1e293b);
    this.eyeR = scene.add.circle(3, -bodyY - headRadius - 1, 2, 0x1e293b);

    this.mouth = scene.add.circle(0, -bodyY - headRadius + 4, 1.5, 0x9d174d);
    this.mouth.setVisible(!isTeacher);

    this.bodyGraphic = scene.add.circle(0, bodyY, bodyRadius, colors.body);
    this.bodyGraphic.setStrokeStyle(1, 0x000000, 0.12);

    this.add([this.bodyGraphic, this.headGraphic, this.eyeL, this.eyeR, this.mouth]);

    if (isTeacher) {
      const pointer = scene.add.triangle(0, -6, -4, 4, 4, 4, 0, -6, 0xfbbf24);
      pointer.setScale(0.6);
      this.add(pointer);
    }

    this.nameLabel = scene.add.text(0, bodyY + bodyRadius + 6, nickname, {
      fontSize: '10px',
      color: '#e2e8f0',
      fontFamily: '"Segoe UI", sans-serif',
      align: 'center',
    }).setOrigin(0.5, 0).setAlpha(0.8);
    this.add(this.nameLabel);

    scene.add.existing(this);
    this.startIdleAnimation();
  }

  private startIdleAnimation() {
    this.bobTween = this.scene.tweens.add({
      targets: this,
      y: this.y - 1,
      duration: 800 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.animTimer = this.scene.time.addEvent({
      delay: 3000 + Math.random() * 4000,
      callback: () => {
        if (this.role === 'student') {
          const blink = this.scene.tweens.add({
            targets: [this.eyeL, this.eyeR],
            scaleY: 0,
            duration: 80,
            yoyo: true,
          });
        }
      },
      loop: true,
    });
  }

  setState(state: CharacterState) {
    this.eyeL.setScale(1);
    this.eyeR.setScale(1);

    switch (state) {
      case 'sleep': {
        this.eyeL.setVisible(false);
        this.eyeR.setVisible(false);
        this.mouth.setVisible(false);
        const z = this.scene.add.text(0, -this.headGraphic.y - 8, 'zzZ', {
          fontSize: '8px', color: '#a78bfa', fontFamily: 'monospace',
        }).setOrigin(0.5);
        this.add(z);
        break;
      }
      case 'phone':
        this.eyeL.setScale(0.6);
        this.eyeR.setScale(0.6);
        break;
      default:
        this.eyeL.setVisible(true);
        this.eyeR.setVisible(true);
        this.mouth.setVisible(true);
    }
  }

  setHighlight(active: boolean) {
    this.bodyGraphic.setStrokeStyle(active ? 2 : 1, active ? 0xfbbf24 : 0x000000, active ? 0.6 : 0.12);
  }

  destroy() {
    this.bobTween?.destroy();
    this.animTimer?.destroy();
    super.destroy();
  }
}
