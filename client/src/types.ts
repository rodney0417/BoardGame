// Client-side types
// 重新匯出共用型別
export * from '../../shared/types';
export type { BasePlayer as Player } from '../../shared/types';

// 如果有前端專屬的 UI 型別可以定義在這裡
export interface ToastMsg {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}