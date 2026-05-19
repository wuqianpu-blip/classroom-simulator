import Phaser from 'phaser';

interface RamenFlavor {
  id: string;
  name: string;
  emoji: string;
  color: string;
  difficulty: number;
  description: string;
  steps: RamenStep[];
}

interface RamenStep {
  id: string;
  label: string;
  emoji: string;
  instruction: string;
  waitTime?: number;
  clickTarget?: number;
  failChance: number;
}

const FLAVORS: RamenFlavor[] = [
  {
    id: 'classic',
    name: '经典红烧味',
    emoji: '🍜',
    color: '#ef4444',
    difficulty: 1,
    description: '最经典的味道，新手推荐',
    steps: [
      { id: 'open', label: '开盖', emoji: '📦', instruction: '点击打开泡面盖', failChance: 0.10 },
      { id: 'tear', label: '撕调料', emoji: '🧂', instruction: '点击撕开调料包', failChance: 0.12 },
      { id: 'press', label: '按压', emoji: '👊', instruction: '点击按压面条', failChance: 0.08 },
      { id: 'pour', label: '倒水', emoji: '🫖', instruction: '点击水壶倒水', failChance: 0.10 },
      { id: 'wait', label: '等待', emoji: '⏳', instruction: '等待 3 秒...', waitTime: 3, failChance: 0 },
      { id: 'eat', label: '开吃', emoji: '🍜', instruction: '连点吃泡面！', clickTarget: 6, failChance: 0 },
    ],
  },
  {
    id: 'spicy',
    name: '麻辣火鸡味',
    emoji: '🌶️',
    color: '#f97316',
    difficulty: 2,
    description: '辣到冒火！需要更快的操作',
    steps: [
      { id: 'open', label: '开盖', emoji: '📦', instruction: '点击打开泡面盖', failChance: 0.15 },
      { id: 'tear', label: '撕调料', emoji: '🌶️', instruction: '点击撕开辣椒包', failChance: 0.15 },
      { id: 'press', label: '揉面', emoji: '👊', instruction: '快速点击揉面！', failChance: 0.12, clickTarget: 3 },
      { id: 'pour', label: '倒水', emoji: '🫖', instruction: '点击水壶倒水', failChance: 0.15 },
      { id: 'wait', label: '等待', emoji: '⏳', instruction: '等待 4 秒...', waitTime: 4, failChance: 0 },
      { id: 'eat', label: '挑战', emoji: '🔥', instruction: '连点吃完！辣到飞起！', clickTarget: 10, failChance: 0 },
    ],
  },
  {
    id: 'seafood',
    name: '海鲜至尊味',
    emoji: '🦐',
    color: '#06b6d4',
    difficulty: 2,
    description: '满满的鲜味，步骤更多',
    steps: [
      { id: 'open', label: '开盖', emoji: '📦', instruction: '点击打开泡面盖', failChance: 0.10 },
      { id: 'tear', label: '撕海鲜包', emoji: '🦐', instruction: '点击撕开海鲜包', failChance: 0.12 },
      { id: 'add', label: '加料', emoji: '🐟', instruction: '点击加入鱼片', failChance: 0.12 },
      { id: 'press', label: '按压', emoji: '👊', instruction: '点击按压面条', failChance: 0.10 },
      { id: 'pour', label: '倒水', emoji: '🫖', instruction: '点击倒热水', failChance: 0.12 },
      { id: 'wait', label: '等待', emoji: '⏳', instruction: '等待 3 秒...', waitTime: 3, failChance: 0 },
      { id: 'eat', label: '开吃', emoji: '🍜', instruction: '连点吃面！鲜！', clickTarget: 7, failChance: 0 },
    ],
  },
  {
    id: 'miso',
    name: '日式味噌味',
    emoji: '🍵',
    color: '#84cc16',
    difficulty: 1,
    description: '温和的味噌汤底',
    steps: [
      { id: 'open', label: '开盖', emoji: '📦', instruction: '点击打开泡面盖', failChance: 0.08 },
      { id: 'tear', label: '撕味噌包', emoji: '🧂', instruction: '点击撕开味噌包', failChance: 0.08 },
      { id: 'press', label: '按压', emoji: '👊', instruction: '点击按压面条', failChance: 0.06 },
      { id: 'pour', label: '倒水', emoji: '🫖', instruction: '点击倒热水', failChance: 0.08 },
      { id: 'wait', label: '等待', emoji: '⏳', instruction: '等待 2 秒...', waitTime: 2, failChance: 0 },
      { id: 'eat', label: '开吃', emoji: '🍜', instruction: '连点吃味噌拉面~', clickTarget: 5, failChance: 0 },
    ],
  },
];

// 隐藏食谱 - 特定顺序触发
const HIDDEN_RECIPES: RamenFlavor[] = [
  {
    id: 'golden',
    name: '✨ 黄金满汉全席面 ✨',
    emoji: '👑',
    color: '#ffd700',
    difficulty: 5,
    description: '传说中最豪华的泡面！所有步骤必须完美！',
    steps: [
      { id: 'open', label: '开盖', emoji: '👑', instruction: '完美开盖！', failChance: 0.05 },
      { id: 'tear', label: '撕金包', emoji: '💎', instruction: '撕开金色调料包', failChance: 0.05 },
      { id: 'add1', label: '加鲍鱼', emoji: '🐚', instruction: '放入鲍鱼', failChance: 0.08 },
      { id: 'add2', label: '加松露', emoji: '🍄', instruction: '放入黑松露', failChance: 0.08 },
      { id: 'press', label: '揉面', emoji: '👊', instruction: '高级揉面手法！', failChance: 0.06, clickTarget: 5 },
      { id: 'pour', label: '倒金汤', emoji: '🫖', instruction: '倒入黄金高汤', failChance: 0.06 },
      { id: 'wait', label: '等待', emoji: '⏳', instruction: '等待 5 秒...', waitTime: 5, failChance: 0 },
      { id: 'eat', label: '享用', emoji: '👑', instruction: '连点享用人间美味！', clickTarget: 12, failChance: 0 },
    ],
  },
];

export function getRamenFlavors(): RamenFlavor[] {
  return [...FLAVORS];
}

export function getRamenFlavor(id: string): RamenFlavor | undefined {
  return [...FLAVORS, ...HIDDEN_RECIPES].find((f) => f.id === id);
}

export function checkHiddenRecipe(flavorIds: string[]): RamenFlavor | null {
  // 特定顺序触发隐藏食谱
  if (JSON.stringify(flavorIds.slice(-3)) === JSON.stringify(['classic', 'spicy', 'seafood'])) {
    return HIDDEN_RECIPES[0];
  }
  return null;
}

export function getRandomFlavor(): RamenFlavor {
  return FLAVORS[Math.floor(Math.random() * FLAVORS.length)];
}
