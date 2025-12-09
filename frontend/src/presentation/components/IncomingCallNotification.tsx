// frontend/src/presentation/components/IncomingCallNotification.tsx - CORREGIDO ✅
import React, { useEffect, useRef, useState } from 'react';

interface IncomingCallNotificationProps {
  callerName: string;
  callerAvatar?: string;
  callType: 'audio' | 'video';
  isGroupCall?: boolean;
  groupName?: string;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallNotification: React.FC<IncomingCallNotificationProps> = ({
  callerName,
  callerAvatar,
  callType,
  isGroupCall = false,
  groupName,
  onAccept,
  onReject
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Animación de entrada
    setTimeout(() => setIsVisible(true), 100);

    // ✅ CORREGIDO: Reproducir sonido de timbre con manejo de errores
    const playRingtone = async () => {
      if (audioRef.current) {
        try {
          audioRef.current.loop = true;
          audioRef.current.volume = 0.5; // ✅ Volumen al 50%
          
          console.log('🔔 Intentando reproducir timbre...');
          await audioRef.current.play();
          console.log('✅ Timbre reproduciéndose');
        } catch (error) {
          console.warn('⚠️ No se pudo reproducir el sonido de llamada:', error);
          console.warn('💡 Tip: El navegador puede bloquear autoplay. El usuario debe interactuar primero.');
          
          // ✅ FALLBACK: Vibración en móviles si el audio falla
          if ('vibrate' in navigator) {
            // Patrón: vibrar 500ms, pausar 500ms, repetir
            const vibratePattern = [500, 500, 500, 500, 500, 500];
            navigator.vibrate(vibratePattern);
            console.log('📳 Vibración activada como alternativa');
          }
        }
      }
    };

    playRingtone();

    // Cleanup: detener sonido y vibración al desmontar
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // Detener vibración
      if ('vibrate' in navigator) {
        navigator.vibrate(0);
      }
    };
  }, []);

  const handleAccept = () => {
    console.log('✅ Usuario aceptó la llamada');
    
    // Detener sonido y vibración
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
    
    setIsVisible(false);
    setTimeout(onAccept, 300);
  };

  const handleReject = () => {
    console.log('🚫 Usuario rechazó la llamada');
    
    // Detener sonido y vibración
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
    
    setIsVisible(false);
    setTimeout(onReject, 300);
  };

  return (
    <>
      {/* ✅ Audio de timbre - con preload para mejor rendimiento */}
      <audio 
        ref={audioRef} 
        src="/sounds/ringtone.mp3"
        preload="auto"
        onError={(e) => {
          console.error('❌ Error al cargar el audio:', e);
          console.error('🔍 Verifica que el archivo existe en: frontend/public/sounds/ringtone.mp3');
        }}
      />

      {/* Overlay semi-transparente */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleReject}
      />

      {/* Notificación de llamada */}
      <div 
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
        style={{ 
          animation: isVisible ? 'bounce 1s ease-in-out infinite' : 'none' 
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[350px] max-w-md">
          {/* Icono de llamada animado */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-whatsapp-green to-green-600 rounded-full flex items-center justify-center animate-pulse">
                {callType === 'video' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-12 h-12">
                    <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-12 h-12">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                )}
              </div>
              {/* Anillos animados */}
              <div className="absolute inset-0 rounded-full border-4 border-whatsapp-green animate-ping opacity-75"></div>
              <div className="absolute inset-0 rounded-full border-4 border-whatsapp-green animate-ping opacity-50" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>

          {/* Avatar y nombre del contacto */}
          <div className="text-center mb-6">
            {isGroupCall ? (
              <>
                <div className="w-20 h-20 mx-auto mb-4 bg-whatsapp-green rounded-full flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">
                    {groupName ? groupName[0].toUpperCase() : '👥'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">
                  {groupName || 'Grupo'}
                </h3>
                <p className="text-sm text-gray-600">
                  {callerName} te está llamando
                </p>
              </>
            ) : (
              <>
                {callerAvatar ? (
                  <img 
                    src={callerAvatar} 
                    alt={callerName}
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">
                      {callerName[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-800 mb-1">
                  {callerName}
                </h3>
              </>
            )}
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-2 h-2 bg-whatsapp-green rounded-full animate-pulse"></div>
              <p className="text-sm text-gray-600 font-medium">
                {callType === 'video' ? 'Videollamada entrante' : 'Llamada de audio entrante'}
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-4 justify-center">
            {/* Botón Rechazar */}
            <button
              onClick={handleReject}
              className="group relative bg-red-500 hover:bg-red-600 text-white rounded-full p-4 transition-all transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl"
              title="Rechazar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75L18 6m0 0l2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m1.5 13.5c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 014.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 00-.38 1.21 12.035 12.035 0 007.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 011.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 01-2.25 2.25h-2.25z" />
              </svg>
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Rechazar
              </span>
            </button>

            {/* Botón Responder */}
            <button
              onClick={handleAccept}
              className="group relative bg-whatsapp-green hover:bg-green-600 text-white rounded-full p-4 transition-all transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl animate-pulse"
              title="Responder"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Responder
              </span>
            </button>
          </div>

          {/* Texto adicional */}
          <p className="text-center text-xs text-gray-500 mt-8">
            {isGroupCall ? 'Toca para unirte a la llamada grupal' : 'Responde o rechaza la llamada'}
          </p>
        </div>
      </div>

      {/* CSS para animación bounce personalizada */}
      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.05);
          }
        }
      `}</style>
    </>
  );
};