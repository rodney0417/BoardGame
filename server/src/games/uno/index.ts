import { Server, Socket } from 'socket.io';
import { GameModule, Room, Player } from '../../types';
import { UnoRound, UnoCard, CardColor } from './domain';

export interface UnoState {
  roundModel: UnoRound | null;
}

export interface UnoSettings {
  startingCards: number;
}

export interface UnoPlayer extends Player {
  hand: UnoCard[];
  isUno: boolean;
}

const Uno: GameModule<UnoState, UnoSettings> = {
  id: 'uno',
  name: 'UNO',
  icon: '🎴',
  maxPlayers: 6,
  defaultSettings: {
    startingCards: 7,
  },

  initPlayer: (player: Partial<Player>) => {
    return {
      score: 0,
      hand: [],
      isUno: false,
    } as any;
  },

  handlers: {
    play_card: (io, room, socket, data) => {
      const { card, chosenColor } = data;
      const roundModel = room.gameState.roundModel;

      if (!roundModel) return false;
      if (room.phase !== 'playing') return false;

      const playerId = socket.id;
      const success = roundModel.playCard(playerId, card, chosenColor);

      if (success) {
        syncState(io, room);

        // [UX] Special toast for 2-player Reverse rule
        if (room.players.length === 2 && card.value === 'reverse') {
          io.to(room.id).emit('toast', {
            type: 'info',
            message: '⚠️ 2人遊戲規則：反轉卡等同禁止卡，請再出一張！',
          });
        }

        const winner = roundModel.getWinner();
        if (winner) {
          const winnerPlayer = room.players.find((p) => p.id === winner);

          // Calculate round score (sum of other players' hands)
          let roundPoints = 0;
          room.players.forEach((p) => {
            if (p.id !== winner) {
              const pScore = roundModel.calculateHandScore(p.id);
              console.log(`[Score] Player ${p.username} hand score: ${pScore}`);
              roundPoints += pScore;
            }
          });

          console.log(
            `[Score] Round Winner: ${winnerPlayer?.username}, Added Points: ${roundPoints}`,
          );

          // Update total score
          if (winnerPlayer) {
            (winnerPlayer as any).score += roundPoints;
            console.log(`[Score] Winner Total Score: ${(winnerPlayer as any).score}`);
          }

          // Check for Game Winner (First to 500)
          if (winnerPlayer && (winnerPlayer as any).score >= 500) {
            room.phase = 'game_over';
            io.to(room.id).emit('toast', {
              type: 'success',
              message: `🏆 恭喜 ${winnerPlayer.username} 達成 ${(winnerPlayer as any).score} 分，獲得最終勝利！`,
            });
          } else {
            // Round Over - Go back to waiting to start next round
            room.phase = 'waiting';
            io.to(room.id).emit('toast', {
              type: 'success',
              message: `🎉 ${winnerPlayer?.username} 贏得本局！獲得 ${roundPoints} 分 (總分: ${(winnerPlayer as any).score})`,
            });

            // Clear round model to prevent further actions until restart
            room.gameState.roundModel = null;

            // Sync state to update scores and phase
            syncState(io, room);
            return true;
          }
        }
        return true; // Trigger broadcastRoomData
      }

      return false;
    },

    draw_card: (io, room, socket, data) => {
      const roundModel = room.gameState.roundModel;
      if (!roundModel) return false;
      if (room.phase !== 'playing') return false;

      const playerId = socket.id;
      const card = roundModel.drawCard(playerId);

      if (card) {
        // Check if the DRAWN card is playable (Official Rule: play that card or pass)
        const canPlay = roundModel.isPlayable(card);

        if (!canPlay) {
          roundModel.pass(playerId);
          io.to(room.id).emit('toast', { type: 'info', message: '無牌可出，自動換下一位' });
        }

        syncState(io, room);
        // Send private hand update to player
        socket.emit('hand_update', { hand: roundModel.getHand(playerId) });
        return true; // Trigger broadcastRoomData
      }

      return false;
    },

    pass_turn: (io, room, socket, data) => {
      const roundModel = room.gameState.roundModel;
      if (!roundModel) return false;

      const success = roundModel.pass(socket.id);
      if (success) {
        syncState(io, room);
        return true; // Trigger broadcastRoomData
      }

      return false;
    },

    call_uno: (io, room, socket, data) => {
      const roundModel = room.gameState.roundModel;
      if (!roundModel) return false;

      console.log(`[UNO] Player ${socket.id} called UNO`);
      roundModel.callUno(socket.id);
      const player = room.players.find((p) => p.id === socket.id);

      // Emit visual effect event
      io.to(room.id).emit('uno_shouted', { playerId: socket.id, username: player?.username });

      // Toast removed as per user request (redundant with visual effect)

      syncState(io, room); // This updates p.isUno
      return true;
    },

    challenge_uno: (io, room, socket, data) => {
      const { targetId } = data;
      const roundModel = room.gameState.roundModel;
      if (!roundModel) return false;

      const success = roundModel.challengeUno(socket.id, targetId);

      if (success) {
        const challenger = room.players.find((p) => p.id === socket.id);
        const target = room.players.find((p) => p.id === targetId);

        io.to(room.id).emit('toast', {
          type: 'warning',
          message: `⚠️ ${challenger?.username} 挑戰成功！${target?.username} 必須抽 2 張牌！`,
        });

        syncState(io, room);
        return true; // Trigger broadcastRoomData
      }

      return false;
    },

    get_hand: (io, room, socket, data) => {
      const roundModel = room.gameState.roundModel;
      if (!roundModel) return false;

      socket.emit('hand_update', { hand: roundModel.getHand(socket.id) });
      return false;
    },

    start_game: (io, room, socket, data) => {
      // Only host can start
      if (socket.id !== room.players[0].id) return false;

      if (room.phase === 'playing') return false;

      if (room.players.length < 2) {
        io.to(socket.id).emit('toast', { type: 'error', message: '❌ 至少需要 2 人才能開始遊戲' });
        return false;
      }

      // Initialize game state
      room.gameState = { roundModel: null };

      // Start round
      const playerIds = room.players.map((p) => p.id);
      const roundModel = new UnoRound(playerIds);
      room.gameState.roundModel = roundModel;
      room.phase = 'playing';

      syncState(io, room);
      io.to(room.id).emit('toast', { type: 'success', message: '🎴 UNO 遊戲開始！' });

      return true; // Trigger broadcastRoomData
    },
  },

  onStartGame: (room) => {
    room.phase = 'playing';
    room.gameState = {
      roundModel: null,
    };
  },

  startRound: (room) => {
    const playerIds = room.players.map((p) => p.id);
    const roundModel = new UnoRound(playerIds);
    room.gameState.roundModel = roundModel;
    room.phase = 'playing';
  },

  onPlayerReconnect: (io, room, oldId, newId, socket) => {
    if (room.gameState && room.gameState.roundModel) {
      room.gameState.roundModel.updatePlayerId(oldId, newId);

      // Sync state to update handCount for all players (including the reconnected one)
      syncState(io, room);

      // Proactively sync hand to the reconnected player
      const hand = room.gameState.roundModel.getHand(newId);
      socket.emit('hand_update', { hand });
      console.log(`[Uno] Sent recovered hand to ${newId} (${hand.length} cards)`);
    }
  },
};

function syncState(io: Server, room: Room<UnoState, UnoSettings>): void {
  const roundModel = room.gameState.roundModel;
  if (!roundModel) return;

  const state = roundModel.getState();

  // Update public room state (hand counts only)
  room.players.forEach((p) => {
    const up = p as UnoPlayer;
    up.hand = []; // Don't expose full hand
    (up as any).handCount = state.hands[p.id] || 0;
    up.isUno = state.unoCalled.includes(p.id);
  });

  (room.gameState as any).topCard = state.topCard;
  (room.gameState as any).activeColor = state.activeColor;
  (room.gameState as any).currentPlayer = state.currentPlayer;
  (room.gameState as any).direction = state.direction;
  (room.gameState as any).deckSize = state.deckSize;
  (room.gameState as any).unoCalled = state.unoCalled;
  (room.gameState as any).hasDrawnThisTurn = state.hasDrawnThisTurn;

  // Send private hands to each player
  room.players.forEach((p) => {
    const hand = roundModel.getHand(p.id);
    io.to(p.id).emit('hand_update', { hand });
  });
}

export default Uno;
