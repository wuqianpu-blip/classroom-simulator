export interface DreamTheme {
  name: string;
  bgColor: string;
  floorColor: number;
  floorAlt: number;
  pathColor: number;
  accentColor: string;
  decorations: { x: number; y: number; emoji: string; size: number }[];
  shardPositions: [number, number][];
  mascots: { x: number; y: number; emoji: string; name: string; dialog: string }[];
  rides: { type: 'ferris' | 'carousel' | 'roller'; x: number; y: number; color: string }[];
}

export const DREAM_THEMES: Record<string, DreamTheme> = {
  playground: {
    name: '游乐世界',
    bgColor: '#0f0f2e',
    floorColor: 0x1a3a2a,
    floorAlt: 0x1e4a32,
    pathColor: 0x3a2a1a,
    accentColor: '#c084fc',
    decorations: [
      { x: 80, y: 500, emoji: '🎈', size: 24 },
      { x: 720, y: 100, emoji: '🎪', size: 28 },
      { x: 400, y: 80, emoji: '🎆', size: 20 },
    ],
    shardPositions: [
      [120, 120], [300, 80], [500, 120], [700, 80],
      [80, 300], [200, 350], [400, 280], [600, 300],
      [120, 500], [300, 550], [500, 520], [680, 500],
    ],
    mascots: [
      { x: 350, y: 150, emoji: '🐰', name: '小白兔', dialog: '欢迎来到游乐世界！' },
      { x: 160, y: 450, emoji: '🐻', name: '小熊', dialog: '那边的过山车可好玩了！' },
      { x: 400, y: 500, emoji: '🐱', name: '小猫咪', dialog: '栅栏旁边有隐藏碎片哦~' },
      { x: 700, y: 350, emoji: '🦊', name: '小狐狸', dialog: '集齐碎片可以实现愿望！' },
    ],
    rides: [
      { type: 'ferris', x: 650, y: 170, color: '#818cf8' },
      { type: 'carousel', x: 200, y: 200, color: '#f472b6' },
      { type: 'roller', x: 550, y: 420, color: '#6366f1' },
    ],
  },

  food: {
    name: '美食世界',
    bgColor: '#1a0f0a',
    floorColor: 0x3a2a1a,
    floorAlt: 0x4a3a2a,
    pathColor: 0x5a3a1a,
    accentColor: '#f472b6',
    decorations: [
      { x: 100, y: 100, emoji: '🍰', size: 32 },
      { x: 700, y: 120, emoji: '🍦', size: 28 },
      { x: 400, y: 550, emoji: '🍕', size: 30 },
      { x: 300, y: 80, emoji: '🍔', size: 24 },
      { x: 600, y: 500, emoji: '🥤', size: 20 },
    ],
    shardPositions: [
      [200, 100], [500, 80], [700, 200], [100, 250],
      [350, 180], [600, 300], [150, 400], [450, 350],
      [250, 500], [650, 450], [400, 500], [50, 500],
    ],
    mascots: [
      { x: 250, y: 200, emoji: '🍩', name: '甜甜圈', dialog: '咬一口我吧！超级甜~' },
      { x: 550, y: 180, emoji: '🍪', name: '小饼干', dialog: '那边有杯巨大的奶茶！' },
      { x: 350, y: 450, emoji: '🍫', name: '巧克力', dialog: '收集美食碎片可以换无限供应！' },
      { x: 650, y: 350, emoji: '🍭', name: '棒棒糖', dialog: '甜食是快乐源泉~' },
    ],
    rides: [
      { type: 'ferris', x: 650, y: 170, color: '#f472b6' },
      { type: 'carousel', x: 200, y: 200, color: '#34d399' },
      { type: 'roller', x: 550, y: 420, color: '#fbbf24' },
    ],
  },

  space: {
    name: '太空世界',
    bgColor: '#000011',
    floorColor: 0x0a0a2a,
    floorAlt: 0x10103a,
    pathColor: 0x1a1a4a,
    accentColor: '#60a5fa',
    decorations: [
      { x: 700, y: 80, emoji: '🪐', size: 24 },
      { x: 100, y: 150, emoji: '🌍', size: 28 },
      { x: 600, y: 500, emoji: '🌙', size: 26 },
      { x: 200, y: 400, emoji: '☄️', size: 20 },
      { x: 500, y: 100, emoji: '🛸', size: 22 },
    ],
    shardPositions: [
      [150, 80], [400, 60], [650, 100], [80, 200],
      [300, 180], [550, 250], [200, 350], [450, 400],
      [100, 500], [350, 500], [600, 450], [700, 550],
    ],
    mascots: [
      { x: 300, y: 150, emoji: '👽', name: '小外星人', dialog: '嘟嘟——欢迎来到太空！' },
      { x: 600, y: 200, emoji: '🤖', name: '机器人', dialog: '检测到梦境碎片信号...' },
      { x: 200, y: 450, emoji: '👾', name: '太空小怪兽', dialog: '星星碎片可以兑换火箭票！' },
      { x: 550, y: 450, emoji: '🛸', name: '飞碟', dialog: '跟我一起去银河旅行吧！' },
    ],
    rides: [
      { type: 'ferris', x: 650, y: 170, color: '#60a5fa' },
      { type: 'carousel', x: 200, y: 200, color: '#818cf8' },
      { type: 'roller', x: 550, y: 420, color: '#a78bfa' },
    ],
  },

  underwater: {
    name: '海底世界',
    bgColor: '#001020',
    floorColor: 0x0a1a3a,
    floorAlt: 0x0e224a,
    pathColor: 0x1a2a4a,
    accentColor: '#38bdf8',
    decorations: [
      { x: 100, y: 100, emoji: '🐠', size: 24 },
      { x: 700, y: 120, emoji: '🐙', size: 26 },
      { x: 400, y: 80, emoji: '🦈', size: 28 },
      { x: 150, y: 450, emoji: '🪸', size: 22 },
      { x: 650, y: 500, emoji: '🐋', size: 30 },
    ],
    shardPositions: [
      [100, 150], [300, 100], [550, 80], [750, 180],
      [200, 280], [400, 250], [600, 300], [100, 380],
      [350, 420], [550, 480], [700, 400], [250, 500],
    ],
    mascots: [
      { x: 300, y: 200, emoji: '🐬', name: '小海豚', dialog: '跟我一起游吧！海底好美~' },
      { x: 600, y: 180, emoji: '🐢', name: '海龟爷爷', dialog: '那边的珊瑚里有宝藏哦！' },
      { x: 200, y: 400, emoji: '🐡', name: '河豚', dialog: '别碰我，我会鼓起来！' },
      { x: 550, y: 400, emoji: '🦀', name: '小螃蟹', dialog: '横着走也能捡到碎片！' },
    ],
    rides: [
      { type: 'ferris', x: 650, y: 170, color: '#38bdf8' },
      { type: 'carousel', x: 200, y: 200, color: '#34d399' },
      { type: 'roller', x: 550, y: 420, color: '#2dd4bf' },
    ],
  },

  garden: {
    name: '花园世界',
    bgColor: '#0a1a0a',
    floorColor: 0x1a3a1a,
    floorAlt: 0x224a22,
    pathColor: 0x2a3a1a,
    accentColor: '#34d399',
    decorations: [
      { x: 80, y: 100, emoji: '🌻', size: 24 },
      { x: 720, y: 120, emoji: '🌷', size: 22 },
      { x: 400, y: 550, emoji: '🌳', size: 30 },
      { x: 300, y: 80, emoji: '🦋', size: 18 },
      { x: 600, y: 480, emoji: '🍄', size: 20 },
    ],
    shardPositions: [
      [150, 100], [350, 80], [600, 120], [780, 200],
      [80, 280], [300, 250], [500, 300], [700, 350],
      [200, 450], [400, 500], [600, 550], [750, 480],
    ],
    mascots: [
      { x: 300, y: 180, emoji: '🦋', name: '小蝴蝶', dialog: '花丛中有很多秘密哦~' },
      { x: 600, y: 200, emoji: '🐝', name: '小蜜蜂', dialog: '嗡嗡~这个花园最漂亮了！' },
      { x: 200, y: 400, emoji: '🐞', name: '七星瓢虫', dialog: '每片叶子下都可能有碎片！' },
      { x: 550, y: 450, emoji: '🐛', name: '毛毛虫', dialog: '等我长大了，也会变成蝴蝶~' },
    ],
    rides: [
      { type: 'ferris', x: 650, y: 170, color: '#34d399' },
      { type: 'carousel', x: 200, y: 200, color: '#fbbf24' },
      { type: 'roller', x: 550, y: 420, color: '#f472b6' },
    ],
  },
};
