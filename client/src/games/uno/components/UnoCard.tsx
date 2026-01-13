import React from 'react';
import { UnoCard as UnoCardType, CardColor } from '../types';

interface UnoCardProps {
    card: UnoCardType;
    onClick?: () => void;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const COLOR_MAP: Record<CardColor, string> = {
    red: '#e53935',
    blue: '#1e88e5',
    green: '#43a047',
    yellow: '#fdd835',
    wild: '#424242'
};

const VALUE_DISPLAY: Record<string, string> = {
    'skip': '⊘',
    'reverse': '⇄',
    'draw_two': '+2',
    'wild': '★',
    'wild_draw_four': '+4'
};

const UnoCard: React.FC<UnoCardProps> = ({ card, onClick, disabled = false, size = 'md' }) => {
    const bgColor = COLOR_MAP[card.color];
    const displayValue = VALUE_DISPLAY[card.value] || card.value;
    
    const sizeStyles = {
        sm: { width: '50px', height: '75px', fontSize: '1rem' },
        md: { width: '70px', height: '100px', fontSize: '1.5rem' },
        lg: { width: '90px', height: '130px', fontSize: '2rem' }
    };

    return (
        <div 
            onClick={disabled ? undefined : onClick}
            style={{
                ...sizeStyles[size],
                backgroundColor: bgColor,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: card.color === 'yellow' ? '#333' : '#fff',
                fontWeight: 'bold',
                cursor: disabled ? 'not-allowed' : onClick ? 'pointer' : 'default',
                opacity: disabled ? 0.5 : 1,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                border: '3px solid white',
                transition: 'transform 0.15s ease',
                userSelect: 'none'
            }}
            className={onClick && !disabled ? 'uno-card-hover' : ''}
        >
            {displayValue}
            <style>{`
                .uno-card-hover:hover {
                    transform: translateY(-8px) scale(1.05);
                }
            `}</style>
        </div>
    );
};

export default UnoCard;
