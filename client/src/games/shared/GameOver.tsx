import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Trophy, Users, RotateCcw, Home, Info } from 'lucide-react';
import { GAME_CONFIG, GameType } from './gameConfig';
import GameLayout from './GameLayout';

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

  const sidebarContent = (
    <>
      <div className="text-center mb-4 p-4 rounded-4 shadow-sm border" style={{ background: config.gradient }}>
        <div className="display-4 mb-2">{config.icon}</div>
        <h4 className="fw-bold m-0 text-dark">遊戲結束</h4>
      </div>

      <div className="flex-grow-1">
        <h6 className="m-0 fw-bold text-secondary d-flex align-items-center gap-2 mb-3 px-2">
            <Users size={18} /> 最終排行榜
        </h6>

        <div className="d-flex flex-column gap-2 mb-4">
            {sortedPlayers.map((p, idx) => (
              <div
                key={p.id}
                className="p-3 rounded-4 d-flex align-items-center justify-content-between transition-all bg-white border shadow-sm"
                style={{
                  borderLeft: idx === 0 ? '4px solid #ffd700' : '1px solid #eee'
                }}
              >
                <div className="d-flex align-items-center gap-3">
                    <span className="fs-5">
                       {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                    </span>
                    <span className="fw-bold text-dark">{p.username}</span>
                </div>
                <Badge bg="light" text="dark" className="border px-3 py-2">
                    {p.score} 分
                </Badge>
              </div>
            ))}
        </div>
      </div>

      {onBackToLobby && (
        <div className="mt-auto pt-4 border-top">
            <Button 
                variant="outline-secondary" 
                className="w-100 rounded-pill py-2 shadow-sm d-flex align-items-center justify-content-center gap-2 mb-3"
                onClick={onBackToLobby}
            >
                <Home size={18} /> 返回大廳
            </Button>
            <Button 
                variant="dark" 
                className="w-100 rounded-pill py-3 shadow-sm d-flex align-items-center justify-content-center gap-2 fw-bold"
                onClick={onRestart}
            >
                <RotateCcw size={18} /> 再來一局
            </Button>
        </div>
      )}
    </>
  );

  const mainContent = (
    <div className="d-flex flex-column gap-4">
        <Card className="border-0 shadow-lg rounded-4 overflow-hidden text-center bg-white p-5">
            <div className="mb-4">
                <div className="display-1 mb-3 animate-bounce">🏆</div>
                <h1 className="fw-black text-dark display-5 mb-2">勝利屬於：{topPlayer?.username}</h1>
                <p className="text-muted fs-4">恭喜獲得本場冠軍！</p>
            </div>
            
            <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-pill px-5 py-3 border shadow-inner">
                <span className="text-secondary fw-bold me-2 fs-5">最終得分：</span>
                <span className="text-dark fw-black display-6" style={{ color: config.color }}>{topPlayer?.score}</span>
            </div>
        </Card>

        {children && (
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="bg-light p-3 border-bottom d-flex align-items-center gap-2">
                    <Info size={20} className="text-primary" />
                    <h6 className="m-0 fw-bold">遊戲結算回顧</h6>
                </div>
                <Card.Body className="p-4">
                    {children}
                </Card.Body>
            </Card>
        )}
    </div>
  );

  return (
    <GameLayout
      maxWidth="1400px"
      sidebar={sidebarContent}
      main={mainContent}
      reverseMobile={true}
    />
  );
};

export default GameOver;
