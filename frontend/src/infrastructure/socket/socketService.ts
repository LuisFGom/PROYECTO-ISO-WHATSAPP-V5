// frontend/src/infrastructure/socket/socketService.ts - CON VIDEOLLAMADAS (PARTE 1/2)
import { io, Socket } from 'socket.io-client';

// URL pública de ngrok para acceso remoto con HTTPS
// Esta URL es necesaria para que WebRTC funcione desde IPs remotas
const NGROK_BACKEND_URL = 'https://specifically-semihumanistic-maria.ngrok-free.dev';

export interface EncryptedMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  timestamp: Date;
  is_read: boolean;
  edited_at: Date | null;
  is_deleted_for_all: boolean;
}

export interface GroupMessage {
  groupId: number;
  senderId: number;
  content: string;
  timestamp: Date;
  editedAt: Date | null;
  isDeletedForAll: boolean;
  senderUsername: string;
  senderEmail: string;
  senderAvatarUrl: string | null;
}

export interface SocketResponse {
  success: boolean;
  error?: string;
  message?: EncryptedMessage | GroupMessage;
  messages?: (EncryptedMessage | GroupMessage)[];
  count?: number;
  member?: any;
  callId?: number;
}

class SocketService {
  private socket: Socket | null = null;
  private userId: number | null = null;

  connect(token: string, userId: number) {
    if (this.socket?.connected) {
      console.log('⚠️ Ya existe una conexión activa');
      return;
    }

    // Detectar si está en localhost o en IP remota
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    let SOCKET_URL: string;
    
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && !isMobile) {
      // Modo LOCAL (desktop): conectar a localhost:3001 (HTTP)
      SOCKET_URL = 'http://localhost:3001';
      console.log('🔌 Modo LOCAL (desktop) - Conectando a:', SOCKET_URL);
    } else if (hostname.match(/^(10\.|192\.|172\.)/)) {
      // Modo RED LOCAL: conectar directamente a la IP (HTTP)
      // Para máquinas en la misma red, HTTP funciona mejor que HTTPS via ngrok
      SOCKET_URL = `http://${hostname}:3001`;
      console.log('🔌 Modo RED LOCAL - Conectando a:', SOCKET_URL);
    } else if (isMobile) {
      // Modo MÓVIL: conectar a ngrok HTTPS
      // Los navegadores móviles requieren HTTPS para WebRTC
      SOCKET_URL = NGROK_BACKEND_URL;
      console.log('📱 Dispositivo móvil detectado, usando ngrok HTTPS para WebRTC');
    } else {
      // Modo REMOTO: conectar a ngrok HTTPS
      SOCKET_URL = NGROK_BACKEND_URL;
      console.log('🔌 Modo REMOTO (IP lejana) - Conectando a ngrok HTTPS:', SOCKET_URL);
    }
    
    console.log('🔌 Conectando Socket.IO a:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'],
    });

    this.userId = userId;

    this.socket.on('connect', () => {
      console.log('✅ Conectado al servidor Socket.IO');
      this.socket?.emit('authenticate', userId);
    });

    this.socket.on('authenticated', (data) => {
      console.log('🔐 Autenticado:', data);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Desconectado del servidor');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión:', error);
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Intento de reconexión #${attempt}`);
    });

    this.socket.on('reconnect', (attempt) => {
      console.log(`✅ Reconectado después de ${attempt} intentos`);
      
      // 🔥 NUEVO: Verificar si hay una llamada pendiente de notificar
      this.checkPendingCallEnd();
    });
    
    // 🔥 NUEVO: También verificar en connect por si el socket se reconecta de otra forma
    this.socket.on('connect', () => {
      console.log('✅ Socket conectado');
      
      // Verificar llamadas pendientes después de un breve delay para asegurar autenticación
      setTimeout(() => {
        this.checkPendingCallEnd();
      }, 1000);
    });
  }
  
  // 🔥 NUEVO: Verificar y notificar llamadas que terminaron por desconexión
  private checkPendingCallEnd() {
    const pendingCallStr = localStorage.getItem('pending_call_end');
    if (pendingCallStr) {
      try {
        const pendingCall = JSON.parse(pendingCallStr);
        
        // Solo procesar si es reciente (menos de 5 minutos)
        if (Date.now() - pendingCall.timestamp < 5 * 60 * 1000) {
          console.log('📤 Notificando llamada que terminó por desconexión:', pendingCall);
          
          // Emitir evento al backend
          this.emitCallEndByConnection(pendingCall.callId, pendingCall.contactId);
        }
        
        // Limpiar de localStorage
        localStorage.removeItem('pending_call_end');
      } catch (error) {
        console.error('❌ Error al procesar llamada pendiente:', error);
        localStorage.removeItem('pending_call_end');
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      console.log('🔌 Socket desconectado manualmente');
    }
  }

  on(eventName: string, callback: (...args: any[]) => void): void {
    this.socket?.on(eventName, callback);
  }

  // ==================== MÉTODOS EXISTENTES (CHAT 1-A-1) ====================

  sendMessage(to: number, content: string) {
    if (!this.socket || !this.userId) {
      console.error('❌ Socket no conectado');
      return;
    }

    this.socket.emit('message:send', {
      from: this.userId,
      to,
      content,
      timestamp: new Date().toISOString(),
    });
  }

  onMessageReceive(callback: (data: any) => void) {
    this.socket?.on('message:receive', callback);
  }

  onMessageSent(callback: (data: any) => void) {
    this.socket?.on('message:sent', callback);
  }

  startTyping(to: number) {
    if (!this.userId) return;
    this.socket?.emit('typing:start', { from: this.userId, to });
  }

  stopTyping(to: number) {
    if (!this.userId) return;
    this.socket?.emit('typing:stop', { from: this.userId, to });
  }

  onTypingStart(callback: (data: { from: number; to: number }) => void) {
    this.socket?.on('typing:start', callback);
  }

  onTypingStop(callback: (data: { from: number; to: number }) => void) {
    this.socket?.on('typing:stop', callback);
  }

  onUserOnline(callback: (data: { userId: number }) => void) {
    this.socket?.on('user:online', callback);
  }

  onUserOffline(callback: (data: { userId: number }) => void) {
    this.socket?.on('user:offline', callback);
  }

  markAsRead(messageId: number, userId: number) {
    this.socket?.emit('message:read', { messageId, userId });
  }

  onMessageRead(callback: (data: { messageId: number; userId: number }) => void) {
    this.socket?.on('message:read', callback);
  }

  sendEncryptedMessage(receiverId: number, content: string): Promise<EncryptedMessage> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('chat:send-message', 
        { receiverId, content },
        (response: SocketResponse) => {
          if (response.success && response.message) {
            resolve(response.message as EncryptedMessage);
          } else {
            reject(new Error(response.error || 'Error al enviar mensaje'));
          }
        }
      );
    });
  }

  editMessage(messageId: number, newContent: string): Promise<EncryptedMessage> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('chat:edit-message',
        { messageId, newContent },
        (response: SocketResponse) => {
          if (response.success && response.message) {
            console.log(`✏️ Mensaje ${messageId} editado exitosamente`);
            resolve(response.message as EncryptedMessage);
          } else {
            reject(new Error(response.error || 'Error al editar mensaje'));
          }
        }
      );
    });
  }

  onMessageEdited(callback: (message: EncryptedMessage) => void): void {
    this.socket?.on('chat:message-edited', callback);
  }

  loadChatHistory(
    contactId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<EncryptedMessage[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('chat:load-history',
        { contactId, limit, offset },
        (response: SocketResponse) => {
          if (response.success && response.messages) {
            resolve(response.messages as EncryptedMessage[]);
          } else {
            reject(new Error(response.error || 'Error al cargar historial'));
          }
        }
      );
    });
  }

  markChatMessagesAsRead(senderId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('chat:mark-as-read',
        { senderId },
        (response: SocketResponse) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || 'Error al marcar como leído'));
          }
        }
      );
    });
  }

  deleteChatMessage(messageId: number, deleteForAll: boolean = false): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('chat:delete-message',
        { messageId, deleteForAll },
        (response: SocketResponse) => {
          if (response.success) {
            console.log(`🗑️ Mensaje ${messageId} eliminado ${deleteForAll ? 'PARA TODOS' : 'PARA MÍ'}`);
            resolve();
          } else {
            reject(new Error(response.error || 'Error al eliminar mensaje'));
          }
        }
      );
    });
  }

  getUnreadCount(senderId?: number): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('chat:get-unread-count',
        { senderId },
        (response: SocketResponse) => {
          if (response.success && typeof response.count === 'number') {
            resolve(response.count);
          } else {
            reject(new Error(response.error || 'Error al obtener conteo'));
          }
        }
      );
    });
  }

  onNewEncryptedMessage(callback: (message: EncryptedMessage) => void): void {
    this.socket?.on('chat:new-message', callback);
  }

  onChatMessagesRead(callback: (data: { readBy: number }) => void): void {
    this.socket?.on('chat:messages-read', callback);
  }

  onChatMessageDeleted(callback: (data: { messageId: number; deleteForAll: boolean }) => void): void {
    this.socket?.on('chat:message-deleted', callback);
  }

  // ==================== 🔥 MÉTODOS DE GRUPOS ====================

  sendGroupMessage(groupId: number, content: string): Promise<GroupMessage> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('group:send-message',
        { groupId, content },
        (response: SocketResponse) => {
          if (response.success && response.message) {
            resolve(response.message as GroupMessage);
          } else {
            reject(new Error(response.error || 'Error al enviar mensaje de grupo'));
          }
        }
      );
    });
  }

  editGroupMessage(messageId: number, newContent: string): Promise<GroupMessage> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('group:edit-message',
        { messageId, newContent },
        (response: SocketResponse) => {
          if (response.success && response.message) {
            console.log(`✏️ Mensaje de grupo ${messageId} editado exitosamente`);
            resolve(response.message as GroupMessage);
          } else {
            reject(new Error(response.error || 'Error al editar mensaje de grupo'));
          }
        }
      );
    });
  }

  deleteGroupMessage(messageId: number, deleteForAll: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('group:delete-message',
        { messageId, deleteForAll },
        (response: SocketResponse) => {
          if (response.success) {
            console.log(`🗑️ Mensaje de grupo ${messageId} eliminado ${deleteForAll ? 'PARA TODOS' : 'PARA MÍ'}`);
            resolve();
          } else {
            reject(new Error(response.error || 'Error al eliminar mensaje de grupo'));
          }
        }
      );
    });
  }
  
  deleteGroupForUser(groupId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('group:delete-for-user',
        { groupId },
        (response: SocketResponse) => {
          if (response.success) {
            console.log(`🗑️ Grupo ${groupId} ocultado para el usuario`);
            resolve();
          } else {
            reject(new Error(response.error || 'Error al ocultar grupo'));
          }
        }
      );
    });
  }

  loadGroupHistory(
    groupId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<GroupMessage[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('group:load-history',
        { groupId, limit, offset },
        (response: SocketResponse) => {
          if (response.success && response.messages) {
            resolve(response.messages as GroupMessage[]);
          } else {
            reject(new Error(response.error || 'Error al cargar historial de grupo'));
          }
        }
      );
    });
  }

  markGroupMessageAsRead(groupMessageId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('group:mark-as-read',
        { groupMessageId },
        (response: SocketResponse) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || 'Error al marcar mensaje como leído'));
          }
        }
      );
    });
  }

  addGroupMember(groupId: number, userIdToAdd: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('group:add-member',
        { groupId, userIdToAdd },
        (response: SocketResponse) => {
          if (response.success) {
            resolve(response.member);
          } else {
            reject(new Error(response.error || 'Error al agregar miembro'));
          }
        }
      );
    });
  }

  removeGroupMember(groupId: number, userIdToRemove: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('group:remove-member',
        { groupId, userIdToRemove },
        (response: SocketResponse) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || 'Error al remover miembro'));
          }
        }
      );
    });
  }

  startGroupTyping(groupId: number) {
    if (!this.userId) return;
    this.socket?.emit('group:typing-start', { groupId });
  }

  stopGroupTyping(groupId: number) {
    if (!this.userId) return;
    this.socket?.emit('group:typing-stop', { groupId });
  }

  onGroupNewMessage(callback: (message: GroupMessage & { groupId: number }) => void): void {
    this.socket?.on('group:new-message', callback);
  }

  onGroupMessageEdited(callback: (message: GroupMessage) => void): void {
    this.socket?.on('group:message-edited', callback);
  }

  onGroupMessageDeleted(callback: (data: { messageId: number; groupId: number; deleteForAll: boolean }) => void): void {
    this.socket?.on('group:message-deleted', callback);
  }

  onGroupMemberAdded(callback: (data: { groupId: number; member: any }) => void): void {
    this.socket?.on('group:member-added', callback);
  }

  onGroupMemberRemoved(callback: (data: { groupId: number; userId: number }) => void): void {
    this.socket?.on('group:member-removed', callback);
  }

  onGroupTypingStart(callback: (data: { groupId: number; userId: number }) => void): void {
    this.socket?.on('group:typing-start', callback);
  }

  onGroupTypingStop(callback: (data: { groupId: number; userId: number }) => void): void {
    this.socket?.on('group:typing-stop', callback);
  }

  onGroupCreated(callback: (data: { group: any; members: any[] }) => void): void {
      this.socket?.on('group:created', callback);
  }
    
  onGroupUpdated(callback: (data: { group: any; groupId: number }) => void): void {
    this.socket?.on('group:updated', callback);
  }
    
  onGroupDeleted(callback: (data: { groupId: number }) => void): void {
    this.socket?.on('group:deleted', callback);
  }
  // ==================== 🔥 NUEVOS MÉTODOS DE VIDEOLLAMADAS JITSI ====================

  // 📞 Llamada 1-a-1: Invitar
  emitCallInvite(receiverId: number, roomName: string, callType: 'audio' | 'video'): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('call:invite',
        { receiverId, roomName, callType },
        (response: SocketResponse) => {
          if (response.success && response.callId) {
            console.log(`📞 Llamada ${callType} iniciada con ${receiverId}, callId: ${response.callId}`);
            resolve(response.callId);
          } else {
            reject(new Error(response.error || 'Error al iniciar llamada'));
          }
        }
      );
    });
  }

  // 📞 Llamada 1-a-1: Responder
  emitCallAnswer(callId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('call:answer',
        { callId },
        (response: SocketResponse) => {
          if (response.success) {
            console.log(`✅ Llamada ${callId} respondida`);
            resolve();
          } else {
            reject(new Error(response.error || 'Error al responder llamada'));
          }
        }
      );
    });
  }

  // 📞 Llamada 1-a-1: Rechazar
  emitCallReject(callId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('call:reject',
        { callId },
        (response: SocketResponse) => {
          if (response.success) {
            console.log(`🚫 Llamada ${callId} rechazada`);
            resolve();
          } else {
            reject(new Error(response.error || 'Error al rechazar llamada'));
          }
        }
      );
    });
  }

  // 📞 Llamada 1-a-1: Terminar
  emitCallEnd(callId: number, duration: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('call:end',
        { callId, duration },
        (response: SocketResponse) => {
          if (response.success) {
            console.log(`📴 Llamada ${callId} finalizada, duración: ${duration}s`);
            resolve();
          } else {
            reject(new Error(response.error || 'Error al finalizar llamada'));
          }
        }
      );
    });
  }

  // 🔥 NUEVO: Llamada 1-a-1: Terminar por problemas de conexión
  emitCallEndByConnection(callId: number, contactId?: number): void {
    if (!this.socket) {
      console.error('❌ Socket no conectado para enviar notificación de desconexión');
      return;
    }

    console.log(`📤 Emitiendo call:end-by-connection para callId=${callId}, contactId=${contactId}`);
    
    this.socket.emit('call:end-by-connection', { 
      callId, 
      contactId,
      reason: 'connection_lost'
    });
  }

  // 🔥 NUEVO: Listener para cuando la llamada termina por problemas de conexión del otro usuario
  onCallEndedByConnection(callback: (data: { callId: number; endedBy: number; reason: string }) => void): void {
    this.socket?.on('call:ended-by-connection', callback);
  }

  // 📞 Listeners de llamadas 1-a-1
  onCallIncoming(callback: (data: { 
    callId: number; 
    callerId: number; 
    roomName: string; 
    callType: 'audio' | 'video' 
  }) => void): void {
    this.socket?.on('call:incoming', callback);
  }

  onCallAnswered(callback: (data: { callId: number; answeredBy: number }) => void): void {
    this.socket?.on('call:answered', callback);
  }

  onCallRejected(callback: (data: { callId: number; rejectedBy: number }) => void): void {
    this.socket?.on('call:rejected', callback);
  }

  onCallEnded(callback: (data: { callId: number; endedBy: number }) => void): void {
    this.socket?.on('call:ended', callback);
  }

  // 📞 Llamada Grupal: Invitar
  emitGroupCallInvite(groupId: number, roomName: string, callType: 'audio' | 'video'): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('group:call-invite',
        { groupId, roomName, callType },
        (response: SocketResponse) => {
          if (response.success && response.callId) {
            console.log(`📞 Llamada grupal ${callType} iniciada en grupo ${groupId}, callId: ${response.callId}`);
            resolve(response.callId);
          } else {
            reject(new Error(response.error || 'Error al iniciar llamada grupal'));
          }
        }
      );
    });
  }

  // 📞 Llamada Grupal: Unirse
  emitGroupCallJoin(callId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('group:call-join',
        { callId },
        (response: SocketResponse) => {
          if (response.success) {
            console.log(`✅ Unido a llamada grupal ${callId}`);
            resolve();
          } else {
            reject(new Error(response.error || 'Error al unirse a llamada grupal'));
          }
        }
      );
    });
  }

  // 📞 Llamada Grupal: Salir
  emitGroupCallLeave(callId: number, duration: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket no conectado'));
      }

      this.socket.emit('group:call-leave',
        { callId, duration },
        (response: SocketResponse) => {
          if (response.success) {
            console.log(`📴 Salido de llamada grupal ${callId}, duración: ${duration}s`);
            resolve();
          } else {
            reject(new Error(response.error || 'Error al salir de llamada grupal'));
          }
        }
      );
    });
  }

  // 📞 Listener de llamada grupal entrante
  onGroupCallIncoming(callback: (data: { 
    callId: number; 
    groupId: number; 
    callerId: number; 
    roomName: string; 
    callType: 'audio' | 'video' 
  }) => void): void {
    this.socket?.on('group:call-incoming', callback);
  }

  // ==================== FIN DE MÉTODOS DE VIDEOLLAMADAS ====================

  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }

  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  get connectionState(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    return 'connecting';
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();