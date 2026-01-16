import React from 'react';

interface SymbolIconProps {
  symbol: string;
  size?: number;
  className?: string;
  color?: string;
}

export const SymbolIcon: React.FC<SymbolIconProps> = ({
  symbol,
  size = 24,
  className = '',
  color,
}) => {
  const style = { width: size, height: size, display: 'inline-block', verticalAlign: 'middle' };

  switch (symbol.toLowerCase()) {
    case 'star':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={color || '#4CAF50'}
            stroke={color || '#2E7D32'}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'triangle':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
          <path
            d="M12 3L3 20h18L12 3z"
            fill={color || '#F44336'}
            stroke={color || '#C62828'}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'square':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            fill={color || '#FF9800'}
            stroke={color || '#EF6C00'}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'circle':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
          <circle
            cx="12"
            cy="12"
            r="9"
            fill={color || '#2196F3'}
            stroke={color || '#1565C0'}
            strokeWidth="1.5"
          />
        </svg>
      );
    case 'cloud':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
          <path
            d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
            fill={color || '#90A4AE'}
            stroke={color || '#546E7A'}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'moon':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            fill={color || '#9C27B0'}
            stroke={color || '#7B1FA2'}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return <span style={{ fontSize: size, lineHeight: 1, color: color }}>{symbol}</span>;
  }
};
