import React from 'react';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { Users, Info, Play, LogOut } from 'lucide-react';
import { GAME_CONFIG, GameType } from './gameConfig';
import GameLayout from './GameLayout';

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
  onLeave: () => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({
  gameType,
  players,
  myId,
  isHost,
  onStartGame,
  hostControls,
  onLeave,
}) => {
  const config = GAME_CONFIG[gameType];
  const canStart = players.length >= config.minPlayers;

  const sidebarContent = (
    <>
      {/* Game Title */}
      <div
        className="text-center mb-0 mb-md-3 p-4 rounded-4 shadow-sm border"
        style={{ background: config.gradient }}
      >
        <div className="display-4 mb-2">{config.icon}</div>
        <h4 className="fw-bold m-0 text-dark">{config.name}</h4>
      </div>

      {/* Leave Button - Desktop only */}
      <div className="mt-auto d-none d-md-block">
        <Button
          variant="outline-danger"
          className="w-100 rounded-pill py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
          onClick={onLeave}
        >
          <LogOut size={18} /> 離開房間
        </Button>
      </div>
    </>
  );

  const mainContent = (
    <div className="d-flex flex-column gap-3 gap-md-4">
      {/* Combined Player List + Waiting Status Card - Now at top of main */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom bg-light">
          <h6 className="m-0 fw-bold text-secondary d-flex align-items-center gap-2">
            <Users size={18} /> 玩家列表
          </h6>
          <Badge bg="light" text="dark" className="border">
            {players.length} / {config.maxPlayers}
          </Badge>
        </div>

        <Card.Body className="p-3">
          {/* Player List - Horizontal on desktop, vertical on mobile */}
          <div className="d-flex flex-wrap gap-2 mb-3">
            {players.map((p, idx) => (
              <div
                key={p.id}
                className="p-2 px-3 rounded-3 d-flex align-items-center gap-2"
                style={{
                  background: p.id === myId ? '#f8f9fa' : 'white',
                  border: p.id === myId ? `2px solid ${config.color}` : '1px solid #eee',
                }}
              >
                <span className="fw-medium text-dark">{p.username}</span>
                {p.id === myId && (
                  <Badge bg="primary" className="rounded-pill" style={{ fontSize: '0.6rem' }}>
                    您
                  </Badge>
                )}
                {idx === 0 && <span className="small opacity-50">🏠</span>}
              </div>
            ))}
          </div>

          {/* Waiting Status + Start Button */}
          <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 pt-3 border-top">
            <div className="text-center text-md-start">
              {!canStart ? (
                <div className="d-flex align-items-center gap-2 text-muted">
                  <div
                    className="spinner-grow text-secondary"
                    role="status"
                    style={{ width: '1rem', height: '1rem' }}
                  ></div>
                  <span className="fw-bold small">
                    等待更多玩家... 還需要 {config.minPlayers - players.length} 位
                  </span>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2 text-success">
                  <Play size={18} />
                  <span className="fw-bold small">準備就緒！{!isHost && '等待房主開始遊戲'}</span>
                </div>
              )}
            </div>

            {isHost && (
              <Button
                className="rounded-pill px-4 py-2 fw-bold border-0 shadow-sm"
                style={{
                  background: config.gradient,
                  opacity: canStart ? 1 : 0.6,
                }}
                onClick={onStartGame}
                disabled={!canStart}
              >
                {canStart ? '立即開始遊戲' : `等待玩家 (${players.length}/${config.minPlayers})`}
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>

      <Row className="g-3 g-md-4">
        {/* Rules Section */}
        <Col xs={12} lg={hostControls ? 6 : 12}>
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden h-100">
            <div className="bg-light p-3 border-bottom d-flex align-items-center gap-2">
              <Info size={20} className="text-primary" />
              <h6 className="m-0 fw-bold">遊戲規則</h6>
            </div>
            <Card.Body className="p-3 p-md-4">
              <div className="row g-3">
                {config.rules.map((rule, idx) => (
                  <div key={idx} className="col-12">
                    <div
                      className="p-3 bg-light rounded-3 h-100 border-start border-4"
                      style={{ borderColor: config.color }}
                    >
                      <div className="small text-dark">{rule}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Host Controls Section */}
        {hostControls && (
          <Col xs={12} lg={6}>
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden h-100">
              <div className="bg-light p-3 border-bottom d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <Users size={20} className="text-secondary" />
                  <h6 className="m-0 fw-bold">遊戲設定</h6>
                </div>
                {isHost ? (
                  <span className="badge bg-primary rounded-pill bg-opacity-10 text-primary fw-normal border border-primary-subtle">
                    房主控制
                  </span>
                ) : (
                  <span className="badge bg-secondary rounded-pill bg-opacity-25 text-secondary fw-normal">
                    僅房主可修改
                  </span>
                )}
              </div>
              <Card.Body className="p-3 p-md-4">{hostControls}</Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* Leave Button - Mobile only, at bottom */}
      <div className="d-md-none">
        <Button
          variant="outline-danger"
          className="w-100 rounded-pill py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
          onClick={onLeave}
        >
          <LogOut size={18} /> 離開房間
        </Button>
      </div>
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

export default GameLobby;
