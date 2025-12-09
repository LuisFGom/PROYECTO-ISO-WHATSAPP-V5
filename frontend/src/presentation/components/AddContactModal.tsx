// frontend/src/presentation/components/AddContactModal.tsx
import { useState } from 'react';
import { apiClient } from '../../infrastructure/api/apiClient';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded: () => void;
}

interface SearchedUser {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
}

export const AddContactModal = ({ isOpen, onClose, onContactAdded }: AddContactModalProps) => {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [searchedUser, setSearchedUser] = useState<SearchedUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // 🔍 Buscar usuario por email
  const handleSearchUser = async () => {
    if (!email.trim()) {
      setError('Ingresa un email');
      return;
    }

    setError('');
    setIsSearching(true);
    setSearchedUser(null);

    try {
      // 🔧 Importante: asegúrate de no duplicar /api
      const response = await apiClient.post(`/contacts/search`, { email: email.trim() });
      setSearchedUser(response.data.data);
      setNickname(response.data.data.username); // Sugerir el username como apodo
    } catch (err: any) {
      console.error('❌ Error al buscar usuario:', err);
      setError(err.response?.data?.message || 'Usuario no encontrado');
    } finally {
      setIsSearching(false);
    }
  };

  // ➕ Agregar contacto
  const handleAddContact = async () => {
    if (!nickname.trim()) {
      setError('Ingresa un apodo para el contacto');
      return;
    }

    if (!searchedUser) {
      setError('Primero busca un usuario');
      return;
    }

    setError('');
    setIsAdding(true);

    try {
      await apiClient.post(`/contacts`, {
        email: searchedUser.email,
        nickname: nickname.trim(),
      });

      // Resetear y cerrar
      setEmail('');
      setNickname('');
      setSearchedUser(null);
      onContactAdded();
      onClose();
    } catch (err: any) {
      console.error('❌ Error al agregar contacto:', err);
      setError(err.response?.data?.message || 'Error al agregar contacto');
    } finally {
      setIsAdding(false);
    }
  };

  // 🔄 Resetear modal
  const handleClose = () => {
    setEmail('');
    setNickname('');
    setSearchedUser(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="bg-whatsapp-teal p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Agregar Contacto</h2>
            <button
              onClick={handleClose}
              className="text-white hover:bg-whatsapp-teal-dark rounded-full p-1 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Buscar por email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email del usuario
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
                disabled={isSearching || !!searchedUser}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
              />
              <button
                onClick={handleSearchUser}
                disabled={isSearching || !!searchedUser}
                className="px-4 py-2 bg-whatsapp-green text-white rounded-lg hover:bg-whatsapp-green-dark transition disabled:opacity-50"
              >
                {isSearching ? '...' : '🔍'}
              </button>
            </div>
          </div>

          {/* Usuario encontrado */}
          {searchedUser && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Usuario encontrado:</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-whatsapp-green rounded-full flex items-center justify-center">
                  {searchedUser.avatarUrl ? (
                    <img src={searchedUser.avatarUrl} alt="" className="w-full h-full rounded-full" />
                  ) : (
                    <span className="text-white font-bold">
                      {searchedUser.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{searchedUser.username}</p>
                  <p className="text-sm text-gray-500">{searchedUser.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Apodo */}
          {searchedUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apodo (cómo lo quieres guardar)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ej: Mamá, Juan, Trabajo..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">Máximo 100 caracteres</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            {searchedUser && (
              <button
                onClick={handleAddContact}
                disabled={isAdding}
                className="flex-1 px-4 py-2 bg-whatsapp-green text-white rounded-lg hover:bg-whatsapp-green-dark transition disabled:opacity-50"
              >
                {isAdding ? 'Agregando...' : 'Agregar Contacto'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
