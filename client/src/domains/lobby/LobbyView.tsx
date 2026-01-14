import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Modal, Form } from 'react-bootstrap';
import { RoomListInfo } from '../../types';
import { PLAYER_COLORS } from '../../constants';

interface LobbyViewProps {
  roomList: RoomListInfo[];
  onJoinRoom: (roomId: string, gameType: string, color?: string, drawTime?: number) => void;
  showCreateModal: boolean;
  onCloseCreateModal: () => void;
}

const LobbyView: React.FC<LobbyViewProps> = ({ roomList, onJoinRoom, showCreateModal, onCloseCreateModal }) => {
  // UI States for Modals
  const [selectedGame, setSelectedGame] = useState<string>('pictomania');
  const [activeColor, setActiveColor] = useState<string>(PLAYER_COLORS[0]);
  const [selectedDrawTime, setSelectedDrawTime] = useState<number>(60);
  
  const [showColorModal, setShowColorModal] = useState<boolean>(false);
  const [showTimeModal, setShowTimeModal] = useState<boolean>(false);
  
  const [createRoomName, setCreateRoomName] = useState<string>('');
  const [pendingRoom, setPendingRoom] = useState<any | null>(null);

  const handleJoinClick = (room: any, isCreating: boolean = false) => {
    if (!room) return;
    
    // Setup pending room state
    setPendingRoom({ ...room, gameName: room.gameName || '妙筆神猜', isCreating });

    if (room.gameType === 'pictomania') {
      if (isCreating) {
        setShowTimeModal(true);
      } else {
        // Direct join for Pictomania (no color selection needed)
        onJoinRoom(room.id, room.gameType);
      }
    } else {
      // Direct join for other games like UNO
      onJoinRoom(room.id, room.gameType);
    }
  };

  const confirmJoin = () => {
      if (!pendingRoom) return;
      
      onJoinRoom(
          pendingRoom.id,
          pendingRoom.gameType,
          activeColor,
          pendingRoom.isCreating ? selectedDrawTime : undefined
      );

      // Close all modals
      setShowColorModal(false);
      setShowTimeModal(false);
      onCloseCreateModal();
      setPendingRoom(null);
  };

  return (
    <Container className="py-4">
      {/* Room List Grid */}
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          {roomList.length === 0 ? (
            <Card className="custom-card p-5 border-0 text-center text-muted">
              <p className="m-0">目前沒有房間，來創一個吧！</p>
            </Card>
          ) : (
             <Row className="g-4">
              {roomList.map((r) => (
                <Col xl={6} key={r.id}>
                  <Card className="custom-card border-0 h-100" style={{ minHeight: '220px' }}>
                    <Card.Body className="p-4 d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h5 className="fw-bold mb-1 text-truncate" style={{ maxWidth: '180px' }}>
                            {r.id}
                          </h5>
                          <Badge bg="info" pill>{r.gameName}</Badge>
                          {r.gameType === 'pictomania' && r.settings?.drawTime && (
                            <Badge bg="warning" text="dark" pill className="ms-1">
                              ⏱️ {r.settings.drawTime}s
                            </Badge>
                          )}
                        </div>
                        <Badge
                          bg={r.playerCount >= r.maxPlayers ? 'danger' : 'secondary'}
                          className="rounded-pill px-3"
                        >
                          {r.playerCount} / {r.maxPlayers} 人
                        </Badge>
                      </div>
                      
                       {r.gameType === 'pictomania' && (
                        <div className="mb-4 d-flex gap-2">
                          {PLAYER_COLORS.map((c) => (
                            <div
                              key={c}
                              style={{
                                width: '14px', height: '14px', backgroundColor: c, borderRadius: '50%',
                                opacity: r.takenColors?.includes(c) ? 1 : 0.1,
                                border: '1px solid rgba(0,0,0,0.1)',
                              }}
                            />
                          ))}
                        </div>
                      )}

                      <div className="d-grid mt-auto">
                        <Button
                          variant={r.phase === 'playing' || r.playerCount >= r.maxPlayers ? 'outline-secondary' : 'primary'}
                          disabled={r.phase === 'playing' || r.playerCount >= r.maxPlayers}
                          onClick={() => handleJoinClick(r)}
                          className="fw-bold rounded-pill"
                        >
                          {r.phase === 'playing' ? '遊戲中' : r.playerCount >= r.maxPlayers ? '已滿' : '立即加入'}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>

      {/* Create Modal */}
      <Modal show={showCreateModal} onHide={onCloseCreateModal} centered>
        <Modal.Header closeButton className="border-0 bg-white">
          <Modal.Title className="fw-bold">創建新房間</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 bg-white">
          <Form.Group className="mb-3">
            <Form.Label className="text-muted">選擇遊戲</Form.Label>
            <Form.Select value={selectedGame} onChange={(e: any) => setSelectedGame(e.target.value)}>
              <option value="pictomania">🎨 妙筆神猜</option>
              <option value="uno">🎴 UNO</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="text-muted">房間名稱</Form.Label>
            <Form.Control
              type="text"
              placeholder="輸入房間名..."
              value={createRoomName}
              onChange={(e: any) => setCreateRoomName(e.target.value)}
              autoFocus
            />
          </Form.Group>
          <Button
            className="w-100 fw-bold rounded-pill mt-3"
            variant="success"
            size="lg"
            onClick={() => {
              handleJoinClick(
                {
                  id: createRoomName,
                  gameType: selectedGame,
                  gameName: selectedGame === 'pictomania' ? '妙筆神猜' : selectedGame === 'uno' ? 'UNO' : '',
                  takenColors: [],
                  playerCount: 0,
                  maxPlayers: 6,
                  gameState: 'waiting',
                },
                true,
              );
              onCloseCreateModal();
              setCreateRoomName('');
            }}
            disabled={!createRoomName}
          >
            {selectedGame === 'uno' ? '建立房間' : '下一步：設定規則'}
          </Button>
        </Modal.Body>
      </Modal>
        
     {/* Time Modal */}
      <Modal show={showTimeModal} onHide={() => setShowTimeModal(false)} centered>
        <Modal.Header closeButton className="border-0 bg-white">
          <Modal.Title className="fw-bold">設定遊戲規則</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-4 bg-white">
          <p className="text-muted mb-4">請選擇每一輪的<strong>畫畫時間</strong></p>
          <div className="d-flex justify-content-center gap-3 mb-4">
            {[30, 60, 90].map((time) => (
              <Button
                key={time}
                variant={selectedDrawTime === time ? 'primary' : 'outline-secondary'}
                onClick={() => setSelectedDrawTime(time)}
                className="py-3 px-4 fw-bold rounded-pill"
              >
                {time}s
              </Button>
            ))}
          </div>
          <Button
            variant="success"
            size="lg"
            className="w-100 fw-bold rounded-pill"
            onClick={() => {
              setShowTimeModal(false);
              confirmJoin();
            }}
          >
            確認設定
          </Button>
        </Modal.Body>
      </Modal>

      {/* Color Modal */}
      <Modal show={showColorModal} onHide={() => setShowColorModal(false)} centered>
        <Modal.Header closeButton className="border-0 bg-white">
          <Modal.Title className="fw-bold">挑選顏色</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-4 bg-white">
          <p className="text-muted mb-4">選擇您的<strong>代表色</strong></p>
          <div className="d-flex justify-content-center gap-3 mb-4">
            {PLAYER_COLORS.map((c) => {
              const isTaken = pendingRoom?.takenColors?.includes(c);
              return (
                <div
                  key={c}
                  onClick={() => !isTaken && setActiveColor(c)}
                  style={{
                    width: '45px', height: '45px', backgroundColor: c, borderRadius: '50%',
                    cursor: isTaken ? 'not-allowed' : 'pointer',
                    border: activeColor === c ? '4px solid #333' : '2px solid transparent',
                    opacity: isTaken ? 0.2 : 1,
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                >
                  {isTaken && <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' }}>✕</span>}
                </div>
              );
            })}
          </div>
          <Button
            variant="primary"
            size="lg"
            className="w-100 fw-bold rounded-pill shadow-sm"
            onClick={confirmJoin}
          >
            {pendingRoom?.isCreating ? '建立房間' : '進入房間'}
          </Button>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default LobbyView;
