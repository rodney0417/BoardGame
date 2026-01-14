import React, { useState, useEffect, useRef } from 'react';
import { Button, Card } from 'react-bootstrap';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { RoomDTO } from '../../types';
import { SymbolIcon } from './PictomaniaIcons';

import GameTimer from '../shared/GameTimer';
import GuessModal from './components/GuessModal';
import GameOverView from './components/GameOverView';
import DrawingCanvas from './components/DrawingCanvas';
import PlayerList from './components/PlayerList';
import RoundResultSummary from './components/RoundResultSummary';
import GameLobby from '../shared/GameLobby';
import GameOver from '../shared/GameOver';
import GameLayout from '../shared/GameLayout';

import { PictomaniaPlayer, PictomaniaPhase, PictomaniaState } from './types';
import { PICTOMANIA_LEVELS, PICTOMANIA_DRAW_TIMES, PICTOMANIA_CANVAS_WIDTH, PICTOMANIA_CANVAS_HEIGHT } from './constants';

interface PictomaniaSettings {
  difficulty: number;
  drawTime: number;
  totalRounds: number;
}

interface PictomaniaProps {
  socket: Socket;
  room: RoomDTO<PictomaniaState, PictomaniaSettings>;
  me: PictomaniaPlayer;
  onLeaveRoom: () => void;
}

const Pictomania: React.FC<PictomaniaProps> = ({ socket, room, me, onLeaveRoom }) => {
  const roomId = room.id;
  const gameState = room.gameState;
  const phase = room.phase as PictomaniaPhase;
  const players = room.players as PictomaniaPlayer[];
  const timeLeft = room.timeLeft;
  const { currentRound = 1, wordCards: cards = {}, history = [] } = (gameState || {}) as any;

  const levels = PICTOMANIA_LEVELS;
  const isHost = players.length > 0 && players[0].id === me.id;

  const [showGuessModal, setShowGuessModal] = useState(false);
  const [targetPlayer, setTargetPlayer] = useState<PictomaniaPlayer | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');

  const drawTimes = PICTOMANIA_DRAW_TIMES;

  const myCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (phase === 'game_over') return;

    const handleUpdateCanvas = (data: { playerId: string; imageBase64: string }) => {
      if (data.playerId !== me.id && canvasRefs.current[data.playerId]) {
        const canvas = canvasRefs.current[data.playerId];
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          };
          img.src = data.imageBase64;
        }
      }
    };

    socket.on('update_canvas', handleUpdateCanvas);

    const handleDraw = (data: any) => {
      if (data.playerId !== me.id && canvasRefs.current[data.playerId]) {
        const canvas = canvasRefs.current[data.playerId];
        const ctx = canvas?.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          ctx.moveTo(data.lastX, data.lastY);
          ctx.lineTo(data.x, data.y);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 5;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }
    };

    socket.on('draw', handleDraw);
    socket.on('clear_canvas', (data: any) => {
      if (data.playerId !== me.id && canvasRefs.current[data.playerId]) {
        canvasRefs.current[data.playerId]?.getContext('2d')?.clearRect(0, 0, PICTOMANIA_CANVAS_WIDTH, PICTOMANIA_CANVAS_HEIGHT);
      }
    });

    return () => {
      socket.off('update_canvas', handleUpdateCanvas);
      socket.off('draw', handleDraw);
      socket.off('clear_canvas');
    };
  }, [players, me.id, socket, phase]);

  useEffect(() => {
    Object.values(canvasRefs.current).forEach((canvas) => {
      canvas?.getContext('2d')?.clearRect(0, 0, 1200, 800);
    });
    myCanvasRef.current?.getContext('2d')?.clearRect(0, 0, 1200, 800);
  }, [currentRound]);

  useEffect(() => {
    const handleRequestImages = () => {
      if (myCanvasRef.current) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 1200;
        tempCanvas.height = 800;
        const tempCtx = tempCanvas.getContext('2d');

        if (tempCtx) {
          tempCtx.fillStyle = '#ffffff';
          tempCtx.fillRect(0, 0, 1200, 800);
          tempCtx.drawImage(myCanvasRef.current, 0, 0);

          const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.6);
          socket.emit('upload_image', { roomId, imageBase64: dataUrl });
        }
      }
    };

    socket.on('request_round_images', handleRequestImages);
    return () => {
      socket.off('request_round_images', handleRequestImages);
    };
  }, [socket, roomId]);

    // Recover Canvas State on Mount (and phase === 'playing')
    useEffect(() => {
        if (phase === 'playing' && !me.isDoneDrawing) {
            const savedCanvas = localStorage.getItem('pictomania_canvas_backup');
            if (savedCanvas && myCanvasRef.current) {
                 const img = new Image();
                 img.onload = () => {
                     const ctx = myCanvasRef.current?.getContext('2d');
                     if (ctx) {
                         ctx.clearRect(0, 0, 1200, 800);
                         ctx.drawImage(img, 0, 0);
                     }
                 };
                 img.src = savedCanvas;
            }
        }
    }, [phase, me.isDoneDrawing]); // Only run when entering playing phase or recovering

    useEffect(() => {
        // Clear backup when round changes or done drawing
        if (me.isDoneDrawing || phase !== 'playing') {
            localStorage.removeItem('pictomania_canvas_backup');
        }
    }, [currentRound, me.isDoneDrawing, phase]);


  const startGame = () => socket.emit('start_game', { roomId, difficulty: currentDifficulty, drawTime: currentDrawTime });
  const nextRound = () => socket.emit('next_round', { roomId, difficulty: currentDifficulty, drawTime: currentDrawTime });
  const handleFinishDrawing = () => {
      socket.emit('player_finish_drawing', roomId);
      localStorage.removeItem('pictomania_canvas_backup');
  };
  const handleClearCanvas = () => {
    myCanvasRef.current?.getContext('2d')?.clearRect(0, 0, 1200, 800);
    socket.emit('clear_canvas', roomId);
    localStorage.removeItem('pictomania_canvas_backup');
  };
  
  const handleSaveCanvas = () => {
      if (myCanvasRef.current) {
          const dataUrl = myCanvasRef.current.toDataURL();
          localStorage.setItem('pictomania_canvas_backup', dataUrl);
      }
  };

  const handleGuessClick = (player: PictomaniaPlayer) => {
    setTargetPlayer(player);
    const availableSymbols = Object.keys(cards || {});
    if (!selectedSymbol && availableSymbols.length > 0) {
      setSelectedSymbol(availableSymbols[0]);
    }
    setShowGuessModal(true);
  };

  const handleGuessSubmit = (symbol: string, number: number) => {
    if (targetPlayer) {
      socket.emit('guess_word', {
        roomId,
        guesserId: me.id,
        targetPlayerId: targetPlayer.id,
        symbol,
        number,
      });
      setShowGuessModal(false);
    }
  };

  const otherPlayers = players.filter((p: PictomaniaPlayer) => p.id !== me.id);

  // Derived State (Server Authority)
  const settings = room.settings as any;
  const currentDifficulty = settings?.difficulty || 1;
  const currentDrawTime = settings?.drawTime || 60;



  const updateSetting = (key: 'difficulty' | 'drawTime', value: number) => {
    if (!isHost) return;
    
    // Server Authority: Just emit, UI updates on broadcast
    socket.emit('game_event', {
      roomId,
      action: 'update_settings',
      data: { [key]: value }
    });
  };

  // Host Controls
  const hostControls = (
    <div className="d-flex flex-column gap-3">
      {/* Difficulty */}
      <div className="d-flex align-items-center justify-content-between">
        <span className="text-muted small fw-bold">難度等級</span>
        <div className="d-flex gap-2">
          {levels.map((level: number) => (
            <Button
              key={level}
              size="sm"
              variant={currentDifficulty === level ? 'primary' : 'outline-secondary'}
              className="rounded-circle p-0 fw-bold"
              style={{ width: '30px', height: '30px', cursor: isHost ? 'pointer' : 'default' }}
              onClick={() => isHost && updateSetting('difficulty', level)}
              disabled={!isHost && currentDifficulty !== level}
            >
              {level}
            </Button>
          ))}
        </div>
      </div>

      {/* Draw Time */}
      <div className="d-flex align-items-center justify-content-between">
        <span className="text-muted small fw-bold">繪畫時間</span>
        <div className="d-flex gap-2">
          {drawTimes.map((time: number) => (
            <Button
              key={time}
              size="sm"
              variant={currentDrawTime === time ? 'success' : 'outline-secondary'}
              className="rounded-pill px-2 fw-bold"
              style={{ minWidth: '45px', cursor: isHost ? 'pointer' : 'default' }}
              onClick={() => isHost && updateSetting('drawTime', time)}
              disabled={!isHost && currentDrawTime !== time}
            >
              {time}s
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  if (phase === 'waiting') {
    return (
      <GameLobby
        gameType="pictomania"
        players={players.map((p: PictomaniaPlayer) => ({ id: p.id, username: p.username }))}
        myId={me.id}
        isHost={isHost}
        onStartGame={startGame}
        hostControls={hostControls}
        onLeave={onLeaveRoom}
      />
    );
  }

  if (phase === 'game_over') {
    return (
      <GameOver
        gameType="pictomania"
        players={players.map((p: PictomaniaPlayer) => ({
          id: p.id,
          username: p.username,
          score: p.score || 0,
        }))}
        onRestart={startGame}
        onBackToLobby={onLeaveRoom}
      >
        <GameOverView players={players} history={history} onRestart={startGame} />
      </GameOver>
    );
  }

  const sidebarContent = (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="m-0 fw-bold text-secondary">遊戲資訊</h5>
        <div className="d-flex align-items-center bg-white rounded-pill px-3 py-1 shadow-sm border">
            <span className="small text-muted me-2">Round</span>
            <span className="fw-bold fs-5 text-dark">{currentRound}</span>
            <span className="small text-muted mx-1">/</span>
            <span className="small text-muted">5</span>
        </div>
      </div>

      <PlayerList
         otherPlayers={otherPlayers}
         me={me}
         phase={phase}
         canvasRefs={canvasRefs}
         onGuessClick={handleGuessClick}
      />

      {hostControls && (
        <div className="mt-4 p-3 bg-white rounded-3 shadow-sm border">
            <h6 className="text-muted small fw-bold mb-3 border-bottom pb-2">房主控制</h6>
            {hostControls}
        </div>
      )}

      <div className="mt-auto pt-4">
        <Button 
            variant="outline-danger" 
            className="w-100 rounded-pill py-2 shadow-sm"
            onClick={onLeaveRoom}
        >
            離開房間
        </Button>
      </div>
    </>
  );

  return (
    <GameLayout
      maxWidth="1400px"
      sidebar={sidebarContent}
      onLeave={onLeaveRoom}
      main={
        <>
            <GameTimer 
                timeLeft={timeLeft} 
                visible={phase === 'playing' && !me?.isDoneDrawing}
            />

            <Card className="custom-card p-4 h-100 border-0 shadow-sm" style={{ minHeight: '600px' }}>
                
                <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-3">
                            <h4 className="fw-bold m-0 text-dark">
                                {phase === 'round_ended' ? '本局結算' : '您的畫布'}
                            </h4>
                            {me.targetWord && (
                                <div className="d-flex align-items-center bg-light rounded-pill px-3 py-1 border">
                                    <span className="badge bg-secondary rounded-pill me-2">#{me.numberCard}</span>
                                    <span className="fw-bold text-dark">{me.targetWord}</span>
                                </div>
                            )}
                        </div>

                         {phase === 'playing' && !me.isDoneDrawing && (
                             <div className="d-flex gap-2">
                                <Button
                                  variant="link"
                                  className="text-muted text-decoration-none p-0 px-2"
                                  onClick={handleClearCanvas}
                                >
                                  清空
                                </Button>
                                <Button
                                  variant="primary" 
                                  size="sm"
                                  className="rounded-pill px-4 fw-bold shadow-sm"
                                  onClick={handleFinishDrawing}
                                >
                                  {me.isDoneDrawing ? (
                                    <>
                                      <CheckCircle size={16} className="me-1" /> 已完成
                                    </>
                                  ) : (
                                    '畫好了'
                                  )}
                                </Button>
                             </div>
                        )}
                    </div>

                    <div className="flex-grow-1 position-relative bg-light rounded-4 overflow-hidden">
                       {phase === 'round_ended' ? (
                            <div className="p-3 h-100 overflow-auto">
                                <RoundResultSummary 
                                    players={players} 
                                    history={history} 
                                    currentRound={currentRound} 
                                />
                                {isHost && (
                                     <div className="text-center mt-4">
                                        <Button 
                                            size="lg" 
                                            variant="dark" 
                                            className="rounded-pill px-5 shadow fw-bold"
                                            onClick={nextRound}
                                        >
                                            下一回合 <ArrowRight size={20} className="ms-2"/>
                                        </Button>
                                     </div>
                                )}
                            </div>
                       ) : (
                            <DrawingCanvas
                                me={me}
                                phase={phase}
                                canvasRef={myCanvasRef}
                                isDrawingRef={isDrawing}
                                lastPosRef={lastPos}
                                onDraw={(data) => socket.emit('draw', { roomId, ...data })}
                                onStrokeEnd={handleSaveCanvas}
                            />
                       )}
                   </div>
            </Card>

          <GuessModal
            show={showGuessModal}
            onHide={() => setShowGuessModal(false)}
            targetPlayer={targetPlayer}
            cards={cards}
            selectedSymbol={selectedSymbol}
            onSymbolSelect={setSelectedSymbol}
            onGuess={handleGuessSubmit}
            usedNumbers={me?.myGuesses?.map((g: any) => g.number) || []}
            mySymbol={me?.symbolCard || ''}
            myNumber={me?.numberCard || 0}
          />
        </>
      }
    />
  );
};

export default Pictomania;
