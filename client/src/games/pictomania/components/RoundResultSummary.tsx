import React from 'react';
import { Table, Badge } from 'react-bootstrap';
import { PictomaniaPlayer } from '../types';
import { PictomaniaHistoryRecord } from '../../../types';

interface RoundResultSummaryProps {
  players: PictomaniaPlayer[];
  history: PictomaniaHistoryRecord[];
  currentRound: number;
}

const RoundResultSummary: React.FC<RoundResultSummaryProps> = ({
  players,
  history,
  currentRound,
}) => {
  return (
    <div className="overflow-hidden rounded-3 border">
      <Table responsive hover className="mb-0">
        <thead className="bg-light">
          <tr>
            <th className="px-4 border-0">玩家</th>
            <th className="border-0">畫作</th>
            <th className="border-0">目標單字</th>
            <th className="border-0 text-center">被猜對次數</th>
            <th className="px-4 border-0 text-end">總分</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => {
            const record = history.find((h) => h.round === currentRound && h.playerId === p.id);
            return (
              <tr key={p.id} className="align-middle">
                <td className="px-4 border-0">
                  <span className="fw-bold">{p.username}</span>
                </td>
                <td className="border-0 py-3" style={{ width: '120px' }}>
                  {record?.imageBase64 ? (
                    <img
                      src={record.imageBase64}
                      alt="drawing"
                      className="rounded-3 shadow-sm bg-white"
                      style={{ width: '100px', height: '66px', objectFit: 'contain' }}
                    />
                  ) : (
                    <span className="text-muted small">未提交</span>
                  )}
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
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};

export default RoundResultSummary;
