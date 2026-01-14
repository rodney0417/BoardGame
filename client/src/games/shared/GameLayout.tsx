import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

interface GameLayoutProps {
  sidebar?: React.ReactNode;
  main: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  reverseMobile?: boolean; // If true, sidebar shows below main on mobile
}

const GameLayout: React.FC<GameLayoutProps> = ({ 
  sidebar, 
  main, 
  header, 
  footer,
  maxWidth = '1400px',
  reverseMobile = false
}) => {
  return (
    <Container fluid className="py-3" style={{ maxWidth }}>
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
            <div className="d-flex flex-column gap-3 h-100">
              {sidebar}
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
