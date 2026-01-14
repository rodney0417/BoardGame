import { PictomaniaPlayer, PictomaniaPhase } from '../types';
import { PICTOMANIA_CANVAS_WIDTH, PICTOMANIA_CANVAS_HEIGHT } from '../constants';

interface DrawingCanvasProps {
  me: PictomaniaPlayer;
  phase: PictomaniaPhase;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  isDrawingRef: React.MutableRefObject<boolean>;
  lastPosRef: React.MutableRefObject<{ x: number; y: number }>;
  onDraw?: (data: { lastX: number; lastY: number; x: number; y: number; color: string }) => void;
  onStrokeEnd?: () => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  me,
  phase,
  canvasRef,
  isDrawingRef,
  lastPosRef,
  onDraw,
  onStrokeEnd,
}) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    if (phase !== 'playing' || me?.isDoneDrawing) return;
    isDrawingRef.current = true;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (e.clientX - rect.left) * (PICTOMANIA_CANVAS_WIDTH / rect.width);
      const y = (e.clientY - rect.top) * (PICTOMANIA_CANVAS_HEIGHT / rect.height);
      lastPosRef.current = { x, y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingRef.current || !canvasRef.current || me?.isDoneDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    if (ctx && rect) {
      const x = (e.clientX - rect.left) * (PICTOMANIA_CANVAS_WIDTH / rect.width);
      const y = (e.clientY - rect.top) * (PICTOMANIA_CANVAS_HEIGHT / rect.height);

      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.stroke();

      onDraw?.({
        lastX: lastPosRef.current.x,
        lastY: lastPosRef.current.y,
        x,
        y,
        color: me.color,
      });

      lastPosRef.current = { x, y };
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (phase !== 'playing' || me?.isDoneDrawing) return;
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (touch.clientX - rect.left) * (PICTOMANIA_CANVAS_WIDTH / rect.width);
      const y = (touch.clientY - rect.top) * (PICTOMANIA_CANVAS_HEIGHT / rect.height);
      isDrawingRef.current = true;
      lastPosRef.current = { x, y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDrawingRef.current || !canvasRef.current || me?.isDoneDrawing) return;
    const touch = e.touches[0];
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    if (ctx && rect) {
      const x = (touch.clientX - rect.left) * (PICTOMANIA_CANVAS_WIDTH / rect.width);
      const y = (touch.clientY - rect.top) * (PICTOMANIA_CANVAS_HEIGHT / rect.height);

      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.stroke();

      onDraw?.({
        lastX: lastPosRef.current.x,
        lastY: lastPosRef.current.y,
        x,
        y,
        color: me.color,
      });

      lastPosRef.current = { x, y };
    }
  };

  const handleStopDrawing = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      onStrokeEnd?.();
    }
  };

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={PICTOMANIA_CANVAS_WIDTH}
        height={PICTOMANIA_CANVAS_HEIGHT}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          cursor: phase === 'playing' && !me?.isDoneDrawing ? 'crosshair' : 'not-allowed',
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.1)',
          touchAction: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleStopDrawing}
        onMouseOut={handleStopDrawing}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleStopDrawing}
      />
    </div>
  );
};

export default DrawingCanvas;
