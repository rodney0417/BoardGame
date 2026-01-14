import React from 'react';
import { Navbar as BSNavbar, Container, Button } from 'react-bootstrap';

interface NavbarProps {
  roomId?: string;
  onCreateRoom?: () => void;
  onLeaveRoom?: () => void;
}

import styles from './Navbar.module.css';

const Navbar: React.FC<NavbarProps> = ({ roomId, onCreateRoom, onLeaveRoom }) => {
  return (
    <BSNavbar fixed="top" className={`py-3 ${styles.navbarMain}`}>
      <Container>
        <BSNavbar.Brand className={`fw-bold fs-4 ${styles.brand}`}>
          🪐 萬遊引力
        </BSNavbar.Brand>
        
        <div className="d-flex align-items-center gap-3">
          {roomId && (
            <div className={`d-flex align-items-center px-3 py-2 rounded-pill shadow-sm ${styles.roomBadge}`}>
              <span className="me-2 fs-5 d-flex align-items-center" style={{ height: '24px', transform: 'translateY(-2px)' }}>🏠</span>
              <span className={`fw-bold text-dark ${styles.roomId}`}>{roomId}</span>
            </div>
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
              variant="outline-danger"
              className="rounded-pill px-3 py-2"
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
