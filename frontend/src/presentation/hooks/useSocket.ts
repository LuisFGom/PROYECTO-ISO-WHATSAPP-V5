// frontend/src/presentation/hooks/useSocket.ts
import { useEffect, useState } from 'react';
import { socketService } from '../../infrastructure/socket/socketService';
import { useAuthStore } from '../store/authStore';

export const useSocket = () => {
  const { user, token, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  useEffect(() => {
    // Solo conectar si el usuario está autenticado
    if (!isAuthenticated || !user || !token) {
      return;
    }

    console.log('🔌 Iniciando conexión Socket.IO...');
    
    // Conectar al socket
    socketService.connect(token, user.id);

    // 🔥 Escuchar eventos de conexión
    const socket = (socketService as any).socket;
    
    if (socket) {
      // ✅ Conexión exitosa
      socket.on('connect', () => {
        console.log('✅ Socket conectado');
        setIsConnected(true);
        setIsReconnecting(false);
        setReconnectAttempt(0);
      });

      // ❌ Desconexión
      socket.on('disconnect', (reason: string) => {
        console.log('❌ Socket desconectado:', reason);
        setIsConnected(false);
        
        // Si no fue desconexión manual, mostrar reconectando
        if (reason !== 'io client disconnect') {
          setIsReconnecting(true);
        }
      });

      // 🔄 Intentando reconectar
      socket.on('reconnect_attempt', (attempt: number) => {
        console.log(`🔄 Intento de reconexión #${attempt}`);
        setIsReconnecting(true);
        setReconnectAttempt(attempt);
      });

      // ✅ Reconexión exitosa
      socket.on('reconnect', (attempt: number) => {
        console.log(`✅ Reconectado después de ${attempt} intentos`);
        setIsConnected(true);
        setIsReconnecting(false);
        setReconnectAttempt(0);
      });

      // ❌ Error de conexión
      socket.on('connect_error', (error: Error) => {
        console.error('❌ Error de conexión:', error.message);
        setIsConnected(false);
        setIsReconnecting(true);
      });

      // ❌ Error de reconexión
      socket.on('reconnect_failed', () => {
        console.error('❌ Falló la reconexión');
        // Aunque falle, Socket.IO seguirá intentando
        setIsReconnecting(true);
      });
    }

    // Cleanup al desmontar o cuando cambie la autenticación
    return () => {
      console.log('🔌 Limpiando conexión Socket.IO...');
      socketService.disconnect();
      setIsConnected(false);
      setIsReconnecting(false);
      setReconnectAttempt(0);
    };
  }, [isAuthenticated, user, token]);

  return {
    isConnected,
    isReconnecting,
    reconnectAttempt,
    socket: socketService,
  };
};