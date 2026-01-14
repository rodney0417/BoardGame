import React from 'react';
import { Badge } from 'react-bootstrap';

interface PlayerAvatarProps {
  username: string;
  score?: number;
  isTurn?: boolean;
  isHost?: boolean;
  isConnected?: boolean;
  avatarUrl?: string; // Optional custom avatar
  badges?: React.ReactNode[]; // Extra badges (e.g., "Guessed Correctly")
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  username,
  score = 0,
  isTurn = false,
  isHost = false,
  isConnected = true,
  avatarUrl,
  badges = [],
  size = 'md',
  showScore = true,
}) => {
  // Size mappings
  const sizeMap = {
    sm: { width: '32px', fontSize: '0.8rem' },
    md: { width: '48px', fontSize: '1rem' },
    lg: { width: '64px', fontSize: '1.25rem' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`d-flex align-items-center gap-3 p-2 rounded-4 ${isTurn ? 'bg-white shadow-sm border border-primary' : ''}`}>
      {/* Avatar Circle */}
      <div className="position-relative">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm"
          style={{
            width: currentSize.width,
            height: currentSize.width,
            fontSize: currentSize.fontSize,
            background: avatarUrl ? `url(${avatarUrl})` : 'linear-gradient(135deg, #a8b5a0 0%, #9fb4c7 100%)',
            backgroundSize: 'cover',
            border: isTurn ? '3px solid #b5a7c4' : '2px solid white',
          }}
        >
          {!avatarUrl && username.charAt(0).toUpperCase()}
        </div>
        
        {/* Status Indicator */}
        {!isConnected && (
           <span className="position-absolute bottom-0 end-0 p-1 bg-danger border border-white rounded-circle">
             <span className="visually-hidden">Disconnected</span>
           </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-grow-1">
        <div className="d-flex align-items-center gap-2">
          <span className={`fw-bold ${isTurn ? 'text-primary' : 'text-dark'}`}>{username}</span>
          {isHost && <span title="房主">🏠</span>}
        </div>
        
        <div className="d-flex align-items-center gap-1 mt-1 flex-wrap">
          {showScore && (
             <Badge bg="light" text="dark" className="border">
               🏆 {score}
             </Badge>
          )}
          {badges.map((badge, idx) => (
            <React.Fragment key={idx}>{badge}</React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerAvatar;
