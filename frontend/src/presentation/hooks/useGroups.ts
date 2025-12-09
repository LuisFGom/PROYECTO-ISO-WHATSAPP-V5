// frontend/src/presentation/hooks/useGroups.ts - SIN CAMBIOS (ya estaba correcto)
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../infrastructure/api/apiClient';
import { useAuthStore } from '../store/authStore';

export interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  joinedAt: string;
  leftAt: string | null;
  addedByUserId: number | null;
  username: string;
  email: string;
  avatarUrl: string | null;
  status: 'online' | 'offline' | 'away';
  isActive: boolean;
  displayName?: string;
}

export interface Group {
  id: number;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  adminUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupWithMembers extends Group {
  members: GroupMember[];
  memberCount: number;
  isAdmin: boolean;
}

export const useGroups = () => {
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/groups');
      setGroups(response.data.data);
    } catch (err: any) {
      console.error('Error cargando grupos:', err);
      setError(err.response?.data?.message || 'Error al cargar grupos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshGroups = () => {
    loadGroups();
  };

  const silentRefreshGroups = useCallback(async () => {
    try {
      const response = await apiClient.get('/groups');
      setGroups(response.data.data);
    } catch (err: any) {
      console.error('Error recargando grupos silenciosamente:', err);
    }
  }, []);

  // 🔥 Agregar un grupo al estado local (usado cuando te agregan a un grupo)
  const addGroupLocally = (group: GroupWithMembers) => {
    if (currentUserId !== undefined) {
      setGroups(prev => {
        const exists = prev.some(g => g.id === group.id);
        if (exists) return prev;
        return [group, ...prev];
      });
    }
  };

  // 🔥 Remover un grupo del estado local (usado cuando te sacan de un grupo)
  const removeGroupLocally = (groupId: number) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const createGroup = async (data: {
    name: string;
    description?: string;
    avatarUrl?: string;
  }) => {
    try {
      const response = await apiClient.post('/groups', data);
      const newGroup = response.data.data as GroupWithMembers;
      if (newGroup) {
        addGroupLocally(newGroup);
      } else {
        await silentRefreshGroups();
      }
      return { success: true, data: newGroup };
    } catch (err: any) {
      console.error('Error creando grupo:', err);
      return {
        success: false,
        error: err.response?.data?.message || 'Error al crear grupo'
      };
    }
  };

  const updateGroup = async (
    groupId: number,
    data: {
      name?: string;
      description?: string;
      avatarUrl?: string;
    }
  ) => {
    try {
      await apiClient.put(`/groups/${groupId}`, data);
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, ...data } : g
        )
      );
      return { success: true };
    } catch (err: any) {
      console.error('Error actualizando grupo:', err);
      return {
        success: false,
        error: err.response?.data?.message || 'Error al actualizar grupo'
      };
    }
  };

  const deleteGroup = async (groupId: number) => {
    try {
      await apiClient.delete(`/groups/${groupId}`);
      removeGroupLocally(groupId);
      return { success: true };
    } catch (err: any) {
      console.error('Error eliminando grupo:', err);
      return {
        success: false,
        error: err.response?.data?.message || 'Error al eliminar grupo'
      };
    }
  };

  const getGroupMembers = async (groupId: number): Promise<GroupMember[]> => {
    try {
      const response = await apiClient.get(`/groups/${groupId}/members`);
      return response.data.data;
    } catch (err: any) {
      console.error('Error obteniendo miembros:', err);
      return [];
    }
  };

  const addMember = async (groupId: number, userIdToAdd: number) => {
    try {
      const response = await apiClient.post(`/groups/${groupId}/members`, { userIdToAdd });
      const newMember = response.data.data as GroupMember;

      if (!newMember || newMember.userId !== userIdToAdd) {
        console.warn('Advertencia: La API de agregar miembro devolvió datos inconsistentes.');
      }
      
      setGroups((prev) => 
        prev.map((group) => {
          if (group.id !== groupId) return group;
          
          const memberExists = group.members.some(m => m.userId === userIdToAdd);
          if (memberExists) return group;

          return {
            ...group,
            members: [...group.members, newMember],
            memberCount: group.memberCount + 1,
          };
        })
      );
      
      return { success: true, member: newMember };
    } catch (err: any) {
      console.error('Error agregando miembro:', err);
      return {
        success: false,
        error: err.response?.data?.message || 'Error al agregar miembro'
      };
    }
  };

  const removeMember = async (groupId: number, userIdToRemove: number) => {
    try {
      await apiClient.delete(`/groups/${groupId}/members/${userIdToRemove}`);
      
      setGroups((prev) => 
        prev.map((group) => {
          if (group.id !== groupId) return group;
          
          return {
            ...group,
            members: group.members.filter(m => m.userId !== userIdToRemove),
            memberCount: Math.max(0, group.memberCount - 1),
          };
        })
      );

      return { success: true, removedUserId: userIdToRemove };
    } catch (err: any) {
      console.error('Error removiendo miembro:', err);
      return {
        success: false,
        error: err.response?.data?.message || 'Error al remover miembro'
      };
    }
  };

  const leaveGroup = async (groupId: number) => {
    try {
      await apiClient.post(`/groups/${groupId}/leave`);
      removeGroupLocally(groupId);
      return { success: true };
    } catch (err: any) {
      console.error('Error saliendo del grupo:', err);
      return {
        success: false,
        error: err.response?.data?.message || 'Error al salir del grupo'
      };
    }
  };

  const searchGroups = (query: string): GroupWithMembers[] => {
    if (!query.trim()) return groups;

    const lowerQuery = query.toLowerCase();
    return groups.filter((group) =>
      group.name.toLowerCase().includes(lowerQuery) ||
      group.description?.toLowerCase().includes(lowerQuery)
    );
  };

  const getUnreadCount = async (groupId: number): Promise<number> => {
    try {
      const response = await apiClient.get(`/groups/${groupId}/unread-count`);
      return response.data.count;
    } catch (err: any) {
      console.error('Error obteniendo mensajes no leídos:', err);
      return 0;
    }
  };

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  return {
    groups,
    isLoading,
    error,
    refreshGroups,
    silentRefreshGroups,
    addGroupLocally,
    removeGroupLocally,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupMembers,
    addMember,
    removeMember,
    leaveGroup,
    searchGroups,
    getUnreadCount
  };
};