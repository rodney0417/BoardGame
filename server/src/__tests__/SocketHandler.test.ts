import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Server, Socket } from 'socket.io';
import { SocketHandler } from '../infrastructure/socket/SocketHandler';
import { RoomService } from '../domain/room/RoomService';
import { TimerService } from '../infrastructure/timer/TimerService';
import { RoomRepository } from '../domain/room/RoomRepository';

// Mock Socket.io
const createMockSocket = (): Partial<Socket> => ({
  id: 'test-socket-id',
  emit: vi.fn(),
  on: vi.fn(),
  join: vi.fn(),
  leave: vi.fn(),
  to: vi.fn().mockReturnThis(),
  rooms: new Set(['test-socket-id']),
});

const createMockServer = (): Partial<Server> => ({
  emit: vi.fn(),
  to: vi.fn().mockReturnValue({ emit: vi.fn() }),
});

const createMockRepo = (): RoomRepository => ({
  init: vi.fn().mockResolvedValue(undefined),
  getAll: vi.fn().mockResolvedValue({}),
  save: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
});

describe('SocketHandler', () => {
  let handler: SocketHandler;
  let mockIo: Partial<Server>;
  let mockSocket: Partial<Socket>;
  let roomService: RoomService;
  let timerService: TimerService;

  beforeEach(async () => {
    mockIo = createMockServer();
    mockSocket = createMockSocket();
    
    const mockRepo = createMockRepo();
    roomService = new RoomService(mockRepo);
    await roomService.init();

    timerService = new TimerService(mockIo as Server);
    handler = new SocketHandler(mockIo as Server, roomService, timerService);
  });

  it('should register socket events on connection', () => {
    handler.registerEvents(mockSocket as Socket);

    expect(mockSocket.on).toHaveBeenCalledWith('validate_username', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('join_room', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('leave_room', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnecting', expect.any(Function));
  });

  it('should emit room_list on connection', () => {
    handler.registerEvents(mockSocket as Socket);

    expect(mockSocket.emit).toHaveBeenCalledWith('room_list', []);
  });

  it('should register game events', () => {
    handler.registerEvents(mockSocket as Socket);

    const gameEvents = ['start_game', 'play_card', 'draw_card', 'call_uno'];
    gameEvents.forEach((event) => {
      expect(mockSocket.on).toHaveBeenCalledWith(event, expect.any(Function));
    });
  });

  it('should register game_action event and route correctly', () => {
    // Spy on private handleGameEvent logic
    const spy = vi.spyOn(handler as any, 'handleGameEvent');

    handler.registerEvents(mockSocket as Socket);

    // Verify registration
    expect(mockSocket.on).toHaveBeenCalledWith('game_action', expect.any(Function));

    // Find and execute the callback to verify routing
    const calls = (mockSocket.on as any).mock.calls;
    const gameActionCall = calls.find((c: any[]) => c[0] === 'game_action');
    expect(gameActionCall).toBeDefined();
    
    if (gameActionCall) {
        const callback = gameActionCall[1];
        // Simulate client emitting game_action
        callback({ action: 'start_game', data: { foo: 'bar' } });
        
        // Should unwrap and call internal handler
        expect(spy).toHaveBeenCalledWith(mockSocket, 'start_game', { foo: 'bar' });
    }
  });
});
