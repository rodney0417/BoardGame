import { Server, Socket } from 'socket.io';
import { BasePlayer, RoomDTO } from '../../shared/types';

// Server-side Player (extends shared base)
export interface Player extends BasePlayer {
  // 可以在這裡加入 Server 專用的敏感資訊
}

// Server-side Room
export interface Room<TState = any, TSettings = any> {
  id: string;
  players: Player[];
  gameType: string;
  
  // 核心狀態
  phase: 'waiting' | 'playing' | 'round_ended' | 'game_over';
  settings: TSettings;
  gameState: TState;

  // 通用計時器 (Server端控制用)
  timeLeft: number;
  timer?: NodeJS.Timeout | null;
  cleanupTimer?: NodeJS.Timeout | null;
  
  // 上次活動時間 (用於清除閒置房間)
  lastActivity: number;
}

export interface GameModule<TState = any, TSettings = any> {
  id: string;
  name: string;
  icon: string;
  maxPlayers: number;
  defaultSettings: TSettings;

  // 初始化玩家 (回傳遊戲專屬的玩家初始狀態欄位)
  initPlayer: (player: Partial<Player>) => Partial<Player>;

  // 遊戲邏輯處理
  handlers: Record<string, (io: Server, room: Room<TState, TSettings>, socket: Socket, data: any) => boolean>;

  // Hooks
  onStartGame?: (room: Room<TState, TSettings>) => void;
  startRound?: (room: Room<TState, TSettings>) => void;
  onTimeout?: (io: Server, room: Room<TState, TSettings>) => boolean;
  onPlayerReconnect?: (io: Server, room: Room<TState, TSettings>, oldId: string, newId: string, socket: Socket) => void;
}