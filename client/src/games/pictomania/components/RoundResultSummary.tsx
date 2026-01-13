import React from 'react';
import { Table, Badge } from 'react-bootstrap';
import { PictomaniaPlayer } from '../types';

interface RoundResultSummaryProps {
  players: PictomaniaPlayer[];
}

const RoundResultSummary: React.FC<RoundResultSummaryProps> = ({ players }) => {
  return (
    <div className="overflow-hidden rounded-3 border">
      <div className="p-0">
        <Table responsive hover className="mb-0">
          <thead className="bg-light">
            <tr>
              <th className="px-4 border-0">玩家</th>
              <th className="border-0">目標單字</th>
              <th className="border-0 text-center">被猜對次數</th>
              <th className="px-4 border-0 text-end">總分</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="align-middle">
                <td className="px-4 border-0">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: p.color,
                        borderRadius: '50%',
                      }}
                    />
                    <span className="fw-bold">{p.username}</span>
                  </div>
                </td>
                <td className="border-0">
                  <Badge bg="light" text="dark" className="border">
                    #{p.numberCard} {p.targetWord}
                  </Badge>
                </td>
                <td className="border-0 text-center">
                  <Badge bg="info" className="rounded-pill px-3">
                    {p.guessedCorrectlyBy?.length || 0} 人
                  </Badge>
                </td>
                <td className="px-4 border-0 text-end fw-bolder text-primary fs-5">{p.score}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default RoundResultSummary;
