import { CardColor } from './types';

export const UNO_COLORS: Record<CardColor, { hex: string; label: string }> = {
  red: { hex: '#e53935', label: '紅' },
  blue: { hex: '#1e88e5', label: '藍' },
  green: { hex: '#43a047', label: '綠' },
  yellow: { hex: '#fdd835', label: '黃' },
  wild: { hex: '#424242', label: '萬用' },
};

export const getUnoColorHex = (color: CardColor | undefined): string => {
  if (!color) return '#cbd5e1';
  return UNO_COLORS[color]?.hex || '#cbd5e1';
};
