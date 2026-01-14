import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Button, Card } from 'react-bootstrap';
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

import { PictomaniaPlayer, PictomaniaPhase } from './types';

interface PictomaniaProps {
  socket: Socket;
  room: RoomDTO;
  me: PictomaniaPlayer;
}

const Pictomania: React.FC<PictomaniaProps> = ({ socket, room, me }) => {
  const roomId = room.id;
  const gameState = room.gameState;
  const phase = room.phase as PictomaniaPhase;
  const players = room.players as PictomaniaPlayer[];
  const timeLeft = room.timeLeft;
  const { currentRound = 1, wordCards: cards = {}, history = [] } = (gameState || {}) as any;

  const levels = [1, 2, 3, 4];
  const isHost = players.length > 0 && players[0].id === me.id;

  const [showGuessModal, setShowGuessModal] = useState(false);
  const [targetPlayer, setTargetPlayer] = useState<PictomaniaPlayer | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(1);
  const [selectedDrawTime, setSelectedDrawTime] = useState<number>(60);
  const drawTimes = [30, 45, 60, 90];

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
        canvasRefs.current[data.playerId]?.getContext('2d')?.clearRect(0, 0, 1200, 800);
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

  const startGame = () => socket.emit('start_game', { roomId, difficulty: selectedDifficulty, drawTime: selectedDrawTime });
  const nextRound = () => socket.emit('next_round', { roomId, difficulty: selectedDifficulty, drawTime: selectedDrawTime });
  const stopDrawing = () => socket.emit('player_finish_drawing', roomId);
  const requestClear = () => {
    myCanvasRef.current?.getContext('2d')?.clearRect(0, 0, 1200, 800);
    socket.emit('clear_canvas', roomId);
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
              variant={selectedDifficulty === level ? 'primary' : 'outline-secondary'}
              className="rounded-circle p-0 fw-bold"
              style={{ width: '30px', height: '30px' }}
              onClick={() => setSelectedDifficulty(level)}
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
              variant={selectedDrawTime === time ? 'success' : 'outline-secondary'}
              className="rounded-pill px-2 fw-bold"
              style={{ minWidth: '45px' }}
              onClick={() => setSelectedDrawTime(time)}
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
      />
    );
  }

  return (
    <>
      <GameTimer 
        timeLeft={timeLeft} 
        visible={phase === 'playing' && !me?.isDoneDrawing}
        phase={phase}
      />

      {phase === 'game_over' ? (
        <GameOverView players={players} history={history} onRestart={startGame} />
      ) : (
        <Row>
          <Col lg={8}>
            <Card
              className="custom-card p-4 mb-4"
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="game-header-stats d-flex align-items-center gap-2">
                  <div
                    className="d-flex align-items-center bg-white rounded-pill px-3 py-1 shadow-sm text-nowrap user-select-none"
                    style={{ border: '1px solid #e9ecef' }}
                  >
                    <span
                      className="text-uppercase text-secondary me-2 fw-bold d-none d-sm-inline"
                      style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}
                    >
                      Round
                    </span>
                    <span
                      className="fw-bolder text-dark"
                      style={{
                        fontSize: '1.25rem',
                        lineHeight: 1,
                        fontFamily: 'Rubik, sans-serif',
                      }}
                    >
                      {currentRound}
                    </span>
                    <span className="text-muted mx-1 small">/</span>
                    <span className="text-muted fw-medium fs-6">5</span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2 gap-sm-3 flex-wrap">
                  {/* Show target info during playing/round_ended */}
                  <div className="d-flex align-items-center gap-2">
                    <div className="d-flex align-items-center bg-light rounded-pill px-2 px-sm-3 py-1 shadow-sm border">
                      <SymbolIcon
                        symbol={me?.symbolCard || ''}
                        size={20}
                        className="me-1 me-sm-2"
                      />
                      <div className="text-nowrap small">
                        <span className="text-secondary fw-bold d-none d-sm-inline me-1">
                          目標:
                        </span>
                        <span className="fw-bolder text-dark">
                          #{me?.numberCard} {me?.targetWord}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-1 ms-auto ms-sm-0">
                    {phase === 'playing' && !me?.isDoneDrawing && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="rounded-pill px-2 px-sm-3 border-0 shadow-none"
                        onClick={requestClear}
                      >
                        🗑️ <span className="d-none d-sm-inline">清空</span>
                      </Button>
                    )}
                    {phase === 'round_ended' ? (
                      isHost ? (
                        <div className="d-flex align-items-center gap-2">
                          <div className="d-flex align-items-center gap-1 bg-light rounded-pill px-2 py-1">
                            <span className="text-muted small fw-bold me-1">Lv</span>
                            {levels.map((level: number) => (
                              <Button
                                key={level}
                                size="sm"
                                variant={
                                  selectedDifficulty === level ? 'primary' : 'outline-secondary'
                                }
                                className="rounded-circle p-0 border-0"
                                style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}
                                onClick={() => setSelectedDifficulty(level)}
                              >
                                {level}
                              </Button>
                            ))}
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={nextRound}
                            className="rounded-pill px-3 shadow-sm text-nowrap"
                          >
                            <span className="d-none d-sm-inline">下一局</span>{' '}
                            <ArrowRight size={14} />
                          </Button>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center gap-2 text-muted fw-bold">
                          <span>⏳ 等待房主選擇下一局...</span>
                        </div>
                      )
                    ) : (
                      <Button
                        variant={me?.isDoneDrawing ? 'secondary' : 'success'}
                        size="sm"
                        onClick={stopDrawing}
                        disabled={me?.isDoneDrawing}
                        className="rounded-pill px-3 shadow-sm text-nowrap"
                      >
                        {me?.isDoneDrawing ? (
                          <>
                            <span className="d-none d-sm-inline">已停筆</span>
                            <CheckCircle size={14} />
                          </>
                        ) : (
                          '畫好了'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {phase === 'round_ended' ? (
                <RoundResultSummary players={players} />
              ) : (
                <DrawingCanvas
                  me={me}
                  phase={phase}
                  canvasRef={myCanvasRef}
                  isDrawingRef={isDrawing}
                  lastPosRef={lastPos}
                  onDraw={(data) => socket.emit('draw', { roomId, ...data })}
                />
              )}
            </Card>
          </Col>

          <Col lg={4}>
            <PlayerList
              otherPlayers={otherPlayers}
              me={me}
              phase={phase}
              canvasRefs={canvasRefs}
              onGuessClick={handleGuessClick}
            />
          </Col>
        </Row>
      )}

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
  );
};

export default Pictomania;
