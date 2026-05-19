import Phaser from 'phaser';
import { Character } from './Character';

export type StudentAction = 'idle' | 'sleep' | 'eat' | 'phone' | 'note' | 'read';

const ACTION_RISK_RATES: Record<StudentAction, number> = {
  idle: 0,
  sleep: 3,
  eat: 8,
  phone: 6,
  note: 2,
  read: 2,
};

const ACTION_DURATIONS: Record<StudentAction, number> = {
  idle: 0,
  sleep: 15,
  eat: 25,
  phone: 12,
  note: 6,
  read: 8,
};

export interface ActionEvent {
  type: 'action_start' | 'action_end' | 'risk_change' | 'caught' | 'step_complete' | 'action_complete';
  playerId: string;
  action?: StudentAction | string;
  value?: number;
  message?: string;
}

export class ActionManager {
  private scene: Phaser.Scene;
  private studentData: Map<string, {
    character: Character;
    currentAction: StudentAction;
    risk: number;
    actionTimer: number;
    isCaught: boolean;
  }> = new Map();
  private teacherCharacter: Character;
  private events: Phaser.Events.EventEmitter;

  constructor(scene: Phaser.Scene, teacher: Character) {
    this.scene = scene;
    this.teacherCharacter = teacher;
    this.events = new Phaser.Events.EventEmitter();
    this.scene.events.on('update', this.update, this);
  }

  registerStudent(playerId: string, character: Character) {
    this.studentData.set(playerId, {
      character,
      currentAction: 'idle',
      risk: 0,
      actionTimer: 0,
      isCaught: false,
    });
  }

  unregisterStudent(playerId: string) {
    this.studentData.delete(playerId);
  }

  startAction(playerId: string, action: StudentAction): boolean {
    const data = this.studentData.get(playerId);
    if (!data || data.isCaught) return false;
    if (data.currentAction !== 'idle') return false;

    data.currentAction = action;
    data.actionTimer = 0;
    data.character.setCharacterState(action);

    this.emit('action_start', { playerId, action });
    return true;
  }

  stopAction(playerId: string) {
    const data = this.studentData.get(playerId);
    if (!data) return;

    const prevAction = data.currentAction;
    data.currentAction = 'idle';
    data.actionTimer = 0;
    data.character.setState('idle');

    this.emit('action_end', { playerId, action: prevAction });
  }

  updateRisk(playerId: string, deltaSeconds: number) {
    const data = this.studentData.get(playerId);
    if (!data || data.isCaught) return;

    if (data.currentAction === 'idle') {
      data.risk = Math.max(0, data.risk - 2 * deltaSeconds);
    } else {
      const rate = ACTION_RISK_RATES[data.currentAction];
      data.risk += rate * deltaSeconds;

      const dist = Phaser.Math.Distance.Between(
        this.teacherCharacter.x, this.teacherCharacter.y,
        data.character.x, data.character.y
      );
      if (dist < 80) {
        data.risk += rate * 1.5 * deltaSeconds;
      }
      if (dist < 40) {
        data.risk += rate * 3 * deltaSeconds;
      }

      data.actionTimer += deltaSeconds;
      if (data.actionTimer >= ACTION_DURATIONS[data.currentAction]) {
        this.emit('action_complete', { playerId, action: data.currentAction });
        this.stopAction(playerId);
        return;
      }
    }

    data.risk = Phaser.Math.Clamp(data.risk, 0, 100);

    this.emit('risk_change', { playerId, value: data.risk });

    if (data.risk >= 100) {
      this.catchStudent(playerId);
    }
  }

  catchStudent(playerId: string) {
    const data = this.studentData.get(playerId);
    if (!data || data.isCaught) return;

    data.isCaught = true;
    data.currentAction = 'idle';
    this.emit('caught', { playerId, action: data.currentAction });

    // 惩罚：风险归零，5秒后才能再次行动
    this.scene.time.delayedCall(5000, () => {
      const d = this.studentData.get(playerId);
      if (d) {
        d.isCaught = false;
        d.risk = 0;
      }
    });
  }

  getRisk(playerId: string): number {
    return this.studentData.get(playerId)?.risk ?? 0;
  }

  getAction(playerId: string): StudentAction {
    return this.studentData.get(playerId)?.currentAction ?? 'idle';
  }

  isCaught(playerId: string): boolean {
    return this.studentData.get(playerId)?.isCaught ?? false;
  }

  on(event: string, fn: (...args: any[]) => void) {
    this.events.on(event, fn);
  }

  private emit(type: string, data: Omit<ActionEvent, 'type'>) {
    this.events.emit(type, { ...data, type } as ActionEvent);
  }

  update(_time: number, delta: number) {
    const deltaSec = delta / 1000;
    this.studentData.forEach((_, playerId) => {
      this.updateRisk(playerId, deltaSec);
    });
  }

  destroy() {
    this.scene.events.off('update', this.update, this);
    this.events.destroy();
  }
}
