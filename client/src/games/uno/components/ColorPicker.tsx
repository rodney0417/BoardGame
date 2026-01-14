import React from 'react';
import { CardColor } from '../types';
import { UNO_COLORS } from '../constants';
import { Modal, Button } from 'react-bootstrap';

interface ColorPickerProps {
  show: boolean;
  onSelect: (color: CardColor) => void;
  onCancel: () => void;
}

const COLORS = (['red', 'blue', 'green', 'yellow'] as const).map(c => ({
  color: c,
  bg: UNO_COLORS[c].hex,
  label: UNO_COLORS[c].label
}));

const ColorPicker: React.FC<ColorPickerProps> = ({ show, onSelect, onCancel }) => {
  return (
    <Modal show={show} centered backdrop="static" keyboard={false} onHide={onCancel}>
      <Modal.Header closeButton className="bg-dark text-white border-0">
        <Modal.Title className="fw-bold">選擇顏色</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4 bg-light">
        <div className="d-flex justify-content-center gap-3 mb-3">
          {COLORS.map(({ color, bg, label }) => (
            <Button
              key={color}
              onClick={() => onSelect(color)}
              style={{
                width: '80px',
                height: '80px',
                backgroundColor: bg,
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: color === 'yellow' ? '#333' : '#fff',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.1s',
              }}
              className="hover-scale"
            >
              {label}
            </Button>
          ))}
        </div>
      </Modal.Body>
      <Modal.Footer className="bg-light border-0 d-flex justify-content-center">
        <Button variant="secondary" onClick={onCancel} className="px-5 rounded-pill">
          取消 (Cancel)
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ColorPicker;
