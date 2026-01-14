import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Modal, Form, Card } from 'react-bootstrap';
import { Plus, Users, Gamepad2 } from 'lucide-react';
import { RoomListInfo } from '../../types';
import { GAME_CONFIG, GameType } from '../../games/shared/gameConfig';
import GameLayout from '../../games/shared/GameLayout';

import PlayerAvatar from '../../games/shared/PlayerAvatar';

interface LobbyViewProps {
  username: string;
  roomList: RoomListInfo[];
  onJoinRoom: (roomId: string, gameType: string) => void;
  showCreateModal: boolean;
  onCloseCreateModal: () => void;
  onCreateModalOpen: () => void;
}

const LobbyView: React.FC<LobbyViewProps> = ({ 
  username,
  roomList, 
  onJoinRoom, 
  showCreateModal, 
  onCloseCreateModal,
  onCreateModalOpen
}) => {
  const [selectedGame, setSelectedGame] = useState<GameType>('pictomania');
  const [createRoomName, setCreateRoomName] = useState<string>('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCreateRoom = () => {
    if (!createRoomName) return;
    onJoinRoom(createRoomName, selectedGame);
    onCloseCreateModal();
    setCreateRoomName('');
  };

  // Right Side on Desktop / Top Side on Mobile (1:3 ratio)
  const sidebarContent = (
      <div className="d-flex flex-row flex-md-column gap-2 gap-md-3 align-items-stretch px-0 pb-0 pt-0 px-md-0 py-md-0">
          <style>
              {`
                @media (max-width: 767px) {
                    .flex-1-mobile { flex: 1 !important; min-width: 0; }
                    .flex-3-mobile { flex: 3 !important; min-width: 0; }
                }
              `}
          </style>
          
          {/* Personal Info Card (1/4 width on mobile) */}
          <Card className="border-0 shadow-sm rounded-4 bg-white flex-1-mobile">
              <Card.Body className="p-2 p-md-3 d-flex flex-column justify-content-center">
                  <div className="text-muted small fw-bold mb-2 ps-2 d-none d-md-block">個人資訊</div>
                  <PlayerAvatar 
                    username={username} 
                    showScore={false} 
                    direction={isMobile ? 'vertical' : 'horizontal'} 
                    size={isMobile ? 'sm' : 'md'}
                  />
              </Card.Body>
          </Card>

          {/* Lobby Info Card (3/4 width on mobile) */}
          <Card className="border-0 shadow-sm rounded-4 bg-white flex-3-mobile">
              <Card.Body className="p-2 p-md-3 p-xl-4 d-flex flex-column justify-content-center h-100">
                  <div className="d-flex align-items-center gap-2 mb-2 mb-md-4">
                      <div className="bg-dark text-white p-2 rounded-3 d-none d-sm-block">
                          <Gamepad2 size={isMobile ? 18 : 24} />
                      </div>
                      <div className="overflow-hidden">
                          <h6 className="fw-bold m-0 d-md-none text-truncate" style={{ fontSize: '1rem' }}>遊戲大廳</h6>
                          <h4 className="fw-bold m-0 d-none d-md-block">遊戲大廳</h4>
                          <div className="small text-muted" style={{ fontSize: '0.8rem' }}>{roomList.length} 間房</div>
                      </div>
                  </div>

                   <p className="text-secondary small mb-3 d-none d-md-block">
                      歡迎來到桌遊大廳！選擇一個房間加入，或是創建您自己的遊戲。
                  </p>

                  <Button 
                      variant="dark" 
                      size="sm" 
                      className="w-100 rounded-pill shadow-sm py-2 fw-bold mt-auto d-flex align-items-center justify-content-center gap-1"
                      onClick={onCreateModalOpen}
                      style={{ fontSize: isMobile ? '0.8rem' : 'auto' }}
                  >
                      <Plus size={isMobile ? 16 : 16} /> 
                      <span className="d-none d-sm-inline">創建房間</span>
                      <span className="d-inline d-sm-none">創建</span>
                  </Button>
              </Card.Body>
          </Card>
      </div>
  );

  // Left Side on Desktop / Bottom Side on Mobile
  const mainContent = (
      <div className="px-0 px-md-0 pb-0">
        {roomList.length === 0 ? (
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden bg-light py-5 text-center d-flex align-items-center justify-content-center">
                <Card.Body className="py-5">
                    <div className="mb-4 opacity-50">
                        <img 
                            src="https://cdn-icons-png.flaticon.com/512/7486/7486747.png" 
                            alt="Empty" 
                            width="100"
                            style={{ filter: 'grayscale(100%)' }}
                        />
                    </div>
                    <h5 className="fw-bold text-secondary mb-2">目前沒有活躍的房間</h5>
                    <p className="text-muted small">成為第一個創建房間的玩家吧！</p>
                </Card.Body>
            </Card>
        ) : (
            <Row className="g-3">
            {roomList.map((r) => {
                const game = GAME_CONFIG[r.gameType as GameType] || { icon: '🎮', name: r.gameName, color: '#6c757d', gradient: 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)' };
                const disabled = r.phase === 'playing' || r.playerCount >= r.maxPlayers;
                
                return (
                <Col xs={12} xl={6} key={r.id}>
                    <Card 
                    className={`border-0 shadow-sm rounded-4 transition-all-hover ${disabled ? 'opacity-75 grayscale' : ''}`}
                    style={{ 
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onClick={() => !disabled && onJoinRoom(r.id, r.gameType)}
                    >
                        <Card.Body className="p-3 d-flex align-items-center gap-3">
                            <div 
                                className="rounded-3 d-flex align-items-center justify-content-center text-white shrink-0"
                                style={{ 
                                    width: isMobile ? '60px' : '80px', 
                                    height: isMobile ? '60px' : '80px', 
                                    background: game.gradient,
                                    fontSize: isMobile ? '1.5rem' : '2rem'
                                }}
                            >
                                {game.icon}
                            </div>
                            
                            <div className="flex-grow-1 overflow-hidden">
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                    <h6 className="fw-bold m-0 text-truncate text-dark">{r.id}</h6>
                                    {r.ownerName && <span className="badge bg-light text-secondary fw-normal small">{r.ownerName}</span>}
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className={`badge rounded-pill ${r.phase === 'playing' ? 'bg-secondary' : 'bg-success'} fw-normal`}>
                                        {r.phase === 'playing' ? '遊戲中' : '等待中'}
                                    </span>
                                    <span className="text-muted small d-flex align-items-center gap-1">
                                        <Users size={12} />
                                        {r.playerCount}/{r.maxPlayers}
                                    </span>
                                    <span className="badge bg-light text-muted border fw-normal small ms-auto">
                                        {game.name}
                                    </span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                );
            })}
            </Row>
        )}
      </div>
  );

  return (
    <>
     <GameLayout
        sidebar={sidebarContent}
        main={mainContent}
        reverseMobile={true} 
     />

      {/* Floating Action Button for Mobile */}
      <Button
        variant="dark"
        className="d-lg-none position-fixed bottom-0 end-0 m-4 rounded-circle shadow-lg d-flex align-items-center justify-content-center"
        style={{ width: '60px', height: '60px', zIndex: 1050 }}
        onClick={onCreateModalOpen}
      >
        <Plus size={30} />
      </Button>

      {/* Create Modal */}
      <Modal show={showCreateModal} onHide={onCloseCreateModal} centered contentClassName="rounded-4 border-0 overflow-hidden">
        <Modal.Body className="p-0">
          <div 
            className="text-center py-5 position-relative overflow-hidden"
            style={{ 
              background: GAME_CONFIG[selectedGame].gradient,
            }}
          >
            <div className="display-1 mb-2 position-relative" style={{ zIndex: 2 }}>{GAME_CONFIG[selectedGame].icon}</div>
            <h4 className="fw-bold mb-0 position-relative" style={{ color: '#4a4a4a', zIndex: 2 }}>創建房間</h4>
             <div 
                className="position-absolute translate-middle rounded-circle bg-white opacity-25"
                style={{ width: '300px', height: '300px', top: '50%', left: '50%' }}
             />
          </div>
          
          <div className="p-4 bg-white">
            <div className="d-flex gap-2 mb-4">
              {(Object.keys(GAME_CONFIG) as GameType[]).map((key) => {
                const info = GAME_CONFIG[key];
                return (
                  <div
                    key={key}
                    className="flex-fill text-center py-3 rounded-4 cursor-pointer transition-all"
                    style={{ 
                      background: selectedGame === key ? '#f8f9fa' : 'transparent',
                      border: selectedGame === key ? `2px solid ${info.color}` : '2px solid transparent',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedGame(key)}
                  >
                    <div className="fs-3 mb-1">{info.icon}</div>
                    <div className="small fw-bold text-dark">{info.name}</div>
                  </div>
                );
              })}
            </div>
            
            <Form.Control
              type="text"
              placeholder="給房間取個名字..."
              value={createRoomName}
              onChange={(e) => setCreateRoomName(e.target.value)}
              className="rounded-4 px-4 py-3 mb-4 border-light bg-light form-control-lg"
              autoFocus
            />
            
            <Button
              className="w-100 rounded-pill py-3 fw-bold border-0 shadow-sm"
              style={{ background: GAME_CONFIG[selectedGame].gradient }}
              onClick={handleCreateRoom}
              disabled={!createRoomName}
            >
              立即開始
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <style>
        {`
            .transition-all-hover:hover {
                transform: translateY(-3px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.08) !important;
            }
            .grayscale {
                filter: grayscale(1);
            }
        `}
      </style>
    </>
  );
};

export default LobbyView;
