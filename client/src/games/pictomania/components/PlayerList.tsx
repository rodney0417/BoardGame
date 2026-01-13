import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { PictomaniaPlayer, PictomaniaPhase } from '../types';

interface PlayerListProps {
  otherPlayers: PictomaniaPlayer[];
  me: PictomaniaPlayer;
  phase: PictomaniaPhase;
  canvasRefs: React.MutableRefObject<Record<string, HTMLCanvasElement | null>>;
  onGuessClick: (player: PictomaniaPlayer) => void;
}

const PlayerList: React.FC<PlayerListProps> = ({
  otherPlayers,
  me,
  phase,
  canvasRefs,
  onGuessClick,
}) => {
  return (
    <>
      <h5 className="fw-bold mb-3 px-2 text-dark opacity-75">👥 玩家列表</h5>
      {otherPlayers.map((p: PictomaniaPlayer) => (
        <Card key={p.id} className="mb-3 border-0 overflow-hidden rounded-4 custom-card shadow-sm">
          <div
            className="p-3 d-flex justify-content-between align-items-center border-bottom bg-light"
            style={{ borderTop: `6px solid ${p.color}` }}
          >
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: p.color,
                  borderRadius: '50%',
                }}
              />
              <span className="fw-bold text-dark">{p.username}</span>
              <Badge bg="info" className="ms-1 rounded-pill text-white">
                得分: {p.score}
              </Badge>
              {p.disconnected && (
                <Badge bg="warning" text="dark" className="ms-1 rounded-pill">
                  斷線
                </Badge>
              )}
              {phase === 'round_ended' && (
                <>
                  <Badge bg="primary" className="ms-1 rounded-pill">
                    題: {p.targetWord}
                  </Badge>
                  {(p.guessedCorrectlyBy as string[])?.includes(me.id) ? (
                    <Badge bg="success" className="ms-1 rounded-pill">
                      ✅ 猜對
                    </Badge>
                  ) : (
                    <Badge bg="danger" className="ms-1 rounded-pill">
                      ❌ 猜錯
                    </Badge>
                  )}
                </>
              )}
              {phase === 'playing' && p.isDoneDrawing && (
                <Badge bg="secondary" className="ms-1 rounded-pill">
                  已畫完
                </Badge>
              )}
            </div>
            {phase === 'playing' && me?.isDoneDrawing && !me?.isDoneGuessing && (
              <Button
                size="sm"
                variant={
                  me.myGuesses?.some((g: any) => g.targetPlayerId === p.id)
                    ? 'success'
                    : 'outline-primary'
                }
                onClick={() => onGuessClick(p)}
                className="rounded-pill px-3 shadow-sm"
                disabled={me.myGuesses?.some((g: any) => g.targetPlayerId === p.id)}
              >
                {me.myGuesses?.some((g: any) => g.targetPlayerId === p.id) ? '✅ 已猜過' : '猜他'}
              </Button>
            )}
          </div>

          <div className="position-relative bg-white overflow-hidden" style={{ height: '180px' }}>
            <canvas
              ref={(el) => (canvasRefs.current[p.id] = el)}
              width={1200}
              height={800}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                backgroundColor: '#ffffff',
                pointerEvents: 'none',
              }}
            />

            {!(phase === 'round_ended' || (phase === 'playing' && me?.isDoneDrawing)) && (
              <div
                className="d-flex flex-column align-items-center justify-content-center position-absolute top-0 start-0 w-100 h-100 text-muted bg-light"
                style={{ zIndex: 5 }}
              >
                <div className="fs-1 mb-2">🎨</div>
                <div className="small fw-bold text-center px-3">
                  {phase === 'waiting' ? '等待玩家準備中...' : '完成您的畫作後即可觀察'}
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
      {otherPlayers.length === 0 && (
        <div className="text-center py-5 bg-light rounded-4 border border-dashed">
          <div className="text-muted">暫無其他玩家加入</div>
        </div>
      )}
    </>
  );
};

export default PlayerList;
