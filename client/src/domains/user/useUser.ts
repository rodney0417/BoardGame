import { useState, useEffect } from 'react';

const getPeerId = (): string => {
  let id = localStorage.getItem('pictomania_peerId');
  if (!id) {
    id = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('pictomania_peerId', id);
  }
  return id;
};

export const useUser = () => {
    const [username, setUsername] = useState<string>(() => localStorage.getItem('pictomania_username') || '');
    const [peerId] = useState<string>(getPeerId());

    const saveUsername = (name: string) => {
        localStorage.setItem('pictomania_username', name);
        setUsername(name);
    };

    return {
        username,
        peerId,
        saveUsername,
        isLoggedIn: !!username
    };
};
