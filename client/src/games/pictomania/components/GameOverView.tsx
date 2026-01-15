import React from 'react';
import { Row, Col, Button, Card, Badge } from 'react-bootstrap';
import { Player, PictomaniaHistoryRecord } from '../../../types';

interface GameOverViewProps {
  players: Player[];
  history: PictomaniaHistoryRecord[];
}

const GameOverView: React.FC<GameOverViewProps> = ({ players, history }) => {
  return (
    <Row className="g-4">
      {players.map((p: Player) => {
        const playerHistory = history
          .filter((h: PictomaniaHistoryRecord) => h.playerId === p.id)
          .sort((a, b) => a.round - b.round);
        return (
          <Col xs={12} key={p.id}>
            <Card
              className="custom-card border-0 overflow-hidden shadow-sm"
              style={{ borderRadius: '20px' }}
            >
              <Card.Header className="border-0 p-3" style={{ background: 'var(--morandi-blue)' }}>
                <div className="d-flex align-items-center gap-2">
                  <h5 className="m-0 text-dark fw-bold" style={{ color: 'var(--text-color)' }}>
                    {p.username} 的作品集
                  </h5>
                  <Badge
                    bg="light"
                    text="dark"
                    className="ms-auto fs-6 shadow-sm border"
                    style={{ color: 'var(--text-color)' }}
                  >
                    總分: {p.score}
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="d-flex overflow-auto p-3 gap-3" style={{ scrollbarWidth: 'thin' }}>
                  {playerHistory.length > 0 ? (
                    playerHistory.map((rec: PictomaniaHistoryRecord) => (
                      <div
                        key={rec.round}
                        className="flex-shrink-0 text-center"
                        style={{ width: '280px' }}
                      >
                        <div className="mb-2 text-primary fw-bold">
                          Round {rec.round}: {rec.word}
                        </div>
                        <img
                          src={rec.imageBase64}
                          className="rounded-3 shadow-sm w-100 bg-white"
                          alt={`Round ${rec.round}`}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-muted opacity-50 p-4">沒有作品記錄</div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

export default GameOverView;
