import React from 'react';
import { Clock } from 'lucide-react';
import { PictomaniaPhase } from '../types';

interface FixedTimerProps {
  phase: PictomaniaPhase;
  timeLeft: number;
  isDoneDrawing: boolean;
}

const FixedTimer: React.FC<FixedTimerProps> = ({ phase, timeLeft, isDoneDrawing }) => {
  if (phase !== 'playing' || timeLeft <= 0 || isDoneDrawing) return null;

  return (
    <div 
      className="position-fixed start-50 translate-middle-x" 
      style={{ top: '20px', zIndex: 1050, transition: 'all 0.3s ease' }}
    >
      <div className={`d-flex align-items-center rounded-pill px-4 py-2 shadow-lg border-2 border-white text-white ${timeLeft <= 10 ? 'bg-danger animate-pulse' : 'bg-primary'}`}>
        <Clock size={24} className="me-2" />
        <span className="fw-bolder fs-4" style={{ fontFamily: 'monospace' }}>{timeLeft}s</span>
      </div>
    </div>
  );
};

export default FixedTimer;
