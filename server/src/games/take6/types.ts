export interface Take6Player {
  id: string;
  username: string;
  hand: number[];
  score: number;
  scorePile: number[]; // Cards taken this game (for verify/display)
  selectedCard?: number; // Card selected for current turn
  isReady?: boolean;     // For lobby
}

export interface Take6State {
  deck: number[];
  rows: number[][]; // 4 rows of cards
  players: Record<string, Take6Player>;
  phase: 'waiting' | 'selecting' | 'revealing' | 'choosing_row' | 'round_end' | 'game_over';
  winner?: string;
  currentTurnCard?: {
    playerId: string;
    card: number;
  };
  pendingCards: {
    playerId: string;
    card: number;
  }[];
  round: number; // 1-10
}

export type Take6Phase = Take6State['phase'];
