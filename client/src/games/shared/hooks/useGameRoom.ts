import { RoomDTO } from '../../../types';

export function useGameRoom<TState = any, TSettings = any, TPlayer = any>(room: RoomDTO<TState, TSettings>, myPeerId: string) {
  const { gameState, players, phase, id: roomId } = room;
  
  const me = players.find((p: any) => p.peerId === myPeerId || p.id === myPeerId);
  const isHost = players.length > 0 && (players[0].peerId === myPeerId || players[0].id === myPeerId);
  const otherPlayers = players.filter((p: any) => p.id !== (me as any)?.id);

  return {
    roomId,
    gameState,
    players: (players as unknown) as TPlayer[],
    phase,
    me: (me as unknown) as TPlayer,
    isHost,
    otherPlayers: (otherPlayers as unknown) as TPlayer[],
    settings: room.settings as TSettings,
    timeLeft: room.timeLeft,
  };
}
