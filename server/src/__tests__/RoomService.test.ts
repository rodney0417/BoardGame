import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoomService } from '../domain/room/RoomService';
import { RoomRepository } from '../domain/room/RoomRepository';

// Mock Repository
const createMockRepo = (): RoomRepository => ({
  init: vi.fn().mockResolvedValue(undefined),
  getAll: vi.fn().mockResolvedValue({}),
  save: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
});

describe('RoomService', () => {
  let service: RoomService;
  let mockRepo: RoomRepository;

  beforeEach(async () => {
    mockRepo = createMockRepo();
    service = new RoomService(mockRepo);
    await service.init();
  });

  it('should initialize with empty rooms', () => {
    expect(service.getAllRooms()).toEqual([]);
  });

  it('should create a room', () => {
    const room = service.createRoom('test-room', 'pictomania', { drawTime: 60 });

    expect(room.id).toBe('test-room');
    expect(room.gameType).toBe('pictomania');
    expect(room.settings.drawTime).toBe(60);
    expect(room.players).toEqual([]);
    expect(room.phase).toBe('waiting');
  });

  it('should return existing room if already created', () => {
    const room1 = service.createRoom('test-room', 'pictomania', { drawTime: 60 });
    const room2 = service.createRoom('test-room', 'uno', { something: true });

    expect(room1).toBe(room2);
    expect(room2.gameType).toBe('pictomania'); // Should not change
  });

  it('should get room by id', () => {
    service.createRoom('room-1', 'pictomania', {});
    
    const room = service.getRoom('room-1');
    expect(room).toBeDefined();
    expect(room?.id).toBe('room-1');
  });

  it('should return undefined for non-existent room', () => {
    const room = service.getRoom('non-existent');
    expect(room).toBeUndefined();
  });

  it('should delete room and call repo.delete', async () => {
    service.createRoom('room-to-delete', 'pictomania', {});
    
    await service.deleteRoom('room-to-delete');
    
    expect(service.getRoom('room-to-delete')).toBeUndefined();
    expect(mockRepo.delete).toHaveBeenCalledWith('room-to-delete');
  });

  it('should save room to repo', async () => {
    const room = service.createRoom('room-1', 'pictomania', {});
    
    await service.saveRoom(room);
    
    expect(mockRepo.save).toHaveBeenCalledWith(room);
  });
});
