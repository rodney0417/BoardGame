import React from 'react';
import { Socket } from 'socket.io-client';
import { RoomDTO, BasePlayer } from '../../types';
import GAME_COMPONENTS from '../../games';
import { GameLobby, GameOver, GameType } from '../../games/shared';

interface GameSessionViewProps {
  socket: Socket;
  activeRoom: RoomDTO;
  me: BasePlayer;
  onLeaveRoom: () => void;
}

const GameSessionView: React.FC<GameSessionViewProps> = ({
  socket,
  activeRoom,
  me,
  onLeaveRoom,
}) => {
  // Enforce GameLobby for waiting phase
  if (activeRoom.phase === 'waiting' || !activeRoom.phase) {
    return (
      <GameLobby
        gameType={activeRoom.gameType as GameType}
        players={activeRoom.players.map((p) => ({
          id: p.id,
          username: p.username,
        }))}
        myId={me.id}
        isHost={activeRoom.players[0]?.id === me.id}
        onStartGame={() => {
          socket.emit('game_action', {
            roomId: activeRoom.id,
            action: 'start_game',
            data: {},
          });
        }}
        onLeave={onLeaveRoom}
      />
    );
  }

  // Enforce GameOver for game_over phase
  if (activeRoom.phase === 'game_over') {
    const gameState = activeRoom.gameState as any;
    const players = activeRoom.players || [];

    // Merge generic player data with game-specific state (score)
    // Use gameState.players if available for scores, as room.players might be stale on scores
    const finalPlayers = players.map((p) => ({
      id: p.id,
      username: p.username,
      score: gameState.players?.[p.id]?.score || p.score || 0,
    }));

    // Determine winner from state.winner (Standard)
    const winnerId = gameState.winner;
    let winner = finalPlayers.find((p) => p.id === winnerId);

    // Fallback: If no winnerId (legacy/non-standard), try to guess?
    // For Take6 (Low score wins), Uno (High score/Empty hand).
    // Best is to require server to set winner.
    // If not found, GameOver handles undefined winner gracefully (shows just list).

    return (
      <GameOver
        gameType={activeRoom.gameType as GameType}
        players={finalPlayers}
        winner={winner}
        onRestart={() =>
          socket.emit('game_action', {
            roomId: activeRoom.id,
            action: 'start_game',
            data: {},
          })
        }
        onBackToLobby={onLeaveRoom}
      />
    );
  }

  const GameComponent = GAME_COMPONENTS[activeRoom.gameType || ''];

  if (!GameComponent) {
    return (
      <div className="text-center py-5 text-white">
        <h3>未知的遊戲類型: {activeRoom.gameType}</h3>
        <button className="btn btn-outline-light mt-3" onClick={onLeaveRoom}>
          回到大廳
        </button>
      </div>
    );
  }

  return <GameComponent socket={socket} room={activeRoom} me={me} onLeaveRoom={onLeaveRoom} />;
};

export default GameSessionView;
