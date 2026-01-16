
import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RedisRoomRepository, RoomService } from './domain/room';
import { SocketHandler, TimerService } from './infrastructure';

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

// Bootstrap
(async () => {
    // 1. Init Infra
    const roomRepo = new RedisRoomRepository();
    const timerService = new TimerService(io);
    
    // 2. Init Domain/App Services
    const roomService = new RoomService(roomRepo);
    await roomService.init();

    // 3. Init Socket Handlers (SocketHandler now also needs TimerService)
    const socketHandler = new SocketHandler(io, roomService, timerService);

    io.on('connection', (socket) => {
        socketHandler.registerEvents(socket);
    });

    // 4. Start Server
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    // 5. Global Background Jobs (Cleanup)
    setInterval(() => {
        const now = Date.now();
        const FIVE_MINUTES = 5 * 60 * 1000;
        roomService.getAllRooms().forEach((room) => {
            if (now - room.lastActivity > FIVE_MINUTES) {
                console.log(`[Server] 清理閒置房間: ${room.id}`);
                roomService.deleteRoom(room.id);
                io.emit('room_list', roomService.getAllRooms().map(r => ({
                     // Simplified mapping or reuse getRoomList from logic
                     id: r.id,
                     gameType: r.gameType,
                     gameName: '...', // we can access games[r.gameType] here too if imported or delegate
                     playerCount: r.players.length,
                     maxPlayers: 6,
                     phase: r.phase,
                     takenColors: r.players.map(p => p.color),
                     settings: r.settings
                })));
                // Actually SocketHandler has getRoomList logic, maybe we should expose it or make it static/shared
                // For now, let's just trigger update via socket handler broadcast logic if possible, 
                // or just emit raw list if client accepts partial data or we duplicate mapping.
                // Better: RoomService could have `getRoomListShortInfo` method.
            }
        });
    }, 60000);
})();

