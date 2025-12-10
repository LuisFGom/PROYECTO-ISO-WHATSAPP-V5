// frontend/src/presentation/components/ConnectionStatusOverlay.tsx - OVERLAY DE ESTADO DE CONEXIÓN PARA LLAMADAS
import React, { useState, useEffect } from 'react';

interface ConnectionStatusOverlayProps {
  status: 'connected' | 'reconnecting' | 'disconnected';
  isVisible: boolean;
  timeoutSeconds?: number;
  reconnectAttempt?: number;
}

export const ConnectionStatusOverlay: React.FC<ConnectionStatusOverlayProps> = ({
  status,
  isVisible,
  timeoutSeconds = 30,
  reconnectAttempt = 0,
}) => {
  const [countdown, setCountdown] = useState(timeoutSeconds);

  // Efecto para el countdown
  useEffect(() => {
    if (!isVisible || status !== 'reconnecting') {
      setCountdown(timeoutSeconds);
      return;
    }

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, status, timeoutSeconds]);

  // Reset countdown cuando se vuelve visible
  useEffect(() => {
    if (isVisible && status === 'reconnecting') {
      setCountdown(timeoutSeconds);
    }
  }, [isVisible, status, timeoutSeconds]);

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
            <p className="text-gray-300 text-lg mb-4">Intentando reconectar...</p>
            
            {/* Contador de intentos */}
            {reconnectAttempt > 0 && (
              <div className="bg-yellow-500/20 rounded-lg px-4 py-2 mb-4 inline-block">
                <p className="text-yellow-400 text-sm font-medium">
                  Intento #{reconnectAttempt}
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping" style={{ animationDelay: '75ms' }}></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping" style={{ animationDelay: '150ms' }}></div>
            </div>
            
            {/* Barra de progreso */}
            <div className="w-64 mx-auto bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
              <div 
                className="bg-yellow-500 h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / timeoutSeconds) * 100}%` }}
              ></div>
            </div>
            
            <p className="text-gray-400 text-sm">Tiempo restante: {countdown}s</p>
            <p className="text-gray-500 text-xs mt-2">La llamada se finalizará si no se reconecta</p>
            <p className="text-gray-500 text-xs">Verifica tu conexión a internet</p>
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
