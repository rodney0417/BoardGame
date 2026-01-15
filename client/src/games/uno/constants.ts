import { CardColor } from './types';

export const UNO_COLORS: Record<CardColor, { hex: string; label: string }> = {
  red: { hex: '#e53935', label: '紅色' },
  blue: { hex: '#1e88e5', label: '藍色' },
  green: { hex: '#43a047', label: '綠色' },
  yellow: { hex: '#fdd835', label: '黃色' },
  wild: { hex: '#424242', label: '萬用' },
};

export const getUnoColorHex = (color: CardColor | undefined): string => {
  if (!color) return '#cbd5e1';
  return UNO_COLORS[color]?.hex || '#cbd5e1';
};

export const getUnoColorName = (color: CardColor | undefined): string => {
  if (!color) return '無';
  return UNO_COLORS[color]?.label || '未知';
};
