// frontend/src/presentation/hooks/useSocketStatus.ts
import { useState, useEffect } from 'react';
import { socketService } from '../../infrastructure/socket/socketService';

export const useSocketStatus = () => {
  const [isConnected, setIsConnected] = useState(socketService.isConnected);

  useEffect(() => {
    const socket = socketService.getSocket();
    
    if (!socket) {
      setIsConnected(false);
      return;
    }

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Estado inicial
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  return { isConnected };
};