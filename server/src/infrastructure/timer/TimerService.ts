
import { Server } from 'socket.io';
import { Room } from '../../types';
import games from '../../games';

export class TimerService {
  private roomTimers: Record<string, NodeJS.Timeout> = {};
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public startRoomTimer(room: Room, broadcastCallback: (roomId: string) => void) {
    if (this.roomTimers[room.id]) return; // Timer already running, don't reset

    if (room.timeLeft <= 0) return;

    this.roomTimers[room.id] = setInterval(() => {
      room.timeLeft--;
      this.io.to(room.id).emit('timer_update', room.timeLeft);

      if (room.timeLeft <= 0) {
        this.stopRoomTimer(room.id);

        const game = games[room.gameType];
        if (game?.onTimeout) {
          const shouldUpdate = game.onTimeout(this.io, room);
          if (shouldUpdate) broadcastCallback(room.id);
        } else {
          // Fallback default behavior
          room.players.forEach((p) => (p.isDoneDrawing = true));
          broadcastCallback(room.id);
          this.io.to(room.id).emit('toast', { type: 'warning', message: '時間到！' });
        }
      }
    }, 1000);
  }

  public stopRoomTimer(roomId: string) {
    if (this.roomTimers[roomId]) {
      clearInterval(this.roomTimers[roomId]);
      delete this.roomTimers[roomId];
    }
  }
}
