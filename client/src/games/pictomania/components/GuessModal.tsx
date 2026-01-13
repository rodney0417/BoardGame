import React from 'react';
import { Modal, Row, Col, Button } from 'react-bootstrap';
import { SymbolIcon } from '../PictomaniaIcons';
import { PictomaniaPlayer } from '../types';

interface GuessModalProps {
  show: boolean;
  onHide: () => void;
  targetPlayer: PictomaniaPlayer | null;
  cards: Record<string, string[]>;
  selectedSymbol: string;
  onSymbolSelect: (symbol: string) => void;
  onGuess: (symbol: string, index: number) => void;
  usedNumbers: number[];
  mySymbol: string;
  myNumber: number;
}

const GuessModal: React.FC<GuessModalProps> = ({
  show,
  onHide,
  targetPlayer,
  cards,
  selectedSymbol,
  onSymbolSelect,
  onGuess,
  usedNumbers,
  mySymbol,
  myNumber
}) => {
  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="light-modal">
      <Modal.Header closeButton className="bg-light text-dark border-0">
        <Modal.Title className="fw-bold">猜猜 {targetPlayer?.username} 畫什麼？</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4 bg-white text-dark">
        <div className="d-flex justify-content-center mb-4">
          <div className="d-inline-flex gap-2 p-2 bg-light rounded-pill border">
            {Object.keys(cards || {}).length > 0 ? Object.keys(cards || {}).map((s: string) => (
              <Button 
                key={s} 
                variant={selectedSymbol === s ? "primary" : "light"} 
                onClick={() => onSymbolSelect(s)} 
                className={`rounded-circle d-flex align-items-center justify-content-center p-0 ${selectedSymbol === s ? 'shadow' : ''}`}
                style={{ width: '44px', height: '44px', transition: 'all 0.2s ease', border: selectedSymbol === s ? 'none' : '1px solid transparent' }}
              >
                <SymbolIcon symbol={s} size={22} color={selectedSymbol === s ? '#fff' : undefined} />
              </Button>
            )) : <div className="p-2 text-muted small">載入題目中...</div>}
          </div>
        </div>
        <Row className="g-3">
          {selectedSymbol && (cards || {})[selectedSymbol] ? (cards || {})[selectedSymbol].map((w: string, i: number) => {
            const number = i + 1;
            const isUsed = usedNumbers.includes(number) || number === myNumber;
            const isMySymbol = selectedSymbol === mySymbol;
            const isDisabled = isUsed || isMySymbol;
            
            return (
              <Col xs={6} sm={4} key={i}>
                <Button 
                  variant={isDisabled ? "secondary" : "outline-primary"} 
                  className="w-100 py-3 fw-bold rounded-4 shadow-sm" 
                  onClick={() => onGuess(selectedSymbol, number)}
                  disabled={isDisabled}
                >
                  {number}. {w}
                  {isUsed && !isMySymbol && <span className="ms-2 badge bg-dark">已用</span>}
                </Button>
              </Col>
            );
          }) : <div className="text-center py-4 text-muted w-100">請先選擇一個符號</div>}
        </Row>
      </Modal.Body>
    </Modal>
  );
};

export default GuessModal;
