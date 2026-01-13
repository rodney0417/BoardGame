import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { Room } from './types';
import games from './games';
import { RoomListInfo, RoomDTO } from '../../shared/types';
import {
  initRedis,
  loadAllRoomsFromRedis,
  saveRoomToRedis,
  deleteRoomFromRedis,
} from './redis_store';

const app = express();
app.use(cors());

// Serve static files in production
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const publicPath = path.join(process.cwd(), 'public');
if (fs.existsSync(publicPath)) {
  console.log(`[Server] Serving static files from ${publicPath}`);
  app.use(express.static(publicPath));

  // SPA fallback: serve index.html for unknown routes (excluding API/Socket interactions)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/socket.io/')) return next();
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

const rooms: Record<string, Room> = {};
// Initialize Redis and load rooms
(async () => {
  await initRedis();
  const loaded = await loadAllRoomsFromRedis();
  Object.assign(rooms, loaded);
})();

const roomTimers: Record<string, NodeJS.Timeout> = {};
const roomCleanupTimers: Record<string, NodeJS.Timeout> = {};

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];

const getRoomDto = (room: Room, viewerId?: string): RoomDTO => {
  // Debug gameName issue
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
};

const broadcastRoomData = (roomId: string) => {
  const room = rooms[roomId];
  if (!room) return;

  room.players.forEach((p) => {
    if (!p.disconnected) {
      io.to(p.id).emit('room_data', getRoomDto(room, p.id));
    }
  });
};

const getRoomList = (): RoomListInfo[] => {
  return Object.values(rooms).map((r) => ({
    id: r.id,
    gameType: r.gameType,
    gameName: games[r.gameType]?.name || '未知',
    playerCount: r.players.length,
    maxPlayers: games[r.gameType]?.maxPlayers || 6,
    phase: r.phase,
    takenColors: r.players.map((p) => p.color),
    settings: r.settings,
  }));
};

io.on('connection', (socket: Socket) => {
  socket.emit('room_list', getRoomList());

  socket.on(
    'validate_username',
    (
      data: { username: string },
      callback: (response: { valid: boolean; message?: string }) => void,
    ) => {
      const isTaken = Object.values(rooms).some((room) =>
        room.players.some(
          (p) => p.username.toLowerCase() === data.username.toLowerCase() && !p.disconnected,
        ),
      );
      if (isTaken) callback({ valid: false, message: '此暱稱已被其他在線玩家使用' });
      else callback({ valid: true });
    },
  );

  socket.on('join_room', (data: any) => {
    const { roomId, username, gameType = 'pictomania', color, drawTime, peerId } = data;
    const game = games[gameType];

    if (!game) {
      socket.emit('toast', { type: 'error', message: '找不到該遊戲類型' });
      return;
    }

    if (!rooms[roomId]) {
      // 初始房間設定
      const initialSettings = { ...game.defaultSettings };
      if (drawTime) initialSettings.drawTime = drawTime;

      rooms[roomId] = {
        id: roomId,
        players: [],
        phase: 'waiting',
        timeLeft: 0,
        gameType,
        settings: initialSettings,
        gameState: {},
        lastActivity: Date.now(),
      };
    }

    const room = rooms[roomId];
    room.lastActivity = Date.now();

    // 清除該房間的刪除倒數 (如果有的話)
    if (roomCleanupTimers[roomId]) {
      clearTimeout(roomCleanupTimers[roomId]);
      delete roomCleanupTimers[roomId];
    }

    let player = room.players.find((p) => p.peerId === peerId);

    if (player) {
      console.log(
        `[Server] Player ${username} re-joined. Updating ID: ${player.id} -> ${socket.id}`,
      );

      const oldId = player.id;

      // Update player ID FIRST so syncState can find the correct handCount
      player.id = socket.id;
      player.disconnected = false;

      // Then notify Game Module about reconnection (e.g. migrate UNO hand)
      const game = games[room.gameType];
      if (game?.onPlayerReconnect) {
        try {
          game.onPlayerReconnect(io, room, oldId, socket.id, socket);
          console.log(`[Server] Triggered onPlayerReconnect for game ${room.gameType}`);
        } catch (e) {
          console.error(`[Server] Error in onPlayerReconnect:`, e);
        }
      }
    } else {
      if (room.players.length >= game.maxPlayers || room.phase !== 'waiting') return;

      let targetColor = color || PLAYER_COLORS[0];
      const isColorTaken = room.players.some((p) => p.color === targetColor);

      const finalColor = isColorTaken
        ? PLAYER_COLORS.find((c) => !room.players.some((p) => p.color === c))
        : targetColor;

      const basePlayer = { id: socket.id, peerId, username, color: finalColor || PLAYER_COLORS[0] };
      const gamePlayer = game.initPlayer(basePlayer); // 取得遊戲專屬欄位

      player = { ...basePlayer, ...gamePlayer } as any;
      room.players.push(player!);
    }

    socket.join(roomId);
    saveRoomToRedis(room);
    broadcastRoomData(roomId);

    // 如果是重新連線且遊戲正在進行中，發送當前狀態
    if (room.phase === 'playing') {
      // TODO: Let Game Module decide if specific events are needed
    }

    io.emit('room_list', getRoomList());
  });

  socket.on('leave_room', (data) => {
    const { roomId, peerId } = data;
    const room = rooms[roomId];
    if (room) {
      room.lastActivity = Date.now();
      room.players = room.players.filter((p) => p.peerId !== peerId);
      socket.leave(roomId);
      if (room.players.length === 0) {
        stopRoomTimer(roomId);
        delete rooms[roomId];
      } else {
        saveRoomToRedis(room);
        broadcastRoomData(roomId);
      }
      io.emit('room_list', getRoomList());
    }
  });

  const handleGameEvent = (eventName: string, data: any) => {
    const roomId = Array.from(socket.rooms).find((r) => r !== socket.id);
    if (!roomId) return;
    const room = rooms[roomId];
    if (!room) return;

    room.lastActivity = Date.now();

    const game = games[room.gameType];
    if (game?.handlers && game.handlers[eventName]) {
      const shouldUpdate = game.handlers[eventName](io, room, socket, data);

      // 特殊處理：如果事件導致狀態變為 playing，啟動計時器
      if ((eventName === 'start_game' || eventName === 'next_round') && room.phase === 'playing') {
        startRoomTimer(room);
      }

      if (shouldUpdate) {
        broadcastRoomData(room.id);
        saveRoomToRedis(room);
      }
    }
  };

  // Auto-register game events
  [
    'start_game',
    'player_finish_drawing',
    'guess_word',
    'player_finish_guessing',
    'upload_image',
    'next_round',
    'play_card',
    'draw_card',
    'pass_turn',
    'call_uno',
    'challenge_uno',
    'get_hand',
  ].forEach((event) => {
    socket.on(event, (data) => handleGameEvent(event, data));
  });

  socket.on('draw', (data) => {
    const room = rooms[data.roomId];
    if (room) room.lastActivity = Date.now();
    socket.to(data.roomId).emit('draw', { ...data, playerId: socket.id });
  });

  socket.on('clear_canvas', (roomId) => {
    const room = rooms[roomId];
    if (room) room.lastActivity = Date.now();
    io.to(roomId).emit('clear_canvas', { playerId: socket.id });
  });

  socket.on('disconnecting', () => {
    const socketRooms = Array.from(socket.rooms);
    socketRooms.forEach((roomId) => {
      if (roomId === socket.id) return;
      const room = rooms[roomId];
      if (!room) return;

      const player = room.players.find((p) => p.id === socket.id);
      if (player) {
        player.disconnected = true;

        if (room.players.every((p) => p.disconnected)) {
          roomCleanupTimers[roomId] = setTimeout(() => {
            console.log(`[Server] 清理空房間: ${roomId}`);
            stopRoomTimer(roomId);
            delete rooms[roomId];
            deleteRoomFromRedis(roomId);
            io.emit('room_list', getRoomList());
          }, 30000);
        }

        broadcastRoomData(roomId);
      }
    });
  });
});

function startRoomTimer(room: Room) {
  if (roomTimers[room.id]) clearInterval(roomTimers[room.id]);

  // 如果 timeLeft <= 0，不需要啟動
  if (room.timeLeft <= 0) return;

  roomTimers[room.id] = setInterval(() => {
    room.timeLeft--;
    io.to(room.id).emit('timer_update', room.timeLeft);
    if (room.timeLeft <= 0) {
      clearInterval(roomTimers[room.id]);
      delete roomTimers[room.id];

      const game = games[room.gameType];
      if (game?.onTimeout) {
        const shouldUpdate = game.onTimeout(io, room);
        if (shouldUpdate) broadcastRoomData(room.id);
      } else {
        // Fallback default behavior
        room.players.forEach((p) => (p.isDoneDrawing = true));
        broadcastRoomData(room.id);
        io.to(room.id).emit('toast', { type: 'warning', message: '時間到！' });
      }
    }
  }, 1000);
}

function stopRoomTimer(roomId: string) {
  if (roomTimers[roomId]) {
    clearInterval(roomTimers[roomId]);
    delete roomTimers[roomId];
  }
}

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// 每 1 分鐘檢查一次閒置超過 5 分鐘的房間

setInterval(
  () => {
    const now = Date.now();

    const FIVE_MINUTES = 5 * 60 * 1000;

    Object.keys(rooms).forEach((roomId) => {
      const room = rooms[roomId];

      if (now - room.lastActivity > FIVE_MINUTES) {
        console.log(`[Server] 清理閒置房間: ${roomId}`);

        stopRoomTimer(roomId);

        delete rooms[roomId];
        deleteRoomFromRedis(roomId);

        io.emit('room_list', getRoomList());
      }
    });
  },
  1 * 60 * 1000,
);
