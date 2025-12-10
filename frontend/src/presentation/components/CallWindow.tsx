// frontend/src/presentation/components/CallWindow.tsx - VERSIÓN SIMPLIFICADA (SOLO IFRAME) CON RECONEXIÓN MEJORADA
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { dailyService } from '../../services/dailyService';
import { ConnectionStatusOverlay } from './ConnectionStatusOverlay';
import { socketService } from '../../infrastructure/socket/socketService';

interface CallWindowProps {
  roomName: string;
  callType: 'audio' | 'video';
  isGroupCall?: boolean;
  displayName?: string;
  callId?: number;           // 🔥 NUEVO: ID de la llamada para notificar desconexión
  contactId?: number;        // 🔥 NUEVO: ID del contacto para enviar mensaje
  onCallEnd: (duration: number, reason?: 'normal' | 'connection_lost') => void;
  onCallReady?: () => void;
}

export const CallWindow: React.FC<CallWindowProps> = ({
  roomName,
  callType,
  isGroupCall = false,
  displayName,
  callId,
  contactId,
  onCallEnd,
  onCallReady
}) => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [callStartTime] = useState<number>(Date.now());
  const callFrameRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const disconnectDelayRef = useRef<NodeJS.Timeout | null>(null);
  const offlineTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 🔥 NUEVO: Timer para detectar offline por navegador
  const hasEndedRef = useRef(false); // Para evitar llamar onCallEnd múltiples veces
  
  // 🔥 CONFIGURACIÓN DE TIEMPOS
  const disconnectDelay = 5000;    // 5 segundos antes de mostrar overlay de reconexión
  const maxReconnectTime = 20000;  // 20 segundos máximo para reconectar después de mostrar overlay

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

  // 🔥 NUEVO: useEffect para detectar pérdida de conexión usando navigator.onLine (más confiable)
  useEffect(() => {
    // Función para terminar la llamada localmente Y notificar al servidor
    const forceEndCall = () => {
      if (hasEndedRef.current) return;
      hasEndedRef.current = true;
      
      console.log('🔴 Forzando cierre de llamada por pérdida de conexión (navigator.onLine)');
      setConnectionStatus('disconnected');
      
      // 🔥 IMPORTANTE: Guardar info de llamada terminada para notificar al backend cuando se reconecte
      if (callId) {
        const pendingEndCall = {
          callId,
          contactId,
          duration: Math.floor((Date.now() - callStartTime) / 1000),
          timestamp: Date.now()
        };
        localStorage.setItem('pending_call_end', JSON.stringify(pendingEndCall));
        console.log('💾 Guardada info de llamada terminada para notificar al reconectar:', pendingEndCall);
        
        // 🔥 Intentar emitir inmediatamente (se encolará si no hay conexión)
        try {
          socketService.emitCallEndByConnection(callId, contactId);
          console.log('📤 Intento de notificación de desconexión enviado');
        } catch (error) {
          console.log('⚠️ No se pudo emitir ahora, se notificará al reconectar');
        }
      }
      
      // Limpiar el iframe
      if (callFrameRef.current) {
        callFrameRef.current.innerHTML = '';
      }
      
      // Calcular duración
      const duration = Math.floor((Date.now() - callStartTime) / 1000);
      
      // Cerrar después de un breve momento
      setTimeout(() => {
        onCallEnd(duration, 'connection_lost');
      }, 1000);
    };

    // Handler cuando el navegador detecta que se perdió la conexión
    const handleOffline = () => {
      console.log('🌐❌ navigator.onLine: OFFLINE detectado');
      
      // Mostrar overlay de reconexión inmediatamente
      if (connectionStatus !== 'reconnecting' && connectionStatus !== 'disconnected') {
        setConnectionStatus('reconnecting');
        setReconnectAttempt(1);
      }
      
      // Iniciar timer para cerrar la llamada si no se recupera
      if (!offlineTimeoutRef.current) {
        console.log(`⏱️ Iniciando timer de ${(disconnectDelay + maxReconnectTime) / 1000}s para cierre automático`);
        offlineTimeoutRef.current = setTimeout(() => {
          console.log('⏱️ Tiempo agotado (navigator.onLine), cerrando llamada...');
          forceEndCall();
        }, disconnectDelay + maxReconnectTime); // 5s + 20s = 25s total
      }
    };

    // Handler cuando el navegador detecta que se recuperó la conexión
    const handleOnline = () => {
      console.log('🌐✅ navigator.onLine: ONLINE detectado');
      
      // Limpiar timer
      if (offlineTimeoutRef.current) {
        clearTimeout(offlineTimeoutRef.current);
        offlineTimeoutRef.current = null;
      }
      
      // Si la llamada ya terminó, NO cambiar el estado (dejar que se cierre)
      if (hasEndedRef.current) {
        console.log('📞 La llamada ya terminó, no reconectar');
        return;
      }
      
      // Si no ha terminado la llamada, volver a conectado
      setConnectionStatus('connected');
      setReconnectAttempt(0);
    };

    // Agregar listeners
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Si ya está offline al montar, iniciar el proceso
    if (!navigator.onLine) {
      console.log('🌐⚠️ Iniciando en estado OFFLINE');
      handleOffline();
    }

    // Cleanup
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (offlineTimeoutRef.current) {
        clearTimeout(offlineTimeoutRef.current);
        offlineTimeoutRef.current = null;
      }
    };
  }, [callStartTime, onCallEnd, connectionStatus, disconnectDelay, maxReconnectTime]);

  // 🔥 useEffect para manejar reconexión de Socket durante la llamada (MEJORADO)
  useEffect(() => {
    const socket = socketService.getSocket();
    
    if (!socket) {
      console.log('⚠️ No hay socket disponible para monitorear reconexión');
      return;
    }

    console.log('🔌 Configurando listeners de reconexión para la llamada...');
    console.log(`⏱️ Delay antes de mostrar reconectando: ${disconnectDelay/1000}s`);
    console.log(`⏱️ Tiempo máximo de reconexión: ${maxReconnectTime/1000}s`);

    // 🔥 Función para finalizar la llamada por problemas de conexión
    const endCallDueToConnection = () => {
      if (hasEndedRef.current) return; // Evitar llamar múltiples veces
      hasEndedRef.current = true;
      
      console.log('⏱️ Tiempo de reconexión agotado. Finalizando llamada por problemas de conexión...');
      setConnectionStatus('disconnected');
      
      // 🔥 Guardar en localStorage que esta llamada terminó por conexión
      // Esto permite que si la página se recarga, no intente reconectar a una llamada terminada
      if (callId) {
        localStorage.setItem(`call_ended_${callId}`, 'connection_lost');
        localStorage.setItem('last_call_ended_by_connection', JSON.stringify({
          callId,
          contactId,
          timestamp: Date.now()
        }));
      }
      
      // Intentar notificar al otro usuario (puede fallar si no hay conexión, pero el backend lo manejará)
      if (callId) {
        try {
          socketService.emitCallEndByConnection(callId, contactId);
          console.log('📤 Notificación de desconexión enviada al otro usuario');
        } catch (error) {
          console.error('❌ Error al notificar desconexión (esperado si no hay conexión):', error);
        }
      }
      
      // 🔥 IMPORTANTE: Cerrar la llamada INMEDIATAMENTE sin esperar al socket
      // Limpiar el iframe para detener la videollamada
      if (callFrameRef.current) {
        callFrameRef.current.innerHTML = '';
      }
      
      // Calcular duración y terminar la llamada
      const duration = Math.floor((Date.now() - callStartTime) / 1000);
      
      // Dar un breve momento para mostrar el estado "disconnected" y luego cerrar
      setTimeout(() => {
        onCallEnd(duration, 'connection_lost');
      }, 1500);
    };

    // Función para iniciar el timeout de reconexión (después del delay inicial)
    const startReconnectTimeout = () => {
      // Limpiar timeout anterior si existe
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Iniciar timeout de reconexión máxima
      reconnectTimeoutRef.current = setTimeout(() => {
        endCallDueToConnection();
      }, maxReconnectTime);
    };

    // 🔥 Función para iniciar el delay antes de mostrar el overlay
    const startDisconnectDelay = () => {
      // Limpiar delay anterior si existe
      if (disconnectDelayRef.current) {
        clearTimeout(disconnectDelayRef.current);
      }
      
      console.log(`⏳ Esperando ${disconnectDelay/1000}s antes de mostrar reconectando...`);
      
      // Esperar el delay antes de mostrar el overlay de reconexión
      disconnectDelayRef.current = setTimeout(() => {
        console.log('📡 Mostrando overlay de reconexión...');
        setConnectionStatus('reconnecting');
        setReconnectAttempt(1);
        startReconnectTimeout();
      }, disconnectDelay);
    };

    // 🔥 Limpiar todos los timeouts
    const clearAllTimeouts = () => {
      if (disconnectDelayRef.current) {
        clearTimeout(disconnectDelayRef.current);
        disconnectDelayRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    // Handler para desconexión
    const handleDisconnect = (reason: string) => {
      console.log('📞❌ Llamada: Socket desconectado -', reason);
      
      // Si fue desconexión manual, no mostrar reconectando
      if (reason === 'io client disconnect') {
        return;
      }
      
      // 🔥 Iniciar el delay de 15 segundos antes de mostrar overlay
      startDisconnectDelay();
    };

    // Handler para intentos de reconexión
    const handleReconnectAttempt = (attempt: number) => {
      console.log(`📞🔄 Llamada: Intento de reconexión #${attempt}`);
      // Solo actualizar el contador si ya se está mostrando el overlay
      if (connectionStatus === 'reconnecting') {
        setReconnectAttempt(attempt);
      }
    };

    // Handler para reconexión exitosa
    const handleReconnect = (attempt: number) => {
      console.log(`📞✅ Llamada: Reconectado después de ${attempt} intentos`);
      
      // 🔥 Verificar si la llamada ya debería haber terminado
      if (hasEndedRef.current) {
        console.log('📞⚠️ La llamada ya terminó, ignorando reconexión');
        return;
      }
      
      // Verificar en localStorage si esta llamada fue marcada como terminada
      if (callId && localStorage.getItem(`call_ended_${callId}`)) {
        console.log('📞⚠️ La llamada fue terminada por desconexión, no reconectar');
        localStorage.removeItem(`call_ended_${callId}`);
        return;
      }
      
      // 🔥 Limpiar todos los timeouts
      clearAllTimeouts();
      
      setConnectionStatus('connected');
      setReconnectAttempt(0);
    };

    // Handler para conexión (también cubre reconexión)
    const handleConnect = () => {
      console.log('📞✅ Llamada: Socket conectado');
      
      // 🔥 Verificar si la llamada ya debería haber terminado
      if (hasEndedRef.current) {
        console.log('📞⚠️ La llamada ya terminó, ignorando conexión');
        return;
      }
      
      // Verificar en localStorage si esta llamada fue marcada como terminada
      if (callId && localStorage.getItem(`call_ended_${callId}`)) {
        console.log('📞⚠️ La llamada fue terminada por desconexión, no reconectar');
        localStorage.removeItem(`call_ended_${callId}`);
        return;
      }
      
      // 🔥 Limpiar todos los timeouts
      clearAllTimeouts();
      
      setConnectionStatus('connected');
      setReconnectAttempt(0);
    };

    // Handler para error de conexión
    const handleConnectError = (error: Error) => {
      console.error('📞❌ Llamada: Error de conexión -', error.message);
      // Solo iniciar el proceso si no está ya en reconexión
      if (connectionStatus !== 'reconnecting' && !disconnectDelayRef.current) {
        startDisconnectDelay();
      }
    };

    // Agregar listeners
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect', handleReconnect);
    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);

    // Cleanup
    return () => {
      console.log('🧹 Limpiando listeners de reconexión de llamada...');
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect', handleReconnect);
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      
      // 🔥 Limpiar todos los timeouts
      clearAllTimeouts();
    };
  }, [callStartTime, onCallEnd, reconnectAttempt, connectionStatus, callId, contactId]);

  const handleEndCall = () => {
    if (hasEndedRef.current) return; // Evitar llamar múltiples veces
    hasEndedRef.current = true;
    
    const duration = Math.floor((Date.now() - callStartTime) / 1000);

    console.log('════════════════════════════════════════');
    console.log('📴 FINALIZANDO LLAMADA');
    console.log(`⏱️ Duración: ${duration} segundos`);
    console.log('════════════════════════════════════════');

    if (callFrameRef.current) {
      callFrameRef.current.innerHTML = '';
    }

    onCallEnd(duration, 'normal');
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
        timeoutSeconds={maxReconnectTime / 1000}
        reconnectAttempt={reconnectAttempt}
      />

      {/* Iframe container - Daily.co carga automáticamente aquí */}
      <div ref={callFrameRef} className="flex-1 w-full h-full" />
    </div>
  );
};