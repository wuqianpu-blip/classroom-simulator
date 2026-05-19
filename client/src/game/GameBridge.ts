export class GameBridge {
  private static instance: GameBridge;
  private actionHandler: ((action: string) => void) | null = null;
  private teacherMoveHandler: ((x: number, y: number) => void) | null = null;
  private studentActionHandler: ((action: string) => void) | null = null;
  private riskChangeHandler: ((risk: number) => void) | null = null;

  static getInstance(): GameBridge {
    if (!GameBridge.instance) {
      GameBridge.instance = new GameBridge();
    }
    return GameBridge.instance;
  }

  onAction(handler: (action: string) => void) {
    this.actionHandler = handler;
  }

  triggerAction(action: string) {
    this.actionHandler?.(action);
  }

  onTeacherMove(handler: (x: number, y: number) => void) {
    this.teacherMoveHandler = handler;
  }

  onStudentAction(handler: (action: string) => void) {
    this.studentActionHandler = handler;
  }

  onRiskChange(handler: (risk: number) => void) {
    this.riskChangeHandler = handler;
  }

  reportTeacherMove(x: number, y: number) {
    this.teacherMoveHandler?.(x, y);
  }

  reportStudentAction(action: string) {
    this.studentActionHandler?.(action);
  }

  reportRiskChange(risk: number) {
    this.riskChangeHandler?.(risk);
  }
}
