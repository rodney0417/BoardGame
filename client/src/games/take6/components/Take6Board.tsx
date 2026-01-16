import React from 'react';
import Take6Card from './Take6Card';

interface Take6BoardProps {
  rows: number[][];
  onRowClick?: (rowIndex: number) => void;
  highlightRows?: boolean;
}

const Take6Board: React.FC<Take6BoardProps> = ({ rows, onRowClick, highlightRows }) => {
  return (
    <div className="d-flex flex-column gap-3">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`d-flex align-items-center gap-2 p-2 rounded shadow-sm ${highlightRows ? 'row-hover-highlight' : ''}`}
          style={{
            minHeight: '110px',
            border: highlightRows ? '2px dashed #ffc107' : '1px solid rgba(255,255,255,0.4)',
            backgroundColor: highlightRows ? 'rgba(255, 243, 205, 0.9)' : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(5px)',
            cursor: highlightRows ? 'pointer' : 'default',
            transition: 'all 0.2s',
          }}
          onClick={() => highlightRows && onRowClick?.(rowIndex)}
        >
          {/* Row Index Indicator */}
          <div className="text-secondary fw-bold me-2 fs-5">#{rowIndex + 1}</div>

          {/* Cards */}
          {row.map((cardNum, cardIndex) => (
            <Take6Card key={`${rowIndex}-${cardIndex}`} number={cardNum} size="md" disabled />
          ))}

          {/* Placeholder for next card */}
          {row.length < 5 && (
            <div
              className="border border-light border-dashed rounded d-flex align-items-center justify-content-center text-white small"
              style={{ width: 70, height: 100, opacity: 0.2 }}
            >
              {row.length + 1}/5
            </div>
          )}

          {/* Danger Indicator */}
          {row.length === 5 && (
            <div className="ms-auto text-danger fw-bold blink-animation bg-dark px-2 rounded">
              ⚠️ 滿員
            </div>
          )}
        </div>
      ))}
      <style>{`
        .row-hover-highlight:hover {
            background-color: rgba(255, 230, 156, 0.3) !important;
            border-color: #ffc107 !important;
        }
        .blink-animation {
            animation: blinker 1.5s linear infinite;
        }
        @keyframes blinker {
            50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Take6Board;
