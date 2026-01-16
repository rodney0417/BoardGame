
import { Server, Socket } from 'socket.io';
import { RoomService } from '../../domain/room';
import { TimerService } from '../timer/TimerService';
import games from '../../games';
import { Room } from '../../types';
import { RoomListInfo, RoomDTO } from '../../../../shared/types';
import { PLAYER_COLORS } from '../../../../shared/constants';

export class SocketHandler {
  private io: Server;
  private roomService: RoomService;
  private timerService: TimerService;

  constructor(io: Server, roomService: RoomService, timerService: TimerService) {
    this.io = io;
    this.roomService = roomService;
    this.timerService = timerService;
  }

  public registerEvents(socket: Socket) {
    // 1. Send initial Room List
    socket.emit('room_list', this.getRoomList());

    // 2. Validate Username
    socket.on('validate_username', (data, callback) => this.handleValidateUsername(data, callback));

    // 3. Join Room
    socket.on('join_room', (data) => this.handleJoinRoom(socket, data));

    // 4. Leave Room
    socket.on('leave_room', (data) => this.handleLeaveRoom(socket, data));

    // 5. Game Events
    const gameEvents = [
        'start_game', 'player_finish_drawing', 'guess_word', 'player_finish_guessing',
        'upload_image', 'next_round', 'play_card', 'draw_card', 'pass_turn',
        'call_uno', 'challenge_uno', 'get_hand', 'update_settings'
    ];
    gameEvents.forEach((event) => {
        socket.on(event, (data) => this.handleGameEvent(socket, event, data));
    });

    // 5.5 Standardized Game Action (Universal Handler)
    socket.on('game_action', (payload) => {
        console.log(`[Socket] received game_action from ${socket.id}:`, payload);
        const { action, data } = payload || {};
        if (action) {
            console.log(`[Socket] dispatching action ${action} to handleGameEvent`);
            this.handleGameEvent(socket, action, data || {});
        } else {
            console.warn(`[Socket] invalid game_action payload:`, payload);
        }
    });

    // 6. Generic Draw/Clear
    socket.on('draw', (data) => {
         // ... implementation 
         // Assuming simple passthrough
         socket.to(data.roomId).emit('draw', { ...data, playerId: socket.id });
    });

    socket.on('clear_canvas', (roomId) => {
        const room = this.roomService.getRoom(roomId);
        if(room) { // update activity
            room.lastActivity = Date.now();
        } 
        this.io.to(roomId).emit('clear_canvas', { playerId: socket.id });
    });

    // 7. Disconnect
    socket.on('disconnecting', () => this.handleDisconnecting(socket));
  }
  
  // ... Implementation methods needed (we will copy logic from index.ts)
  // For brevity in this step, I will skeleton specific complex methods and fill them in next edit 
  // or put full content if possible.
  
  private getRoomList(): RoomListInfo[] {
      return this.roomService.getAllRooms().map((r) => ({
        id: r.id,
        gameType: r.gameType,
        gameName: games[r.gameType]?.name || '未知',
        playerCount: r.players.length,
        maxPlayers: games[r.gameType]?.maxPlayers || 6,
        phase: r.phase,
        takenColors: r.players.map((p) => p.color),
        settings: r.settings,
      }));
  }

  private handleValidateUsername(data: { username: string }, callback: any) {
      const isTaken = this.roomService.getAllRooms().some((room) =>
        room.players.some(
          (p) => p.username.toLowerCase() === data.username.toLowerCase() && !p.disconnected,
        ),
      );
      if (isTaken) callback({ valid: false, message: '此暱稱已被其他在線玩家使用' });
      else callback({ valid: true });
  }

  private async handleJoinRoom(socket: Socket, data: any) {
      const { roomId, username, gameType = 'pictomania', color, drawTime, peerId } = data;
      const game = games[gameType];

      if (!game) {
        socket.emit('toast', { type: 'error', message: '找不到該遊戲類型' });
        return;
      }

      // Use RoomService to Create/Get Room structure
      let room = this.roomService.getRoom(roomId);
      if (!room) {
        // Create room with game-specific settings
        const initialSettings = { ...game.defaultSettings };
        if (drawTime) initialSettings.drawTime = drawTime;
        room = this.roomService.createRoom(roomId, gameType, initialSettings);
      }
      
      this.roomService.cancelCleanup(roomId);
      this.roomService.updateActivity(roomId);
      
      if (!room) return;

      // Update Player Logic (Moved from index.ts)
      let player = room.players.find((p) => p.peerId === peerId);

      if (player) {
          console.log(`[Server] Player ${username} re-joined. Updating ID: ${player.id} -> ${socket.id}`);
          const oldId = player.id;
          player.id = socket.id;
          player.disconnected = false;

          if (game.onPlayerReconnect) {
            try {
                game.onPlayerReconnect(this.io, room, oldId, socket.id, socket);
            } catch (e) {
                console.error(`[Server] Error in onPlayerReconnect:`, e);
            }
          }
      } else {
          // New Player
           if (room.players.length >= game.maxPlayers || room.phase !== 'waiting') return;

           let targetColor = color || PLAYER_COLORS[0];
           const isColorTaken = room.players.some((p) => p.color === targetColor);
           const finalColor = isColorTaken
             ? PLAYER_COLORS.find((c) => !room.players.some((p) => p.color === c))
             : targetColor;

           const basePlayer = { id: socket.id, peerId, username, color: finalColor || PLAYER_COLORS[0] };
           const gamePlayer = game.initPlayer(basePlayer);
           player = { ...basePlayer, ...gamePlayer } as any;
           room.players.push(player!);
      }

      socket.join(roomId);

      // Re-trigger timer if re-joining during playing phase and timer is not running
      if (room.phase === 'playing' && room.timeLeft > 0) {
          this.timerService.startRoomTimer(room, (id) => this.broadcastRoomData(id));
      }

      this.roomService.saveRoom(room);
      this.broadcastRoomData(roomId);
      this.io.emit('room_list', this.getRoomList());
  }

  private handleLeaveRoom(socket: Socket, data: any) {
       const { roomId, peerId } = data;
       const room = this.roomService.getRoom(roomId);
       if (room) {
         room.lastActivity = Date.now();
         room.players = room.players.filter((p) => p.peerId !== peerId);
         socket.leave(roomId);
         if (room.players.length === 0) {
           // Schedule cleanup
           this.roomService.scheduleCleanup(roomId, 0, () => { // Immediate delete? Or use standard logic?
               // Original code: immediately delete if empty on manual leave? 
               // Original: delete rooms[roomId]; stopTimer; deleteRedis; emit list.
               // We should follow original logic.
               this.io.emit('room_list', this.getRoomList());
           });
           this.roomService.deleteRoom(roomId); 
           this.io.emit('room_list', this.getRoomList());
         } else {
           this.roomService.saveRoom(room);
           this.broadcastRoomData(roomId);
         }
         this.io.emit('room_list', this.getRoomList());
       }
  }

  private handleDisconnecting(socket: Socket) {
     // ... logic from index.ts
     const socketRooms = Array.from(socket.rooms);
     socketRooms.forEach((roomId) => {
         if (roomId === socket.id) return;
         const room = this.roomService.getRoom(roomId);
         if (!room) return;

         const player = room.players.find((p) => p.id === socket.id);
         if (player) {
             player.disconnected = true;
             if (room.players.every((p) => p.disconnected)) {
                 this.roomService.scheduleCleanup(roomId, 30000, () => {
                     this.io.emit('room_list', this.getRoomList());
                 });
             }
             this.broadcastRoomData(roomId);
         }
     });
  }

  private handleGameEvent(socket: Socket, eventName: string, data: any) {
      // ... logic
       const roomId = Array.from(socket.rooms).find((r) => r !== socket.id);
       if (!roomId) return;
       const room = this.roomService.getRoom(roomId);
       if (!room) return;

       const game = games[room.gameType];
       if (game?.handlers && game.handlers[eventName]) {
        const shouldUpdate = game.handlers[eventName](this.io, room, socket, data);
        
        if (shouldUpdate) {
            // Timer Logic: Start if playing and room has time limit, Stop otherwise
            if (room.phase === 'playing' && (room.timeLeft > 0)) {
                this.timerService.startRoomTimer(room, (id) => this.broadcastRoomData(id));
            } else {
                this.timerService.stopRoomTimer(room.id);
            }

            this.broadcastRoomData(room.id);
            this.roomService.saveRoom(room);
        }
       }
  }

  // Helper helper
  private broadcastRoomData(roomId: string) {
       const room = this.roomService.getRoom(roomId);
       if (!room) return;
       room.players.forEach((p) => {
            if (!p.disconnected) {
                this.io.to(p.id).emit('room_data', this.getRoomDto(room, p.id));
            }
       });
  }

  // Copy getRoomDto logic
  private getRoomDto(room: Room, viewerId: string): RoomDTO {
    const gameName = games[room.gameType]?.name || '未知';
    if (!gameName || gameName === 'undefined') {
      console.log(
        `[Error] GameName invalid. Type: ${room.gameType}, Games keys: ${Object.keys(games)}, Entry: ${games[room.gameType]}`,
      );
    }
  
    // Debug: Log handCount for UNO
    if (room.gameType === 'uno') {
      console.log(
        `[Debug] getRoomDto - players handCount:`,
        room.players.map((p) => ({
          id: p.id.substring(0, 8),
          username: (p as any).username,
          handCount: (p as any).handCount,
        })),
      );
    }
  
    return {
      id: room.id,
      gameType: room.gameType,
      gameName: gameName,
      phase: room.phase,
      timeLeft: room.timeLeft,
      settings: room.settings,
      gameState: room.gameState,
      players: room.players.map((p) => {
        const isMe = p.id === viewerId;
        const revealAll = room.phase === 'round_ended' || room.phase === 'game_over';
  
        const playerDto: any = {
          id: p.id,
          peerId: p.peerId,
          username: p.username,
          color: p.color,
          score: p.score,
          isDoneDrawing: p.isDoneDrawing,
          disconnected: p.disconnected,
          // 遊戲專屬但非敏感的欄位
          isDoneGuessing: (p as any).isDoneGuessing,
          guessedCorrectlyBy: (p as any).guessedCorrectlyBy,
          // UNO 專屬欄位
          handCount: (p as any).handCount,
          isUno: (p as any).isUno,
        };
  
        if (isMe || revealAll) {
          playerDto.symbolCard = (p as any).symbolCard;
          playerDto.numberCard = (p as any).numberCard;
          playerDto.targetWord = (p as any).targetWord;
          playerDto.myGuesses = (p as any).myGuesses;
        }
  
        return playerDto;
      }),
    };
  }
}
