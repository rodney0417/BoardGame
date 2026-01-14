import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlayerList from '../components/PlayerList';
import { PictomaniaPlayer } from '../types';
import React from 'react';

const createMockPlayer = (overrides: Partial<PictomaniaPlayer> = {}): PictomaniaPlayer => ({
  id: 'player-1',
  peerId: 'peer-1',
  username: 'TestPlayer',
  color: '#e74c3c',
  score: 10,
  disconnected: false,
  isDoneDrawing: false,
  isDoneGuessing: false,
  myGuesses: [],
  targetWord: '',
  guessedCorrectlyBy: [],
  ...overrides,
});

describe('PlayerList', () => {
  const mockCanvasRefs = { current: {} };
  const mockOnGuessClick = vi.fn();

  it('should render player username and score', () => {
    const players = [createMockPlayer({ username: 'Alice', score: 25 })];
    const me = createMockPlayer({ id: 'me-id' });

    render(
      <PlayerList
        otherPlayers={players}
        me={me}
        phase="waiting"
        canvasRefs={mockCanvasRefs as any}
        onGuessClick={mockOnGuessClick}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('得分: 25')).toBeInTheDocument();
  });

  it('should show disconnected badge when player is disconnected', () => {
    const players = [createMockPlayer({ disconnected: true })];
    const me = createMockPlayer({ id: 'me-id' });

    render(
      <PlayerList
        otherPlayers={players}
        me={me}
        phase="playing"
        canvasRefs={mockCanvasRefs as any}
        onGuessClick={mockOnGuessClick}
      />
    );

    expect(screen.getByText('斷線')).toBeInTheDocument();
  });

  it('should show empty state when no other players', () => {
    const me = createMockPlayer({ id: 'me-id' });

    render(
      <PlayerList
        otherPlayers={[]}
        me={me}
        phase="waiting"
        canvasRefs={mockCanvasRefs as any}
        onGuessClick={mockOnGuessClick}
      />
    );

    expect(screen.getByText('暫無其他玩家加入')).toBeInTheDocument();
  });

  it('should show guess button when playing and done drawing', async () => {
    const players = [createMockPlayer({ id: 'player-1', username: 'Bob' })];
    const me = createMockPlayer({ id: 'me-id', isDoneDrawing: true, isDoneGuessing: false });

    render(
      <PlayerList
        otherPlayers={players}
        me={me}
        phase="playing"
        canvasRefs={mockCanvasRefs as any}
        onGuessClick={mockOnGuessClick}
      />
    );

    const guessButton = screen.getByRole('button', { name: '猜他' });
    expect(guessButton).toBeInTheDocument();

    await userEvent.click(guessButton);
    expect(mockOnGuessClick).toHaveBeenCalledWith(players[0]);
  });
});
