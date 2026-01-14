// 核心玩家資料 (前後端共用)
export interface BasePlayer {
  id: string; // Socket ID
  peerId: string; // PeerJS ID
  username: string;
  color: string;
  score: number;
  disconnected: boolean;
  isDoneDrawing: boolean;
}

// 房間的基礎狀態 (DTO - 傳輸給前端用)
export interface RoomDTO<GameState = any, GameSettings = any> {
  id: string;
  gameType: string;
  gameName: string;
  phase: 'waiting' | 'playing' | 'round_ended' | 'game_over'; // 新增階段
  players: BasePlayer[];
  timeLeft: number;
  settings: GameSettings; // 泛型設定 (如: drawTime, difficulty...)
  gameState: GameState;   // 泛型遊戲狀態 (如: cards, round...)
}

// 簡易的房間列表資訊
export interface RoomListInfo {
  id: string;
  gameType: string;
  gameName: string;
  playerCount: number;
  maxPlayers: number;
  phase: string;
  takenColors: string[];
  settings?: any;
  ownerName?: string;
}

// Pictomania 專用的歷史記錄結構 (放在這裡方便前後端共用)
export interface PictomaniaHistoryRecord {
  round: number;
  word: string; // 題目
  playerId: string;
  playerName: string; // 冗餘存儲，怕玩家離開
  playerColor?: string; // 玩家顏色 (Optional to avoid breaking existing history if any)
  imageBase64: string; // 圖片數據
}