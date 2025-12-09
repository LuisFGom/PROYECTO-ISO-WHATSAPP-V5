// frontend/src/presentation/providers/SocketProvider.tsx
// frontend/src/presentation/providers/SocketProvider.tsx
import type { ReactNode } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useAuthStore } from '../store/authStore';
import { ReconnectingOverlay } from '../components/ReconnectingOverlay';

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const { isAuthenticated } = useAuthStore();
  
  // 🔌 Socket.IO - Solo si está autenticado
  const socketStatus = useSocket();
  
  // 🌐 Conexión a internet/backend - SIEMPRE activo
  const networkStatus = useNetworkStatus();

  // 🔥 Determinar qué mostrar:
  // - Si NO está autenticado → Usar networkStatus
  // - Si SÍ está autenticado → Usar socketStatus (más preciso)
  const isReconnecting = isAuthenticated 
    ? socketStatus.isReconnecting 
    : networkStatus.isReconnecting;
  
  const reconnectAttempt = isAuthenticated 
    ? socketStatus.reconnectAttempt 
    : networkStatus.reconnectAttempt;

  return (
    <>
      {/* 🔥 OVERLAY GLOBAL - Aparece en TODA la aplicación */}
      <ReconnectingOverlay 
        isVisible={isReconnecting} 
        attempt={reconnectAttempt} 
      />
      
      {/* Resto de la aplicación */}
      {children}
    </>
  );
};