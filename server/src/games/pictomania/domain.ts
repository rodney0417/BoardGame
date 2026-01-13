export type PlayerId = string;

export interface GuessResult {
  guesserId: PlayerId;
  targetId: PlayerId;
  isCorrect: boolean;
  time: number;
}

export interface PlayerHistoryEntry {
  guesserId: PlayerId;
  score: number;
  order: number;
}

export class PictomaniaRound {
  private players: PlayerId[];
  private scoreCards: Record<PlayerId, number[]>;
  private correctGuesses: Record<PlayerId, PlayerHistoryEntry[]>; // TargetId -> List of people who guessed them correctly
  private scores: Record<PlayerId, number>; // Temporary score accumulation from guesses
  private activeGuesses: Record<PlayerId, Map<PlayerId, number>>;

  constructor(players: PlayerId[]) {
    this.players = players;
    this.scoreCards = {};
    this.correctGuesses = {};
    this.scores = {};
    this.activeGuesses = {};

    this.players.forEach((p) => {
      this.scoreCards[p] = this.titlesForPlayerCount(this.players.length);
      this.correctGuesses[p] = [];
      this.scores[p] = 0;
      this.activeGuesses[p] = new Map();
    });
  }

  public updatePlayerId(oldId: PlayerId, newId: PlayerId): void {
    console.log(`[PictomaniaRound] Updating ID: ${oldId} -> ${newId}`);

    // 1. Update players array
    const idx = this.players.indexOf(oldId);
    if (idx !== -1) this.players[idx] = newId;

    // 2. Update scoreCards (Key)
    if (this.scoreCards[oldId]) {
      this.scoreCards[newId] = this.scoreCards[oldId];
      delete this.scoreCards[oldId];
    }

    // 3. Update scores (Key)
    if (this.scores[oldId] !== undefined) {
      this.scores[newId] = this.scores[oldId];
      delete this.scores[oldId];
    }

    // 4. Update correctGuesses (Key: TargetId, Value: GuesserId in objects)
    // 4a. As Target (Key)
    if (this.correctGuesses[oldId]) {
      this.correctGuesses[newId] = this.correctGuesses[oldId];
      delete this.correctGuesses[oldId];
    }
    // 4b. As Guesser (Value inside other arrays)
    Object.values(this.correctGuesses).forEach((historyList) => {
      historyList.forEach((entry) => {
        if (entry.guesserId === oldId) entry.guesserId = newId;
      });
    });

    // 5. Update activeGuesses (Key: GuesserId, Map keys: TargetId)
    // 5a. As Guesser (Key)
    if (this.activeGuesses[oldId]) {
      this.activeGuesses[newId] = this.activeGuesses[oldId];
      delete this.activeGuesses[oldId];
    }
    // 5b. As Target (Map Keys inside other Guessers)
    Object.values(this.activeGuesses).forEach((guessMap) => {
      if (guessMap.has(oldId)) {
        const val = guessMap.get(oldId)!;
        guessMap.set(newId, val);
        guessMap.delete(oldId);
      }
    });
  }

  public setGuess(guesserId: PlayerId, targetId: PlayerId, number: number): void {
    const guesserGuesses = this.activeGuesses[guesserId];
    if (!guesserGuesses) return; // Should not happen

    if (guesserId === targetId) {
      throw new Error('無法猜測自己！');
    }

    // Check if ALREADY guessed this target (One-time only rule)
    if (guesserGuesses.has(targetId)) {
      // User requested strict locking: cannot change guess once made.
      throw new Error(`無法修改！您已經猜過這個玩家了。`);
    }

    // Check if number is already used on a DIFFERENT target
    for (const [tid, num] of guesserGuesses.entries()) {
      if (num === number && tid !== targetId) {
        // Number used elsewhere. Throw error as requested by current TDD spec.
        // Or we could silently remove it from the other target if that was the UX.
        // But test expects Error.
        throw new Error(`數字 ${number} 已經用在其他人身上了`);
      }
    }

    guesserGuesses.set(targetId, number);
  }

  // --- Setup Logic ---

  public setupRound(activeSymbols: string[]): Record<string, { symbol: string; number: number }> {
    const shuffle = <T>(array: T[]): T[] => {
      const newArr = [...array];
      for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
      }
      return newArr;
    };

    const assignments: Record<string, { symbol: string; number: number }> = {};
    const shuffledSymbols = shuffle(activeSymbols);
    const usedSymbols = new Set<string>();

    this.players.forEach((pid, index) => {
      // Each player gets a unique symbol (if enough symbols available)
      const symbol = shuffledSymbols[index % shuffledSymbols.length];
      // Random number 1-7 for this symbol
      const number = Math.floor(Math.random() * 7) + 1;

      assignments[pid] = { symbol, number };
      usedSymbols.add(symbol);
    });

    return assignments;
  }

  public getGuess(guesserId: PlayerId, targetId: PlayerId): number | undefined {
    return this.activeGuesses[guesserId]?.get(targetId);
  }

  private titlesForPlayerCount(count: number): number[] {
    // Rule: N players, each player has (N-1) cards that others can take.
    // The cards are valued highest to lowest (first correct guesser gets most points).
    // Remaining cards at end of round become PENALTY for the drawer.

    switch (count) {
      case 2:
        return [3]; // 2-player mode: single high-value card, simpler gameplay
      case 3:
        return [2, 1];
      case 4:
        return [2, 1, 1];
      case 5:
        return [3, 2, 1, 1];
      case 6:
        return [3, 2, 1, 1, 1];
      default:
        return Array(Math.max(0, count - 1)).fill(1);
    }
  }

  public getScoreCards(playerId: PlayerId): number[] {
    return this.scoreCards[playerId] || [];
  }

  public getSearchHistory(playerId: PlayerId): PlayerHistoryEntry[] {
    return this.correctGuesses[playerId] || [];
  }

  public processGuess(guess: GuessResult): number {
    if (!guess.isCorrect) {
      console.log(`[Domain] processGuess: Incorrect guess from ${guess.guesserId}`);
      return 0;
    }

    const targetCards = this.scoreCards[guess.targetId];
    console.log(
      `[Domain] processGuess: Target ${guess.targetId} cards: ${JSON.stringify(targetCards)}`,
    );

    let points = 0;
    if (targetCards && targetCards.length > 0) {
      // Take the highest card (first in array assumed sorted decending)
      points = targetCards.shift()!; // Remove first
    }

    // Record history (Even if points are 0, it was a correct guess!)
    const history: PlayerHistoryEntry = {
      guesserId: guess.guesserId,
      score: points,
      order: this.correctGuesses[guess.targetId].length + 1,
    };
    this.correctGuesses[guess.targetId].push(history);

    // Add points immediately to guesser (or could wait till end, but method return implies immediate feedback)
    this.scores[guess.guesserId] = (this.scores[guess.guesserId] || 0) + points;

    return points;
  }

  public calculateFinalScores(): Record<PlayerId, number> {
    const finalScores: Record<PlayerId, number> = { ...this.scores };

    // Skip penalty for 2-player mode to make guessing rewarding
    if (this.players.length === 2) {
      return finalScores;
    }

    this.players.forEach((p) => {
      const remainingCards = this.scoreCards[p];
      const penalty = remainingCards.reduce((sum, val) => sum + val, 0);

      // Drawer receives penalty for remaining cards
      finalScores[p] = (finalScores[p] || 0) - penalty;
    });

    return finalScores;
  }

  public isRoundComplete(): boolean {
    const totalPlayers = this.players.length;
    if (totalPlayers < 2) return false;

    for (const player of this.players) {
      const guesses = this.activeGuesses[player];
      if (!guesses || guesses.size < totalPlayers - 1) {
        return false;
      }
    }
    return true;
  }
}
