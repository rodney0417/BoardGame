import React from 'react';
import { UnoCard as UnoCardType } from '../types';
import UnoCard from './UnoCard';

interface PlayerHandProps {
  cards: UnoCardType[];
  onCardClick: (card: UnoCardType) => void;
  isCurrentPlayer: boolean;
  activeColor: string;
  topCard: UnoCardType;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  onCardClick,
  isCurrentPlayer,
  activeColor,
  topCard,
}) => {
  const isPlayable = (card: UnoCardType): boolean => {
    if (card.color === 'wild') return true;
    return card.color === activeColor || card.value === topCard.value;
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        padding: '16px',
        overflowX: 'auto',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}
    >
      {cards.map((card, index) => (
        <UnoCard
          key={`${card.color}-${card.value}-${index}`}
          card={card}
          onClick={() => isPlayable(card) && onCardClick(card)}
          disabled={!isCurrentPlayer || !isPlayable(card)}
          size="md"
        />
      ))}
    </div>
  );
};

export default PlayerHand;
