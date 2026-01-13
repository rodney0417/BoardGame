import { describe, it, expect, beforeEach } from 'vitest';
import { UnoCard, CardColor, CardValue, UnoDeck, UnoRound } from '../../src/games/uno/domain';

describe('UNO Domain Logic', () => {
  describe('UnoDeck', () => {
    it('should create a deck with 108 cards', () => {
      const deck = new UnoDeck();
      expect(deck.size()).toBe(108);
    });

    it('should have correct card distribution', () => {
      const deck = new UnoDeck();
      const cards = deck.getAllCards();

      // Count by color
      const redCards = cards.filter((c) => c.color === 'red').length;
      const blueCards = cards.filter((c) => c.color === 'blue').length;
      const greenCards = cards.filter((c) => c.color === 'green').length;
      const yellowCards = cards.filter((c) => c.color === 'yellow').length;
      const wildCards = cards.filter((c) => c.color === 'wild').length;

      expect(redCards).toBe(25);
      expect(blueCards).toBe(25);
      expect(greenCards).toBe(25);
      expect(yellowCards).toBe(25);
      expect(wildCards).toBe(8); // 4 Wild + 4 Wild Draw Four
    });

    it('should shuffle and deal cards', () => {
      const deck = new UnoDeck();
      deck.shuffle();

      const hand = deck.deal(7);
      expect(hand.length).toBe(7);
      expect(deck.size()).toBe(101);
    });
  });

  describe('UnoRound', () => {
    let round: UnoRound;
    const players = ['p1', 'p2', 'p3'];

    beforeEach(() => {
      round = new UnoRound(players);
    });

    it('should initialize with each player having 7 cards', () => {
      expect(round.getHand('p1').length).toBe(7);
      expect(round.getHand('p2').length).toBe(7);
      expect(round.getHand('p3').length).toBe(7);
    });

    it('should have a valid starting card on discard pile', () => {
      const topCard = round.getTopCard();
      expect(topCard).toBeDefined();
      // Starting card should not be a wild or action card
      expect(topCard.color).not.toBe('wild');
    });

    it('should validate playable cards correctly', () => {
      // Force a known top card for testing
      round.setTopCard({ color: 'red', value: '5' });

      // Same color should be playable
      expect(round.isPlayable({ color: 'red', value: '3' })).toBe(true);

      // Same value should be playable
      expect(round.isPlayable({ color: 'blue', value: '5' })).toBe(true);

      // Wild should always be playable
      expect(round.isPlayable({ color: 'wild', value: 'wild' })).toBe(true);

      // Different color and value should not be playable
      expect(round.isPlayable({ color: 'blue', value: '3' })).toBe(false);
    });

    it('should handle Skip card effect', () => {
      round.setTopCard({ color: 'red', value: '5' });
      const skipCard: UnoCard = { color: 'red', value: 'skip' };

      // Give p1 the skip card
      round.giveCard('p1', skipCard);

      // p1 plays skip
      expect(round.getCurrentPlayer()).toBe('p1');
      round.playCard('p1', skipCard);

      // p2 should be skipped, now p3's turn
      expect(round.getCurrentPlayer()).toBe('p3');
    });

    it('should handle Reverse card effect', () => {
      round.setTopCard({ color: 'red', value: '5' });
      const reverseCard: UnoCard = { color: 'red', value: 'reverse' };

      round.giveCard('p1', reverseCard);

      expect(round.getCurrentPlayer()).toBe('p1');
      round.playCard('p1', reverseCard);

      // Direction reversed, next should be p3 (going backwards)
      expect(round.getCurrentPlayer()).toBe('p3');
    });

    it('should handle Reverse card effect with 3 players', () => {
      // 3 Players: p1 -> p2 -> p3
      // p1 plays Reverse -> Direction flips -> p3 should be next
      const round3 = new UnoRound(['p1', 'p2', 'p3']);
      round3.setTopCard({ color: 'red', value: '1' });
      round3.clearHand('p1');
      round3.giveCard('p1', { color: 'red', value: 'reverse' });

      const success = round3.playCard('p1', { color: 'red', value: 'reverse' });

      expect(success).toBe(true);
      expect(round3.getDirection()).toBe(-1);
      expect(round3.getCurrentPlayer()).toBe('p3');
    });

    it('should handle Reverse card effect with 2 players (Skip)', () => {
      // 2 Players: p1 -> p2
      // p1 plays Reverse -> Acts like Skip -> p1 plays again
      const round2 = new UnoRound(['p1', 'p2']);
      round2.setTopCard({ color: 'red', value: '1' });
      round2.clearHand('p1');
      round2.giveCard('p1', { color: 'red', value: 'reverse' });

      round2.playCard('p1', { color: 'red', value: 'reverse' });

      expect(round2.getCurrentPlayer()).toBe('p1'); // p1 plays again
    });

    it('should handle Draw Two card effect', () => {
      round.setTopCard({ color: 'red', value: '5' });
      const drawTwoCard: UnoCard = { color: 'red', value: 'draw_two' };

      round.giveCard('p1', drawTwoCard);
      const p2HandSize = round.getHand('p2').length;

      round.playCard('p1', drawTwoCard);

      // p2 should have drawn 2 cards and be skipped
      expect(round.getHand('p2').length).toBe(p2HandSize + 2);
      expect(round.getCurrentPlayer()).toBe('p3');
    });

    it('should handle Wild card color selection', () => {
      round.setTopCard({ color: 'red', value: '5' });
      const wildCard: UnoCard = { color: 'wild', value: 'wild' };

      round.giveCard('p1', wildCard);
      round.playCard('p1', wildCard, 'blue');

      // Top card should now require blue
      expect(round.getActiveColor()).toBe('blue');
    });

    it('should detect winner when hand is empty', () => {
      // Give p1 only one card
      round.clearHand('p1');
      round.giveCard('p1', { color: 'red', value: '5' });
      round.setTopCard({ color: 'red', value: '3' });

      expect(round.getWinner()).toBeNull();
      round.playCard('p1', { color: 'red', value: '5' });
      expect(round.getWinner()).toBe('p1');
    });
  });

  describe('UNO Call Rules', () => {
    it('should track UNO calls', () => {
      const round = new UnoRound(['p1', 'p2']);

      // Give p1 only 2 cards
      round.clearHand('p1');
      round.giveCard('p1', { color: 'red', value: '5' });
      round.giveCard('p1', { color: 'red', value: '3' });
      round.setTopCard({ color: 'red', value: '1' });

      // Play a card without calling UNO
      round.playCard('p1', { color: 'red', value: '5' });

      // p1 should be vulnerable to challenge
      expect(round.canChallengeUno('p1')).toBe(true);

      // After calling UNO, no longer vulnerable
      round.callUno('p1');
      expect(round.canChallengeUno('p1')).toBe(false);
    });

    it('should penalize with 2 cards when UNO challenge succeeds', () => {
      const round = new UnoRound(['p1', 'p2']);

      // Setup: p1 has 1 card without calling UNO
      round.clearHand('p1');
      round.giveCard('p1', { color: 'red', value: '5' });
      round.giveCard('p1', { color: 'red', value: '3' });
      round.setTopCard({ color: 'red', value: '1' });
      round.playCard('p1', { color: 'red', value: '5' });

      // p1 now has 1 card, didn't call UNO
      expect(round.getHand('p1').length).toBe(1);

      // p2 challenges p1
      const success = round.challengeUno('p2', 'p1');

      expect(success).toBe(true);
      // p1 should now have 1 + 2 = 3 cards
      expect(round.getHand('p1').length).toBe(3);
    });

    it('should not allow challenging if player already called UNO', () => {
      const round = new UnoRound(['p1', 'p2']);

      round.clearHand('p1');
      round.giveCard('p1', { color: 'red', value: '5' });
      round.giveCard('p1', { color: 'red', value: '3' });
      round.setTopCard({ color: 'red', value: '1' });

      // p1 calls UNO before playing
      round.callUno('p1');
      round.playCard('p1', { color: 'red', value: '5' });

      // p2 tries to challenge - should fail
      const success = round.challengeUno('p2', 'p1');
      expect(success).toBe(false);
      expect(round.getHand('p1').length).toBe(1); // No penalty
    });

    it('should not allow challenging if player has more than 1 card', () => {
      const round = new UnoRound(['p1', 'p2']);

      // p1 has 7 cards (default)
      expect(round.getHand('p1').length).toBe(7);

      const success = round.challengeUno('p2', 'p1');
      expect(success).toBe(false);
    });
  });

  describe('Scoring Rules', () => {
    it('should calculate hand score correctly', () => {
      const round = new UnoRound(['p1']);
      round.clearHand('p1');

      // Number cards (face value)
      round.giveCard('p1', { color: 'red', value: '5' }); // 5
      round.giveCard('p1', { color: 'blue', value: '0' }); // 0
      round.giveCard('p1', { color: 'green', value: '9' }); // 9

      // Action cards (20 each)
      round.giveCard('p1', { color: 'yellow', value: 'reverse' }); // 20
      round.giveCard('p1', { color: 'red', value: 'skip' }); // 20
      round.giveCard('p1', { color: 'blue', value: 'draw_two' }); // 20

      // Wild cards (50 each)
      round.giveCard('p1', { color: 'wild', value: 'wild' }); // 50
      round.giveCard('p1', { color: 'wild', value: 'wild_draw_four' }); // 50

      // Total: 5 + 0 + 9 + 20 + 20 + 20 + 50 + 50 = 174
      expect(round.calculateHandScore('p1')).toBe(174);
    });
  });

  describe('Turn Rules (Draw/Pass)', () => {
    let round: UnoRound;
    const players = ['p1', 'p2', 'p3'];

    beforeEach(() => {
      round = new UnoRound(players);
    });

    it('should not allow passing without drawing', () => {
      const currentPlayer = round.getCurrentPlayer();
      const result = round.pass(currentPlayer);
      expect(result).toBe(false);
    });

    it('should allow drawing a card', () => {
      const currentPlayer = round.getCurrentPlayer();
      const stateBefore = round.getState();
      const handSizeBefore = stateBefore.hands[currentPlayer];

      const card = round.drawCard(currentPlayer);
      expect(card).toBeDefined();

      const stateAfter = round.getState();
      const handSizeAfter = stateAfter.hands[currentPlayer];
      expect(handSizeAfter).toBe(handSizeBefore + 1);
    });

    it('should allow passing AFTER drawing', () => {
      const currentPlayer = round.getCurrentPlayer();
      round.drawCard(currentPlayer);

      const result = round.pass(currentPlayer);
      expect(result).toBe(true);

      expect(round.getCurrentPlayer()).not.toBe(currentPlayer);
    });

    it('should not allow drawing twice in a turn', () => {
      const currentPlayer = round.getCurrentPlayer();
      round.drawCard(currentPlayer);

      const card2 = round.drawCard(currentPlayer);
      expect(card2).toBeUndefined();
    });

    it('should reset drawn state after turn ends', () => {
      const p1 = round.getCurrentPlayer();
      round.drawCard(p1);
      round.pass(p1);

      const p2 = round.getCurrentPlayer();
      expect(round.pass(p2)).toBe(false);
    });
  });

  describe('Serialization (Redis Persistence)', () => {
    it('should serialize and deserialize UnoDeck correctly', () => {
      const deck = new UnoDeck();
      deck.shuffle();
      deck.deal(10);

      const json = deck.toJSON();
      const restored = UnoDeck.fromJSON(json);

      expect(restored.size()).toBe(deck.size());
      expect(restored.getAllCards()).toEqual(deck.getAllCards());
    });

    it('should serialize and deserialize UnoRound correctly', () => {
      const round = new UnoRound(['p1', 'p2', 'p3']);

      round.setTopCard({ color: 'blue', value: '7' });
      round.callUno('p1');

      const json = round.toJSON();
      const restored = UnoRound.fromJSON(json);

      expect(restored.getHand('p1').length).toBe(round.getHand('p1').length);
      expect(restored.getHand('p2').length).toBe(round.getHand('p2').length);
      expect(restored.getTopCard()).toEqual(round.getTopCard());
      expect(restored.getCurrentPlayer()).toBe(round.getCurrentPlayer());
      expect(restored.getActiveColor()).toBe(round.getActiveColor());
      expect(restored.canChallengeUno('p1')).toBe(false);
    });

    it('should preserve game progress after serialization', () => {
      const round = new UnoRound(['p1', 'p2']);

      round.clearHand('p1');
      round.giveCard('p1', { color: 'red', value: '5' });
      round.giveCard('p1', { color: 'red', value: '3' });
      round.setTopCard({ color: 'red', value: '1' });
      round.playCard('p1', { color: 'red', value: '5' });

      const json = round.toJSON();
      const restored = UnoRound.fromJSON(json);

      expect(restored.getCurrentPlayer()).toBe('p2');
      expect(restored.getHand('p1').length).toBe(1);
    });
  });

  describe('Game End Integration', () => {
    it('should calculate winner score from loser hands', () => {
      const round = new UnoRound(['p1', 'p2']);

      // Setup: P1 has 1 card (plays it to win), P2 has cards
      round.clearHand('p1');
      round.giveCard('p1', { color: 'red', value: '5' });

      round.clearHand('p2');
      round.giveCard('p2', { color: 'blue', value: '5' }); // 5 points
      round.giveCard('p2', { color: 'green', value: 'draw_two' }); // 20 points
      round.giveCard('p2', { color: 'wild', value: 'wild' }); // 50 points
      // P2 Total: 75

      round.setTopCard({ color: 'red', value: '1' });

      // P1 plays last card
      const win = round.playCard('p1', { color: 'red', value: '5' });
      expect(win).toBe(true);
      expect(round.getWinner()).toBe('p1');

      // Calculate score logic from index.ts
      let roundPoints = 0;
      const players = ['p1', 'p2'];
      players.forEach((pid) => {
        if (pid !== 'p1') {
          roundPoints += round.calculateHandScore(pid);
        }
      });

      expect(roundPoints).toBe(75);
    });
  });
});
