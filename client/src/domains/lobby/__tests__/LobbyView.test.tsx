import { render, screen, fireEvent } from '@testing-library/react';
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
    render(<LobbyView roomList={[]} onJoinRoom={vi.fn()} />);
    expect(screen.getByText(/目前沒有房間/i)).toBeInTheDocument();
    expect(screen.getByText(/創建房間/i)).toBeInTheDocument();
  });

  it('renders room list', () => {
    render(<LobbyView roomList={mockRooms} onJoinRoom={vi.fn()} />);
    expect(screen.getByText('Room1')).toBeInTheDocument();
    expect(screen.getByText(/立即加入/i)).toBeInTheDocument();
  });

  it('opens create modal when clicking create button', async () => {
    // This test verifies interaction. Since Modal is from React-Bootstrap, we need to check if it appears.
    // Note: React-Bootstrap modals are rendered in a portal usually.
    // We check for the explicit text "創建新房間" which appears in the modal header.
    render(<LobbyView roomList={[]} onJoinRoom={vi.fn()} />);
    
    // There are two buttons, one in empty state card, one in top right (if list not empty).
    // In empty state, there is one button "創建房間".
    const createBtn = screen.getByRole('button', { name: /創建房間/i });
    fireEvent.click(createBtn);

    const modalTitle = await screen.findByText('創建新房間');
    expect(modalTitle).toBeInTheDocument();
  });
});
