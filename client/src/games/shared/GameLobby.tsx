import React from 'react';
import { Container, Card, Button, Badge } from 'react-bootstrap';

export interface GameLobbyPlayer {
  id: string;
  username: string;
  color?: string;
}

export interface GameLobbyProps {
  gameName: string;
  gameIcon: string;
  gradientColors: [string, string];
  players: GameLobbyPlayer[];
  myId: string;
  minPlayers: number;
  maxPlayers: number;
  isHost: boolean;
  onStartGame: () => void;
  rules?: string[];
  hostControls?: React.ReactNode;
}

const GameLobby: React.FC<GameLobbyProps> = ({
  gameName,
  gameIcon,
  gradientColors,
  players,
  myId,
  minPlayers,
  maxPlayers,
  isHost,
  onStartGame,
  rules = [],
  hostControls,
}) => {
  const canStart = players.length >= minPlayers;

  return (
    <Container className="py-5" style={{ maxWidth: '600px' }}>
      <Card
        className="shadow-lg border-0 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
          borderRadius: '24px',
        }}
      >
        {/* Header */}
        <div className="text-center py-4 text-white">
          <div className="display-1 mb-2">{gameIcon}</div>
          <h2 className="fw-bold mb-1">{gameName}</h2>
          <p className="opacity-75 mb-0">等待玩家加入中...</p>
        </div>

        {/* Player List */}
        <Card.Body className="bg-white mx-3 mb-3" style={{ borderRadius: '16px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-bold text-dark">👥 玩家列表</span>
            <Badge bg="primary" pill>
              {players.length} / {maxPlayers}
            </Badge>
          </div>

          <div className="d-flex flex-wrap gap-2 mb-4">
            {players.map((p, idx) => (
              <div
                key={p.id}
                className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm"
                style={{
                  backgroundColor: idx === 0 ? '#fef3c7' : '#f1f5f9',
                  border: p.id === myId ? `2px solid ${gradientColors[0]}` : 'none',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: p.color || gradientColors[0],
                  }}
                />
                <span className="fw-medium small">{p.username}</span>
                {idx === 0 && <span className="small">🏠</span>}
              </div>
            ))}
          </div>

          {/* Game Rules */}
          {rules.length > 0 && (
            <div className="bg-light p-3 rounded-3 small text-muted">
              <div className="fw-bold text-dark mb-2">📖 遊戲規則</div>
              <ul className="mb-0 ps-3">
                {rules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Host Controls (e.g., difficulty selector) */}
          {isHost && hostControls && (
            <div className="mt-3 pt-3 border-top">
              {hostControls}
            </div>
          )}
        </Card.Body>

        {/* Action Button */}
        <div className="text-center pb-4 px-4">
          {isHost ? (
            <Button
              variant="light"
              size="lg"
              className="w-100 fw-bold shadow"
              style={{ borderRadius: '12px' }}
              onClick={onStartGame}
              disabled={!canStart}
            >
              {canStart ? '🚀 開始遊戲' : `等待更多玩家 (至少 ${minPlayers} 人)`}
            </Button>
          ) : (
            <div className="text-white opacity-75">
              <div className="spinner-border spinner-border-sm me-2" />
              等待房主開始遊戲...
            </div>
          )}
        </div>
      </Card>
    </Container>
  );
};

export default GameLobby;
