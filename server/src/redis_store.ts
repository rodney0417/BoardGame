import Redis from 'ioredis';
import { Room } from './types';
import { PictomaniaRound } from './games/pictomania/domain';
import { UnoRound } from './games/uno/domain';

const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;

// --- 修改部分開始 ---
let redis: Redis;

if (REDIS_URL) {
  console.log(`[Redis] Setup - Detected REDIS_URL. Connecting via connection string...`);
  
  // Upstash 的 rediss:// 必須處理 tls 參數
  const isTls = REDIS_URL.startsWith('rediss://');
  
  redis = new Redis(REDIS_URL, {
    lazyConnect: true,
    // 關鍵設定：如果是 rediss:// 則必須開啟 TLS
    tls: isTls ? { rejectUnauthorized: false } : undefined,
    connectTimeout: 10000, // 增加連線超時，避免網路波動
  });
} else {
  console.log(`[Redis] Setup - No URL found. Using Host/Port: ${REDIS_HOST}:${REDIS_PORT}`);
  redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    lazyConnect: true,
  });
}
// --- 修改部分結束 ---

redis.on('error', (err) => {
  // 只在非開發環境打印嚴重錯誤
  if (process.env.NODE_ENV === 'production') {
    console.error('[Redis] Error event:', err.message);
  }
});

let isRedisConnected = false;

export const initRedis = async () => {
  try {
    // 增加一點點延遲，確保環境變數完全載入
    await redis.connect();
    isRedisConnected = true;
    console.log('[Redis] Connected successfully to the server.');
  } catch (e: any) {
    console.warn(`[Redis] Connection failed: ${e.message}`);
    console.warn('[Redis] Running in In-Memory only mode.');
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
