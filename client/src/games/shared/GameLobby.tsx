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
      <div className="text-center mb-4 p-4 rounded-4 shadow-sm border" style={{ background: config.gradient }}>
        <div className="display-4 mb-2">{config.icon}</div>
        <h4 className="fw-bold m-0 text-dark">{config.name}</h4>
      </div>

      <div className="flex-grow-1">
        <div className="d-flex align-items-center justify-content-between mb-3 px-2">
            <h6 className="m-0 fw-bold text-secondary d-flex align-items-center gap-2">
                <Users size={18} /> 玩家列表
            </h6>
            <Badge bg="light" text="dark" className="border">
                {players.length} / {config.maxPlayers}
            </Badge>
        </div>

        <div className="d-flex flex-column gap-2 mb-4">
            {players.map((p, idx) => (
              <div
                key={p.id}
                className="p-3 rounded-4 d-flex align-items-center justify-content-between transition-all"
                style={{
                  background: p.id === myId ? '#f8f9fa' : 'white',
                  border: p.id === myId ? `2px solid ${config.color}` : '1px solid #eee',
                }}
              >
                <div className="d-flex align-items-center gap-2">
                    <span className="fw-medium text-dark">{p.username}</span>
                    {p.id === myId && <Badge bg="primary" className="rounded-pill" style={{ fontSize: '0.6rem' }}>您</Badge>}
                </div>
                {idx === 0 && <span className="small opacity-50">🏠 房主</span>}
              </div>
            ))}
        </div>
      </div>

      <div className="mt-auto pt-4">
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
                    <div className="p-3 bg-light rounded-3 h-100 border-start border-4" style={{ borderColor: config.color }}>
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
              <div className="bg-light p-3 border-bottom d-flex align-items-center gap-2">
                <Users size={20} className="text-secondary" />
                <h6 className="m-0 fw-bold">遊戲設定 (僅房主可修改)</h6>
              </div>
              <Card.Body className="p-3 p-md-4">
                {hostControls}
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* Entry Status Section */}
      <div className="mt-2 mt-md-4 py-4 py-md-5 text-center bg-white rounded-4 shadow-sm border border-dashed border-2">
        <div className="mb-3 mb-md-4">
          {!canStart ? (
            <div className="text-muted">
              <div className="spinner-grow text-secondary mb-3" role="status" style={{ width: '2rem', height: '2rem' }}></div>
              <h5 className="fw-bold fs-6 fs-md-5">等待更多玩家加入...</h5>
              <p className="small mb-0">還需要至少 {config.minPlayers - players.length} 位玩家</p>
            </div>
          ) : (
            <div className="text-success">
              <div className="mb-2 mb-md-3">
                <Play size={32} className="animate-bounce" />
              </div>
              <h5 className="fw-bold fs-6 fs-md-5">準備就緒！</h5>
              <p className="small text-muted mb-0">{isHost ? '您可以點擊下方按鈕開始遊戲' : '等待房主開始遊戲...'}</p>
            </div>
          )}
        </div>

        {isHost && (
          <Button
            size="lg"
            className="rounded-pill px-4 px-md-5 py-2 py-md-3 fw-bold border-0 shadow transition-all scale-hover"
            style={{ 
              background: config.gradient,
              minWidth: '200px',
              transform: canStart ? 'scale(1.05)' : 'none',
              opacity: canStart ? 1 : 0.6
            }}
            onClick={onStartGame}
            disabled={!canStart}
          >
            {canStart ? '立即開始遊戲' : `等待玩家 (${players.length}/${config.minPlayers})`}
          </Button>
        )}
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
