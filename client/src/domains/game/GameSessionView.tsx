import React from 'react';
import { Socket } from 'socket.io-client';
import { RoomDTO, BasePlayer } from '../../types';
import GAME_COMPONENTS from '../../games';

interface GameSessionViewProps {
    socket: Socket;
    activeRoom: RoomDTO;
    me: BasePlayer;
}

const GameSessionView: React.FC<GameSessionViewProps> = ({ socket, activeRoom, me }) => {
    const GameComponent = GAME_COMPONENTS[activeRoom.gameType || ''];

    if (!GameComponent) {
        return (
            <div className="text-center py-5 text-white">
                <h3>未知的遊戲類型: {activeRoom.gameType}</h3>
            </div>
        );
    }

    return <GameComponent socket={socket} room={activeRoom} me={me} />;
};

export default GameSessionView;
