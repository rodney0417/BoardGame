export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 
                        'skip' | 'reverse' | 'draw_two' | 'wild' | 'wild_draw_four';

export interface UnoCard {
    color: CardColor;
    value: CardValue;
}

export interface UnoPlayer {
    id: string;
    username: string;
    color: string;
    score: number;
    handCount: number;
    isUno: boolean;
}

export interface UnoState {
    topCard: UnoCard;
    activeColor: CardColor;
    currentPlayer: string;
    direction: number;
    deckSize: number;
    hasDrawnThisTurn?: boolean;
}

export type UnoPhase = 'waiting' | 'playing' | 'game_over';

