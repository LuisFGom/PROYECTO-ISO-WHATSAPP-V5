// frontend/src/presentation/components/ConnectionStatusOverlay.tsx - OVERLAY DE ESTADO DE CONEXIÓN
import React from 'react';

interface ConnectionStatusOverlayProps {
  status: 'connected' | 'reconnecting' | 'disconnected';
  isVisible: boolean;
  timeoutSeconds?: number;
}

export const ConnectionStatusOverlay: React.FC<ConnectionStatusOverlayProps> = ({
  status,
  isVisible,
  timeoutSeconds = 30,
}) => {
  if (!isVisible) return null;

  const isReconnecting = status === 'reconnecting';
  const isDisconnected = status === 'disconnected';

  return (
    <div className={`fixed inset-0 z-40 flex items-center justify-center transition-all duration-300 ${
      isReconnecting || isDisconnected ? 'bg-black/80 backdrop-blur-sm' : 'opacity-0 pointer-events-none'
    }`}>
      <div className="text-center">
        {isReconnecting && (
          <>
            <div className="text-6xl mb-4 animate-bounce">📡</div>
            <p className="text-white text-2xl font-bold mb-2">Problemas de conexión</p>
            <p className="text-gray-300 text-lg mb-6">Intentando reconectar...</p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping" style={{ animationDelay: '75ms' }}></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping" style={{ animationDelay: '150ms' }}></div>
            </div>
            <p className="text-gray-400 text-sm">Esperando reconexión... ({timeoutSeconds}s)</p>
            <p className="text-gray-500 text-xs mt-2">Si la conexión no se restablece en {timeoutSeconds} segundos,</p>
            <p className="text-gray-500 text-xs">la llamada se finalizará automáticamente.</p>
          </>
        )}

        {isDisconnected && (
          <>
            <div className="text-6xl mb-4">📵</div>
            <p className="text-white text-2xl font-bold mb-2">Conexión perdida</p>
            <p className="text-gray-300 text-lg">Se perdió la conexión con el servidor</p>
            <p className="text-gray-400 text-sm mt-4">Finalizando llamada...</p>
          </>
        )}
      </div>
    </div>
  );
};
