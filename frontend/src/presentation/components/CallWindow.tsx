// frontend/src/presentation/components/CallWindow.tsx - VERSIÓN SIMPLIFICADA (SOLO IFRAME)
import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { dailyService } from '../../services/dailyService';
import { ConnectionStatusOverlay } from './ConnectionStatusOverlay';

interface CallWindowProps {
  roomName: string;
  callType: 'audio' | 'video';
  isGroupCall?: boolean;
  displayName?: string;
  onCallEnd: (duration: number) => void;
  onCallReady?: () => void;
}

export const CallWindow: React.FC<CallWindowProps> = ({
  roomName,
  callType,
  isGroupCall = false,
  displayName,
  onCallEnd,
  onCallReady
}) => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
  const [callStartTime] = useState<number>(Date.now());
  const callFrameRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) {
      console.log('⚠️ CallWindow ya inicializado, saltando...');
      return;
    }
    isInitialized.current = true;

    const participantName = displayName || user?.username || user?.email || 'Usuario';

    const initializeCall = async () => {
      try {
        console.log('════════════════════════════════════════');
        console.log('🎬 INICIALIZANDO LLAMADA CON DAILY.CO');
        console.log('════════════════════════════════════════');
        console.log('👤 Participante:', participantName);
        console.log('📹 Tipo de llamada:', callType);
        console.log('🏠 Room Name:', roomName);
        console.log('════════════════════════════════════════');

        setIsLoading(true);

        // Obtener URL con token del backend
        console.log('🔐 Solicitando URL con token del backend...');
        const tokenData = await dailyService.getTokenForRoom(roomName, participantName);
        const roomUrl = tokenData.roomUrl;
        
        console.log('✅ URL obtenida:', roomUrl);

        // Verificar que el contenedor existe
        if (!callFrameRef.current) {
          throw new Error('Contenedor del frame no existe');
        }

        console.log('🏗️ Creando iframe HTML...');
        
        // Limpiar contenedor
        callFrameRef.current.innerHTML = '';
        
        // ✅ SOLUCIÓN SIMPLE Y FINAL: Crear iframe directo
        // Daily.co Prebuilt maneja TODO automáticamente
        // La URL ya tiene el token incluido, solo cargar en iframe
        const iframe = document.createElement('iframe');
        iframe.src = roomUrl;
        iframe.style.position = 'absolute';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = '0';
        iframe.style.borderRadius = '0';
        iframe.allow = 'camera; microphone; autoplay; display-capture';
        
        console.log('📍 iframe.src:', roomUrl);
        
        // Agregar iframe al DOM
        callFrameRef.current.appendChild(iframe);
        
        console.log('✅ iframe agregado al DOM');
        console.log('✅ Daily.co cargando automáticamente en el iframe...');
        
        // Esperar a que cargue completamente
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('✅ Videollamada inicializada correctamente');
        setIsLoading(false);
        setConnectionStatus('connected');

        if (onCallReady) {
          onCallReady();
        }

      } catch (error: any) {
        console.error('\n❌ ERROR AL INICIALIZAR VIDEOLLAMADA');
        console.error('Mensaje:', error?.message || error);

        let errorMessage = 'Error al conectar a la videollamada.\n';
        
        if (error?.message?.includes('WebRTC')) {
          errorMessage = 'WebRTC no disponible.\nPor favor: 1) Usa HTTPS, 2) Verifica permisos, 3) Usa Chrome/Firefox/Safari';
        } else if (error?.message?.includes('400')) {
          errorMessage += 'Solicitud inválida (API key o sala incorrecta)';
        } else {
          errorMessage += error?.message || 'Error desconocido';
        }

        console.error(errorMessage);
        alert(errorMessage);
        onCallEnd(0);
      }
    };

    initializeCall();

    // Cleanup
    return () => {
      console.log('════════════════════════════════════════');
      console.log('🧹 LIMPIANDO CALLWINDOW');
      console.log('════════════════════════════════════════');

      if (callFrameRef.current) {
        callFrameRef.current.innerHTML = '';
      }

      isInitialized.current = false;
      console.log('✅ Cleanup completado');
      console.log('════════════════════════════════════════');
    };
  }, []);

  const handleEndCall = () => {
    const duration = Math.floor((Date.now() - callStartTime) / 1000);

    console.log('════════════════════════════════════════');
    console.log('📴 FINALIZANDO LLAMADA');
    console.log(`⏱️ Duración: ${duration} segundos`);
    console.log('════════════════════════════════════════');

    if (callFrameRef.current) {
      callFrameRef.current.innerHTML = '';
    }

    onCallEnd(duration);
  };

  const handleManualHangup = () => {
    console.log('🔴 Usuario presionó botón Colgar');
    if (confirm('¿Deseas finalizar la llamada?')) {
      console.log('✅ Usuario confirmó finalizar');
      handleEndCall();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar con estado y botón colgar */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' :
            connectionStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' :
            'bg-red-500'
          }`}></div>
          <span className="text-white font-medium">
            {isGroupCall ? '📹 Llamada Grupal' : callType === 'video' ? '📹 Videollamada' : '📞 Llamada de Audio'}
          </span>
          {connectionStatus === 'reconnecting' && (
            <span className="text-yellow-400 text-sm animate-pulse">Reconectando...</span>
          )}
        </div>

        <button
          onClick={handleManualHangup}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-semibold transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75L18 6m0 0l2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m1.5 13.5c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 014.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 00-.38 1.21 12.035 12.035 0 007.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 011.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 01-2.25 2.25h-2.25z" />
          </svg>
          Colgar
        </button>
      </div>

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black">
          <div className="text-center">
            <svg className="animate-spin h-16 w-16 mx-auto mb-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-white text-lg font-medium">Conectando a la sala...</p>
            <p className="text-gray-400 text-sm mt-2">Preparando videollamada...</p>
          </div>
        </div>
      )}

      {/* Connection status overlay */}
      <ConnectionStatusOverlay
        status={connectionStatus}
        isVisible={connectionStatus !== 'connected'}
        timeoutSeconds={30}
      />

      {/* Iframe container - Daily.co carga automáticamente aquí */}
      <div ref={callFrameRef} className="flex-1 w-full h-full" />
    </div>
  );
};