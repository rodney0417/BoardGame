import React, { useState, useEffect, useRef } from 'react';
import { Button, Card } from 'react-bootstrap';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { RoomDTO } from '../../types';
import {
  SymbolIcon,
  GuessModal,
  GameOverView,
  DrawingCanvas,
  PlayerList,
  RoundResultSummary,
} from './components';

import {
  GameTimer,
  GameLobby,
  GameOver,
  GameLayout,
  useGameRoom,
  SidebarSection,
  HostSettingControl,
  GameRulesModal,
} from '../shared';

import { PictomaniaPlayer, PictomaniaPhase, PictomaniaState } from './types';
import {
  PICTOMANIA_LEVELS,
  PICTOMANIA_DRAW_TIMES,
  PICTOMANIA_CANVAS_WIDTH,
  PICTOMANIA_CANVAS_HEIGHT,
} from './constants';

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

const Pictomania: React.FC<PictomaniaProps> = ({
  socket,
  room,
  me: myInitialInfo,
  onLeaveRoom,
}) => {
  const { roomId, gameState, phase, players, me, isHost, otherPlayers, settings, timeLeft } =
    useGameRoom<PictomaniaState, PictomaniaSettings>(room, myInitialInfo.id);

  const { currentRound = 1, wordCards: cards = {}, history = [] } = (gameState || {}) as any;

  const levels = PICTOMANIA_LEVELS;

  const [showGuessModal, setShowGuessModal] = useState(false);
  const [targetPlayer, setTargetPlayer] = useState<PictomaniaPlayer | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [showRules, setShowRules] = useState(false);

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
        canvasRefs.current[data.playerId]
          ?.getContext('2d')
          ?.clearRect(0, 0, PICTOMANIA_CANVAS_WIDTH, PICTOMANIA_CANVAS_HEIGHT);
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

  // Initialize canvases from history when entering guessing phase
  useEffect(() => {
    if (phase === 'playing' && me.isDoneDrawing) {
      // Delay request slightly to ensure PlayerList component is mounted and refs are assigned
      // Race Condition: If we request too early, the 'update_canvas' events might return before we render.
      const requestTimer = setTimeout(() => {
        console.log('[Pictomania] Requesting all canvas snapshots from server...');
        socket.emit('request_all_canvases', { roomId });
      }, 250);

      const historyTimer = setTimeout(() => {
        history
          .filter((h: any) => h.round === currentRound && h.playerId !== me.id)
          .forEach((h: any) => {
            const canvas = canvasRefs.current[h.playerId];
            if (canvas && h.imageBase64) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                const img = new Image();
                img.onload = () => {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0);
                };
                img.src = h.imageBase64;
              }
            }
          });
      }, 100);

      return () => {
        clearTimeout(requestTimer);
        clearTimeout(historyTimer);
      };
    }
  }, [phase, me.isDoneDrawing, history, currentRound, me.id, roomId, socket]);

  const startGame = () =>
    socket.emit('start_game', { roomId, difficulty: currentDifficulty, drawTime: currentDrawTime });
  const nextRound = () =>
    socket.emit('next_round', { roomId, difficulty: currentDifficulty, drawTime: currentDrawTime });
  const handleFinishDrawing = () => {
    // First, upload the canvas image so other players can see it
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

  // Derived State (Server Authority)
  const currentDifficulty = settings?.difficulty || 1;
  const currentDrawTime = settings?.drawTime || 60;

  const updateSetting = (key: 'difficulty' | 'drawTime', value: number) => {
    if (!isHost) return;

    // Server Authority: Just emit, UI updates on broadcast
    socket.emit('update_settings', {
      [key]: value,
    });
  };

  // Host Controls
  const hostControls = (
    <SidebarSection>
      <HostSettingControl
        label="難度等級"
        options={[...PICTOMANIA_LEVELS]}
        currentValue={currentDifficulty}
        onSelect={(val) => updateSetting('difficulty', val)}
        isHost={isHost}
      />
      <HostSettingControl
        label="繪畫時間"
        options={[...PICTOMANIA_DRAW_TIMES]}
        currentValue={currentDrawTime}
        onSelect={(val) => updateSetting('drawTime', val)}
        isHost={isHost}
        unit="s"
        isLast
      />
    </SidebarSection>
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
        <GameOverView players={players} history={history} />
      </GameOver>
    );
  }

  const gameInfoSection = (
    <SidebarSection>
      <div className="d-flex flex-row flex-lg-column gap-2">
        {/* Round Info */}
        <div className="d-flex align-items-center justify-content-center justify-content-lg-between p-2 p-md-3 bg-white rounded-3 shadow-sm border flex-fill">
          <span className="text-muted small fw-bold me-2 d-none d-lg-block">目前回合</span>
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '0.9rem' }}>🏁</span>
            <span className="fw-bold text-dark small">{currentRound} / 5</span>
          </div>
        </div>

        {/* Time Left - Only show during playing */}
        {phase === 'playing' && (
          <div className="d-flex align-items-center justify-content-center justify-content-lg-between p-2 p-md-3 bg-white rounded-3 shadow-sm border flex-fill">
            <span className="text-muted small fw-bold me-2 d-none d-lg-block">剩餘時間</span>
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '0.9rem' }}>⏱️</span>
              <span className="fw-bold text-dark small">{timeLeft}s</span>
            </div>
          </div>
        )}
      </div>
    </SidebarSection>
  );

  const sidebarContent = (
    <>
      {hostControls && (
        <div className="p-3 bg-white rounded-3 shadow-sm border">{hostControls}</div>
      )}

      <div className="mt-auto pt-4">
        <Button
          variant="outline-primary"
          className="w-100 rounded-pill py-2 shadow-sm mb-2"
          onClick={() => setShowRules(true)}
        >
          📖 遊戲說明
        </Button>
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

  // Refactored to keep PlayerList mounted (but hidden) so it captures draw events in background
  const showGuessingInterface = me.isDoneDrawing && phase === 'playing';
  const showDrawingInterface = !me.isDoneDrawing || phase === 'round_ended';

  const mainContent = (
    <>
      {/* Guessing Interface (PlayerList) - Always mounted during playing to catch events, hidden when drawing */}
      <div className={showGuessingInterface ? 'd-block' : 'd-none'}>
        <PlayerList
          otherPlayers={otherPlayers}
          me={me}
          phase={phase}
          canvasRefs={canvasRefs}
          onGuessClick={handleGuessClick}
        />
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
      </div>

      {/* Drawing Interface (Card) - Hidden when guessing */}
      <div className={showDrawingInterface ? 'd-block h-100' : 'd-none'}>
        <Card
          className="custom-card p-4 h-100 border-0 shadow-sm d-flex flex-column"
          style={{ minHeight: '400px' }}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center gap-3">
              <h4 className="fw-bold m-0 text-dark">
                {phase === 'round_ended' ? '本局結算' : '您的畫布'}
              </h4>
              {me.targetWord && !me.isDoneDrawing && (
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
                  畫好了
                </Button>
              </div>
            )}
          </div>

          <div className="flex-grow-1 position-relative overflow-hidden">
            {phase === 'round_ended' ? (
              <div className="h-100 overflow-auto">
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
                      下一回合 <ArrowRight size={20} className="ms-2" />
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
        </Card>
      </div>
    </>
  );

  return (
    <GameLayout
      maxWidth="1400px"
      sidebar={sidebarContent}
      gameInfo={gameInfoSection}
      main={mainContent}
    />
  );
};

export default Pictomania;
