import React, { useMemo } from 'react';
import { Card } from 'react-bootstrap';
import bullHeadIcon from '../../../assets/games/take6/bull_head.png';
import cardBg1 from '../../../assets/games/take6/card_bg_1.png';
import cardBg2 from '../../../assets/games/take6/card_bg_2.png';
import cardBg3 from '../../../assets/games/take6/card_bg_3.png';
import cardBg5 from '../../../assets/games/take6/card_bg_5.png';
import cardBg7 from '../../../assets/games/take6/card_bg_7.png';

interface Take6CardProps {
  number: number;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  hidden?: boolean;
}

const calculateBullHeads = (num: number): number => {
  if (num === 55) return 7;
  if (num % 11 === 0) return 5;
  if (num % 10 === 0) return 3;
  if (num % 5 === 0) return 2;
  return 1;
};

const Take6Card: React.FC<Take6CardProps> = ({
  number,
  onClick,
  selected,
  disabled,
  size = 'md',
  hidden,
}) => {
  const heads = calculateBullHeads(number);

  const bgImage = useMemo(() => {
    if (heads === 7) return cardBg7;
    if (heads === 5) return cardBg5;
    if (heads === 3) return cardBg3;
    if (heads === 2) return cardBg2;
    return cardBg1;
  }, [heads]);

  const dimensions = {
    sm: { width: 40, height: 60, fontSize: '0.8rem' },
    md: { width: 70, height: 100, fontSize: '1.2rem' },
    lg: { width: 100, height: 140, fontSize: '1.8rem' },
  }[size];

  const textColor =
    heads === 7 ? 'text-white' : heads === 5 || heads === 2 ? 'text-white' : 'text-dark';
  const shadow = selected ? 'shadow-lg border-warning' : 'shadow-sm';
  const transform = selected ? 'translateY(-10px)' : 'translateY(0)';

  if (hidden) {
    return (
      <div
        className={`card bg-dark ${shadow}`}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          borderRadius: 8,
          border: '2px solid #555',
          background: 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)',
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <div className="d-flex align-items-center justify-content-center h-100 opacity-25">
          <img src={bullHeadIcon} style={{ width: '50%' }} alt="back" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`card position-relative user-select-none ${shadow}`}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        cursor: disabled ? 'default' : 'pointer',
        transform,
        transition: 'all 0.2s ease-in-out',
        border: selected ? '3px solid #ffc107' : '1px solid rgba(0,0,0,0.2)',
        opacity: disabled ? 0.6 : 1,
        borderRadius: 8,
      }}
    >
      {/* Top Number */}
      <div
        className={`position-absolute top-0 start-50 translate-middle-x fw-bold ${textColor}`}
        style={{ marginTop: '5px', fontSize: dimensions.fontSize }}
      >
        {number}
      </div>

      {/* Center Heads */}
      <div className="position-absolute top-50 start-50 translate-middle w-100 text-center">
        <div className="d-flex justify-content-center flex-wrap gap-1 px-1">
          {Array.from({ length: heads }).map((_, i) => (
            <img
              key={i}
              src={bullHeadIcon}
              alt="bull"
              style={{
                width: size === 'sm' ? 8 : 12,
                height: 'auto',
                filter: heads >= 5 ? 'brightness(0) invert(1)' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom Number */}
      <div
        className={`position-absolute bottom-0 start-50 translate-middle-x fw-bold ${textColor}`}
        style={{ marginBottom: '5px', fontSize: dimensions.fontSize }}
      >
        {number}
      </div>
    </div>
  );
};

export default Take6Card;
