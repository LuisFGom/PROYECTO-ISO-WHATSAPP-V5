// frontend/src/presentation/hooks/useCallNotification.ts - CORREGIDO ✅
import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../../infrastructure/socket/socketService';

export interface IncomingCall {
  callId: number;
  callerId: number;
  callerName: string;
  callerAvatar?: string;
  roomName: string;
  callType: 'audio' | 'video';
  isGroupCall: boolean;
  groupId?: number;
  groupName?: string;
}

export interface ActiveCall {
  callId: number;
  roomName: string;
  callType: 'audio' | 'video';
  isGroupCall: boolean;
  startTime: number;
}

export const useCallNotification = () => {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  
  // 🔥 NUEVO: Prevenir llamadas duplicadas
  const isStartingCallRef = useRef<boolean>(false);
  const processedCallIdsRef = useRef<Set<number>>(new Set());
  const lastIncomingCallIdRef = useRef<number | null>(null);

  // 📞 Handler para llamada 1-a-1 entrante
  const handleIncomingCall = useCallback((data: { 
    callId: number; 
    callerId: number; 
    roomName: string; 
    callType: 'audio' | 'video' 
  }) => {
    console.log('📞 Llamada entrante 1-a-1:', data);
    
    // 🔥 NUEVO: Ignorar si ya procesamos esta llamada
    if (processedCallIdsRef.current.has(data.callId)) {
      console.log('⚠️ Llamada duplicada ignorada, callId:', data.callId);
      return;
    }
    
    // 🔥 NUEVO: Ignorar si ya hay una llamada entrante del mismo callId
    if (lastIncomingCallIdRef.current === data.callId) {
      console.log('⚠️ Llamada duplicada del mismo callId ignorada:', data.callId);
      return;
    }
    
    // Marcar como procesada
    processedCallIdsRef.current.add(data.callId);
    lastIncomingCallIdRef.current = data.callId;
    
    // ✅ CRÍTICO: Guardar el roomName que viene del servidor
    setIncomingCall({
      callId: data.callId,
      callerId: data.callerId,
      callerName: `Usuario ${data.callerId}`, // TODO: Obtener nombre real
      callerAvatar: undefined, // TODO: Obtener avatar real
      roomName: data.roomName, // ✅ MISMO roomName que el que llama
      callType: data.callType,
      isGroupCall: false
    });
  }, []);

  // 📞 Handler para llamada grupal entrante
  const handleIncomingGroupCall = useCallback((data: { 
    callId: number; 
    groupId: number; 
    callerId: number; 
    roomName: string; 
    callType: 'audio' | 'video' 
  }) => {
    console.log('📞 Llamada grupal entrante:', data);
    
    // 🔥 NUEVO: Ignorar si ya procesamos esta llamada
    if (processedCallIdsRef.current.has(data.callId)) {
      console.log('⚠️ Llamada grupal duplicada ignorada, callId:', data.callId);
      return;
    }
    
    // 🔥 NUEVO: Ignorar si ya hay una llamada entrante del mismo callId
    if (lastIncomingCallIdRef.current === data.callId) {
      console.log('⚠️ Llamada grupal duplicada del mismo callId ignorada:', data.callId);
      return;
    }
    
    // Marcar como procesada
    processedCallIdsRef.current.add(data.callId);
    lastIncomingCallIdRef.current = data.callId;
    
    // ✅ CRÍTICO: Guardar el roomName que viene del servidor
    setIncomingCall({
      callId: data.callId,
      callerId: data.callerId,
      callerName: `Usuario ${data.callerId}`, // TODO: Obtener nombre real
      callerAvatar: undefined,
      roomName: data.roomName, // ✅ MISMO roomName que el grupo
      callType: data.callType,
      isGroupCall: true,
      groupId: data.groupId,
      groupName: `Grupo ${data.groupId}` // TODO: Obtener nombre real del grupo
    });
  }, []);

  // 📞 Handler cuando el otro usuario responde (solo para el que llamó)
  const handleCallAnswered = useCallback((data: { callId: number; answeredBy: number }) => {
    console.log('✅ Llamada respondida:', data);
    // La llamada ya está activa, no hacemos nada aquí
  }, []);

  // 📞 Handler cuando rechazan tu llamada (solo para el que llamó)
  const handleCallRejected = useCallback((data: { callId: number; rejectedBy: number }) => {
    console.log('🚫 Llamada rechazada:', data);
    
    // 🔥 NUEVO: Limpiar referencias
    lastIncomingCallIdRef.current = null;
    isStartingCallRef.current = false;
    
    // Cerrar la ventana de llamada si estaba abierta
    setActiveCall(null);
    
    alert('La llamada fue rechazada');
  }, []);

  // 📞 Handler cuando la otra persona cuelga
  const handleCallEnded = useCallback((data: { callId: number; endedBy: number }) => {
    console.log('📴 Llamada finalizada por el otro usuario:', data);
    
    // 🔥 NUEVO: Limpiar referencias
    lastIncomingCallIdRef.current = null;
    isStartingCallRef.current = false;
    
    // Cerrar la ventana de llamada
    setActiveCall(null);
    
    // 🔥 NUEVO: También limpiar llamada entrante si existe con este callId
    setIncomingCall(prev => prev?.callId === data.callId ? null : prev);
  }, []);

  // 🔥 NUEVO: Handler cuando la llamada termina por problemas de conexión del otro usuario
  const handleCallEndedByConnection = useCallback((data: { callId: number; endedBy: number; reason: string }) => {
    console.log('📵 Llamada finalizada por problemas de conexión:', data);
    
    // 🔥 NUEVO: Limpiar referencias
    lastIncomingCallIdRef.current = null;
    isStartingCallRef.current = false;
    
    // Cerrar la ventana de llamada
    setActiveCall(null);
    
    // 🔥 NUEVO: También limpiar llamada entrante si existe
    setIncomingCall(prev => prev?.callId === data.callId ? null : prev);
    
    // Mostrar mensaje al usuario
    alert('📵 Llamada finalizada por problemas de conexión del otro participante');
  }, []);

  // ✅ Aceptar llamada entrante
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    
    // 🔥 NUEVO: Limpiar referencia para permitir nuevas llamadas
    lastIncomingCallIdRef.current = null;

    try {
      if (incomingCall.isGroupCall) {
        // Llamada grupal: unirse
        await socketService.emitGroupCallJoin(incomingCall.callId);
      } else {
        // Llamada 1-a-1: responder
        await socketService.emitCallAnswer(incomingCall.callId);
      }

      // ✅ Activar la llamada con el MISMO roomName que recibimos
      setActiveCall({
        callId: incomingCall.callId,
        roomName: incomingCall.roomName, // ✅ CRÍTICO: Usar el roomName recibido
        callType: incomingCall.callType,
        isGroupCall: incomingCall.isGroupCall,
        startTime: Date.now()
      });

      // Limpiar notificación
      setIncomingCall(null);

      console.log('✅ Llamada aceptada, roomName:', incomingCall.roomName);
    } catch (error) {
      console.error('❌ Error al aceptar llamada:', error);
      alert('Error al aceptar la llamada');
      setIncomingCall(null);
    }
  }, [incomingCall]);

  // ❌ Rechazar llamada entrante
  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;
    
    // 🔥 NUEVO: Limpiar referencia para permitir nuevas llamadas
    lastIncomingCallIdRef.current = null;

    try {
      if (!incomingCall.isGroupCall) {
        // Solo las llamadas 1-a-1 se pueden rechazar explícitamente
        await socketService.emitCallReject(incomingCall.callId);
      }

      // Limpiar notificación (en llamadas grupales, simplemente la ignoras)
      setIncomingCall(null);

      console.log('🚫 Llamada rechazada/ignorada');
    } catch (error) {
      console.error('❌ Error al rechazar llamada:', error);
      setIncomingCall(null);
    }
  }, [incomingCall]);
  // 📴 Finalizar llamada activa
  const endCall = useCallback(async () => {
    if (!activeCall) return;

    const duration = Math.floor((Date.now() - activeCall.startTime) / 1000);

    try {
      // ✅ MEJORADO: Validar que socket esté conectado y autenticado
      if (!socketService.isConnected) {
        console.warn('⚠️ Socket no está conectado, no se puede enviar evento');
        setActiveCall(null);
        return;
      }

      if (activeCall.isGroupCall) {
        // Llamada grupal: salir
        await socketService.emitGroupCallLeave(activeCall.callId, duration);
      } else {
        // Llamada 1-a-1: terminar
        await socketService.emitCallEnd(activeCall.callId, duration);
      }

      setActiveCall(null);
      console.log(`📴 Llamada finalizada, duración: ${duration}s`);
    } catch (error: any) {
      console.error('❌ Error al finalizar llamada:', error);
      
      // Si es error de autenticación, solo cerrar localmente
      if (error.message?.includes('No autenticado') || error.message?.includes('not authenticated')) {
        console.warn('⚠️ No autenticado, cerrando llamada localmente...');
        setActiveCall(null);
      } else {
        // Para otros errores, mostrar alerta pero cerrar de todos modos
        setActiveCall(null);
      }
    }
  }, [activeCall]);

  // 📞 Iniciar llamada 1-a-1
  const startCall = useCallback(async (
    receiverId: number, 
    callType: 'audio' | 'video'
  ): Promise<boolean> => {
    // 🔥 NUEVO: Prevenir doble clic
    if (isStartingCallRef.current) {
      console.log('⚠️ Ya hay una llamada iniciándose, ignorando doble clic');
      return false;
    }
    
    // 🔥 NUEVO: No iniciar si ya hay una llamada activa
    if (activeCall) {
      console.log('⚠️ Ya hay una llamada activa, no se puede iniciar otra');
      return false;
    }
    
    isStartingCallRef.current = true;
    
    try {
      // ✅ MEJORADO: Validar que socket esté conectado
      if (!socketService.isConnected) {
        console.error('❌ Socket no está conectado');
        alert('No hay conexión con el servidor. Intenta de nuevo.');
        isStartingCallRef.current = false;
        return false;
      }

      // ✅ CORREGIDO: Generar roomName ÚNICO
      const roomName = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('🔵 Iniciando llamada con roomName:', roomName);
      
      // ✅ Enviar invitación con el roomName al servidor
      const callId = await socketService.emitCallInvite(receiverId, roomName, callType);

      // ✅ Activar la llamada inmediatamente para el que llama
      setActiveCall({
        callId,
        roomName, // ✅ El que llama usa ESTE roomName
        callType,
        isGroupCall: false,
        startTime: Date.now()
      });

      console.log(`📞 Llamada ${callType} iniciada con ${receiverId}, callId: ${callId}, roomName: ${roomName}`);
      
      // 🔥 Marcar callId como procesado para evitar duplicados
      processedCallIdsRef.current.add(callId);
      
      return true;
    } catch (error) {
      console.error('❌ Error al iniciar llamada:', error);
      alert('Error al iniciar la llamada');
      return false;
    } finally {
      // 🔥 NUEVO: Liberar el bloqueo después de un breve delay
      setTimeout(() => {
        isStartingCallRef.current = false;
      }, 1000);
    }
  }, [activeCall]);

  // 📞 Iniciar llamada grupal
  const startGroupCall = useCallback(async (
    groupId: number, 
    callType: 'audio' | 'video'
  ): Promise<boolean> => {
    // 🔥 NUEVO: Prevenir doble clic
    if (isStartingCallRef.current) {
      console.log('⚠️ Ya hay una llamada grupal iniciándose, ignorando doble clic');
      return false;
    }
    
    // 🔥 NUEVO: No iniciar si ya hay una llamada activa
    if (activeCall) {
      console.log('⚠️ Ya hay una llamada activa, no se puede iniciar otra');
      return false;
    }
    
    isStartingCallRef.current = true;
    
    try {
      // ✅ MEJORADO: Validar que socket esté conectado
      if (!socketService.isConnected) {
        console.error('❌ Socket no está conectado');
        alert('No hay conexión con el servidor. Intenta de nuevo.');
        isStartingCallRef.current = false;
        return false;
      }

      // ✅ CORREGIDO: Generar roomName ÚNICO para grupo
      const roomName = `group-call-${groupId}-${Date.now()}`;
      
      console.log('🔵 Iniciando llamada grupal con roomName:', roomName);
      
      const callId = await socketService.emitGroupCallInvite(groupId, roomName, callType);

      // ✅ Activar la llamada inmediatamente para el que inicia
      setActiveCall({
        callId,
        roomName, // ✅ El que inicia usa ESTE roomName
        callType,
        isGroupCall: true,
        startTime: Date.now()
      });

      console.log(`📞 Llamada grupal ${callType} iniciada en grupo ${groupId}, roomName: ${roomName}`);
      
      // 🔥 Marcar callId como procesado para evitar duplicados
      processedCallIdsRef.current.add(callId);
      
      return true;
    } catch (error) {
      console.error('❌ Error al iniciar llamada grupal:', error);
      alert('Error al iniciar la llamada grupal');
      return false;
    } finally {
      // 🔥 NUEVO: Liberar el bloqueo después de un breve delay
      setTimeout(() => {
        isStartingCallRef.current = false;
      }, 1000);
    }
  }, [activeCall]);

  // 🎧 Registrar listeners de Socket.IO
  useEffect(() => {
    console.log('🎧 Registrando listeners de llamadas...');

    // Listeners para llamadas 1-a-1
    socketService.onCallIncoming(handleIncomingCall);
    socketService.onCallAnswered(handleCallAnswered);
    socketService.onCallRejected(handleCallRejected);
    socketService.onCallEnded(handleCallEnded);
    socketService.onCallEndedByConnection(handleCallEndedByConnection); // 🔥 NUEVO

    // Listeners para llamadas grupales
    socketService.onGroupCallIncoming(handleIncomingGroupCall);

    // Cleanup al desmontar
    return () => {
      console.log('🔌 Limpiando listeners de llamadas...');
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('call:incoming', handleIncomingCall);
        socket.off('call:answered', handleCallAnswered);
        socket.off('call:rejected', handleCallRejected);
        socket.off('call:ended', handleCallEnded);
        socket.off('call:ended-by-connection', handleCallEndedByConnection); // 🔥 NUEVO
        socket.off('group:call-incoming', handleIncomingGroupCall);
      }
    };
  }, [
    handleIncomingCall, 
    handleIncomingGroupCall, 
    handleCallAnswered, 
    handleCallRejected, 
    handleCallEnded,
    handleCallEndedByConnection // 🔥 NUEVO
  ]);

  return {
    // Estado
    incomingCall,
    activeCall,
    
    // Acciones
    acceptCall,
    rejectCall,
    endCall,
    startCall,
    startGroupCall,
  };
};