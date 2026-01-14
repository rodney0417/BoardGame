import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { GAME_CONFIG, GameType } from './gameConfig';

export interface GameLobbyPlayer {
  id: string;
  username: string;
}

export interface GameLobbyProps {
  gameType: GameType;
  players: GameLobbyPlayer[];
  myId: string;
  isHost: boolean;
  onStartGame: () => void;
  hostControls?: React.ReactNode;
}

const GameLobby: React.FC<GameLobbyProps> = ({
  gameType,
  players,
  myId,
  isHost,
  onStartGame,
  hostControls,
}) => {
  const config = GAME_CONFIG[gameType];
  const canStart = players.length >= config.minPlayers;

  return (
    <Container className="py-5" style={{ maxWidth: '500px' }}>
      <Card
        className="border-0 overflow-hidden"
        style={{
          background: config.gradient,
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div className="text-center py-5">
          <div className="display-1 mb-2">{config.icon}</div>
          <h2 className="fw-bold mb-0" style={{ color: '#4a4a4a' }}>{config.name}</h2>
        </div>

        {/* Content */}
        <Card.Body className="bg-white mx-3 mb-3 p-4" style={{ borderRadius: '16px' }}>
          {/* Player Pills */}
          <div className="d-flex flex-wrap gap-2 mb-4">
            {players.map((p, idx) => (
              <div
                key={p.id}
                className="px-3 py-2 rounded-pill"
                style={{
                  background: p.id === myId ? '#f0f0f0' : '#fafafa',
                  border: p.id === myId ? `2px solid ${config.color}` : '1px solid #eee',
                }}
              >
                <span className="small fw-medium">{p.username}</span>
                {idx === 0 && <span className="ms-1 small">🏠</span>}
              </div>
            ))}
          </div>

          {/* Rules */}
          <div className="small text-muted mb-4">
            {config.rules.map((rule, idx) => (
              <div key={idx} className="mb-1">• {rule}</div>
            ))}
          </div>

          {/* Host Controls (Visible to All) */}
          {hostControls && (
            <div className="mb-4 pt-3 border-top">
              {hostControls}
            </div>
          )}

          {/* Action */}
          {isHost ? (
            <Button
              className="w-100 rounded-4 py-3 fw-bold border-0"
              style={{ background: config.gradient }}
              onClick={onStartGame}
              disabled={!canStart}
            >
              {canStart ? '開始遊戲' : `需要 ${config.minPlayers} 人以上`}
            </Button>
          ) : (
            <div className="text-center text-muted py-2">
              <div className="spinner-border spinner-border-sm me-2" />
              等待房主開始...
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default GameLobby;
