export interface Skill {
  id: string;
  name: string;
  emoji: string;
  cooldown: number;
  currentCooldown: number;
  description: string;
}

export class TeacherSkillManager {
  skills: Skill[] = [
    { id: 'scan', name: '鹰眼扫描', emoji: '🔍', cooldown: 12, currentCooldown: 0, description: '高亮所有正在做小动作的学生' },
    { id: 'chalk', name: '粉笔头', emoji: '🎯', cooldown: 8, currentCooldown: 0, description: '远程打断一个学生动作' },
    { id: 'call', name: '点名提问', emoji: '📢', cooldown: 15, currentCooldown: 0, description: '让指定学生站起来，风险+30' },
    { id: 'freeze', name: '时间暂停', emoji: '⏸', cooldown: 30, currentCooldown: 0, description: '全班静止3秒' },
  ];

  private onCooldownUpdate?: (skills: Skill[]) => void;

  set onUpdate(fn: (skills: Skill[]) => void) { this.onCooldownUpdate = fn; }

  useSkill(skillId: string): boolean {
    const skill = this.skills.find((s) => s.id === skillId);
    if (!skill || skill.currentCooldown > 0) return false;
    skill.currentCooldown = skill.cooldown;
    this.onCooldownUpdate?.(this.skills);
    return true;
  }

  tick(deltaSec: number) {
    let changed = false;
    for (const skill of this.skills) {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown = Math.max(0, skill.currentCooldown - deltaSec);
        changed = true;
      }
    }
    if (changed) this.onCooldownUpdate?.(this.skills);
  }

  reset() {
    for (const skill of this.skills) skill.currentCooldown = 0;
  }
}
