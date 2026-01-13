import fs from "fs";
import path from "path";
import { GameModule, Player, Room } from "../../types";
import { Server, Socket } from "socket.io";
import { PictomaniaHistoryRecord } from "../../../../shared/types";
import { PictomaniaRound } from "./domain";

// 定義 Pictomania 專屬的設定與狀態介面
interface PictomaniaSettings {
  drawTime: number;
  totalRounds: number;
  difficulty: number;
}

interface PictomaniaState {
  wordCards: Record<string, string[]>;
  currentRound: number;
  history: PictomaniaHistoryRecord[];
}

// 擴充 Player 以包含 Pictomania 專屬欄位
interface PictomaniaPlayer extends Player {
  symbolCard: string;
  numberCard: number;
  targetWord: string | null;
  guessedCorrectlyBy: string[];
  isDoneGuessing: boolean;
  myGuesses: {
    targetPlayerId: string;
    symbol: string;
    number: number;
    time: number;
  }[];
}

interface WordCardData {
  id: number;
  level: number;
  contents: string[];
}

function loadWords(): {
  wordCardsByLevel: Record<number, WordCardData[]>;
  allWordCards: WordCardData[];
} {
  const filePath = path.join(__dirname, "words.csv");
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const lines = data.split("\n");
    const wordCardsByLevel: Record<number, WordCardData[]> = {};
    const allWordCards: WordCardData[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simplified Parse: level,"contents"
      const parts = line.match(/(\d+),"(.*)"/);

      if (parts) {
        const level = parseInt(parts[1]);
        const contentStr = parts[2];
        const contents = contentStr.split(";").map((w) => w.trim());

        const card = { id: i + 1, level, contents };
        if (!wordCardsByLevel[level]) {
          wordCardsByLevel[level] = [];
        }
        wordCardsByLevel[level].push(card);
        allWordCards.push(card);
      }
    }
    return { wordCardsByLevel, allWordCards };
  } catch (e) {
    console.error("Failed to load words:", e);
    return { wordCardsByLevel: {}, allWordCards: [] };
  }
}

// Global cache
const { wordCardsByLevel } = loadWords();

const checkAndFinishRound = (
  io: Server,
  room: Room<PictomaniaState, PictomaniaSettings>
) => {
  // Prevent double execution
  if (room.phase !== "playing") {
    console.warn(
      `[Pictomania] checkAndFinishRound called but phase is ${room.phase}. Ignoring.`
    );
    return;
  }

  // Domain Model Logic Check
  const roundModel = (room as any).roundModel as PictomaniaRound;

  // Fallback if model missing
  if (!roundModel) {
    console.error("Round Model not found!");
    return;
  }

  // Check if ALL players are done guessing (or disconnected)
  const allDone = room.players.every(
    (p) => (p as any).isDoneGuessing || p.disconnected
  );
  if (!allDone) {
    return;
  }

  // 所有人都猜完了，公佈答案並結算
  const allGuesses: {
    guesserId: string;
    targetPlayerId: string;
    symbol: string;
    number: number;
    time: number;
  }[] = [];
  room.players.forEach((p) => {
    const gp = p as PictomaniaPlayer;
    if (gp.myGuesses) {
      gp.myGuesses.forEach((g) => {
        allGuesses.push({ ...g, guesserId: gp.id });
      });
    }
  });

  // 按時間排序
  allGuesses.sort((a, b) => a.time - b.time);

  if (roundModel) {
    allGuesses.forEach((g) => {
      const target = room.players.find(
        (p) => p.id === g.targetPlayerId
      ) as PictomaniaPlayer;
      if (target) {
        const isSymbolMatch = target.symbolCard === g.symbol;
        const isNumberMatch = Number(target.numberCard) === Number(g.number);
        const isCorrect = isSymbolMatch && isNumberMatch;

        roundModel.processGuess({
          guesserId: g.guesserId,
          targetId: g.targetPlayerId,
          isCorrect,
          time: g.time,
        });
      }
    });

    const finalScores = roundModel.calculateFinalScores();

    room.players.forEach((p) => {
      if (finalScores[p.id] !== undefined) {
        p.score += finalScores[p.id];
      }
    });

    // Update History with new domain data
    room.players.forEach((p) => {
      const history = roundModel.getSearchHistory(p.id);

      // Sync to player object for Frontend "Correct/Wrong" Badge
      const gp = p as PictomaniaPlayer;
      gp.guessedCorrectlyBy = history.map((h) => h.guesserId);

      const validHistoryEntry = room.gameState.history.find(
        (h) => h.round === room.gameState.currentRound && h.playerId === p.id
      );
      if (validHistoryEntry) {
        (validHistoryEntry as any).guessedBy = history;
      }
    });
  } else {
    console.error("Round Model not found!");
  }

  if (room.gameState.currentRound >= room.settings.totalRounds) {
    room.phase = "game_over";
  } else {
    room.phase = "round_ended";
  }
  io.to(room.id).emit("room_data", room);
  io.to(room.id).emit("toast", {
    type: "info",
    message: `第 ${room.gameState.currentRound} 回合結束！公佈答案中...`,
  });
  io.to(room.id).emit("request_round_images", {
    round: room.gameState.currentRound,
  });
};

const Pictomania: GameModule<PictomaniaState, PictomaniaSettings> = {
  id: "pictomania",
  name: "妙筆神猜",
  icon: "🎨",
  maxPlayers: 6,
  defaultSettings: {
    drawTime: 60,
    totalRounds: 5,
    difficulty: 1, // Default to Level 1
  },

  initPlayer: (player: Partial<Player>) => {
    return {
      score: 0,
      isDoneDrawing: false,
      symbolCard: "",
      numberCard: -1,
      targetWord: null,
      guessedCorrectlyBy: [] as string[],
      isDoneGuessing: false,
      myGuesses: [],
    } as any;
  },

  onStartGame: (room) => {
    room.settings.totalRounds = 5;
    room.gameState = {
      wordCards: {},
      currentRound: 1,
      history: [],
    };
    Pictomania.startRound?.(room);
  },

  onPlayerReconnect: (io, room, oldId, newId, socket) => {
    // 1. Update Domain Model
    const roundModel = (room as any).roundModel as PictomaniaRound;
    if (roundModel) {
      roundModel.updatePlayerId(oldId, newId);
    }

    // 2. Update History
    if (room.gameState && room.gameState.history) {
      room.gameState.history.forEach((h) => {
        if (h.playerId === oldId) h.playerId = newId;

        const entry = h as any; // Cast to access dynamic prop
        if (entry.guessedBy) {
          entry.guessedBy.forEach((g: any) => {
            if (g.guesserId === oldId) g.guesserId = newId;
          });
        }
      });
    }
  },

  startRound: (room: Room<PictomaniaState, PictomaniaSettings>) => {
    room.phase = "playing";
    room.timeLeft = room.settings.drawTime;

    console.log(
      `[Pictomania] Starting round ${room.gameState.currentRound}. Players:`,
      room.players.map((p) => ({ id: p.id, username: p.username }))
    );

    // Initialize Domain Model for this round
    // Initialize Domain Model for this round
    const playerIds = room.players.map((p) => p.id);
    // Attach domain model to room directly
    (room as any).roundModel = new PictomaniaRound(playerIds);

    // 1. Select Word Cards based on Difficulty Level
    const level = room.settings.difficulty || 1;
    const availableCards = wordCardsByLevel[level] || wordCardsByLevel[1] || [];

    // We need 6 cards for the 6 symbols (star, triangle, square, circle, cloud, moon)
    const symbols = ["star", "triangle", "square", "circle", "cloud", "moon"];

    // Fisher-Yates Shuffle for selecting random cards
    const shuffle = <T>(array: T[]): T[] => {
      const newArr = [...array];
      for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
      }
      return newArr;
    };

    const activeSymbols = symbols.slice(
      0,
      Math.min(symbols.length, availableCards.length)
    );

    // Randomly pick 'activeSymbols.length' cards from availableCards and map to symbols
    const shuffledCards = shuffle([...availableCards]).slice(
      0,
      activeSymbols.length
    );
    const roundWordCards: Record<string, string[]> = {};
    activeSymbols.forEach((sym, idx) => {
      roundWordCards[sym] = shuffledCards[idx].contents;
    });

    // Save this round's word mapping to gameState so frontend can see
    room.gameState.wordCards = roundWordCards;

    // 2. Distribute Secret Targets using Domain Model Logic (DDD)
    const roundModel = (room as any).roundModel as PictomaniaRound;
    const assignments = roundModel.setupRound(activeSymbols);

    console.log(`[Pictomania] Assignments generated:`, assignments);

    room.players.forEach((p) => {
      const player = p as PictomaniaPlayer;
      const assignment = assignments[player.id];

      if (assignment) {
        player.symbolCard = assignment.symbol;
        player.numberCard = assignment.number;

        if (roundWordCards[player.symbolCard]) {
          player.targetWord =
            roundWordCards[player.symbolCard][player.numberCard - 1];
        } else {
          player.targetWord = "未知";
        }
      } else {
        console.error(`No assignment found for player ${player.id}`);
        player.targetWord = "錯誤";
      }

      // Reset State
      player.isDoneDrawing = false;
      player.isDoneGuessing = false;
      player.guessedCorrectlyBy = [];
      player.myGuesses = [];
    });
  },

  onTimeout: (io, room) => {
    if (room.phase !== "playing") return true;
    room.players.forEach((p) => (p.isDoneDrawing = true));
    io.to(room.id).emit("toast", {
      type: "info",
      message: `⏰ 時間到！請把握時間猜題，所有人都猜完後將結束回合。`,
    });
    return true;
  },

  handlers: {
    start_game: (
      io: Server,
      room: Room<PictomaniaState, PictomaniaSettings>,
      socket: Socket,
      data: any
    ) => {
      if (room.phase === "waiting" || room.phase === "game_over") {
        if (room.players.length < 2) {
          socket.emit("toast", {
            type: "error",
            message: "❌ 至少需要 2 人才能開始遊戲",
          });
          return false;
        }

        const { difficulty } = data || {};
        const availableLevels = Object.keys(wordCardsByLevel).map(Number);
        if (difficulty && availableLevels.includes(difficulty)) {
          room.settings.difficulty = difficulty;
        }

        if (Pictomania.onStartGame) Pictomania.onStartGame(room);
        io.to(room.id).emit("game_started", {
          cards: room.gameState.wordCards,
        });
      } else if (room.phase === "round_ended") {
        if (room.gameState.currentRound < room.settings.totalRounds) {
          room.gameState.currentRound++;
          if (Pictomania.startRound) Pictomania.startRound(room);
          io.to(room.id).emit("game_started", {
            cards: room.gameState.wordCards,
          });
        } else {
          room.phase = "game_over";
          io.to(room.id).emit("room_data", room);
        }
      }
      return true;
    },

    next_round: (io, room, socket, data) => {
      // logic moved to start_game or handled here by passing data
      return Pictomania.handlers["start_game"](io, room, socket, data);
    },

    player_finish_drawing: (io, room, socket, data) => {
      const player = room.players.find((p) => p.id === socket.id);
      if (player) {
        player.isDoneDrawing = true;
        const allDone = room.players.every((p) => p.isDoneDrawing);
        if (allDone) {
          io.to(room.id).emit("toast", {
            type: "info",
            message: "🎨 所有人都畫完了，請把握時間猜題！",
          });
        }
      }
      return true;
    },

    player_finish_guessing: (io, room, socket, data) => {
      const player = room.players.find(
        (p) => p.id === socket.id
      ) as PictomaniaPlayer;
      if (player) {
        player.isDoneGuessing = true;
        checkAndFinishRound(io, room);
      }
      return true;
    },

    guess_word: (io, room, socket, data) => {
      if (room.phase !== "playing") return false;

      const { guesserId, targetPlayerId, symbol, number } = data;
      const targetPlayer = room.players.find(
        (p) => p.id === targetPlayerId
      ) as PictomaniaPlayer;
      const guesser = room.players.find(
        (p) => p.id === guesserId
      ) as PictomaniaPlayer;

      if (targetPlayer && guesser) {
        if (!guesser.isDoneDrawing) {
          socket.emit("toast", {
            type: "error",
            message: "⚠️ 您必須先點擊「畫好了」才能開始猜題！",
          });
          return false;
        }

        if (guesser.isDoneGuessing) {
          socket.emit("toast", {
            type: "error",
            message: "⚠️ 您已經結束猜題，無法再猜！",
          });
          return false;
        }

        // Domain Model Validation (Number Constraint)
        const roundModel = (room as any).roundModel as PictomaniaRound;
        if (roundModel) {
          try {
            // setGuess now handles updating existing guesses too (if logic allows)
            // We verified in domain.test that setGuess updates if same target.
            roundModel.setGuess(guesserId, targetPlayerId, number);
          } catch (e: any) {
            socket.emit("toast", { type: "error", message: `⚠️ ${e.message}` });
            return false;
          }
        }

        // Update local state for frontend display (showing "Selected" but not correctness)
        // Access by index to ensure reference update
        const pIndex = room.players.findIndex((p) => p.id === guesserId);
        if (pIndex !== -1) {
          const p = room.players[pIndex] as PictomaniaPlayer;
          p.myGuesses = (p.myGuesses || []).filter(
            (g) => g.targetPlayerId !== targetPlayerId
          );
          p.myGuesses.push({
            targetPlayerId,
            symbol,
            number,
            time: Date.now(),
          });
        }

        // Auto-Finish Guessing Check: If player has guessed ALL other players
        const uniqueTargets = new Set(
          guesser.myGuesses.map((g) => g.targetPlayerId)
        );
        // Count active players (exclude self)
        const totalTargets =
          room.players.filter((p) => !p.disconnected).length - 1;

        if (uniqueTargets.size >= totalTargets && totalTargets > 0) {
          guesser.isDoneGuessing = true;
          checkAndFinishRound(io, room);
        }

        // DELAYED FEEDBACK: Do not reveal if correct/incorrect.
      }
      return true;
    },

    upload_image: (io, room, socket, data) => {
      const { imageBase64 } = data;
      const player = room.players.find(
        (p) => p.id === socket.id
      ) as PictomaniaPlayer;

      if (player && room.gameState.history) {
        const exists = room.gameState.history.some(
          (r) =>
            r.round === room.gameState.currentRound && r.playerId === player.id
        );
        if (!exists) {
          room.gameState.history.push({
            round: room.gameState.currentRound,
            playerId: player.id,
            playerName: player.username,
            playerColor: player.color,
            word: player.targetWord || "未知",
            imageBase64: imageBase64,
          });
          io.to(room.id).emit("update_canvas", {
            playerId: player.id,
            imageBase64,
          });
          console.log(
            `[Pictomania] 收到 ${player.username} 第 ${room.gameState.currentRound} 回合的畫作並廣播`
          );
        }
      }
      return false;
    },
  },
};

// @ts-ignore
Pictomania.startRound = Pictomania.startRound;

export default Pictomania;
