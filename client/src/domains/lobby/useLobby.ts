import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { RoomListInfo } from '../../types';

export const useLobby = (socket: Socket) => {
    const [roomList, setRoomList] = useState<RoomListInfo[]>([]);

    useEffect(() => {
        const handleRoomList = (list: RoomListInfo[]) => {
            setRoomList(list);
        };

        socket.on('room_list', handleRoomList);

        // Request initial list? Usually server sends it on connect or interval, 
        // but we can also just wait for the event.
        
        return () => {
            socket.off('room_list', handleRoomList);
        };
    }, [socket]);

    return { roomList };
};
