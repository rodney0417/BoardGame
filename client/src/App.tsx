import React, { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  Card,
  Badge,
  Navbar,
  Modal,
  Toast,
  ToastContainer,
} from 'react-bootstrap';
import './index.css';

// 匯入遊戲註冊表
import GAME_COMPONENTS from './games';
import { RoomDTO, RoomListInfo } from './types';
import { PLAYER_COLORS } from './constants';

const getPeerId = (): string => {
  let id = localStorage.getItem('pictomania_peerId');
  if (!id) {
    id = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('pictomania_peerId', id);
  }
  return id;
};

const socket: Socket = io();
const peerId = getPeerId();

function App() {
  const savedUsername = localStorage.getItem('pictomania_username') || '';
  const savedRoomId = localStorage.getItem('pictomania_current_room') || '';

  const [appState, setAppState] = useState<'login' | 'lobby' | 'room'>(
    savedUsername ? 'lobby' : 'login',
  );
  const [username, setUsername] = useState<string>(savedUsername);
  const [roomId, setRoomId] = useState<string>(savedRoomId);
  const [activeRoom, setActiveRoom] = useState<RoomDTO | null>(null);

  // Lobby UI states
  const [selectedGame, setSelectedGame] = useState<string>('pictomania');
  const [selectedColor, setSelectedColor] = useState<string>(PLAYER_COLORS[0]);
  const [selectedDrawTime, setSelectedDrawTime] = useState<number>(60);
  const [showColorModal, setShowColorModal] = useState<boolean>(false);
  const [showTimeModal, setShowTimeModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createRoomName, setCreateRoomName] = useState<string>('');
  const [pendingRoom, setPendingRoom] = useState<any | null>(null);
  const [roomList, setRoomList] = useState<RoomListInfo[]>([]);
  const [toasts, setToasts] = useState<any[]>([]);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(
    !!localStorage.getItem('pictomania_current_room'),
  );

  const [mySocketId, setMySocketId] = useState<string | null>(null);

  useEffect(() => {
    // Safety timeout: stop loading if server doesn't respond in 2s
    const timer = setTimeout(() => setIsCheckingAuth(false), 2000);

    const handleConnect = () => {
      setMySocketId(socket.id || null);
      // 嘗試自動重連
      const currentSavedRoom = localStorage.getItem('pictomania_current_room');
      const currentSavedName = localStorage.getItem('pictomania_username');
      const currentSavedGameType = localStorage.getItem('pictomania_game_type');

      if (currentSavedRoom && currentSavedName) {
        // isCheckingAuth is already true
        socket.emit('join_room', {
          username: currentSavedName,
          roomId: currentSavedRoom,
          gameType: currentSavedGameType || 'pictomania', // Send persisted game type
          peerId,
          isReconnect: true,
        });
      } else {
        setIsCheckingAuth(false);
      }
    };

    socket.on('connect', handleConnect);
    if (socket.connected) handleConnect();

    socket.on('room_list', (list: RoomListInfo[]) => setRoomList(list));

    socket.on('room_data', (data: RoomDTO) => {
      setActiveRoom(data);
      setAppState('room');
      setRoomId(data.id);
      localStorage.setItem('pictomania_current_room', data.id);
      localStorage.setItem('pictomania_game_type', data.gameType); // Persist game type
      setShowColorModal(false);
      setShowTimeModal(false);
      setIsCheckingAuth(false);
    });

    socket.on('timer_update', (time: number) => {
      setActiveRoom((prev) => (prev ? { ...prev, timeLeft: time } : null));
    });

    socket.on('game_started', () => {
      // 可以在這裡加音效或特效
    });

    socket.on('toast', (data: any) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { ...data, id }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
      // If error (e.g. room not found), also stop loading
      if (data.type === 'error') setIsCheckingAuth(false);
    });

    // Cleanup legacy keys
    const whitelist = [
      'pictomania_peerId',
      'pictomania_username',
      'pictomania_current_room',
      'pictomania_game_type',
    ];
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('pictomania_') && !whitelist.includes(key)) {
        console.log(`[App] Removing legacy key: ${key}`);
        localStorage.removeItem(key);
      }
    });

    return () => {
      clearTimeout(timer);
      socket.off('connect', handleConnect);
      socket.off('room_list');
      socket.off('room_data');
      socket.off('timer_update');
      socket.off('game_started');
      socket.off('toast');
    };
  }, []);

  const enterLobby = () => {
    if (!username) return;
    socket.emit(
      'validate_username',
      { username },
      (response: { valid: boolean; message?: string }) => {
        if (response.valid) {
          localStorage.setItem('pictomania_username', username);
          setAppState('lobby');
        } else {
          const id = Date.now();
          setToasts((prev) => [...prev, { type: 'error', message: response.message, id }]);
          setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
        }
      },
    );
  };

  const joinRoom = (id: string, gameType: string, color?: string, drawTime?: number) => {
    const targetRoomId = id || roomId;
    const finalColor = color || selectedColor;
    if (username && targetRoomId) {
      setRoomId(targetRoomId);
      socket.emit('join_room', {
        username,
        roomId: targetRoomId,
        gameType,
        color: finalColor,
        drawTime,
        peerId,
      });
    }
  };

  const leaveRoom = () => {
    if (roomId) socket.emit('leave_room', { roomId, peerId });
    localStorage.removeItem('pictomania_current_room');
    localStorage.removeItem('pictomania_game_type');
    setRoomId('');
    setActiveRoom(null);
    setAppState('lobby');
  };

  const handleJoinClick = (room: any, isCreating: boolean = false) => {
    if (!room) return;
    setPendingRoom({ ...room, gameName: room.gameName || '妙筆神猜', isCreating });
    if (room.gameType === 'pictomania') {
      if (isCreating) setShowTimeModal(true);
      else {
        const taken = room.takenColors || [];
        const availableColor = PLAYER_COLORS.find((c) => !taken.includes(c));
        setSelectedColor(availableColor || PLAYER_COLORS[0]);
        setShowColorModal(true);
      }
    } else joinRoom(room.id, room.gameType);
  };

  if (isCheckingAuth) {
    return (
      <Container
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: '100vh' }}
      >
        <div className="text-center">
          <div
            className="spinner-border text-primary mb-3"
            role="status"
            style={{ width: '3rem', height: '3rem' }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="fw-bold text-muted">連線中...</h4>
        </div>
      </Container>
    );
  }

  if (appState === 'login') {
    return (
      <Container
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: '100vh' }}
      >
        <Card className="custom-card p-5" style={{ maxWidth: '400px', width: '100%' }}>
          <h2 className="text-center mb-4 fw-bold text-primary">萬遊引力 🪐</h2>
          <Form.Group className="mb-4">
            <Form.Label className="text-muted fw-bold">請輸入您的暱稱</Form.Label>
            <Form.Control
              type="text"
              size="lg"
              placeholder="您的名字..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e: any) => e.key === 'Enter' && enterLobby()}
            />
          </Form.Group>
          <Button
            className="w-100 py-3 fw-bold rounded-pill"
            size="lg"
            onClick={enterLobby}
            disabled={!username}
          >
            進入大廳
          </Button>
        </Card>
      </Container>
    );
  }

  const me = activeRoom?.players.find((p) => p.id === mySocketId || p.peerId === peerId);

  return (
    <div className="App" style={{ minHeight: '100vh', paddingBottom: '40px' }}>
      <Navbar className="mb-4" sticky="top">
        <Navbar.Brand className="fw-bold fs-4 ms-2">
          🪐{' '}
          {appState === 'lobby'
            ? '萬遊引力 大廳'
            : `${activeRoom?.gameName || '未知'} - ${activeRoom?.id}`}
        </Navbar.Brand>
        <div className="ms-auto d-flex align-items-center gap-3 pe-2">
          <Navbar.Text className="d-none d-sm-block">你好, {username}</Navbar.Text>
          {appState === 'lobby' && (
            <Button
              variant="success"
              size="sm"
              className="rounded-pill px-3 fw-bold shadow-sm"
              onClick={() => setShowCreateModal(true)}
            >
              創建房間
            </Button>
          )}
          {appState === 'room' && (
            <Button
              variant="outline-danger"
              size="sm"
              className="rounded-pill px-3 text-nowrap"
              onClick={leaveRoom}
            >
              離開房間
            </Button>
          )}
        </div>
      </Navbar>

      <ToastContainer
        position="top-center"
        className="p-3"
        style={{ zIndex: 2000, position: 'fixed' }}
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            bg={t.type === 'success' ? 'success' : t.type === 'error' ? 'danger' : 'info'}
            className="custom-toast text-white"
            autohide
            delay={3000}
          >
            <Toast.Body className="fw-bold">
              {t.type === 'success' ? '🎯 ' : t.type === 'error' ? '❌ ' : 'ℹ️ '}
              {t.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>

      <Container>
        {appState === 'lobby' ? (
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
                              <h5
                                className="fw-bold mb-1 text-truncate"
                                style={{ maxWidth: '180px' }}
                              >
                                {r.id}
                              </h5>
                              <Badge bg="info" pill>
                                {r.gameName}
                              </Badge>
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
                                    width: '14px',
                                    height: '14px',
                                    backgroundColor: c,
                                    borderRadius: '50%',
                                    opacity: r.takenColors?.includes(c) ? 1 : 0.1,
                                    border: '1px solid rgba(0,0,0,0.1)',
                                  }}
                                />
                              ))}
                            </div>
                          )}
                          <div className="d-grid mt-auto">
                            <Button
                              variant={
                                r.phase === 'playing' || r.playerCount >= r.maxPlayers
                                  ? 'outline-secondary'
                                  : 'primary'
                              }
                              disabled={r.phase === 'playing' || r.playerCount >= r.maxPlayers}
                              onClick={() => handleJoinClick(r)}
                              className="fw-bold rounded-pill"
                            >
                              {r.phase === 'playing'
                                ? '遊戲中'
                                : r.playerCount >= r.maxPlayers
                                  ? '已滿'
                                  : '立即加入'}
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
        ) : (
          (() => {
            const GameComponent = GAME_COMPONENTS[activeRoom?.gameType || ''];
            if (!GameComponent || !me)
              return (
                <div className="text-center py-5 text-white">
                  <h3>載入中...</h3>
                </div>
              );
            return <GameComponent socket={socket} room={activeRoom} me={me} />;
          })()
        )}
      </Container>

      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton className="border-0 bg-white">
          <Modal.Title className="fw-bold">創建新房間</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 bg-white">
          <Form.Group className="mb-3">
            <Form.Label className="text-muted">選擇遊戲</Form.Label>
            <Form.Select
              value={selectedGame}
              onChange={(e: any) => setSelectedGame(e.target.value)}
            >
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
                  gameName:
                    selectedGame === 'pictomania'
                      ? '妙筆神猜'
                      : selectedGame === 'uno'
                        ? 'UNO'
                        : '',
                  takenColors: [],
                  playerCount: 0,
                  maxPlayers: 6,
                  gameState: 'waiting',
                },
                true,
              );
              setShowCreateModal(false);
              setCreateRoomName('');
            }}
            disabled={!createRoomName}
          >
            {selectedGame === 'uno' ? '建立房間' : '下一步：設定規則'}
          </Button>
        </Modal.Body>
      </Modal>

      <Modal show={showTimeModal} onHide={() => setShowTimeModal(false)} centered>
        <Modal.Header closeButton className="border-0 bg-white">
          <Modal.Title className="fw-bold">設定遊戲規則</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-4 bg-white">
          <p className="text-muted mb-4">
            請選擇每一輪的<strong>畫畫時間</strong>
          </p>
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
              setShowColorModal(true);
            }}
          >
            確認設定
          </Button>
        </Modal.Body>
      </Modal>

      <Modal show={showColorModal} onHide={() => setShowColorModal(false)} centered>
        <Modal.Header closeButton className="border-0 bg-white">
          <Modal.Title className="fw-bold">挑選顏色</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-4 bg-white">
          <p className="text-muted mb-4">
            選擇您的<strong>代表色</strong>
          </p>
          <div className="d-flex justify-content-center gap-3 mb-4">
            {PLAYER_COLORS.map((c) => {
              const isTaken = pendingRoom?.takenColors?.includes(c);
              return (
                <div
                  key={c}
                  onClick={() => !isTaken && setSelectedColor(c)}
                  style={{
                    width: '45px',
                    height: '45px',
                    backgroundColor: c,
                    borderRadius: '50%',
                    cursor: isTaken ? 'not-allowed' : 'pointer',
                    border: selectedColor === c ? '4px solid #333' : '2px solid transparent',
                    opacity: isTaken ? 0.2 : 1,
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                >
                  {isTaken && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white',
                      }}
                    >
                      ✕
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <Button
            variant="primary"
            size="lg"
            className="w-100 fw-bold rounded-pill shadow-sm"
            onClick={() => {
              if (pendingRoom)
                joinRoom(
                  pendingRoom.id,
                  pendingRoom.gameType,
                  selectedColor,
                  pendingRoom.isCreating ? selectedDrawTime : undefined,
                );
              setShowColorModal(false);
            }}
          >
            {pendingRoom?.isCreating ? '建立房間' : '進入房間'}
          </Button>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default App;
