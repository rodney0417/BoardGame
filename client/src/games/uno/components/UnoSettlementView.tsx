import React from 'react';
import { Container, Card, Button, Table } from 'react-bootstrap';
import { ArrowRight, Trophy } from 'lucide-react';
import { UnoPlayer } from '../types';

interface UnoSettlementViewProps {
  players: UnoPlayer[];
  winnerId?: string;
  roundPoints?: number;
  onNextRound: () => void;
  isHost: boolean;
}

const UnoSettlementView: React.FC<UnoSettlementViewProps> = ({ 
  players, 
  winnerId, 
  roundPoints = 0, 
  onNextRound, 
  isHost 
}) => {
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  const winner = players.find(p => p.id === winnerId);

  return (
    <Container className="py-5" style={{ maxWidth: '600px' }}>
      <Card
        className="border-0 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #c9a9a6 0%, #d4c5b5 100%)', // Morandi Rose -> Sand
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}
      >
        <Card.Body className="p-4 text-center text-white">
          <div className="mb-2 opacity-75 fw-bold letter-spacing-1">本局結算</div>
          <h2 className="display-4 fw-bold mb-3" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
             {winner?.username} 獲勝！
          </h2>
          <div className="fs-5 mb-4 badge bg-white text-secondary px-4 py-2 rounded-pill shadow-sm">
            本局得分: <span className="fw-bold">+{roundPoints}</span>
          </div>

          <Card className="border-0 bg-white text-dark rounded-4 shadow-sm overflow-hidden text-start">
            <Card.Body className="p-0">
               <Table hover responsive className="mb-0 align-middle">
                    <thead className="bg-light text-muted small">
                        <tr>
                            <th className="ps-4 py-3 border-0">排名</th>
                            <th className="py-3 border-0">玩家</th>
                            <th className="pe-4 py-3 border-0 text-end">總分 (500獲勝)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedPlayers.map((p, idx) => (
                            <tr key={p.id} style={{ background: p.id === winnerId ? '#fff5f5' : 'transparent' }}>
                                <td className="ps-4 fw-bold text-muted">#{idx + 1}</td>
                                <td className="fw-bold">
                                    {p.username}
                                    {p.id === winnerId && <Trophy size={16} className="ms-2 text-warning fill-warning" />}
                                </td>
                                <td className="pe-4 text-end fw-bold font-monospace fs-5">
                                    {p.score || 0}
                                </td>
                            </tr>
                        ))}
                    </tbody>
               </Table>
            </Card.Body>
          </Card>

          <div className="mt-4">
             {isHost ? (
                <Button 
                    variant="light" 
                    size="lg" 
                    className="w-100 rounded-pill fw-bold text-secondary shadow-sm"
                    onClick={onNextRound}
                >
                    下一局 <ArrowRight className="ms-2" size={20} />
                </Button>
             ) : (
                <div className="opacity-75 fw-bold animate-pulse">
                    ⏳ 等待房主開始下一局...
                </div>
             )}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default UnoSettlementView;
