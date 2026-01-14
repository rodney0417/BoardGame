import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

interface GameLayoutProps {
  sidebar?: React.ReactNode;
  main: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  reverseMobile?: boolean; // If true, sidebar shows below main on mobile
  onLeave?: () => void;
}

const GameLayout: React.FC<GameLayoutProps> = ({ 
  sidebar, 
  main, 
  header, 
  footer,
  maxWidth = '1400px',
  reverseMobile = false,
  onLeave
}) => {
  return (
    <Container fluid className="position-relative" style={{ maxWidth, minHeight: '100vh' }}>
      
      {/* Mobile Exit Button (Fixed Top-Right) */}
      {onLeave && (
        <div className="d-lg-none position-absolute top-0 end-0 p-2" style={{ zIndex: 1050 }}>
            <button 
                className="btn btn-light shadow-sm rounded-circle d-flex align-items-center justify-content-center p-0 border"
                style={{ width: '40px', height: '40px', opacity: 0.9 }}
                onClick={onLeave}
                title="離開房間"
            >
                <span className="text-danger fw-bold">✕</span>
            </button>
        </div>
      )}

      {/* Optional Header (e.g., Stats, Round Info) */}
      {header && (
        <Row className="mb-3">
          <Col xs={12}>
            {header}
          </Col>
        </Row>
      )}

      <Row className={`g-4 ${reverseMobile ? 'flex-column-reverse flex-lg-row' : ''}`}>
        {/* Main Game Area */}
        <Col xs={12} lg={sidebar ? 8 : 12} xl={sidebar ? 9 : 12}>
          <div className="h-100 position-relative">
            {main}
          </div>
        </Col>

        {/* Sidebar (Player List, Chat, etc.) */}
        {sidebar && (
          <Col xs={12} lg={4} xl={3}>
            {/* Desktop Sticky Sidebar */}
            <div className="sticky-lg-top" style={{ top: '20px', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto' }}>
              <div className="d-flex flex-column gap-3">
                {sidebar}
              </div>
            </div>
          </Col>
        )}
      </Row>

      {/* Optional Footer */}
      {footer && (
        <Row className="mt-3">
          <Col xs={12}>
            {footer}
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default GameLayout;
