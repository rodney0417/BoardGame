import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

interface GameLayoutProps {
  sidebar?: React.ReactNode;
  main: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  reverseMobile?: boolean; // If true, sidebar shows ABOVE main on mobile
}

const GameLayout: React.FC<GameLayoutProps> = ({
  sidebar,
  main,
  header,
  footer,
  maxWidth = '1400px',
  reverseMobile = false,
}) => {
  return (
    <Container fluid className="py-3" style={{ maxWidth }}>
      <style>
        {`
          @media (max-width: 767px) {
            .mobile-column-layout {
              flex-direction: column !important;
              flex-wrap: nowrap !important;
            }
            .sidebar-top {
              order: 1 !important;
              width: 100%;
            }
            .main-bottom {
              order: 2 !important;
              width: 100%;
            }
          }
          @media (min-width: 768px) {
            .sticky-sidebar {
              position: sticky;
              top: 1rem;
              max-height: calc(100vh - 2rem);
              overflow-y: auto;
            }
          }
        `}
      </style>

      {/* Optional Header */}
      {header && (
        <Row className="flex-shrink-0 mt-0 mb-3 px-2 px-md-0">
          <Col xs={12} className="p-0">
            {header}
          </Col>
        </Row>
      )}

      <Row className="gx-0 gx-md-4 gy-3 gy-md-4 m-0 mt-0 flex-grow-1 mobile-column-layout">
        {/* Main Column (Room List on Desktop) */}
        <Col
          xs={12}
          md={sidebar ? 8 : 12}
          xl={sidebar ? 9 : 12}
          className={`${reverseMobile ? 'order-2 order-md-1 main-bottom' : 'order-1 order-md-1'}`}
        >
          {main}
        </Col>

        {/* Sidebar Column (Info on Desktop, Top on Mobile) */}
        {sidebar && (
          <Col
            xs={12}
            md={4}
            xl={3}
            className={`${reverseMobile ? 'order-1 order-md-2 sidebar-top' : 'order-2 order-md-2'}`}
          >
            <div className="sticky-sidebar d-flex flex-column">{sidebar}</div>
          </Col>
        )}
      </Row>

      {/* Optional Footer */}
      {footer && (
        <Row className="mt-3 mb-0 px-2 px-md-0">
          <Col xs={12}>{footer}</Col>
        </Row>
      )}
    </Container>
  );
};

export default GameLayout;
