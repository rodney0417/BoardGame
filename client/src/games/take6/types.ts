export interface Take6Player {
  id: string;
  username: string;
  hand: number[];
  score: number;
  scorePile: number[];
  selectedCard?: number;
}

export interface Take6State {
  deck: number[];
  rows: number[][]; 
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
  round: number;
}
