// Game configuration with Morandi colors
export const GAME_CONFIG = {
  pictomania: {
    icon: '🎨',
    name: '妙筆神猜',
    color: '#c9a9a6',  // Morandi Rose
    gradient: 'linear-gradient(135deg, #c9a9a6 0%, #b5a7c4 100%)',
    minPlayers: 2,
    maxPlayers: 6,
    rules: [
      '每位玩家畫出自己的題目',
      '觀察其他人的畫，猜測他們的題目',
      '畫得越好、猜得越準，分數越高！',
    ],
  },
  uno: {
    icon: '🎴',
    name: 'UNO',
    color: '#9fb4c7',  // Morandi Blue
    gradient: 'linear-gradient(135deg, #9fb4c7 0%, #b5a7c4 100%)',
    minPlayers: 2,
    maxPlayers: 10,
    rules: [
      '最先打完所有手牌的玩家獲勝',
      '只剩一張牌時記得喊 UNO!',
      '目標分數：500 分',
    ],
  },
} as const;

export type GameType = keyof typeof GAME_CONFIG;
