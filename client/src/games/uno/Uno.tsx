import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Container, Button, Badge, Card, Row, Col } from 'react-bootstrap';
import { UnoCard as UnoCardType, UnoPlayer, CardColor } from './types';
import UnoCardComponent from './components/UnoCard';
import PlayerHand from './components/PlayerHand';
import ColorPicker from './components/ColorPicker';
import GameLobby from '../shared/GameLobby';

interface UnoProps {
  socket: Socket;
  room: any;
  me: UnoPlayer;
}

const Uno: React.FC<UnoProps> = ({ socket, room, me }) => {
  const [hand, setHand] = useState<UnoCardType[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingCard, setPendingCard] = useState<UnoCardType | null>(null);

  const { gameState, players, phase } = room;
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
        gameName="UNO"
        gameIcon="🎴"
        gradientColors={['#667eea', '#764ba2']}
        players={players.map((p: UnoPlayer) => ({ id: p.id, username: p.username, color: p.color }))}
        myId={me.id}
        minPlayers={2}
        maxPlayers={10}
        isHost={room.players[0]?.id === me.id}
        onStartGame={startGame}
        rules={[
          '最先打完所有手牌的玩家獲勝',
          '只剩一張牌時記得喊 UNO!',
          '目標分數：500 分',
        ]}
      />
    );
  }


  if (phase === 'game_over') {
    const winnerId = gameState?.winner;
    const winner =
      players.find((p: UnoPlayer) => p.id === winnerId) ||
      players.find((p: UnoPlayer) => (p as any).handCount === 0);
    return (
      <Container className="py-5" style={{ maxWidth: '800px' }}>
        <Card
          className="shadow-lg border-0"
          style={{
            background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
            borderRadius: '16px',
          }}
        >
          <Card.Body className="p-5 text-center">
            <div className="display-1 mb-3">🏆</div>
            <h2 className="display-4 fw-bold mb-3 text-dark">總冠軍</h2>
            <h3 className="mb-4 text-primary fw-bold display-5">{winner?.username || '未知'}</h3>
            <div className="d-inline-block px-4 py-2 bg-success text-white rounded-pill fs-3 fw-bold mb-5 shadow-sm">
              最終得分：{winner?.score || 0} 分
            </div>
            <div>
              <Button variant="outline-primary" size="lg" onClick={() => window.location.reload()}>
                返回大廳
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="py-3" style={{ maxWidth: '1200px', position: 'relative' }}>
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

      <Row className="justify-content-center">
        {' '}
        {/* Added Row and Col */}
        <Col md={12} lg={10}>
          {/* Top Info Bar Removed */}

          {/* Other Players */}
          <div className="d-flex justify-content-center gap-3 flex-wrap mb-4">
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

          {/* Center - Cards Area */}
          <Card className="bg-light border-0 mb-4" style={{ borderRadius: '16px' }}>
            <Card.Body
              className="d-flex justify-content-center align-items-center gap-5 py-5 position-relative"
              style={{ minHeight: '300px' }}
            >
              {/* Status Info (Top Right) */}
              <div className="position-absolute top-0 end-0 p-3 d-flex align-items-center gap-3">
                {/* Active Color Indicator */}
                <div
                  className="d-flex align-items-center justify-content-center px-1 py-1 rounded-circle shadow-sm bg-white"
                  style={{ width: '36px', height: '36px', border: '1px solid #e2e8f0' }}
                  title={`Current Color: ${activeColor}`}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor:
                        activeColor === 'red'
                          ? '#e53935'
                          : activeColor === 'blue'
                            ? '#1e88e5'
                            : activeColor === 'green'
                              ? '#43a047'
                              : activeColor === 'yellow'
                                ? '#fdd835'
                                : '#cbd5e1',
                    }}
                  />
                </div>

                {/* Direction Indicator */}
                <div
                  className="d-flex align-items-center justify-content-center text-primary bg-white shadow-sm"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    transform: direction === -1 ? 'scaleX(-1)' : 'none',
                    transition: 'transform 0.3s ease',
                  }}
                  title={`Direction: ${direction === 1 ? 'Clockwise' : 'Counter-Clockwise'}`}
                >
                  <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>↻</span>
                </div>

                {/* Deck Info */}
                <div
                  className="d-flex align-items-center gap-2 bg-white px-3 py-2 rounded-pill shadow-sm"
                  title="Cards remaining in deck"
                >
                  <span style={{ fontSize: '1rem' }}>🎴</span>
                  <span className="fw-bold text-dark small">{deckSize}</span>
                </div>
              </div>
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
                {topCard && <UnoCardComponent card={topCard} size="lg" />}
              </div>
            </Card.Body>
          </Card>

          {/* Action Buttons */}
          <div className="d-flex justify-content-center gap-2 mb-3">
            {isMyTurn && (
              <Button variant="outline-secondary" onClick={handlePass} disabled={!hasDrawnThisTurn}>
                跳過回合
              </Button>
            )}
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
          <div className="mb-4">
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
        </Col>
      </Row>

      {/* Color Picker Modal */}
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
    </Container>
  );
};

export default Uno;
