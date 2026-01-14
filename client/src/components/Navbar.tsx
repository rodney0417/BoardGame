import React from 'react';
import { Navbar as BSNavbar, Container, Button } from 'react-bootstrap';

interface NavbarProps {
  roomId?: string;
  onCreateRoom?: () => void;
  onLeaveRoom?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ roomId, onCreateRoom, onLeaveRoom }) => {
  return (
    <BSNavbar className="border-0 py-3" style={{ background: 'rgba(245, 240, 235, 0.95)', backdropFilter: 'blur(10px)' }}>
      <Container>
        <BSNavbar.Brand className="fw-bold fs-4" style={{ color: '#4a4a4a' }}>
          🪐 萬遊引力
        </BSNavbar.Brand>
        
        <div className="d-flex align-items-center gap-3">
          {roomId && (
            <span className="small text-muted">
              房間: <span className="fw-medium">{roomId}</span>
            </span>
          )}
          
          {onCreateRoom && !roomId && (
            <Button
              variant="primary"
              className="rounded-pill px-4"
              onClick={onCreateRoom}
            >
              + 創建房間
            </Button>
          )}
          
          {onLeaveRoom && roomId && (
            <Button
              variant="outline-secondary"
              size="sm"
              className="rounded-pill"
              onClick={onLeaveRoom}
            >
              離開房間
            </Button>
          )}
        </div>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
