
import { Room } from '../../types';
import {
  initRedis,
  loadAllRoomsFromRedis,
  saveRoomToRedis,
  deleteRoomFromRedis,
} from '../../redis_store';

export interface RoomRepository {
  init(): Promise<void>;
  getAll(): Promise<Record<string, Room>>;
  save(room: Room): Promise<void>;
  delete(roomId: string): Promise<void>;
}

export class RedisRoomRepository implements RoomRepository {
  async init(): Promise<void> {
    await initRedis();
  }

  async getAll(): Promise<Record<string, Room>> {
    return loadAllRoomsFromRedis();
  }

  async save(room: Room): Promise<void> {
    await saveRoomToRedis(room);
  }

  async delete(roomId: string): Promise<void> {
    await deleteRoomFromRedis(roomId);
  }
}
