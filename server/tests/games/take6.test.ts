import { describe, it, expect, beforeEach } from 'vitest';
import { Take6Round } from '../../src/games/take6/domain';

describe('Take 6! Domain Logic', () => {
    let round: Take6Round;
    const players = ['p1', 'p2', 'p3'];

    beforeEach(() => {
        round = Take6Round.create(players);
    });

    describe('Initialization', () => {
        it('should initialize with 104 cards deck', () => {
            const state = round.getState();
            // 104 - (10 * 3 players) - 4 rows = 70 remaining in deck?
            // Wait, logic implementation:
            // deck = 104
            // Deal 10 to each player (30)
            // Deal 4 to rows (4)
            // Remaining = 70
            
            // However, deck array is mutated logic. 
            // In strict TDD I should verify deck length.
            // But state.deck is what remains.
            expect(state.deck.length).toBe(70);
        });

        it('should deal 10 cards to each player', () => {
            const state = round.getState();
            expect(state.players['p1'].hand.length).toBe(10);
            expect(state.players['p2'].hand.length).toBe(10);
            expect(state.players['p3'].hand.length).toBe(10);
        });

        it('should initialize 4 rows with 1 card each', () => {
            const state = round.getState();
            expect(state.rows.length).toBe(4);
            state.rows.forEach(row => {
                expect(row.length).toBe(1);
            });
        });
    });

    describe('Card Selection', () => {
        it('should allow player to select a card from hand', () => {
             const hand = round.getState().players['p1'].hand;
             const cardToPlay = hand[0];
             
             const success = round.playCard('p1', cardToPlay);
             expect(success).toBe(true);
             
             // Card should be in 'selectedCard' and removed from hand
             expect(round.getState().players['p1'].selectedCard).toBe(cardToPlay);
             expect(round.getState().players['p1'].hand).not.toContain(cardToPlay);
        });

        it('should not allow selecting card not in hand', () => {
            const success = round.playCard('p1', 999); // Assuming 999 not in hand
            expect(success).toBe(false);
        });
        
        it('should detect when all players have selected', () => {
            expect(round.checkAllPlayersSelected()).toBe(false);
            
            const p1Card = round.getState().players['p1'].hand[0];
            const p2Card = round.getState().players['p2'].hand[0];
            const p3Card = round.getState().players['p3'].hand[0];
            
            round.playCard('p1', p1Card);
            round.playCard('p2', p2Card);
            expect(round.checkAllPlayersSelected()).toBe(false);
            
            round.playCard('p3', p3Card);
            expect(round.checkAllPlayersSelected()).toBe(true);
        });
    });

    describe('Resolution Phase', () => {
        it('should queue pending cards correctly', () => {
             // Mock hands for deterministic testing
             const s = round.getState();
             s.players['p1'].hand = [10];
             s.players['p2'].hand = [20];
             s.players['p3'].hand = [5];
             
             round.playCard('p1', 10);
             round.playCard('p2', 20);
             round.playCard('p3', 5);
             
             round.revealPhase();
             
             expect(s.pendingCards.length).toBe(3);
             expect(s.pendingCards[0].card).toBe(5);  // P3 (Smallest)
             expect(s.pendingCards[1].card).toBe(10); // P1
             expect(s.pendingCards[2].card).toBe(20); // P2
        });

        it('should auto-place cards into correct rows', () => {
             const s = round.getState();
             // Setup Rows: [1], [15], [30], [45]
             s.rows = [[1], [15], [30], [45]];
             
             // P1 plays 10 -> Should go to Row 0 (1)
             // P2 plays 20 -> Should go to Row 1 (15)
             
             s.pendingCards = [
                 { playerId: 'p1', card: 10 },
                 { playerId: 'p2', card: 20 }
             ];
             
             const blocked = round.processPendingCards();
             expect(blocked).toBe(false);
             
             expect(s.rows[0]).toEqual([1, 10]);
             expect(s.rows[1]).toEqual([15, 20]);
             expect(s.pendingCards.length).toBe(0);
        });
        
        it('should trigger take row (6th card rule)', () => {
            const s = round.getState();
            // Row 0 has 5 cards
            s.rows[0] = [1, 2, 3, 4, 5]; 
            
            // P1 plays 6 -> Should take row
            s.pendingCards = [{ playerId: 'p1', card: 6 }];
            
            const blocked = round.processPendingCards();
            expect(blocked).toBe(false);
            
            // Check Row reset
            expect(s.rows[0]).toEqual([6]);
            
            // Check Score (1+2+3+4+5 bulls)
            // 55 is 7 bulls, multiples of 11 is 5, 10 is 3, 5 is 2.
            // 1(1), 2(1), 3(1), 4(1), 5(2) = 6 bulls
            expect(s.players['p1'].score).toBe(6);
            expect(s.players['p1'].scorePile).toHaveLength(5);
        });
        
        it('should block and ask for row choice if card is smaller than all rows', () => {
             const s = round.getState();
             s.rows = [[10], [20], [30], [40]];
             
             // P1 plays 5 -> Smaller than 10
             s.pendingCards = [{ playerId: 'p1', card: 5 }];
             
             const blocked = round.processPendingCards();
             expect(blocked).toBe(true);
             expect(s.phase).toBe('choosing_row');
             expect(s.currentTurnCard?.playerId).toBe('p1');
        });
        
        it('should execute row choice', () => {
             const s = round.getState();
             s.rows = [[10], [20], [30], [40]];
             s.phase = 'choosing_row';
             s.currentTurnCard = { playerId: 'p1', card: 5 };
             
             // P1 chooses Row 0 (10) to eat.
             const success = round.chooseRow('p1', 0);
             expect(success).toBe(true);
             
             // Row 0 should become [5]
             expect(s.rows[0]).toEqual([5]);
             // P1 score should increase by bulls of [10] (which is 3 bulls for '10')
             expect(s.players['p1'].score).toBe(3);
        });
    });
});
