import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { GAME_CONFIG, GameType } from '../gameConfig';

interface GameRulesModalProps {
  show: boolean;
  onHide: () => void;
  gameType: GameType;
}

export const GameRulesModal: React.FC<GameRulesModalProps> = ({ show, onHide, gameType }) => {
  const config = GAME_CONFIG[gameType];

  return (
    <Modal show={show} onHide={onHide} centered scrollable size="lg">
      <Modal.Header
        closeButton
        style={{ background: config.gradient }}
        className="border-0 text-white"
      >
        <Modal.Title className="fw-bold d-flex align-items-center gap-2">
          <span>{config.icon}</span>
          <span>{config.name} - 詳細規則</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4" style={{ backgroundColor: '#fff' }}>
        <div className="d-flex flex-column gap-2">
          {config.detailedRules.map((line, index) => {
            // Simple markdown-like parsing
            const isTitle = line.endsWith('：');
            const isListItem =
              line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.');
            const isBullet = line.trim().startsWith('-');
            const isImportant = line.includes('⚠️') || line.includes('🚫') || line.includes('👉');

            let className = 'text-dark';
            let style = {};

            if (isTitle) {
              className = 'h5 fw-bold mt-3 mb-2 text-primary';
            } else if (isListItem) {
              className = 'fw-bold mt-2';
            } else if (isBullet) {
              className = 'ms-4 text-secondary';
            } else if (isImportant) {
              className = 'fw-bold text-danger bg-danger bg-opacity-10 p-2 rounded';
            }

            return (
              <div key={index} className={className} style={style}>
                {line}
              </div>
            );
          })}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} className="rounded-pill px-4">
          關閉
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
