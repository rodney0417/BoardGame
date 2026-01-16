import React, { useEffect, useState } from 'react';
import { Button, Row, Col, Modal } from 'react-bootstrap';
import { Take6State } from './types';
import { Take6Board, Take6Card } from './components';
import { GameLayout, SidebarSection, GameRulesModal } from '../shared';

interface Take6Props {
  socket: any;
  room: any;
  me: any;
  onLeaveRoom: () => void;
}

const Take6: React.FC<Take6Props> = ({ socket, room, me, onLeaveRoom }) => {
  // Fix: Default to empty object if gameState is null/undefined
  const [gameState, setGameState] = useState<Take6State>(room.gameState || {});
  const [selectedCard, setSelectedCard] = useState<number | undefined>(undefined);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    // Sync initial state on mount/room change
    setGameState(room.gameState || {});

    // Request fresh state from server (in case of refresh/reconnect)
    socket.emit('game_action', {
      roomId: room.id,
      action: 'get_state',
      data: {},
    });

    const onUpdateState = (newState: Take6State) => {
      setGameState(newState || {});
      // Reset local selection if phase advanced
      if (newState && newState.phase !== 'selecting') {
        setSelectedCard(undefined);
      }

      // Note: game_over handled by GameSessionView parent
    };

    const onToast = (data: { type: string; message: string }) => {
      console.log(data.message);
    };

    socket.on('update_state', onUpdateState);
    socket.on('game_started', onUpdateState);
    socket.on('toast', onToast);

    return () => {
      socket.off('update_state', onUpdateState);
      socket.off('game_started', onUpdateState);
      socket.off('toast', onToast);
    };
  }, [socket, room]);

  const handlePlayCard = () => {
    if (!selectedCard) return;
    socket.emit('game_action', {
      roomId: room.id,
      action: 'play_card',
      data: { card: selectedCard },
    });
  };

  const handleRowClick = (rowIndex: number) => {
    if (gameState.phase !== 'choosing_row') return;
    socket.emit('game_action', {
      roomId: room.id,
      action: 'choose_row',
      data: { rowIndex },
    });
  };

  // Safety checks for initial state
  const players = gameState.players || {};
  const myPlayer = players[me.id];
  const myHand = myPlayer?.hand || [];
  const rows = gameState.rows || [[], [], [], []];
  const isMyTurnToChooseRow =
    gameState.phase === 'choosing_row' && gameState.currentTurnCard?.playerId === me.id;

  // Calculate Sorted Players
  const sortedPlayers = Object.values(players).sort((a, b) => a.score - b.score);

  // Standard Game Layout Info
  const gameInfoSection = (
    <SidebarSection className="d-flex flex-row flex-lg-column gap-2">
      {/* Round Info */}
      <div className="d-flex align-items-center justify-content-center justify-content-lg-between p-2 p-md-3 bg-white rounded-3 shadow-sm border flex-fill">
        <span className="text-muted small fw-bold me-2 d-none d-lg-block">回合</span>
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: '0.9rem' }}>🔄</span>
          <span className="fw-bold text-dark small">{gameState.round || 1}/10</span>
        </div>
      </div>

      {/* My Score */}
      <div className="d-flex align-items-center justify-content-center justify-content-lg-between p-2 p-md-3 bg-white rounded-3 shadow-sm border flex-fill">
        <span className="text-muted small fw-bold me-2 d-none d-lg-block">我的牛頭</span>
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: '0.9rem' }}>🐮</span>
          <span className="fw-bold text-danger small">{myPlayer?.score || 0}</span>
        </div>
      </div>
    </SidebarSection>
  );

  const sidebarContent = (
    <div className="mt-auto d-flex flex-column gap-2 pt-4">
      <Button
        variant="outline-primary"
        className="w-100 rounded-pill py-2 shadow-sm"
        onClick={() => setShowScoreModal(true)}
      >
        🏆 查看排名
      </Button>
      <Button
        variant="outline-primary"
        className="w-100 rounded-pill py-2 shadow-sm"
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
  );

  return (
    <GameLayout
      maxWidth="1400px"
      gameInfo={gameInfoSection}
      sidebar={sidebarContent}
      main={
        <div className="d-flex flex-column h-100 justify-content-center">
          <GameRulesModal show={showRules} onHide={() => setShowRules(false)} gameType="take6" />

          {/* Main Board Area */}
          <div className="d-flex justify-content-center mb-3 w-100">
            <div className="w-100" style={{ maxWidth: '1400px' }}>
              <Take6Board
                rows={rows}
                highlightRows={isMyTurnToChooseRow}
                onRowClick={handleRowClick}
              />

              {/* Game messages */}
              {isMyTurnToChooseRow && (
                <div className="alert alert-warning mt-3 text-center blink-animation fw-bold shadow">
                  ⚠️ 你的牌太小了！請選擇一列吃掉！
                </div>
              )}
              {gameState.phase === 'revealing' && (
                <div className="alert alert-info mt-3 text-center shadow-sm">🔄 結算中...</div>
              )}
            </div>
          </div>

          {/* Hand Area */}
          <div>
            {/* Pending Status */}
            <div className="d-flex justify-content-center mb-3" style={{ minHeight: '60px' }}>
              {gameState.phase === 'selecting' && myPlayer?.selectedCard && (
                <div className="text-white fw-bold bg-success bg-opacity-75 px-4 py-2 rounded-pill shadow">
                  ✅ 已出牌，等待其他玩家...
                </div>
              )}
              {gameState.phase === 'revealing' &&
                gameState.currentTurnCard &&
                players[gameState.currentTurnCard.playerId] && (
                  <div className="d-flex align-items-center gap-3 bg-dark bg-opacity-75 px-4 py-2 rounded-pill shadow border border-white border-opacity-25">
                    <span className="text-white">當前處理:</span>
                    <Take6Card number={gameState.currentTurnCard.card} size="sm" />
                    <span className="text-white fw-bold">
                      ({players[gameState.currentTurnCard.playerId]?.username})
                    </span>
                  </div>
                )}
            </div>

            {/* Cards */}
            <div className="bg-dark bg-opacity-50 p-3 rounded-4 shadow-lg border border-white border-opacity-25">
              <div
                className="d-flex justify-content-center align-items-end gap-2 overflow-auto pb-2"
                style={{ minHeight: '130px' }}
              >
                {myHand.map((card) => (
                  <Take6Card
                    key={card}
                    number={card}
                    size={selectedCard === card ? 'lg' : 'md'}
                    selected={selectedCard === card}
                    onClick={() =>
                      gameState.phase === 'selecting' &&
                      !myPlayer.selectedCard &&
                      setSelectedCard(card)
                    }
                    disabled={gameState.phase !== 'selecting' || !!myPlayer.selectedCard}
                  />
                ))}
              </div>

              <div className="d-flex justify-content-center mt-2">
                <Button
                  variant="warning"
                  size="lg"
                  className="px-5 fw-bold rounded-pill shadow"
                  disabled={
                    !selectedCard || gameState.phase !== 'selecting' || !!myPlayer.selectedCard
                  }
                  onClick={handlePlayCard}
                >
                  {myPlayer?.selectedCard ? '已出牌' : '出牌'}
                </Button>
              </div>
            </div>
          </div>

          {/* Score Modal */}
          <Modal
            show={showScoreModal}
            onHide={() => setShowScoreModal(false)}
            centered
            contentClassName="bg-dark text-white border-secondary"
          >
            <Modal.Header closeButton closeVariant="white" className="border-secondary">
              <Modal.Title>🏆 積分榜</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <table className="table table-dark table-hover">
                <thead>
                  <tr>
                    <th>排名</th>
                    <th>玩家</th>
                    <th>牛頭數 (失分)</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((p, idx) => (
                    <tr key={p.id} className={p.id === me.id ? 'table-active' : ''}>
                      <td>{idx + 1}</td>
                      <td>
                        {p.username} {p.id === me.id && '(我)'}
                      </td>
                      <td className="fw-bold text-danger">{p.score} 🐮</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Modal.Body>
          </Modal>

          <style>{`
                .blink-animation { animation: blinker 1.5s linear infinite; }
                @keyframes blinker { 50% { opacity: 0; } }
                ::-webkit-scrollbar { height: 8px; }
                ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); borderRadius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.5); }
            `}</style>
        </div>
      }
    />
  );
};

export default Take6;
