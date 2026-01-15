import React, { useState, useEffect } from 'react';
import { getUnoColorHex } from './constants';
import { useGameRoom } from '../shared/hooks/useGameRoom';
import { SidebarSection } from '../shared/components/SidebarModules';
import { Socket } from 'socket.io-client';
import { Button, Card, Row, Col } from 'react-bootstrap';
import { UnoCard as UnoCardType, UnoPlayer, CardColor, UnoState } from './types';
import UnoCardComponent from './components/UnoCard';
import PlayerHand from './components/PlayerHand';
import ColorPicker from './components/ColorPicker';
import GameLobby from '../shared/GameLobby';
import GameOver from '../shared/GameOver';
import UnoSettlementView from './components/UnoSettlementView';
import GameLayout from '../shared/GameLayout';

interface UnoProps {
  socket: Socket;
  room: any;
  me: UnoPlayer;
  onLeaveRoom: () => void;
}

const Uno: React.FC<UnoProps> = ({ socket, room, me: myInitialInfo, onLeaveRoom }) => {
  const { roomId, gameState, phase, players, me, isHost, otherPlayers } = useGameRoom<
    UnoState,
    any,
    UnoPlayer
  >(room, myInitialInfo.id);

  const [hand, setHand] = useState<UnoCardType[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingCard, setPendingCard] = useState<UnoCardType | null>(null);

  const [unoEffect, setUnoEffect] = useState<{ visible: boolean; username: string }>({
    visible: false,
    username: '',
  });
  const { topCard, activeColor, currentPlayer, direction, deckSize, hasDrawnThisTurn } =
    gameState || {};

  useEffect(() => {
    // Fetch initial hand
    socket.emit('get_hand');

    const handleHandUpdate = (data: { hand: UnoCardType[] }) => {
      setHand(data.hand);
    };

    const handleUnoShouted = (data: { playerId: string; username: string }) => {
      setUnoEffect({ visible: true, username: data.username });
      setTimeout(() => setUnoEffect({ visible: false, username: '' }), 3000);
    };

    socket.on('hand_update', handleHandUpdate);
    socket.on('uno_shouted', handleUnoShouted);

    return () => {
      socket.off('hand_update', handleHandUpdate);
      socket.off('uno_shouted', handleUnoShouted);
    };
  }, [socket]);

  const isMyTurn = currentPlayer === me.id;

  const handlePlayCard = (card: UnoCardType) => {
    if (!isMyTurn) return;

    if (card.color === 'wild') {
      setPendingCard(card);
      setShowColorPicker(true);
    } else {
      socket.emit('play_card', { card });
    }
  };

  const handleColorSelect = (color: CardColor) => {
    if (pendingCard) {
      socket.emit('play_card', { card: pendingCard, chosenColor: color });
      setPendingCard(null);
      setShowColorPicker(false);
    }
  };

  const handleDraw = () => {
    if (!isMyTurn || hasDrawnThisTurn) return;
    socket.emit('draw_card');
  };

  const handlePass = () => {
    if (!isMyTurn || !hasDrawnThisTurn) return;
    socket.emit('pass_turn');
  };

  const handleCallUno = () => {
    socket.emit('call_uno');
  };

  const handleChallengeUno = (targetId: string) => {
    socket.emit('challenge_uno', { targetId });
  };

  const startGame = () => {
    socket.emit('start_game', room.id);
  };

  const amIUnoSafe = players.find((p: UnoPlayer) => p.id === me.id)?.isUno;
  const canCallUno = hand.length === 1 && !amIUnoSafe && phase === 'playing';

  if (phase === 'waiting') {
    return (
      <GameLobby
        gameType="uno"
        players={players.map((p: UnoPlayer) => ({ id: p.id, username: p.username }))}
        myId={me.id}
        isHost={room.players[0]?.id === me.id}
        onStartGame={startGame}
        onLeave={onLeaveRoom}
      />
    );
  }

  if (phase === 'game_over') {
    const winnerId = gameState?.winner;
    const winner =
      players.find((p: UnoPlayer) => p.id === winnerId) ||
      players.find((p: UnoPlayer) => (p as any).handCount === 0);

    return (
      <GameOver
        gameType="uno"
        players={players.map((p: UnoPlayer) => ({
          id: p.id,
          username: p.username,
          score: p.score || 0,
        }))}
        winner={
          winner
            ? { id: winner.id, username: winner.username, score: winner.score || 0 }
            : undefined
        }
        onRestart={startGame}
        onBackToLobby={onLeaveRoom}
      />
    );
  }

  if (phase === 'round_ended') {
    const winnerId = gameState?.roundWinner;
    const roundPoints = gameState?.roundPoints;

    return (
      <UnoSettlementView
        players={players}
        winnerId={winnerId}
        roundPoints={roundPoints}
        onNextRound={() => socket.emit('next_round', room.id)}
        isHost={room.players[0]?.id === me.id}
      />
    );
  }

  const gameInfoSection = (
    <SidebarSection className="d-flex flex-row flex-lg-column gap-2">
      {/* Active Color */}
      <div className="d-flex align-items-center justify-content-center justify-content-lg-between p-2 p-md-3 bg-white rounded-3 shadow-sm border flex-fill">
        <span className="text-muted small fw-bold me-2 d-none d-lg-block">目前顏色</span>
        <div className="d-flex align-items-center gap-2 bg-light px-2 px-md-3 py-1 rounded-pill border">
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: getUnoColorHex(activeColor),
            }}
          />
          <span className="fw-bold text-dark small">{activeColor || '無'}</span>
        </div>
      </div>

      {/* Direction */}
      <div className="d-flex align-items-center justify-content-center justify-content-lg-between p-2 p-md-3 bg-white rounded-3 shadow-sm border flex-fill">
        <span className="text-muted small fw-bold me-2 d-none d-lg-block">出牌方向</span>
        <div className="d-flex align-items-center gap-2 bg-light px-2 px-md-3 py-1 rounded-pill border">
          <span
            style={{
              transform: direction === -1 ? 'scaleX(-1)' : 'none',
              display: 'inline-block',
              fontSize: '0.9rem',
            }}
          >
            ↻
          </span>
          <span className="fw-bold text-dark small">{direction === 1 ? '順時針' : '逆時針'}</span>
        </div>
      </div>

      {/* Deck Size */}
      <div className="d-flex align-items-center justify-content-center justify-content-lg-between p-2 p-md-3 bg-white rounded-3 shadow-sm border flex-fill">
        <span className="text-muted small fw-bold me-2 d-none d-lg-block">牌堆剩餘</span>
        <div className="d-flex align-items-center gap-2 bg-light px-2 px-md-3 py-1 rounded-pill border">
          <span style={{ fontSize: '0.9rem' }}>🎴</span>
          <span className="fw-bold text-dark small">{deckSize || 0}</span>
        </div>
      </div>
    </SidebarSection>
  );

  const sidebarContent = (
    <div className="mt-auto pt-4">
      <Button
        variant="outline-danger"
        className="w-100 rounded-pill py-2 shadow-sm"
        onClick={onLeaveRoom}
      >
        離開房間
      </Button>
    </div>
  );

  return (
    <GameLayout
      maxWidth="1400px"
      sidebar={sidebarContent}
      gameInfo={gameInfoSection}
      main={
        <>
          {unoEffect.visible && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                pointerEvents: 'none',
              }}
            >
              <div className="text-center">
                <div
                  className="fw-bold text-danger"
                  style={{
                    fontSize: '8rem',
                    textShadow: '0px 0px 20px rgba(0,0,0,0.5), 4px 4px 0px #000',
                    animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  }}
                >
                  UNO!
                </div>
                <div
                  className="fs-2 text-white fw-bold"
                  style={{
                    textShadow: '2px 2px 4px #000',
                    animation: 'fadeIn 0.5s ease-out',
                  }}
                >
                  {unoEffect.username}
                </div>
              </div>
            </div>
          )}

          <div className="d-flex flex-column gap-4">
            {/* Opponents */}
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              {players
                .filter((p: UnoPlayer) => p.id !== me.id)
                .map((p: UnoPlayer) => (
                  <Card
                    key={p.id}
                    className={
                      `text-center shadow-sm ${currentPlayer === p.id ? 'border-warning border-3' : 'border'} ` +
                      (p.isUno ? 'border-danger' : '')
                    }
                    style={{ width: '110px', transition: 'all 0.3s' }}
                  >
                    <Card.Body className="p-2 position-relative">
                      {p.isUno && (
                        <div className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                          UNO!
                        </div>
                      )}
                      <div className="fw-bold small text-truncate">{p.username}</div>
                      <div className="fs-4 fw-bold text-primary">{p.handCount || 0}</div>
                      <small className="text-muted">張牌</small>
                      {p.handCount === 1 && !p.isUno && (
                        <Button
                          size="sm"
                          variant="danger"
                          className="mt-1 w-100"
                          onClick={() => handleChallengeUno(p.id)}
                        >
                          挑戰!
                        </Button>
                      )}
                    </Card.Body>
                  </Card>
                ))}
            </div>

            {/* Center Table */}
            <Card
              className={`bg-light ${isMyTurn ? 'border-warning border-3 shadow-lg' : 'border-0 shadow-sm'}`}
              style={{ borderRadius: '16px', transition: 'all 0.3s' }}
            >
              <Card.Body
                className="d-flex flex-column justify-content-center align-items-center gap-4 py-5"
                style={{ minHeight: '300px' }}
              >
                <div className="d-flex justify-content-center align-items-center gap-5">
                  {/* Draw Pile */}
                  <div
                    className={`card-back d-flex align-items-center justify-content-center cursor-pointer ${isMyTurn && !hasDrawnThisTurn ? 'hover-scale' : ''}`}
                    style={{
                      width: '90px',
                      height: '130px',
                      background: 'linear-gradient(135deg, #111 0%, #333 100%)',
                      borderRadius: '8px',
                      border: '3px solid white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      cursor: isMyTurn && !hasDrawnThisTurn ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                    onClick={handleDraw}
                  >
                    <div
                      className="text-white fw-bold fs-4"
                      style={{
                        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                        fontStyle: 'italic',
                        letterSpacing: '2px',
                      }}
                    >
                      UNO
                    </div>
                  </div>

                  {/* Discard Pile (Top Card) */}
                  <div style={{ transform: 'scale(1.1)' }}>
                    {topCard && (
                      <UnoCardComponent
                        card={topCard}
                        size="lg"
                        displayColor={
                          topCard.color === 'wild' && activeColor ? activeColor : undefined
                        }
                      />
                    )}
                  </div>
                </div>

                {/* Skip Turn Button - Moved inside */}
                {isMyTurn && hasDrawnThisTurn && (
                  <Button
                    variant="outline-secondary"
                    onClick={handlePass}
                    className="px-4 rounded-pill shadow-sm"
                  >
                    跳過回合
                  </Button>
                )}
              </Card.Body>
            </Card>

            {/* Action Buttons (Call UNO) */}
            <div className="d-flex justify-content-center gap-2">
              {canCallUno && (
                <Button
                  variant="danger"
                  className="fw-bold px-4 pulse-animation"
                  onClick={handleCallUno}
                >
                  🔔 UNO!
                </Button>
              )}
            </div>

            {/* My Hand */}
            <div>
              <PlayerHand
                cards={[...hand].sort((a, b) => {
                  const colorOrder: Record<string, number> = {
                    red: 0,
                    blue: 1,
                    green: 2,
                    yellow: 3,
                    wild: 4,
                  };
                  const valueOrder: Record<string, number> = {
                    '0': 0,
                    '1': 1,
                    '2': 2,
                    '3': 3,
                    '4': 4,
                    '5': 5,
                    '6': 6,
                    '7': 7,
                    '8': 8,
                    '9': 9,
                    skip: 10,
                    reverse: 11,
                    draw_two: 12,
                    wild: 13,
                    wild_draw_four: 14,
                    wild_draw_four_game_over: 15,
                  };

                  if (colorOrder[a.color] !== colorOrder[b.color]) {
                    return colorOrder[a.color] - colorOrder[b.color];
                  }
                  return (valueOrder[a.value] || 0) - (valueOrder[b.value] || 0);
                })}
                onCardClick={handlePlayCard}
                isCurrentPlayer={isMyTurn}
                activeColor={activeColor || 'red'}
                topCard={topCard || { color: 'red', value: '0' }}
              />
            </div>
          </div>

          <ColorPicker
            show={showColorPicker}
            onSelect={handleColorSelect}
            onCancel={() => {
              setShowColorPicker(false);
              setPendingCard(null);
            }}
          />

          <style>
            {`
                .hover-scale { transition: transform 0.2s; }
                .hover-scale:hover { transform: scale(1.05); }
                @keyframes popIn {
                    0% { transform: scale(0); opacity: 0; }
                    80% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); }
                }
                @keyframes fadeIn {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
                }
                .pulse-animation {
                    animation: pulse 2s infinite;
                }
                `}
          </style>
        </>
      }
    />
  );
};

export default Uno;
