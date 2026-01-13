import { Player } from '../../types';

export interface PictomaniaPlayer extends Player {
  symbolCard?: string;
  numberCard?: number;
  targetWord?: string;
  guessedCorrectlyBy?: string[];
  isDoneGuessing?: boolean;
  myGuesses?: { targetPlayerId: string; symbol: string; number: number }[];
}

// 這裡我們暫時擴充 gameState 的類型定義，實際應該在 shared/types 定義更完整的結構
export interface PictomaniaState {
    wordCards: Record<string, string[]>;
    currentRound: number;
    history: any[];
}

export type PictomaniaPhase = 'waiting' | 'playing' | 'round_ended' | 'game_over';
