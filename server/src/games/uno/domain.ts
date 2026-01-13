// UNO Domain Model (DDD)

export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardValue =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'skip'
  | 'reverse'
  | 'draw_two'
  | 'wild'
  | 'wild_draw_four';

export interface UnoCard {
  color: CardColor;
  value: CardValue;
}

type PlayerId = string;

export class UnoDeck {
  private cards: UnoCard[] = [];

  constructor() {
    this.initializeDeck();
  }

  private initializeDeck(): void {
    const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];

    colors.forEach((color) => {
      // One 0 per color
      this.cards.push({ color, value: '0' });

      // Two of each 1-9, Skip, Reverse, Draw Two
      for (let i = 0; i < 2; i++) {
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw_two'].forEach(
          (value) => {
            this.cards.push({ color, value: value as CardValue });
          },
        );
      }
    });

    // 4 Wild cards
    for (let i = 0; i < 4; i++) {
      this.cards.push({ color: 'wild', value: 'wild' });
    }

    // 4 Wild Draw Four cards
    for (let i = 0; i < 4; i++) {
      this.cards.push({ color: 'wild', value: 'wild_draw_four' });
    }
  }

  public size(): number {
    return this.cards.length;
  }

  public getAllCards(): UnoCard[] {
    return [...this.cards];
  }

  public shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  public deal(count: number): UnoCard[] {
    return this.cards.splice(0, count);
  }

  public draw(): UnoCard | undefined {
    return this.cards.shift();
  }

  public addToBottom(cards: UnoCard[]): void {
    this.cards.push(...cards);
  }

  public toJSON() {
    return { cards: this.cards };
  }

  public static fromJSON(data: { cards: UnoCard[] }): UnoDeck {
    const deck = new UnoDeck();
    deck.cards = data.cards || [];
    return deck;
  }
}

export class UnoRound {
  private deck: UnoDeck;
  private hands: Record<PlayerId, UnoCard[]> = {};
  private discardPile: UnoCard[] = [];
  private players: PlayerId[];
  private currentPlayerIndex: number = 0;
  private direction: 1 | -1 = 1; // 1 = clockwise, -1 = counter-clockwise
  private activeColor: CardColor = 'red';
  private unoCalled: Set<PlayerId> = new Set();
  private winner: PlayerId | null = null;
  private hasDrawnThisTurn: boolean = false;

  constructor(players: PlayerId[]) {
    this.players = players;
    this.deck = new UnoDeck();
    this.deck.shuffle();

    // Deal 7 cards to each player
    players.forEach((pid) => {
      this.hands[pid] = this.deck.deal(7);
    });

    // Draw starting card (must be a number card)
    let startCard = this.deck.draw();
    while (
      startCard &&
      (startCard.color === 'wild' || ['skip', 'reverse', 'draw_two'].includes(startCard.value))
    ) {
      this.deck.addToBottom([startCard]);
      this.deck.shuffle();
      startCard = this.deck.draw();
    }
    if (startCard) {
      this.discardPile.push(startCard);
      this.activeColor = startCard.color;
    }
  }

  public getHand(playerId: PlayerId): UnoCard[] {
    return this.hands[playerId] || [];
  }

  public clearHand(playerId: PlayerId): void {
    this.hands[playerId] = [];
  }

  public giveCard(playerId: PlayerId, card: UnoCard): void {
    if (!this.hands[playerId]) this.hands[playerId] = [];
    this.hands[playerId].push(card);
  }

  public getTopCard(): UnoCard {
    return this.discardPile[this.discardPile.length - 1];
  }

  public setTopCard(card: UnoCard): void {
    this.discardPile.push(card);
    this.activeColor = card.color === 'wild' ? this.activeColor : card.color;
  }

  public getActiveColor(): CardColor {
    return this.activeColor;
  }

  public getCurrentPlayer(): PlayerId {
    return this.players[this.currentPlayerIndex];
  }

  public isPlayable(card: UnoCard): boolean {
    if (card.color === 'wild') return true;

    const topCard = this.getTopCard();
    return card.color === this.activeColor || card.value === topCard.value;
  }

  public playCard(playerId: PlayerId, card: UnoCard, chosenColor?: CardColor): boolean {
    console.log(`[Domain] playCard called by ${playerId} with`, card);
    if (playerId !== this.getCurrentPlayer()) {
      console.log(`[Domain] Not current player. Current: ${this.getCurrentPlayer()}`);
      return false;
    }

    const hand = this.hands[playerId];
    const cardIndex = hand.findIndex((c) => c.color === card.color && c.value === card.value);

    if (cardIndex === -1) {
      console.log(`[Domain] Card not in hand`);
      return false;
    }
    if (!this.isPlayable(card)) {
      console.log(`[Domain] Card not playable`);
      return false;
    }

    // Remove card from hand
    hand.splice(cardIndex, 1);
    this.discardPile.push(card);

    // Handle wild card color
    if (card.color === 'wild' && chosenColor) {
      this.activeColor = chosenColor;
    } else {
      this.activeColor = card.color;
    }

    // Update UNO call status:
    // Only clear if the player has more than 1 card left.
    // If they have 1 card left, they keep the status (if they called it).
    if (hand.length > 1) {
      this.unoCalled.delete(playerId);
    }

    // Handle special cards
    this.handleSpecialCard(card);

    // Check for winner
    if (hand.length === 0) {
      this.winner = playerId;
      return true;
    }

    return true;
  }

  private handleSpecialCard(card: UnoCard): void {
    switch (card.value) {
      case 'skip':
        this.advancePlayer();
        this.advancePlayer();
        break;
      case 'reverse':
        this.direction *= -1;
        if (this.players.length === 2) {
          this.advancePlayer();
        }
        this.advancePlayer();
        break;
      case 'draw_two':
        this.advancePlayer();
        const nextPlayer = this.getCurrentPlayer();
        const drawnCards = this.deck.deal(2);
        this.hands[nextPlayer].push(...drawnCards);
        this.unoCalled.delete(nextPlayer);
        this.advancePlayer();
        break;
      case 'wild_draw_four':
        this.advancePlayer();
        const targetPlayer = this.getCurrentPlayer();
        const fourCards = this.deck.deal(4);
        this.hands[targetPlayer].push(...fourCards);
        this.unoCalled.delete(targetPlayer);
        this.advancePlayer();
        break;
      default:
        this.advancePlayer();
    }
  }

  private advancePlayer(): void {
    this.currentPlayerIndex =
      (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
    this.hasDrawnThisTurn = false;
  }

  public updatePlayerId(oldId: PlayerId, newId: PlayerId): void {
    const index = this.players.indexOf(oldId);
    if (index !== -1) {
      this.players[index] = newId;
    }

    if (this.hands[oldId]) {
      this.hands[newId] = this.hands[oldId];
      delete this.hands[oldId];
    }

    if (this.unoCalled.has(oldId)) {
      this.unoCalled.delete(oldId);
      this.unoCalled.add(newId);
    }

    if (this.winner === oldId) {
      this.winner = newId;
    }
  }

  public drawCard(playerId: PlayerId): UnoCard | undefined {
    if (playerId !== this.getCurrentPlayer()) return undefined;
    if (this.hasDrawnThisTurn) return undefined; // Cannot draw more than once

    const card = this.deck.draw();
    if (card) {
      this.hands[playerId].push(card);
      // Drawing a card voids UNO status (because you have +1 card now)
      this.unoCalled.delete(playerId);
      this.hasDrawnThisTurn = true;
    }
    return card;
  }

  public pass(playerId: PlayerId): boolean {
    if (playerId !== this.getCurrentPlayer()) return false;
    if (!this.hasDrawnThisTurn) return false; // Must draw before passing

    this.advancePlayer();
    return true;
  }

  public callUno(playerId: PlayerId): void {
    this.unoCalled.add(playerId);
  }

  public canChallengeUno(playerId: PlayerId): boolean {
    const hand = this.hands[playerId];
    return hand.length === 1 && !this.unoCalled.has(playerId);
  }

  public challengeUno(challengerId: PlayerId, targetId: PlayerId): boolean {
    if (this.canChallengeUno(targetId)) {
      // Target must draw 2 cards as penalty
      const penaltyCards = this.deck.deal(2);
      this.hands[targetId].push(...penaltyCards);
      // Clear UNO status
      this.unoCalled.delete(targetId);
      return true;
    }
    return false;
  }

  public getWinner(): PlayerId | null {
    return this.winner;
  }

  public calculateHandScore(playerId: PlayerId): number {
    const hand = this.hands[playerId] || [];
    return hand.reduce((total, card) => {
      if (['skip', 'reverse', 'draw_two'].includes(card.value)) {
        return total + 20;
      }
      if (['wild', 'wild_draw_four'].includes(card.value)) {
        return total + 50;
      }
      // Number cards
      return total + parseInt(card.value, 10);
    }, 0);
  }

  public getDirection(): number {
    return this.direction;
  }

  public getDeckSize(): number {
    return this.deck.size();
  }

  public getState() {
    return {
      hands: Object.fromEntries(
        Object.entries(this.hands).map(([pid, cards]) => [pid, cards.length]),
      ),
      topCard: this.getTopCard(),
      activeColor: this.activeColor,
      currentPlayer: this.getCurrentPlayer(),
      direction: this.direction,
      deckSize: this.deck.size(),
      winner: this.winner,
      unoCalled: Array.from(this.unoCalled),
      hasDrawnThisTurn: this.hasDrawnThisTurn,
    };
  }

  public toJSON() {
    return {
      deck: this.deck.toJSON(),
      hands: this.hands,
      discardPile: this.discardPile,
      players: this.players,
      currentPlayerIndex: this.currentPlayerIndex,
      direction: this.direction,
      activeColor: this.activeColor,
      unoCalled: Array.from(this.unoCalled),
      winner: this.winner,
      hasDrawnThisTurn: this.hasDrawnThisTurn,
    };
  }

  public static fromJSON(data: any): UnoRound {
    // Create a minimal instance, then override all properties
    const round = Object.create(UnoRound.prototype);
    round.deck = UnoDeck.fromJSON(data.deck || { cards: [] });
    round.hands = data.hands || {};
    round.discardPile = data.discardPile || [];
    round.players = data.players || [];
    round.currentPlayerIndex = data.currentPlayerIndex || 0;
    round.direction = data.direction || 1;
    round.activeColor = data.activeColor || 'red';
    // Handle unoCalled - ensure it's an array before passing to Set
    const unoCalledArray = Array.isArray(data.unoCalled) ? data.unoCalled : [];
    round.unoCalled = new Set(unoCalledArray);
    round.winner = data.winner || null;
    round.hasDrawnThisTurn = data.hasDrawnThisTurn || false;
    return round;
  }
}
