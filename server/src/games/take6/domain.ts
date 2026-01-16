import { Take6State } from './types';

// Helper if not imported
const getBullHeads = (num: number): number => {
  if (num === 55) return 7;
  if (num % 11 === 0) return 5;
  if (num % 10 === 0) return 3;
  if (num % 5 === 0) return 2;
  return 1;
};

export class Take6Round {
    private state: Take6State;

    private constructor(state: Take6State) {
        this.state = state;
    }

    public static create(playerIds: string[]): Take6Round {
        // Initialize State
        const state: Take6State = {
            deck: [],
            rows: [[], [], [], []],
            players: {},
            phase: 'selecting',
            round: 1,
            pendingCards: [],
            currentTurnCard: undefined,
        };

        // Initialize Deck
        const deck = Array.from({ length: 104 }, (_, i) => i + 1);
        // Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        state.deck = deck;

        // Init Players
        playerIds.forEach(pid => {
            state.players[pid] = {
                id: pid,
                username: 'Player', // Placeholder
                hand: state.deck.splice(0, 10).sort((a, b) => a - b),
                score: 0,
                scorePile: [],
                selectedCard: undefined
            };
        });

        // Init Rows
        state.rows = [
            [state.deck.shift()!],
            [state.deck.shift()!],
            [state.deck.shift()!],
            [state.deck.shift()!]
        ];

        return new Take6Round(state);
    }

    public static restore(state: Take6State): Take6Round {
        // Validation / Patching for robust restoration
        if (!state) state = {} as any;
        if (!state.players) state.players = {};
        if (!state.rows) state.rows = [[], [], [], []];
        if (!state.pendingCards) state.pendingCards = [];
        
        return new Take6Round(state);
    }

    public getState(): Take6State {
        return this.state;
    }

    public playCard(playerId: string, card: number): boolean {
        const player = this.state.players[playerId];
        if (!player) return false;
        if (!player.hand.includes(card)) return false;
        if (player.selectedCard) return false;

        player.selectedCard = card;
        player.hand = player.hand.filter(c => c !== card);
        return true;
    }

    public checkAllPlayersSelected(): boolean {
        return Object.values(this.state.players).every(p => p.selectedCard !== undefined);
    }

    public revealPhase(): void {
        this.state.phase = 'revealing';
        this.state.pendingCards = Object.values(this.state.players)
            .map(p => ({ playerId: p.id, card: p.selectedCard! }))
            .sort((a, b) => a.card - b.card);
        
        Object.values(this.state.players).forEach(p => p.selectedCard = undefined);
    }

    // Returns true if blocked (needs explicit choice), false if fully resolved
    public processPendingCards(): boolean {
        while (this.state.pendingCards.length > 0) {
            const nextItem = this.state.pendingCards[0];
            const result = this.placeCard(nextItem);
            
            if (result === 'blocked') {
                this.state.currentTurnCard = nextItem;
                this.state.pendingCards.shift(); 
                this.state.phase = 'choosing_row';
                return true; // Blocked
            }
            // If placed, continue loop
            this.state.pendingCards.shift();
            this.state.currentTurnCard = nextItem; // Animation tracking
        }
        
        // Loop finished check end of round/game
        this.state.currentTurnCard = undefined;
        this.state.phase = 'selecting';
        this.state.round++;
        
        const firstPid = Object.keys(this.state.players)[0];
        if (this.state.players[firstPid].hand.length === 0) {
            this.state.phase = 'game_over';
            this.calculateWinner();
        }

        return false;
    }

    private placeCard(item: { playerId: string, card: number }): 'placed' | 'blocked' {
        const { playerId, card } = item;
        
        // Logic to find best row
        let bestRowIndex = -1;
        let maxVal = -1;

        for (let i = 0; i < 4; i++) {
            const row = this.state.rows[i];
            const lastCard = row[row.length - 1];
            if (card > lastCard) {
                if (lastCard > maxVal) {
                    maxVal = lastCard;
                    bestRowIndex = i;
                }
            }
        }

        if (bestRowIndex === -1) {
            return 'blocked';
        }

        const row = this.state.rows[bestRowIndex];
        if (row.length >= 5) {
            // Take Row
            this.takeRow(bestRowIndex, playerId, card);
        } else {
            row.push(card);
        }
        return 'placed';
    }

    public chooseRow(playerId: string, rowIndex: number): boolean {
        if (this.state.phase !== 'choosing_row') return false;
        
        // Verify user is the one blocked
        if (this.state.currentTurnCard?.playerId !== playerId) return false;
        
        if (rowIndex < 0 || rowIndex > 3) return false;

        const card = this.state.currentTurnCard.card;
        this.takeRow(rowIndex, playerId, card);

        // Resume processing
        this.state.phase = 'revealing';
        this.state.currentTurnCard = undefined;
        // The loop is driven by controller calling processPendingCards again? 
        // Yes, controller should call processPendingCards loop again.
        return true;
    }

    private takeRow(rowIndex: number, playerId: string, newCard: number) {
        const row = this.state.rows[rowIndex];
        const player = this.state.players[playerId];
        const bullHeads = row.reduce((sum, c) => sum + getBullHeads(c), 0);
        player.score += bullHeads;
        player.scorePile.push(...row);
        this.state.rows[rowIndex] = [newCard];
    }
    
    private calculateWinner() {
         let lowestScore = Infinity;
         let winnerId = '';
         Object.values(this.state.players).forEach(p => {
             if (p.score < lowestScore) {
                 lowestScore = p.score;
                 winnerId = p.id;
             }
         });
         this.state.winner = winnerId;
    }
    public updatePlayerId(oldId: string, newId: string): boolean {
        if (!this.state.players) return false;
        const player = this.state.players[oldId];
        if (!player) return false;

        // 1. Move Player Data
        this.state.players[newId] = { ...player, id: newId };
        delete this.state.players[oldId];

        // 2. Update Pending Cards reference
        this.state.pendingCards.forEach(p => {
            if (p.playerId === oldId) p.playerId = newId;
        });

        // 3. Update Current Turn Card reference
        if (this.state.currentTurnCard && this.state.currentTurnCard.playerId === oldId) {
            this.state.currentTurnCard.playerId = newId;
        }

        return true;
    }
}
