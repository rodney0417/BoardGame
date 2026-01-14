import React from 'react';
import { Container, Card, Button, Badge } from 'react-bootstrap';
import { GAME_CONFIG, GameType } from './gameConfig';

export interface GameOverPlayer {
  id: string;
  username: string;
  score: number;
}

export interface GameOverProps {
  gameType: GameType;
  players: GameOverPlayer[];
  winner?: GameOverPlayer;
  onRestart: () => void;
  onBackToLobby?: () => void;
  children?: React.ReactNode;  // For game-specific content (e.g., Pictomania artwork)
}

const GameOver: React.FC<GameOverProps> = ({
  gameType,
  players,
  winner,
  onRestart,
  onBackToLobby,
  children,
}) => {
  const config = GAME_CONFIG[gameType];
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const topPlayer = winner || sortedPlayers[0];

  return (
    <Container className="py-5" style={{ maxWidth: '600px' }}>
      <Card
        className="border-0 overflow-hidden text-center"
        style={{
          background: config.gradient,
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div className="py-5">
          <div className="display-1 mb-2">🏆</div>
          <h2 className="fw-bold mb-0" style={{ color: '#4a4a4a' }}>遊戲結束</h2>
        </div>

        {/* Content */}
        <Card.Body className="bg-white mx-3 mb-3 p-4" style={{ borderRadius: '16px' }}>
          {/* Winner */}
          {topPlayer && (
            <div className="mb-4">
              <div className="small text-muted mb-1">冠軍</div>
              <h3 className="fw-bold mb-1">{topPlayer.username}</h3>
              <Badge bg="success" className="rounded-pill px-3 py-2 fs-6">
                {topPlayer.score} 分
              </Badge>
            </div>
          )}

          {/* Leaderboard */}
          <div className="mb-4">
            {sortedPlayers.map((p, idx) => (
              <div 
                key={p.id}
                className="d-flex align-items-center justify-content-between py-2 border-bottom"
              >
                <div className="d-flex align-items-center gap-2">
                  <span className="small text-muted" style={{ width: '20px' }}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                  </span>
                  <span className="fw-medium">{p.username}</span>
                </div>
                <span className="fw-bold">{p.score}</span>
              </div>
            ))}
          </div>

          {/* Game-specific content */}
          {children}

          {/* Actions */}
          <div className="d-flex gap-2">
            <Button
              className="flex-fill rounded-4 py-3 fw-bold border-0"
              style={{ background: config.gradient }}
              onClick={onRestart}
            >
              再來一局
            </Button>
            {onBackToLobby && (
              <Button
                variant="outline-secondary"
                className="rounded-4 py-3"
                onClick={onBackToLobby}
              >
                返回大廳
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default GameOver;
