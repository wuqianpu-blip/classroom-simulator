const QUIZZES = [
  {
    question: '静夜思的作者是谁？',
    options: ['杜甫', '李白', '白居易', '王维'],
    answer: 1,
  },
  {
    question: '中国的首都是？',
    options: ['上海', '广州', '北京', '深圳'],
    answer: 2,
  },
  {
    question: 'H₂O 是什么？',
    options: ['二氧化碳', '水', '氧气', '氢气'],
    answer: 1,
  },
  {
    question: '地球上最大的动物是？',
    options: ['大象', '鲸鱼', '长颈鹿', '河马'],
    answer: 1,
  },
  {
    question: '太阳从哪边升起？',
    options: ['西方', '南方', '北方', '东方'],
    answer: 3,
  },
  {
    question: '一年有几个月？',
    options: ['10', '11', '12', '13'],
    answer: 2,
  },
  {
    question: '光速约为多少 km/s？',
    options: ['30万', '3万', '3000', '300'],
    answer: 0,
  },
  {
    question: 'Python 是哪种类型的语言？',
    options: ['编译型', '解释型', '标记型', '查询型'],
    answer: 1,
  },
];

export interface QuizTask {
  question: string;
  options: string[];
  answer: number;
}

export class TeachingManager {
  private completedTasks = 0;
  private totalTasks = 12;
  private currentQuizIndex = 0;
  private onProgressChange?: (pct: number) => void;

  get progress(): number {
    return Math.min(100, Math.round((this.completedTasks / this.totalTasks) * 100));
  }

  set onProgress(fn: (pct: number) => void) { this.onProgressChange = fn; }

  completeTask(success: boolean) {
    if (success) this.completedTasks++;
    this.onProgressChange?.(this.progress);
  }

  requestQuiz(): QuizTask | null {
    if (this.completedTasks >= this.totalTasks) return null;
    const quiz = QUIZZES[this.currentQuizIndex % QUIZZES.length];
    this.currentQuizIndex++;
    return quiz;
  }

  reset() {
    this.completedTasks = 0;
    this.currentQuizIndex = 0;
  }
}
