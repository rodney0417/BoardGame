import Redis from 'ioredis';
import { Room } from './types';
import games from './games';
import { PictomaniaRound } from './games/pictomania/domain';
import { UnoRound } from './games/uno/domain';

// Check environment variables or default to localhost
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;

console.log(`[Redis] Connecting to ${REDIS_HOST}:${REDIS_PORT}...`);

const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  retryStrategy: (times) => {
    // Retry limited times then stop to allow server to run in memory-only mode if needed?
    // Or keep retrying? Persistence is critical, so we log.
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true, // Don't connect immediately on instantiation
});

redis.on('error', (err) => {
  // Suppress connection refused logs if running locally without redis
  // console.error('[Redis] Error:', err.message);
});

let isRedisConnected = false;

export const initRedis = async () => {
  try {
    await redis.connect();
    isRedisConnected = true;
    console.log('[Redis] Connected successfully.');
  } catch (e) {
    console.warn('[Redis] Connection failed. Running in In-Memory only mode.');
    isRedisConnected = false;
  }
};

const ROOM_KEY_PREFIX = 'room:';

// Helper to serialize room (handling domain models)
const serializeRoom = (room: Room): string => {
  // We need to carefully handle domain models which are class instances.
  // JSON.stringify will only save properties.
  // When rehydrating, we need to re-instantiate classes.
  return JSON.stringify(room);
};

// Helper to deserialize room and restore domain models
const deserializeRoom = (data: string): Room => {
  const room = JSON.parse(data) as Room;

  // Restore Domain Models if they exist in gameState
  if (room.gameType === 'pictomania' && (room as any).roundModel) {
    // roundModel properties are there, but prototype is Object
    const plainModel = (room as any).roundModel;
    // Hacky restoration: New instance + copy props
    const restored = new PictomaniaRound(plainModel.playerIds || []); // Need constructor args
    Object.assign(restored, plainModel);
    (room as any).roundModel = restored;
  } else if (room.gameType === 'uno' && room.gameState?.roundModel) {
    const plainModel = room.gameState.roundModel;
    room.gameState.roundModel = UnoRound.fromJSON(plainModel);
  }

  return room;
};

export const saveRoomToRedis = async (room: Room) => {
  if (!isRedisConnected) return;
  try {
    await redis.set(`${ROOM_KEY_PREFIX}${room.id}`, serializeRoom(room), 'EX', 86400); // 24h expiry
  } catch (e) {
    console.error(`[Redis] Failed to save room ${room.id}`, e);
  }
};

export const deleteRoomFromRedis = async (roomId: string) => {
  if (!isRedisConnected) return;
  try {
    await redis.del(`${ROOM_KEY_PREFIX}${roomId}`);
  } catch (e) {
    console.error(`[Redis] Failed to delete room ${roomId}`, e);
  }
};

export const loadAllRoomsFromRedis = async (): Promise<Record<string, Room>> => {
  if (!isRedisConnected) return {};
  const rooms: Record<string, Room> = {};

  try {
    const keys = await redis.keys(`${ROOM_KEY_PREFIX}*`);
    if (keys.length === 0) return {};

    const pipeline = redis.pipeline();
    keys.forEach((key) => pipeline.get(key));
    const results = await pipeline.exec();

    results?.forEach((result, index) => {
      const [err, data] = result;
      if (!err && typeof data === 'string') {
        try {
          const room = deserializeRoom(data);
          rooms[room.id] = room;
        } catch (parseErr) {
          console.error(`[Redis] Failed to parse room data for key ${keys[index]}`, parseErr);
        }
      }
    });

    console.log(`[Redis] Loaded ${Object.keys(rooms).length} rooms.`);
  } catch (e) {
    console.error('[Redis] Failed to load rooms', e);
  }

  return rooms;
};
