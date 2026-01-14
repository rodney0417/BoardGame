import { vi, describe, it, expect, beforeEach } from 'vitest';
import Pictomania from '../../src/games/pictomania';
import { Room } from '../../src/types';
import { PictomaniaRound } from '../../src/games/pictomania/domain';

describe('Pictomania Game Logic', () => {
  let room: Room;
  let io: any;
  let socket: any;

  beforeEach(() => {
    // Mock IO and Socket
    io = {
      to: vi.fn().mockReturnValue({
        emit: vi.fn(),
      }),
    };

    // Setup a mock room with 3 players
    room = {
      id: 'test-room',
      gameType: 'pictomania',
      phase: 'playing',
      timeLeft: 60,
      settings: { drawTime: 60, totalRounds: 5 },
      players: [
        {
          id: 'p1',
          username: 'Player1',
          score: 0,
          isDoneDrawing: false,
        } as any,
        {
          id: 'p2',
          username: 'Player2',
          score: 0,
          isDoneDrawing: false,
        } as any,
        {
          id: 'p3',
          username: 'Player3',
          score: 0,
          isDoneDrawing: false,
        } as any,
      ],
      gameState: {
        currentRound: 1,
        wordCards: {},
        history: [],
      },
      lastActivity: Date.now(),
    };

    // Initialize players (add Pictomania specific fields)
    room.players.forEach((p) => {
      const initData = Pictomania.initPlayer(p);
      Object.assign(p, initData);
      // Mock cards for testing
      (p as any).symbolCard = 'star';
      (p as any).numberCard = 1;
      (p as any).targetWord = 'Apple';
    });

    // Initialize Domain Model (Simulate what startRound does)
    (room as any).roundModel = new PictomaniaRound(room.players.map((p) => p.id));
  });

  describe('Initialization & Game Start', () => {
    it('should initialize player correctly', () => {
      const player: any = {};
      const initData = Pictomania.initPlayer(player);

      expect(initData).toHaveProperty('score', 0);
      expect(initData).toHaveProperty('isDoneDrawing', false);
      expect(initData).toHaveProperty('symbolCard', '');
      expect(initData).toHaveProperty('numberCard', -1);
      expect(initData).toHaveProperty('targetWord', null);
      expect(initData).toHaveProperty('myGuesses', []);
    });

    it('should start game correctly', () => {
      // Reset room validation for start game
      room.phase = 'waiting';
      room.players = [
        { id: 'p1', username: 'Player1' } as any,
        { id: 'p2', username: 'Player2' } as any,
      ];
      // Re-init logic which usually happens outside handlers in real app, but here we test the handler
      room.players.forEach((p) => Object.assign(p, Pictomania.initPlayer(p)));

      const success = Pictomania.handlers['start_game'](io, room, { id: 'p1' } as any, {});

      expect(success).toBe(true);
      expect(room.phase).toBe('playing');
      expect(room.gameState.currentRound).toBe(1);
      expect(room.players[0]).toHaveProperty('symbolCard'); // Should be assigned
      expect(room.players[0].symbolCard).not.toBe('');
      expect((room as any).roundModel).toBeDefined(); // Verify domain model created
    });
  });

  describe('Game Settings', () => {
    it('should update settings and broadcast changes', () => {
      room.phase = 'waiting';
      // Initial settings are diff:1, drawTime:60 (from mock) - wait mock says settings in beforeEach?
      // Check beforeEach: settings: { drawTime: 60, totalRounds: 5 }. difficulty missing.
      // Let's ensure initial state.
      room.settings = { difficulty: 1, drawTime: 60, totalRounds: 3 };

      socket = { id: 'p1', emit: vi.fn() }; // p1 is host
      const data = { difficulty: 2, drawTime: 90 };

      const result = Pictomania.handlers['update_settings'](io, room, socket, data);

      expect(result).toBe(true); // Should trigger broadcast
      expect(room.settings.difficulty).toBe(2);
      expect(room.settings.drawTime).toBe(90);
    });

    it('should NOT update settings if game is playing', () => {
      room.phase = 'playing';
      room.settings = { difficulty: 1, drawTime: 60, totalRounds: 3 };
      
      socket = { id: 'p1', emit: vi.fn() };
      const data = { difficulty: 3 };

      const result = Pictomania.handlers['update_settings'](io, room, socket, data);

      expect(result).toBe(false); // No broadcast
      expect(room.settings.difficulty).toBe(1); // Unchanged
    });
  });

  describe('Difficulty Selection', () => {
    it('should set difficulty from start_game data when valid', () => {
      room.phase = 'waiting';
      room.settings.difficulty = 1; // Default
      room.players = [
        { id: 'p1', username: 'Player1' } as any,
        { id: 'p2', username: 'Player2' } as any,
      ];
      room.players.forEach((p) => Object.assign(p, Pictomania.initPlayer(p)));

      // Assuming Level 3 exists in words.csv
      const success = Pictomania.handlers['start_game'](io, room, { id: 'p1' } as any, {
        difficulty: 3,
      });

      expect(success).toBe(true);
      expect(room.settings.difficulty).toBe(3);
    });

    it('should ignore invalid difficulty levels', () => {
      room.phase = 'waiting';
      room.settings.difficulty = 1;
      room.players = [
        { id: 'p1', username: 'Player1' } as any,
        { id: 'p2', username: 'Player2' } as any,
      ];
      room.players.forEach((p) => Object.assign(p, Pictomania.initPlayer(p)));

      const success = Pictomania.handlers['start_game'](
        io,
        room,
        { id: 'p1' } as any,
        { difficulty: 99 }, // Invalid
      );

      expect(success).toBe(true); // Game starts
      expect(room.settings.difficulty).toBe(1); // Ignores 99, keeps 1
    });
  });

  describe('Round Management', () => {
    it('should start a new round correctly', () => {
      room.players.forEach((p) => {
        (p as any).isDoneDrawing = true;
        (p as any).isDoneGuessing = true;
      });

      Pictomania.startRound(room);

      expect(room.phase).toBe('playing');
      expect(room.timeLeft).toBe(60);
      expect((room as any).roundModel).toBeDefined(); // Verify domain model recreated

      room.players.forEach((p) => {
        expect((p as any).isDoneDrawing).toBe(false);
        expect((p as any).isDoneGuessing).toBe(false);
        expect((p as any).guessedCorrectlyBy).toEqual([]);
        expect((p as any).myGuesses).toEqual([]);
      });
    });

    // ... (Previous Tests Omitted for brevity, assumed unchanged logic flow needs no update if handled by handlers which use roundModel) ...
    // Actually, "Drawing & Guessing Flow" tests rely on handlers working. Handlers use roundModel.
    // If we updated beforeEach, they should work.
  });

  // ... Drawing & Guessing Flow ...
  it('should NOT reveal guess result immediately', () => {
    // Setup P1 guessing P2 correctly
    (room.players[0] as any).isDoneDrawing = true;
    socket = { id: 'p1', emit: vi.fn() };

    // P2 has star/1
    (room.players[1] as any).symbolCard = 'star';
    (room.players[1] as any).numberCard = 1;

    const data = {
      guesserId: 'p1',
      targetPlayerId: 'p2',
      symbol: 'star',
      number: 1,
    };

    Pictomania.handlers['guess_word'](io, room, socket, data);

    // User request: "Don't publish right/wrong".
    // We also removed the "Recorded" toast as UI button update is sufficient.
    // So we verify NO toast is emitted.

    expect(socket.emit).not.toHaveBeenCalledWith('toast', expect.any(Object));

    expect(socket.emit).not.toHaveBeenCalledWith(
      'toast',
      expect.objectContaining({
        message: expect.stringMatching(/答對|答錯|正確|錯誤/),
      }),
    );
  });

  it('should Auto-Finish round when last player completes guessing', () => {
    // Setup: 3 Players. P1 Drawing. P2, P3 Guessing.
    // P1 is done drawing.
    (room.players[0] as any).isDoneDrawing = true;
    (room.players[0] as any).isDoneGuessing = true; // P1 doesn't guess

    // P2 has finished guessing
    (room.players[1] as any).isDoneGuessing = true;
    (room.players[1] as any).myGuesses = [
      { targetPlayerId: 'p3', symbol: 'star', number: 1 }, // Dummy
    ];

    // P3 is the last one. Has guessed P1. Needs to guess P2.
    (room.players[2] as any).isDoneDrawing = true; // Fix: P3 must be done drawing to guess!
    (room.players[2] as any).isDoneGuessing = false;
    (room.players[2] as any).myGuesses = [{ targetPlayerId: 'p1', symbol: 'circle', number: 2 }];

    // Ensure room phase is playing
    room.phase = 'playing';

    // P3 guesses P2 (The last required guess)
    socket = { id: 'p3', emit: vi.fn() };
    const data = {
      guesserId: 'p3',
      targetPlayerId: 'p2',
      symbol: 'square',
      number: 3,
    };

    Pictomania.handlers['guess_word'](io, room, socket, data);

    // Expectation:
    // 1. P3 is marked as done guessing
    expect((room.players[2] as any).isDoneGuessing).toBe(true);
    // 2. Round should end because everyone is done (P1 drawing, P2 done, P3 done)
    expect(room.phase).toBe('round_ended');
  });

  it("should reject guess if player hasn't finished drawing", () => {
    (room.players[0] as any).isDoneDrawing = false;
    socket = { id: 'p1', emit: vi.fn() };

    const data = { guesserId: 'p1', targetPlayerId: 'p2', symbol: 'star', number: 1 };
    const result = Pictomania.handlers['guess_word'](io, room, socket, data);

    expect(result).toBe(false);
    expect(socket.emit).toHaveBeenCalledWith('toast', expect.objectContaining({ type: 'error' }));
  });

  it('should reject duplicate number usage (Domain Logic Check)', () => {
    (room.players[0] as any).isDoneDrawing = true;
    const model = (room as any).roundModel as PictomaniaRound;

    // P1 already used number '1' for P2
    model.setGuess('p1', 'p2', 1);
    (room.players[0] as any).myGuesses = [{ targetPlayerId: 'p2', symbol: 'star', number: 1 }];

    socket = { id: 'p1', emit: vi.fn() };
    // Try to use number '1' for P3
    const data = { guesserId: 'p1', targetPlayerId: 'p3', symbol: 'circle', number: 1 };

    const result = Pictomania.handlers['guess_word'](io, room, socket, data);

    expect(result).toBe(false);
    // Should emit error toast from catch block
    expect(socket.emit).toHaveBeenCalledWith('toast', expect.objectContaining({ type: 'error' }));
  });

  it('should prevent self-guessing', () => {
    (room.players[0] as any).isDoneDrawing = true;
    socket = { id: 'p1', emit: vi.fn() };

    // P1 tries to guess P1
    const data = { guesserId: 'p1', targetPlayerId: 'p1', symbol: 'star', number: 1 };
    // The handler usually filters `targetPlayer && guesser`. If target checks `p.id === targetId`.
    // Is there explicit check? setGuess in domain model throws if guesser==target?
    // Let's rely on setGuess throwing or handler check.
    // Actually domain.ts throws "Cannot guess yourself".

    const result = Pictomania.handlers['guess_word'](io, room, socket, data);

    expect(result).toBe(false);
    expect(socket.emit).toHaveBeenCalledWith('toast', expect.objectContaining({ type: 'error' }));
  });

  describe('Scoring Logic', () => {
    it('should calculate scores correctly', () => {
      // Scenario with 3 Players: Cards [2, 1, 1] per person (based on default logic in domain.ts for 3 players?)
      // Let's check domain logic: switch(3) -> return [2, 1, 1];

      // P1 guesses P2 correctly (First) -> Gets 2 points. P2 remaining: [1, 1] (penalty -2)
      // P2 guesses P3 correctly (Second) -> Gets 2 points. P3 remaining: [1, 1] (penalty -2)
      // P3 guesses P1 incorrectly -> Gets 0. P1 remaining: [2, 1, 1] (penalty -4)

      // Initial Scores: 0

      room.players.forEach((p) => {
        p.score = 0;
        p.isDoneDrawing = true;
        (p as any).isDoneGuessing = true;
        (p as any).guessedCorrectlyBy = []; // Reset
      });

      // Mock data setup
      (room.players[0] as any).symbolCard = 'star';
      (room.players[0] as any).numberCard = 1;
      (room.players[1] as any).symbolCard = 'star';
      (room.players[1] as any).numberCard = 2;
      (room.players[2] as any).symbolCard = 'star';
      (room.players[2] as any).numberCard = 3;

      // Populate Domain Model State AND Frontend State (synced)
      const model = (room as any).roundModel as PictomaniaRound;

      // P1 guesses P2 (Correct), P3 (Correct)
      model.setGuess('p1', 'p2', 2);
      model.setGuess('p1', 'p3', 3);
      (room.players[0] as any).myGuesses = [
        { targetPlayerId: 'p2', symbol: 'star', number: 2, time: 100 },
        { targetPlayerId: 'p3', symbol: 'star', number: 3, time: 150 },
      ];

      // P2 guesses P3 (Correct), P1 (Wrong)
      model.setGuess('p2', 'p3', 3);
      model.setGuess('p2', 'p1', 9);
      (room.players[1] as any).myGuesses = [
        { targetPlayerId: 'p3', symbol: 'star', number: 3, time: 200 },
        { targetPlayerId: 'p1', symbol: 'star', number: 9, time: 250 },
      ];

      // P3 guesses P1 (Wrong), P2 (Wrong)
      model.setGuess('p3', 'p1', 7);
      model.setGuess('p3', 'p2', 6);
      (room.players[2] as any).myGuesses = [
        { targetPlayerId: 'p1', symbol: 'star', number: 7, time: 300 },
        { targetPlayerId: 'p2', symbol: 'star', number: 6, time: 350 },
      ];

      // Trigger calculation
      (room.players[2] as any).isDoneGuessing = false;
      socket = { id: 'p3', emit: vi.fn() };
      Pictomania.handlers['player_finish_guessing'](io, room, socket, {});

      expect(room.phase).toBe('round_ended');

      // Score Calculation (3 Players -> Cards [2, 1])
      // ----------------------------------------------------------------
      // Target P2:
      // - P1 guesses (Correct) -> Takes 2. Remaining [1].
      // - P3 guesses (Wrong) -> Takes 0.
      // - P2 Penalty: Sum([1]) = 1.
      //
      // Target P3:
      // - P1 guesses (Correct) -> Takes 2. Remaining [1].
      // - P2 guesses (Correct) -> Takes 1. Remaining [].
      // - P3 Penalty: Sum([]) = 0.
      //
      // Target P1:
      // - P2 guesses (Wrong) -> Takes 0.
      // - P3 guesses (Wrong) -> Takes 0.
      // - P1 Penalty: Sum([2, 1]) = 3.

      // Final Scores:
      // P1: +2(from P2) +2(from P3) - 3(Penalty) = 1
      // P2: +1(from P3) - 1(Penalty) = 0
      // P3: 0 - 0(Penalty) = 0

      expect(room.players[0].score).toBe(1);
      expect(room.players[1].score).toBe(0);
      expect(room.players[2].score).toBe(0);
    });
  });

  describe('Image Handling', () => {
    it('should save image to history with player color', () => {
      socket = { id: 'p1', emit: vi.fn() };
      const imageBase64 = 'data:image/png;base64,test';
      // Mock player color
      (room.players[0] as any).color = '#FF0000';

      Pictomania.handlers['upload_image'](io, room, socket, { imageBase64 });

      expect(room.gameState.history).toHaveLength(1);
      expect(room.gameState.history[0]).toEqual({
        round: 1,
        playerId: 'p1',
        playerName: 'Player1',
        playerColor: '#FF0000', // Expect color to be saved
        word: 'Apple',
        imageBase64: imageBase64,
      });
    });

    it('should ignore duplicate uploads for same round', () => {
      socket = { id: 'p1', emit: vi.fn() };
      const imageBase64 = 'data:image/png;base64,test';

      Pictomania.handlers['upload_image'](io, room, socket, { imageBase64 });
      Pictomania.handlers['upload_image'](io, room, socket, { imageBase64 }); // Duplicate

      expect(room.gameState.history).toHaveLength(1);
    });
  });

  describe('Reconnect Handling', () => {
    it('should migrate round model data on reconnect', () => {
      // Setup: P1 has guesses and score
      (room.players[0] as any).isDoneDrawing = true;
      (room.players[1] as any).isDoneDrawing = true;
      const model = (room as any).roundModel as PictomaniaRound;

      // P1 guesses P2
      model.setGuess('p1', 'p2', 2);

      // Execute Reconnect: P1 -> P1_NEW
      Pictomania.onPlayerReconnect!(io, room, 'p1', 'p1_new', socket);

      // Check Model State:
      // P1_NEW should have the guess
      const guess = model.getGuess('p1_new', 'p2');
      expect(guess).toBe(2);

      // P1 should be gone from active guesses
      const oldGuess = model.getGuess('p1', 'p2');
      expect(oldGuess).toBeUndefined();
    });

    it('should migrate history data on reconnect', () => {
      // Setup: P1 uploaded image
      const historyEntry = {
        round: 1,
        playerId: 'p1',
        playerName: 'Player1',
        playerColor: '#FF0000',
        word: 'Apple',
        imageBase64: 'data...',
        guessedBy: [{ guesserId: 'p2', score: 2, order: 1 }],
      };
      room.gameState.history = [historyEntry];

      // Execute Reconnect: P1 -> P1_NEW (Target) AND P2 -> P2_NEW (Guesser)
      Pictomania.onPlayerReconnect!(io, room, 'p1', 'p1_new', socket);
      Pictomania.onPlayerReconnect!(io, room, 'p2', 'p2_new', socket);

      // Verify History updated
      expect(room.gameState.history[0].playerId).toBe('p1_new');
      expect((room.gameState.history[0] as any).guessedBy[0].guesserId).toBe('p2_new');
    });
  });
});
