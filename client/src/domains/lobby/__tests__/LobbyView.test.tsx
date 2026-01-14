import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LobbyView from '../LobbyView';
import { RoomListInfo } from '../../../types';

const mockRooms: RoomListInfo[] = [
    {
        id: 'Room1',
        gameType: 'pictomania',
        gameName: 'Test Game',
        playerCount: 1,
        maxPlayers: 6,
        phase: 'waiting',
        takenColors: []
    }
];

describe('LobbyView', () => {
  it('renders empty state correctly', () => {
    render(<LobbyView roomList={[]} onJoinRoom={vi.fn()} showCreateModal={false} onCloseCreateModal={vi.fn()} onCreateModalOpen={vi.fn()} />);
    expect(screen.getByText(/目前沒有活躍的房間/i)).toBeInTheDocument();
  });

  it('renders room list', () => {
    render(<LobbyView roomList={mockRooms} onJoinRoom={vi.fn()} showCreateModal={false} onCloseCreateModal={vi.fn()} onCreateModalOpen={vi.fn()} />);
    expect(screen.getByText('Room1')).toBeInTheDocument();
  });

  it('shows create modal when showCreateModal prop is true', async () => {
    render(<LobbyView roomList={[]} onJoinRoom={vi.fn()} showCreateModal={true} onCloseCreateModal={vi.fn()} onCreateModalOpen={vi.fn()} />);
    const modalTitle = await screen.findByText('創建房間');
    expect(modalTitle).toBeInTheDocument();
  });
});
