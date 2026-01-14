import { PictomaniaPlayer, PictomaniaPhase } from '../types';

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
      const x = (e.clientX - rect.left) * (1200 / rect.width);
      const y = (e.clientY - rect.top) * (800 / rect.height);
      lastPosRef.current = { x, y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingRef.current || !canvasRef.current || me?.isDoneDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    if (ctx && rect) {
      const x = (e.clientX - rect.left) * (1200 / rect.width);
      const y = (e.clientY - rect.top) * (800 / rect.height);

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
      const x = (touch.clientX - rect.left) * (1200 / rect.width);
      const y = (touch.clientY - rect.top) * (800 / rect.height);
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
      const x = (touch.clientX - rect.left) * (1200 / rect.width);
      const y = (touch.clientY - rect.top) * (800 / rect.height);

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
    <div className="canvas-wrapper p-1 bg-light rounded-2 shadow-sm">
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
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
