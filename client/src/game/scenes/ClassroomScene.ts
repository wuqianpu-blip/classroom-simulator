import Phaser from 'phaser';
import { Character } from '../entities/Character';
import { ActionManager } from '../entities/ActionManager';
import { TeachingManager } from '../entities/TeachingManager';
import { TeacherSkillManager, type Skill } from '../entities/TeacherSkillManager';
import { GameBridge } from '../GameBridge';
import { soundManager } from '../entities/SoundManager';

class Wall extends Phaser.GameObjects.Rectangle {
  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number) {
    super(scene, x, y, w, h, 0x2a2a4a, 0.9);
    scene.add.existing(this);
  }
}

const W = 800, H = 600;

const SEAT_ROWS = [
  { y: 260, cols: 4, startX: 150, gap: 130 },
  { y: 360, cols: 4, startX: 150, gap: 130 },
  { y: 460, cols: 4, startX: 150, gap: 130 },
];

interface SeatInfo {
  x: number; y: number; col: number; row: number;
  occupied: boolean; playerId?: string;
}

export class ClassroomScene extends Phaser.Scene {
  teacher!: Character;
  private students: Character[] = [];
  private seats: SeatInfo[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private teacherSpeed = 160;
  private gameTimeLeft = 600;
  private timerText!: Phaser.GameObjects.Text;
  private actionManager!: ActionManager;
  private teachingManager!: TeachingManager;
  private skillManager!: TeacherSkillManager;
  private eventLog: Phaser.GameObjects.Text[] = [];
  private riskBars: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private caughtOverlays: Map<string, Phaser.GameObjects.Container> = new Map();
  private progressBar!: Phaser.GameObjects.Graphics;
  private teachingTimer = 0;
  private skillUiTexts: Phaser.GameObjects.Text[] = [];
  private isTeacherMode = false;
  private lastScanHighlight: Phaser.GameObjects.Graphics | null = null;
  private freezeOverlay: Phaser.GameObjects.Rectangle | null = null;
  private isFrozen = false;

  constructor() {
    super({ key: 'ClassroomScene' });
  }

  setPlayerRole(role: 'teacher' | 'student') {
    this.isTeacherMode = role === 'teacher';
  }

  setGameTime(time: number) {
    this.gameTimeLeft = time;
  }

  create() {
    this.buildClassroom();
    this.buildSeats();
    this.spawnCharacters();
    this.setupInput();
    this.createTimer();
    this.createTeachingProgress();
    this.createEventLog();

    this.actionManager = new ActionManager(this, this.teacher);
    this.teachingManager = new TeachingManager();
    this.skillManager = new TeacherSkillManager();

    this.actionManager.on('risk_change', (e) => {
      this.updateRiskBar(e.playerId, e.value);
      if (e.value > 70) soundManager.play('alert');
    });
    this.actionManager.on('caught', (e) => this.showCaughtEffect(e.playerId));
    this.teachingManager.onProgress = (pct) => this.updateTeachingProgress(pct);
    this.skillManager.onUpdate = (skills) => this.updateSkillDisplay(skills);

    GameBridge.getInstance().onAction((action) => this.handleAction(action));

    // 教学任务定时器
    this.time.addEvent({
      delay: 25000, loop: true,
      callback: () => this.triggerTeachingTask(),
    });

    this.triggerTeachingTask();

    soundManager.play('bell');
    soundManager.startAmbient();

    this.cameras.main.fadeIn(400, 30, 30, 50);
    this.cameras.main.setBackgroundColor('#1a1a2e');
  }

  update(_time: number, delta: number) {
    if (this.isFrozen) return;
    this.handleMovement(delta);
    this.skillManager.tick(delta / 1000);
  }

  /* ────── 动作/技能处理 ────── */

  private handleAction(action: string) {
    // 老师技能
    if (['scan', 'chalk', 'call', 'freeze'].includes(action)) {
      if (this.skillManager.useSkill(action)) {
        this.executeSkill(action);
      }
      return;
    }
    // 抓捕
    if (action === 'catch') {
      this.tryCatchNearestStudent();
      return;
    }

    // 学生动作
    if (!this.isTeacherMode) {
      const myId = 'student_0';
      switch (action) {
        case 'sleep':
          if (this.actionManager.startAction(myId, 'sleep')) {
            soundManager.play('dream');
            this.launchScene('SleepScene', { onComplete: () => {} });
          }
          break;
        case 'eat':
          if (this.actionManager.startAction(myId, 'eat')) {
            soundManager.play('click');
            this.launchScene('RamenScene', {
              onComplete: (s: boolean) => {
                soundManager.play(s ? 'success' : 'fail');
                this.logEvent(s ? '🍜 泡面真好吃！' : '😰 泡面没做好...');
              },
            });
          }
          break;
        case 'phone':
          if (this.actionManager.startAction(myId, 'phone')) {
            soundManager.play('click');
            this.launchScene('PhoneScene', {
              onComplete: (s: boolean) => {
                soundManager.play(s ? 'success' : 'fail');
                this.logEvent(s ? '📱 刷到了一个有趣的视频！' : '😅 差点被老师发现');
              },
            });
          }
          break;
        case 'note':
          this.actionManager.startAction(myId, 'note');
          soundManager.play('click');
          this.logEvent('📝 偷偷传了一张纸条');
          this.time.delayedCall(3000, () => this.actionManager.stopAction(myId));
          break;
      }
    }
  }

  private triggerTeachingTask() {
    if (this.teachingManager.progress >= 100) return;

    const type = Math.random() > 0.5 ? 'quiz' : 'grade';
    if (type === 'quiz') {
      const quiz = this.teachingManager.requestQuiz();
      if (!quiz) return;
      this.launchScene('QuizScene', {
        quiz,
        onComplete: (correct: boolean) => {
          soundManager.play(correct ? 'success' : 'fail');
          this.teachingManager.completeTask(correct);
          this.logEvent(correct ? '📖 提问回答正确！' : '📖 回答错了...');
        },
      });
    } else {
      this.launchScene('GradingScene', {
        onComplete: (success: boolean) => {
          soundManager.play(success ? 'success' : 'fail');
          this.teachingManager.completeTask(success);
          this.logEvent(success ? '📝 批改完成！' : '📝 批改不够好');
        },
      });
    }
  }

  private executeSkill(skillId: string) {
    switch (skillId) {
      case 'scan':
        this.executeScan();
        break;
      case 'chalk':
        this.executeChalk();
        break;
      case 'call':
        this.executeCall();
        break;
      case 'freeze':
        this.executeFreeze();
        break;
    }
  }

  private executeScan() {
    soundManager.play('alert');
    this.logEvent('🔍 老师使用了鹰眼扫描！');
    if (this.lastScanHighlight) this.lastScanHighlight.destroy();

    this.students.forEach((student, i) => {
      const action = this.actionManager.getAction(student.playerId);
      if (action !== 'idle') {
        const glow = this.add.graphics();
        glow.lineStyle(3, 0xfbbf24, 0.8);
        glow.strokeCircle(student.x, student.y - 10, 24);
        glow.setDepth(20);
        this.tweens.add({
          targets: glow, alpha: 0, duration: 3000,
          onComplete: () => glow.destroy(),
        });
        this.logEvent(`  ⚠️ ${student.nickname} 正在${action === 'sleep' ? '睡觉' : action === 'eat' ? '偷吃' : '玩手机'}`);
      }
    });
  }

  private executeChalk() {
    soundManager.play('chalk');
    const activeStudent = this.students.find((s) => this.actionManager.getAction(s.playerId) !== 'idle');
    if (!activeStudent) {
      this.logEvent('🎯 现在没有学生做小动作');
      return;
    }
    const idx = this.students.indexOf(activeStudent);
    const pid = `student_${idx}`;
    this.actionManager.stopAction(pid);

    const chalk = this.add.circle(this.teacher.x, this.teacher.y - 10, 3, 0xfbbf24);
    chalk.setDepth(30);
    this.tweens.add({
      targets: chalk, x: activeStudent.x, y: activeStudent.y - 20, duration: 300,
      ease: 'Quad.easeIn',
      onComplete: () => {
        chalk.destroy();
        const hit = this.add.text(activeStudent.x, activeStudent.y - 30, '💥', { fontSize: '20px' }).setOrigin(0.5);
        this.tweens.add({ targets: hit, alpha: 0, duration: 500, onComplete: () => hit.destroy() });
        this.logEvent(`🎯 粉笔头击中了 ${activeStudent.nickname}！`);
      },
    });
  }

  private executeCall() {
    const target = this.students[Math.floor(Math.random() * this.students.length)];
    const pid = target.playerId;
    this.actionManager.stopAction(pid);
    this.actionManager['catchStudent']?.(pid);

    const callText = this.add.text(target.x, target.y - 40, `${target.nickname}！站起来回答！`, {
      fontSize: '12px', color: '#fbbf24', fontFamily: '"Segoe UI", sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({
      targets: callText, alpha: 0, y: callText.y - 20, duration: 2000,
      onComplete: () => callText.destroy(),
    });
    this.logEvent(`📢 老师点名：${target.nickname}！`);
  }

  private executeFreeze() {
    soundManager.play('alert');
    this.isFrozen = true;
    this.freezeOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x60a5fa, 0.08);
    this.freezeOverlay.setDepth(50);

    const freezeText = this.add.text(W / 2, H / 2, '⏸ 时间暂停！', {
      fontSize: '28px', color: '#60a5fa', fontFamily: '"Segoe UI", sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(51);

    this.logEvent('⏸ 时间暂停！所有人都不能动！');

    this.time.delayedCall(3000, () => {
      this.isFrozen = false;
      this.freezeOverlay?.destroy();
      freezeText.destroy();
      this.logEvent('▶ 时间恢复');
    });
  }

  private tryCatchNearestStudent() {
    let nearest: Character | null = null;
    let minDist = Infinity;

    this.students.forEach((s) => {
      const d = Phaser.Math.Distance.Between(this.teacher.x, this.teacher.y, s.x, s.y);
      const action = this.actionManager.getAction(s.playerId);
      if (d < 80 && d < minDist && action !== 'idle') {
        nearest = s;
        minDist = d;
      }
    });

    if (nearest) {
      const idx = this.students.indexOf(nearest);
      this.actionManager.catchStudent(`student_${idx}`);
    } else {
      this.logEvent('🚨 附近没有学生做小动作');
    }
  }

  private launchScene(key: string, data: any) {
    this.scene.launch(key, data);
    this.scene.pause();
    const targetScene = this.scene.get(key);
    if (targetScene) {
      targetScene.events.once('shutdown', () => this.scene.resume());
    }
  }

  /* ────── HUD ────── */

  private createTeachingProgress() {
    this.progressBar = this.add.graphics();
    this.progressBar.setDepth(100);
    this.updateTeachingProgress(0);
  }

  private updateTeachingProgress(pct: number) {
    this.progressBar.clear();
    const bx = W / 2 - 100, by = 46, bw = 200, bh = 6;
    this.progressBar.fillStyle(0x1e293b, 0.6);
    this.progressBar.fillRoundedRect(bx, by, bw, bh, 3);
    const color = pct >= 100 ? 0x34d399 : pct > 50 ? 0xfbbf24 : 0x6366f1;
    this.progressBar.fillStyle(color, 0.9);
    this.progressBar.fillRoundedRect(bx, by, bw * (pct / 100), bh, 3);

    if (this.progressBar.getData('text')) {
      (this.progressBar.getData('text') as Phaser.GameObjects.Text).setText(`📊 ${pct}%`);
    } else {
      const t = this.add.text(W / 2, by - 8, `📊 ${pct}%`, {
        fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(100);
      this.progressBar.setData('text', t);
    }
  }

  private updateSkillDisplay(skills: Skill[]) {
    this.skillUiTexts.forEach((t) => t.destroy());
    this.skillUiTexts = [];

    skills.forEach((skill, i) => {
      const cd = Math.ceil(skill.currentCooldown);
      const ready = cd <= 0;
      const x = 12 + i * 58;
      const y = 52;
      const s = this.add.text(x, y, `${skill.emoji} ${skill.name.slice(0, 2)}`, {
        fontSize: '9px', color: ready ? '#e2e8f0' : '#64748b',
        fontFamily: '"Segoe UI", sans-serif',
        backgroundColor: ready ? '#6366f1' : '#1e293b',
        padding: { x: 4, y: 2 },
      }).setDepth(100);
      this.skillUiTexts.push(s);

      if (!ready) {
        const cdText = this.add.text(x + 22, y, `${cd}s`, {
          fontSize: '9px', color: '#fbbf24', fontFamily: 'monospace',
        }).setDepth(100);
        this.skillUiTexts.push(cdText);
      }
    });
  }

  /* ────── 场景构建 ────── */

  private buildClassroom() {
    const cx = W / 2;
    this.add.rectangle(cx, H / 2, W - 20, H - 20, 0x3a3a5c).setStrokeStyle(2, 0x4a4a6c);
    for (let x = 40; x < W - 30; x += 60) {
      for (let y = 140; y < H - 30; y += 60) {
        const shade = (Math.floor(x / 60) + Math.floor(y / 60)) % 2 === 0 ? 0x404066 : 0x3a3a5c;
        this.add.rectangle(x, y, 56, 56, shade).setAlpha(0.25);
      }
    }
    [new Wall(this, cx, 6, W, 12),
     new Wall(this, cx, H - 6, W, 12),
     new Wall(this, 6, H / 2, 12, H),
     new Wall(this, W - 6, H / 2, 12, H)];

    this.add.rectangle(cx, 24, W - 40, 3, 0xec4899).setAlpha(0.25);
    for (let i = 0; i < 4; i++) {
      const wx = 60 + i * 180;
      this.add.rectangle(wx, 16, 70, 20, 0x1e293b).setStrokeStyle(1, 0x475569);
      this.add.rectangle(wx, 16, 60, 16, 0x38bdf8).setAlpha(0.2);
    }

    const bb = this.add.rectangle(cx, 68, 340, 80, 0x1e3a5f);
    bb.setStrokeStyle(3, 0x8b4513, 0.9);
    this.add.text(cx, 52, '📚  第 一 节  ·  语 文 课', { fontSize: '16px', color: '#e2e8f0', fontFamily: '"Segoe UI", sans-serif', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(cx, 78, '静夜思  —  李白', { fontSize: '13px', color: '#94a3b8', fontFamily: '"SimSun", serif' }).setOrigin(0.5);

    this.add.rectangle(cx, 130, 130, 40, 0x6366f1).setStrokeStyle(1, 0x818cf8);
    this.add.rectangle(W - 50, 45, 24, 24, 0x334155).setStrokeStyle(1, 0x64748b).setCornerRadius(12);
    this.add.text(W - 50, 45, '🕐', { fontSize: '14px' }).setOrigin(0.5);
    this.add.text(cx, 108, '好 好 学 习 · 天 天 向 上', { fontSize: '10px', color: '#64748b', fontFamily: '"SimSun", serif' }).setOrigin(0.5);
  }

  private buildSeats() {
    SEAT_ROWS.forEach((row, ri) => {
      for (let ci = 0; ci < row.cols; ci++) {
        const x = row.startX + ci * row.gap, y = row.y;
        this.seats.push({ x, y, col: ci, row: ri, occupied: false });
        this.add.rectangle(x, y, 50, 28, 0x7c3aed).setStrokeStyle(1, 0x9d7aeb);
        this.add.rectangle(x, y - 1, 44, 22, 0x8b5cf6);
        this.add.rectangle(x - 16, y + 24, 16, 10, 0x6d28d9).setCornerRadius(3);
      }
    });
  }

  private spawnCharacters() {
    this.teacher = new Character(this, W / 2, 170, 'teacher', 'teacher_1', '班主任', 0);
    this.teacher.setDepth(10);

    const demoStudents = [
      { nick: '我', color: 0 }, { nick: '小红', color: 1 },
      { nick: '小刚', color: 2 }, { nick: '小美', color: 3 },
      { nick: '小华', color: 4 }, { nick: '小丽', color: 5 },
    ];

    this.students = [];
    demoStudents.forEach((s, i) => {
      const seat = this.seats[i];
      if (!seat) return;
      seat.occupied = true;
      seat.playerId = `student_${i}`;
      const student = new Character(this, seat.x, seat.y - 18, 'student', `student_${i}`, s.nick, s.color);
      student.setDepth(5);
      this.students.push(student);
      this.actionManager.registerStudent(`student_${i}`, student);
      const bar = this.add.graphics().setDepth(15);
      this.riskBars.set(`student_${i}`, bar);
    });
    this.students[0].setHighlight(true);
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
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.moveTeacherTo(p.x, p.y));
  }

  private handleMovement(delta: number) {
    let dx = 0, dy = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) dx = -1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) dx = 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) dy = -1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) dy = 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      this.moveTeacherTo(
        this.teacher.x + dx / len * this.teacherSpeed * (delta / 1000),
        this.teacher.y + dy / len * this.teacherSpeed * (delta / 1000),
      );
    }
  }

  private moveTeacherTo(x: number, y: number) {
    this.teacher.x = Phaser.Math.Clamp(x, 20, W - 20);
    this.teacher.y = Phaser.Math.Clamp(y, 140, H - 20);
    this.students.forEach((s) => {
      const d = Phaser.Math.Distance.Between(this.teacher.x, this.teacher.y, s.x, s.y);
      s.setHighlight(d < 40);
    });
  }

  /* ────── 风险条/被抓 ────── */

  private updateRiskBar(playerId: string, risk: number) {
    const bar = this.riskBars.get(playerId);
    if (!bar) return;
    const student = this.students.find((s) => s.playerId === playerId);
    if (!student) return;
    bar.clear();
    if (risk <= 0) return;
    const bx = student.x - 20, by = student.y + 22, bw = 40;
    bar.fillStyle(0x1e293b, 0.6);
    bar.fillRect(bx, by, bw, 4);
    const color = risk > 70 ? 0xef4444 : risk > 40 ? 0xfbbf24 : 0x34d399;
    bar.fillStyle(color, 0.9);
    bar.fillRect(bx, by, bw * (risk / 100), 4);
  }

  private showCaughtEffect(playerId: string) {
    soundManager.play('fail');
    const student = this.students.find((s) => s.playerId === playerId);
    if (!student) return;
    const overlay = this.add.container(student.x, student.y - 20).setDepth(50);
    overlay.add([
      this.add.rectangle(0, 0, 80, 28, 0xef4444, 0.9).setCornerRadius(8),
      this.add.text(0, 0, '🚨 被抓住了！', { fontSize: '11px', color: '#fff', fontFamily: '"Segoe UI", sans-serif', fontStyle: 'bold' }).setOrigin(0.5),
    ]);
    this.tweens.add({ targets: overlay, y: overlay.y - 30, alpha: 0, duration: 2000, onComplete: () => overlay.destroy() });
    this.tweens.add({ targets: student, alpha: 0.3, duration: 100, yoyo: true, repeat: 5 });
  }

  /* ────── 计时器/日志 ────── */

  private createTimer() {
    this.timerText = this.add.text(W - 20, H - 20, '⏱ 10:00', { fontSize: '14px', color: '#94a3b8', fontFamily: 'monospace' }).setOrigin(1, 1).setDepth(100);
    this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      this.gameTimeLeft--;
      const min = Math.floor(this.gameTimeLeft / 60), sec = this.gameTimeLeft % 60;
      this.timerText.setText(`⏱ ${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`);
      if (this.gameTimeLeft <= 60) this.timerText.setColor('#ef4444');
    }});
  }

  private createEventLog() {
    this.logEvent('📢 上课了！请同学们保持安静');
    this.logEvent('👩‍🏫 老师走进了教室');
  }

  logEvent(message: string) {
    if (this.eventLog.length >= 4) this.eventLog.shift()?.destroy();
    const t = this.add.text(16, H - 36 - this.eventLog.length * 16, message, {
      fontSize: '10px', color: '#c084fc', fontFamily: 'monospace',
    }).setOrigin(0, 1).setDepth(100);
    this.eventLog.push(t);
  }
}

export { W, H };
