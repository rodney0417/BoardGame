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
