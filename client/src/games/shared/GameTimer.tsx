import React from 'react';
import { Clock } from 'lucide-react';

interface GameTimerProps {
  timeLeft: number;
  visible?: boolean;
  position?: 'top-center' | 'top-right' | 'top-left';
  warningThreshold?: number; // default 10
}

const GameTimer: React.FC<GameTimerProps> = ({
  timeLeft,
  visible = true,
  position = 'top-center',
  warningThreshold = 10,
}) => {
  if (!visible || timeLeft <= 0) return null;

  // Position classes
  const positionClasses = {
    'top-center': 'start-50 translate-middle-x',
    'top-right': 'end-0 me-4',
    'top-left': 'start-0 ms-4',
  };

  return (
    <div
      className={`position-fixed ${positionClasses[position]}`}
      style={{ top: '20px', zIndex: 1050, transition: 'all 0.3s ease' }}
    >
      <div
        className={`d-flex align-items-center rounded-pill px-4 py-2 shadow-lg border-2 border-white text-white ${
          timeLeft <= warningThreshold ? 'bg-danger animate-pulse' : 'bg-primary'
        }`}
      >
        <Clock size={24} className="me-2" />
        <span className="fw-bolder fs-4" style={{ fontFamily: 'monospace' }}>
          {timeLeft}s
        </span>
      </div>
    </div>
  );
};

export default GameTimer;
