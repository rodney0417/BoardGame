import React, { useState } from 'react';
import { Container, Row, Col, Button, Modal, Form } from 'react-bootstrap';
import { RoomListInfo } from '../../types';
import { GAME_CONFIG, GameType } from '../../games/shared/gameConfig';

interface LobbyViewProps {
  roomList: RoomListInfo[];
  onJoinRoom: (roomId: string, gameType: string) => void;
  showCreateModal: boolean;
  onCloseCreateModal: () => void;
}

const LobbyView: React.FC<LobbyViewProps> = ({ roomList, onJoinRoom, showCreateModal, onCloseCreateModal }) => {
  const [selectedGame, setSelectedGame] = useState<GameType>('pictomania');
  const [createRoomName, setCreateRoomName] = useState<string>('');

  const handleCreateRoom = () => {
    if (!createRoomName) return;
    onJoinRoom(createRoomName, selectedGame);
    onCloseCreateModal();
    setCreateRoomName('');
  };

  return (
    <Container className="py-5" style={{ maxWidth: '800px' }}>
      {roomList.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <div className="display-1 mb-3 opacity-25">🎮</div>
          <p>目前沒有房間</p>
        </div>
      ) : (
        <Row className="g-3">
          {roomList.map((r) => {
            const game = GAME_CONFIG[r.gameType as GameType] || { icon: '🎮', name: r.gameName, color: '#6c757d' };
            const disabled = r.phase === 'playing' || r.playerCount >= r.maxPlayers;
            
            return (
              <Col xs={12} sm={6} key={r.id}>
                <div 
                  className={`p-4 rounded-4 ${disabled ? 'opacity-50' : ''}`}
                  style={{ 
                    background: '#fff',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                  onClick={() => !disabled && onJoinRoom(r.id, r.gameType)}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fs-4">{game.icon}</span>
                    <span className="small text-muted">{r.playerCount}/{r.maxPlayers}</span>
                  </div>
                  <div className="fw-bold text-truncate">{r.id}</div>
                  <div className="small text-muted">
                    {r.phase === 'playing' ? '遊戲中' : '等待中'}
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Create Modal */}
      <Modal show={showCreateModal} onHide={onCloseCreateModal} centered>
        <Modal.Body className="p-0 overflow-hidden">
          {/* Header with gradient */}
          <div 
            className="text-center py-5"
            style={{ 
              background: GAME_CONFIG[selectedGame].gradient,
            }}
          >
            <div className="display-3 mb-2">{GAME_CONFIG[selectedGame].icon}</div>
            <h4 className="fw-bold mb-0" style={{ color: '#4a4a4a' }}>創建房間</h4>
          </div>
          
          <div className="p-4">
            {/* Game Selector */}
            <div className="d-flex gap-2 mb-4">
              {(Object.keys(GAME_CONFIG) as GameType[]).map((key) => {
                const info = GAME_CONFIG[key];
                return (
                  <div
                    key={key}
                    className="flex-fill text-center py-3 rounded-4"
                    style={{ 
                      background: selectedGame === key ? '#f8f6f3' : 'transparent',
                      border: selectedGame === key ? '2px solid #e5e0db' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => setSelectedGame(key)}
                  >
                    <div className="fs-3 mb-1">{info.icon}</div>
                    <div className="small fw-medium text-dark">{info.name}</div>
                  </div>
                );
              })}
            </div>
            
            {/* Room Name Input */}
            <Form.Control
              type="text"
              placeholder="輸入房間名稱..."
              value={createRoomName}
              onChange={(e) => setCreateRoomName(e.target.value)}
              className="rounded-4 px-4 py-3 mb-4 border-0"
              style={{ background: '#f8f6f3', fontSize: '1.1rem' }}
              autoFocus
            />
            
            {/* Create Button */}
            <Button
              className="w-100 rounded-4 py-3 fw-bold border-0"
              style={{ background: GAME_CONFIG[selectedGame].gradient }}
              onClick={handleCreateRoom}
              disabled={!createRoomName}
            >
              開始遊戲
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default LobbyView;
