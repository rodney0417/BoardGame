import React from 'react';
import { Row, Col, Button, Card, Badge } from 'react-bootstrap';
import { RotateCcw } from 'lucide-react';
import { Player, PictomaniaHistoryRecord } from '../../../types';

interface GameOverViewProps {
  players: Player[];
  history: PictomaniaHistoryRecord[];
  onRestart: () => void;
}

const GameOverView: React.FC<GameOverViewProps> = ({ players, history, onRestart }) => {
  return (
    <div className="py-5">
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold text-dark mb-3">🎨 遊戲結束！作品回顧</h1>
        <Button variant="primary" size="lg" className="rounded-pill px-5 fw-bold" onClick={onRestart}>
          <RotateCcw className="me-2" /> 再來一局
        </Button>
      </div>
      
      <Row className="g-4">
        {players.map((p: Player) => {
           const playerHistory = history
            .filter((h: PictomaniaHistoryRecord) => h.playerId === p.id)
            .sort((a, b) => a.round - b.round);
           return (
             <Col xs={12} key={p.id}>
               <Card className="custom-card border-0 overflow-hidden">
                  <Card.Header className="bg-transparent border-0 p-3">
                      <div className="d-flex align-items-center gap-2">
                          <div style={{ width: '20px', height: '20px', backgroundColor: p.color, borderRadius: '50%' }} />
                          <h4 className="m-0 text-dark fw-bold">{p.username} 的作品集</h4>
                          <Badge bg="warning" text="dark" className="ms-auto fs-5">總分: {p.score}</Badge>
                      </div>
                  </Card.Header>
                  <Card.Body className="p-0">
                      <div className="d-flex overflow-auto p-3 gap-3" style={{ scrollbarWidth: 'thin' }}>
                          {playerHistory.length > 0 ? playerHistory.map((rec: PictomaniaHistoryRecord) => (
                              <div key={rec.round} className="flex-shrink-0 text-center" style={{ width: '280px' }}>
                                  <div className="mb-2 text-primary fw-bold">Round {rec.round}: {rec.word}</div>
                                  <img src={rec.imageBase64} className="rounded-3 shadow-sm w-100 bg-white" alt={`Round ${rec.round}`} />
                              </div>
                          )) : <div className="text-muted opacity-50 p-4">沒有作品記錄</div>}
                      </div>
                  </Card.Body>
               </Card>
             </Col>
           );
        })}
      </Row>
    </div>
  );
};

export default GameOverView;
