import React from 'react';
import { Socket } from 'socket.io-client';
import { RoomDTO, BasePlayer } from '../../types';
import GAME_COMPONENTS from '../../games';

interface GameSessionViewProps {
    socket: Socket;
    activeRoom: RoomDTO;
    me: BasePlayer;
    onLeaveRoom: () => void;
}

const GameSessionView: React.FC<GameSessionViewProps> = ({ socket, activeRoom, me, onLeaveRoom }) => {
    const GameComponent = GAME_COMPONENTS[activeRoom.gameType || ''];

    if (!GameComponent) {
        return (
            <div className="text-center py-5 text-white">
                <h3>未知的遊戲類型: {activeRoom.gameType}</h3>
                <button className="btn btn-outline-light mt-3" onClick={onLeaveRoom}>回到大廳</button>
            </div>
        );
    }

    return (
        <div className="container-fluid px-0 px-md-3">
            <GameComponent socket={socket} room={activeRoom} me={me} onLeaveRoom={onLeaveRoom} />
        </div>
    );
};

export default GameSessionView;
