import { Room } from '../../types';
import { RoomRepository } from './RoomRepository';

export class RoomService {
  private rooms: Record<string, Room> = {};
  private repo: RoomRepository;
  private roomCleanupTimers: Record<string, NodeJS.Timeout> = {};

  constructor(repo: RoomRepository) {
    this.repo = repo;
  }

  async init() {
    await this.repo.init();
    const loaded = await this.repo.getAll();
    Object.assign(this.rooms, loaded);
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms[roomId];
  }

  getAllRooms(): Room[] {
    return Object.values(this.rooms);
  }

  createRoom(roomId: string, gameType: string, settings: any): Room {
    if (this.rooms[roomId]) {
      return this.rooms[roomId];
    }

    const room: Room = {
      id: roomId,
      players: [],
      phase: 'waiting',
      timeLeft: 0,
      gameType,
      settings,
      gameState: {},
      lastActivity: Date.now(),
    };

    this.rooms[roomId] = room;
    return room;
  }

  updateActivity(roomId: string) {
    const room = this.rooms[roomId];
    if (room) {
      room.lastActivity = Date.now();
    }
  }

  cancelCleanup(roomId: string) {
    if (this.roomCleanupTimers[roomId]) {
      clearTimeout(this.roomCleanupTimers[roomId]);
      delete this.roomCleanupTimers[roomId];
    }
  }

  async saveRoom(room: Room) {
    this.rooms[room.id] = room;
    await this.repo.save(room);
  }

  async deleteRoom(roomId: string) {
    this.cancelCleanup(roomId);
    if (this.rooms[roomId]) {
      delete this.rooms[roomId];
      await this.repo.delete(roomId);
    }
  }

  scheduleCleanup(roomId: string, timeoutMs: number, callback: () => void) {
    this.cancelCleanup(roomId);
    this.roomCleanupTimers[roomId] = setTimeout(() => {
      console.log(`[RoomService] 清理房間: ${roomId}`);
      this.deleteRoom(roomId);
      callback();
    }, timeoutMs);
  }
}
