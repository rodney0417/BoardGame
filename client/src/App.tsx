import React, { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import { ToastContainer, Toast, Container } from 'react-bootstrap';
import Navbar from './components/Navbar';
import './index.css';

import { useUser } from './domains/user/useUser';
import { useLobby } from './domains/lobby/useLobby';
import LoginView from './domains/user/LoginView';
import LobbyView from './domains/lobby/LobbyView';
import GameSessionView from './domains/game/GameSessionView';
import { RoomDTO } from './types';

// Initialize global socket
const socket: Socket = io();

function App() {
  const { username, peerId, saveUsername, isLoggedIn } = useUser();
  const { roomList } = useLobby(socket);

  const [appState, setAppState] = useState<'login' | 'lobby' | 'room'>(isLoggedIn ? 'lobby' : 'login');
  const [activeRoom, setActiveRoom] = useState<RoomDTO | null>(null);
  const [toasts, setToasts] = useState<any[]>([]);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Helper to add toast
  const addToast = (type: string, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { type, message, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  useEffect(() => {
    // Safety timeout
    const timer = setTimeout(() => setIsCheckingAuth(false), 2000);

    const handleConnect = () => {
      const currentSavedRoom = localStorage.getItem('pictomania_current_room');
      const currentSavedGameType = localStorage.getItem('pictomania_game_type');

      if (currentSavedRoom && username) {
        socket.emit('join_room', {
          username: username,
          roomId: currentSavedRoom,
          gameType: currentSavedGameType || 'pictomania',
          peerId,
          isReconnect: true,
        });
      } else {
        setIsCheckingAuth(false);
      }
    };

    socket.on('connect', handleConnect);
    if (socket.connected) handleConnect();

    socket.on('room_data', (data: RoomDTO) => {
      setActiveRoom(data);
      setAppState('room');
      localStorage.setItem('pictomania_current_room', data.id);
      localStorage.setItem('pictomania_game_type', data.gameType);
      setIsCheckingAuth(false);
    });

    socket.on('timer_update', (time: number) => {
      setActiveRoom((prev) => (prev ? { ...prev, timeLeft: time } : null));
    });

    socket.on('game_started', () => {
       // Optional: Sound effect
    });

    socket.on('toast', (data: any) => {
      addToast(data.type, data.message);
      if (data.type === 'error') setIsCheckingAuth(false);
    });

    return () => {
      clearTimeout(timer);
      socket.off('connect', handleConnect);
      socket.off('room_data');
      socket.off('timer_update');
      socket.off('game_started');
      socket.off('toast');
    };
  }, [username, peerId]);

  const handleLogin = (name: string) => {
    socket.emit(
      'validate_username',
      { username: name },
      (response: { valid: boolean; message?: string }) => {
        if (response.valid) {
          saveUsername(name);
          setAppState('lobby');
        } else {
          addToast('error', response.message || 'Invalid username');
        }
      },
    );
  };

  const handleJoinRoom = (roomId: string, gameType: string, color?: string, drawTime?: number) => {
    if (username) {
      socket.emit('join_room', {
        username,
        roomId,
        gameType,
        color,
        drawTime,
        peerId,
      });
    }
  };

  const handleLeaveRoom = () => {
    if (activeRoom) {
        socket.emit('leave_room', { roomId: activeRoom.id, peerId });
        localStorage.removeItem('pictomania_current_room');
        localStorage.removeItem('pictomania_game_type');
        setActiveRoom(null);
        setAppState('lobby');
    }
  };

  if (isCheckingAuth) {
    return (
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="fw-bold text-muted">連線中...</h4>
        </div>
      </Container>
    );
  }

  if (appState === 'login') {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="App" style={{ minHeight: '100vh', paddingBottom: '40px' }}>
      <Navbar 
        roomId={appState === 'room' ? `${activeRoom?.gameName || '未知'}` : undefined}
        onCreateRoom={appState === 'lobby' ? () => setShowCreateModal(true) : undefined}
        onLeaveRoom={appState === 'room' ? handleLeaveRoom : undefined}
      />

      <ToastContainer position="top-center" className="p-3" style={{ zIndex: 2000, position: 'fixed' }}>
        {toasts.map((t) => (
          <Toast key={t.id} bg={t.type === 'success' ? 'success' : t.type === 'error' ? 'danger' : 'info'} className="custom-toast text-white" autohide delay={3000}>
            <Toast.Body className="fw-bold">
              {t.type === 'success' ? '🎯 ' : t.type === 'error' ? '❌ ' : 'ℹ️ '}
              {t.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>

      {appState === 'lobby' ? (
        <LobbyView roomList={roomList} onJoinRoom={handleJoinRoom} showCreateModal={showCreateModal} onCloseCreateModal={() => setShowCreateModal(false)} />
      ) : activeRoom && (
        <GameSessionView socket={socket} activeRoom={activeRoom} me={activeRoom.players.find(p => p.peerId === peerId)!} />
      )}
    </div>
  );
}

export default App;
