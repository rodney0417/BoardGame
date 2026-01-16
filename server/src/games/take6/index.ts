import { Server, Socket } from 'socket.io';
import { GameModule, Room, Player } from '../../types';
import { Take6State, Take6Player } from './types';
import { Take6Round } from './domain';

const ensureRoundModel = (room: any): Take6Round | null => {
    if (room.roundModel) return room.roundModel;
    if (room.gameState) {
        room.roundModel = Take6Round.restore(room.gameState);
        return room.roundModel;
    }
    return null;
};

const Take6: GameModule<Take6State, any> = {
  id: 'take6',
  name: '誰是牛頭王',
  icon: '🐮',
  maxPlayers: 10,
  defaultSettings: {},

  initPlayer: (player: Partial<Player>) => {
    return {
      hand: [],
      score: 0,
      scorePile: [],
      selectedCard: undefined
    };
  },

  onPlayerReconnect: (io: Server, room: Room<Take6State, any>, oldId: string, newId: string) => {
      const roundModel = ensureRoundModel(room);
      if (roundModel) {
          const success = roundModel.updatePlayerId(oldId, newId);
          if (success) {
             room.gameState = roundModel.getState();
             io.to(room.id).emit('update_state', room.gameState);
          }
      }
  },

  handlers: {
    start_game: (io: Server, room: Room<Take6State, any>, socket: Socket, data: any) => {
      // 1. Initialize Domain Model
      const playerIds = room.players.map(p => p.id);
      const roundModel = Take6Round.create(playerIds);
      (room as any).roundModel = roundModel;

      // 2. Sync generic player names to model (optional, mostly for debug)
      const state = roundModel.getState();
      room.players.forEach(p => {
         if(state.players[p.id]) state.players[p.id].username = p.username;
      });

      // 3. Sync to Room State
      // We must ensure room.gameState object reference is maintained if possible, 
      // or we just assign properties. 
      // Accessing roundModel.getState() returns the reference to internal state.
      // We can just point room.gameState to it if we want strict sync.
      room.gameState = state;
      room.phase = 'playing';

      io.to(room.id).emit('game_started', room.gameState);
      io.to(room.id).emit('update_state', room.gameState);

      return true;
    },

    play_card: (io: Server, room: Room<Take6State, any>, socket: Socket, data: any) => {
      const roundModel = ensureRoundModel(room);
      if (!roundModel) return false;

      const success = roundModel.playCard(socket.id, data.card);
      if (!success) return false;

      // Check if all ready
      if (roundModel.checkAllPlayersSelected()) {
          roundModel.revealPhase();
          
          // Auto-resolve pending cards
          // We loop processing until blocked or empty to simulate the full turn
          processResolution(io, room, roundModel);
      } else {
          // Just update state (showing who selected)
          io.to(room.id).emit('update_state', roundModel.getState());
      }
      return true;
    },

    choose_row: (io: Server, room: Room<Take6State, any>, socket: Socket, data: any) => {
      const roundModel = ensureRoundModel(room);
      if (!roundModel) return false;

      const success = roundModel.chooseRow(socket.id, data.rowIndex);
      if (!success) return false;

      // Resume resolution
      processResolution(io, room, roundModel);
      return true;
    },

    get_state: (io: Server, room: Room<Take6State, any>, socket: Socket, data: any) => {
      // Send current state to specific socket
      const roundModel = ensureRoundModel(room);
      const state = roundModel ? roundModel.getState() : room.gameState;
      if (state) {
        socket.emit('update_state', state);
      }
      return true;
    }
  }
};

function processResolution(io: Server, room: Room<Take6State, any>, roundModel: Take6Round) {
    // We execute logic until blocked (user input needed) or finished
    const blocked = roundModel.processPendingCards();
    
    // Sync state
    room.gameState = roundModel.getState();
    io.to(room.id).emit('update_state', room.gameState);
}

export default Take6;
