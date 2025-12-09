// frontend/src/presentation/components/GroupList.tsx - CORREGIDO COMPLETO

import { useState, useEffect } from 'react';
import { socketService } from '../../infrastructure/socket/socketService';
import { useAuthStore } from '../store/authStore';
import type { GroupWithMembers } from '../hooks/useGroups';

interface GroupListProps {
  groups: GroupWithMembers[];
  onGroupClick: (group: GroupWithMembers) => void;
  selectedGroupId: number | null;
  onGroupsUpdate: () => void; 
}

interface LastMessage {
  groupId: number;
  content: string;
  senderUsername: string;
  senderId: number;
  timestamp: Date;
}

export const GroupList = ({ 
  groups, 
  onGroupClick, 
  selectedGroupId, 
  onGroupsUpdate 
}: GroupListProps) => {
  const { user } = useAuthStore();
  const [lastMessages, setLastMessages] = useState<Map<number, LastMessage>>(new Map());
  const [loadingMessages, setLoadingMessages] = useState(false);

  // 🔥 EFECTO 1: Cargar último mensaje de cada grupo (con manejo robusto de errores)
  useEffect(() => {
    const loadLastMessages = async () => {
      if (groups.length === 0) return;
      
      setLoadingMessages(true);
      
      const newMessages = new Map<number, LastMessage>();
      
      // 🔥 CORRECCIÓN: Procesar grupos de forma secuencial para evitar sobrecarga
      for (const group of groups) {
        try {
          const history = await socketService.loadGroupHistory(group.id, 1, 0);
          
          if (history.length > 0) {
            const lastMsg = history[0];
            newMessages.set(group.id, {
              groupId: group.id,
              content: lastMsg.content,
              senderUsername: lastMsg.senderUsername,
              senderId: lastMsg.senderId,
              timestamp: new Date(lastMsg.timestamp)
            });
          }
        } catch (error) {
          // 🔥 CORRECCIÓN: Solo log en desarrollo, no mostrar al usuario
          if (import.meta.env.DEV) {
            console.warn(`⚠️ No se pudo cargar último mensaje del grupo ${group.id}:`, error);
          }
          // Continuar con el siguiente grupo sin fallar
        }
      }
      
      setLastMessages(newMessages);
      setLoadingMessages(false);
    };

    loadLastMessages();
  }, [groups]);

  // 🔥 EFECTO 2: Escuchar eventos de Socket (con cleanup mejorado)
  useEffect(() => {
    // A. Manejar nuevo mensaje en grupo
    const handleNewMessage = (message: any) => {
      setLastMessages(prev => {
        const newMap = new Map(prev);
        newMap.set(message.groupId, {
          groupId: message.groupId,
          content: message.content,
          senderUsername: message.senderUsername,
          senderId: message.senderId,
          timestamp: new Date(message.timestamp)
        });
        return newMap;
      });
    };

    // B. Manejar grupo creado
    const handleGroupCreated = (data: { group: any }) => {
      console.log('🆕 Grupo creado, recargando lista:', data.group);
      onGroupsUpdate();
    };

    // C. Manejar miembro agregado
    const handleMemberAdded = (data: { groupId: number; member: any; fullGroup?: GroupWithMembers }) => {
      console.log('👤 Miembro agregado al grupo:', data.groupId);
      
      // 🔥 CORRECCIÓN: Si recibimos el grupo completo y es para el usuario actual, recargar
      if (data.fullGroup && user && data.member.userId === user.id) {
        console.log('✅ Usuario actual agregado a grupo, recargando lista completa');
        onGroupsUpdate();
      } else if (user && data.member.userId === user.id) {
        // Si no recibimos fullGroup pero somos nosotros, igual recargar
        console.log('✅ Usuario actual agregado (sin fullGroup), recargando lista');
        onGroupsUpdate();
      }
    };

    // D. Manejar miembro removido
    const handleMemberRemoved = (data: { groupId: number; userId: number }) => {
      console.log('🚫 Miembro removido del grupo:', data.groupId, 'userId:', data.userId);
      
      // 🔥 CORRECCIÓN: Si el usuario removido es el actual, recargar para ocultar el grupo
      if (user && data.userId === user.id) {
        console.log('🚫 Usuario actual removido, recargando lista');
        onGroupsUpdate();
      }
    };

    // E. Manejar grupo actualizado
    const handleGroupUpdated = (data: { groupId: number; group: any }) => {
      console.log('✏️ Grupo actualizado:', data.groupId);
      onGroupsUpdate();
    };

    // F. Manejar grupo eliminado
    const handleGroupDeleted = (data: { groupId: number }) => {
      console.log('🗑️ Grupo eliminado:', data.groupId);
      onGroupsUpdate();
    };

    // Registrar todos los listeners
    socketService.onGroupNewMessage(handleNewMessage);
    socketService.on('group:created', handleGroupCreated);
    socketService.on('group:member-added', handleMemberAdded);
    socketService.on('group:member-removed', handleMemberRemoved);
    socketService.on('group:updated', handleGroupUpdated);
    socketService.on('group:deleted', handleGroupDeleted);

    // Cleanup: Remover todos los listeners
    return () => {
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('group:new-message', handleNewMessage);
        socket.off('group:created', handleGroupCreated);
        socket.off('group:member-added', handleMemberAdded);
        socket.off('group:member-removed', handleMemberRemoved);
        socket.off('group:updated', handleGroupUpdated);
        socket.off('group:deleted', handleGroupDeleted);
      }
    };
  }, [onGroupsUpdate, user]);

  // Función de formateo de tiempo
  const formatLastMessageTime = (timestamp: Date) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInMs = now.getTime() - messageDate.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else if (diffInHours < 168) {
      return messageDate.toLocaleDateString('es-ES', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  };

  // Función para renderizar el último mensaje
  const renderLastMessage = (group: GroupWithMembers) => {
    const lastMsg = lastMessages.get(group.id);
    
    if (loadingMessages) {
      return (
        <p className="text-sm text-gray-400 italic">Cargando...</p>
      );
    }
    
    if (!lastMsg) {
      return (
        <p className="text-sm text-gray-500">
          {group.memberCount} {group.memberCount === 1 ? 'miembro' : 'miembros'}
        </p>
      );
    }

    const isOwnMessage = user?.id === lastMsg.senderId;
    const messagePreview = lastMsg.content.length > 30 
      ? `${lastMsg.content.substring(0, 30)}...` 
      : lastMsg.content;

    return (
      <p className="text-sm text-gray-600 truncate">
        {isOwnMessage ? (
          <span className="text-gray-700">Tú: </span>
        ) : (
          <span className="text-gray-700">{lastMsg.senderUsername}: </span>
        )}
        {messagePreview}
      </p>
    );
  };

  // Renderizado del componente
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="text-6xl mb-4">👥</div>
        <p className="text-gray-600 mb-2">No tienes grupos</p>
        <p className="text-sm text-gray-500">Crea un grupo para chatear con varios contactos</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {groups.map((group) => {
        const lastMsg = lastMessages.get(group.id);
        
        return (
          <div
            key={group.id}
            onClick={() => onGroupClick(group)}
            className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition ${
              selectedGroupId === group.id ? 'bg-gray-200' : ''
            }`}
          >
            {/* Avatar del grupo */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-whatsapp-green rounded-full flex items-center justify-center">
                {group.avatarUrl ? (
                  <img 
                    src={group.avatarUrl} 
                    alt={group.name} 
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {group.name[0].toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Información del grupo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800 truncate">
                    {group.name}
                  </p>
                  {group.isAdmin && (
                    <span className="text-yellow-500 text-xs" title="Eres administrador">
                      👑
                    </span>
                  )}
                </div>
                {lastMsg && (
                  <span className="text-xs text-gray-500 ml-2">
                    {formatLastMessageTime(lastMsg.timestamp)}
                  </span>
                )}
              </div>
              {renderLastMessage(group)}
            </div>
          </div>
        );
      })}
    </div>
  );
};