// frontend/src/presentation/hooks/useContacts.ts
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../infrastructure/api/apiClient';

export interface ContactUser {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  status: 'online' | 'offline';
}

export interface Contact {
  id: number;
  userId: number;
  contactUserId: number;
  nickname: string;
  createdAt: string;
  updatedAt: string;
  user: ContactUser;
}

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 📥 Cargar contactos
  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/contacts');
      setContacts(response.data.data);
    } catch (err: any) {
      console.error('Error cargando contactos:', err);
      setError(err.response?.data?.message || 'Error al cargar contactos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🔄 Recargar contactos
  const refreshContacts = () => {
    loadContacts();
  };

  // ❌ Eliminar contacto
  const deleteContact = async (contactId: number) => {
    try {
      await apiClient.delete(`/contacts/${contactId}`);
      // Actualizar lista local
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      return { success: true };
    } catch (err: any) {
      console.error('Error eliminando contacto:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || 'Error al eliminar contacto' 
      };
    }
  };

  // ✏️ Actualizar apodo
  const updateNickname = async (contactId: number, nickname: string) => {
    try {
      await apiClient.put(`/contacts/${contactId}`, { nickname });
      // Actualizar lista local
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, nickname } : c))
      );
      return { success: true };
    } catch (err: any) {
      console.error('Error actualizando contacto:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || 'Error al actualizar contacto' 
      };
    }
  };

  // 🔍 Buscar contactos por nickname o email
  const searchContacts = (query: string): Contact[] => {
    if (!query.trim()) return contacts;

    const lowerQuery = query.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.nickname.toLowerCase().includes(lowerQuery) ||
        contact.user.email.toLowerCase().includes(lowerQuery) ||
        contact.user.username.toLowerCase().includes(lowerQuery)
    );
  };

  // Cargar al montar
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  return {
    contacts,
    isLoading,
    error,
    refreshContacts,
    deleteContact,
    updateNickname,
    searchContacts,
  };
};