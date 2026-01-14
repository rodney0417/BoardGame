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
  reverseMobile = false
}) => {
  return (
    <Container 
      fluid 
      className="position-relative vh-100 d-flex flex-column px-2 pt-2 pb-0 p-md-3 mt-0 overflow-hidden" 
      style={{ maxWidth }}
    >
      <style>
        {`
          .custom-scroll {
            overflow-y: auto;
            flex-grow: 1;
            min-height: 0;
            scrollbar-width: thin;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
          }
          .custom-scroll::-webkit-scrollbar {
            width: 5px;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.1);
            border-radius: 10px;
          }
          @media (max-width: 767px) {
            .mobile-column-layout {
              flex-direction: column !important;
              flex-wrap: nowrap !important;
            }
            .sidebar-top {
              order: 1 !important;
              flex: 0 0 auto !important;
              max-height: 40vh; /* 避免頂部資訊佔太大部分 */
              height: auto !important;
            }
            .main-bottom {
              order: 2 !important;
              flex: 1 1 0 !important;
              min-height: 0 !important;
              height: auto !important;
            }
          }
          @media (min-width: 768px) {
            .desktop-h-100 {
              height: 100% !important;
            }
          }
        `}
      </style>
      
      {/* Header 固定在頂部 */}
      {header && (
        <Row className="flex-shrink-0 mt-0 mb-3 px-2 px-md-0">
          <Col xs={12} className="p-0">
            {header}
          </Col>
        </Row>
      )}

      <Row className="gx-0 gx-md-4 gy-2 gy-md-4 m-0 mt-0 flex-grow-1 overflow-hidden mobile-column-layout align-items-stretch">
        {/* Main Column (房間列表) */}
        <Col 
            xs={12} 
            md={sidebar ? 8 : 12} 
            xl={sidebar ? 9 : 12} 
            className={`d-flex flex-column overflow-hidden desktop-h-100 ${reverseMobile ? 'order-2 order-md-1 main-bottom' : 'order-1 order-md-1'}`}
        >
          <div className="custom-scroll px-0 px-md-3">
            {main}
          </div>
        </Col>

        {/* Sidebar Column (個人資訊/大廳資訊) */}
        {sidebar && (
          <Col 
            xs={12} 
            md={4} 
            xl={3} 
            className={`d-flex flex-column overflow-hidden desktop-h-100 ${reverseMobile ? 'order-1 order-md-2 sidebar-top' : 'order-2 order-md-2'}`}
          >
            <div className="custom-scroll px-0 px-md-3">
                {sidebar}
            </div>
          </Col>
        )}
      </Row>

      {/* Footer 固定在底部 */}
      {footer && (
        <Row className="mt-3 mb-0 px-2 px-md-0 flex-shrink-0">
          <Col xs={12} className="px-0 px-md-3">
            {footer}
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default GameLayout;
