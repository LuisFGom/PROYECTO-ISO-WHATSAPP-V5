// frontend/src/services/dailyService.ts - VERSIÓN MEJORADA CON BACKEND
import { apiClient } from '../infrastructure/api/apiClient';

interface RoomResponse {
  success: boolean;
  roomName: string;
  roomUrl: string;
  domain: string;
}

interface TokenResponse {
  success: boolean;
  token: string;
  roomName: string;
  roomUrl: string;
  domain: string;
}

export const dailyService = {
  /**
   * Obtener token JWT para acceder a una sala
   * NUEVO: Este método es más seguro que getRoomUrl porque incluye un token firmado
   * @param roomName - Nombre único de la sala
   * @param userName - Nombre del usuario
   * @returns Token JWT y URL de la sala
   */
  async getTokenForRoom(roomName: string, userName?: string): Promise<{ token: string; roomUrl: string }> {
    try {
      console.log(`🔐 Solicitando token JWT para sala: ${roomName}`);

      let url = `/videocalls/token/${roomName}`;
      if (userName) {
        url += `?userName=${encodeURIComponent(userName)}`;
      }

      const response = await apiClient.get<TokenResponse>(url);

      if (response.data.success && response.data.token && response.data.roomUrl) {
        console.log(`✅ Token JWT obtenido exitosamente`);
        console.log(`🔐 Token (primeros 50 caracteres): ${response.data.token.substring(0, 50)}...`);
        console.log(`📍 URL: ${response.data.roomUrl}`);
        
        // Cache busting: timestamp para evitar caché stale
        const url = new URL(response.data.roomUrl);
        url.searchParams.set('t', String(Date.now()));
        url.searchParams.set('token', response.data.token);
        
        const finalUrl = url.toString();
        console.log(`📍 URL con token: ${finalUrl.substring(0, 80)}...`);
        
        return {
          token: response.data.token,
          roomUrl: finalUrl
        };
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error: any) {
      console.error(`\n${'='.repeat(60)}`);
      console.error(`❌ ERROR OBTENIENDO TOKEN PARA SALA: ${roomName}`);
      console.error(`${'='.repeat(60)}`);
      console.error(`❌ Error:`, error?.message);
      console.error(`❌ Status:`, error?.response?.status);
      console.error(`${'='.repeat(60)}\n`);

      throw error;
    }
  },

  /**
   * Obtener o crear una sala de videollamada a través del backend
   * @param roomName - Nombre único de la sala
   * @returns URL de la sala
   */
  async getRoomUrl(roomName: string): Promise<string> {
    try {
      console.log(`🔄 Solicitando sala al backend: ${roomName}`);

      const response = await apiClient.get<RoomResponse>(`/videocalls/room/${roomName}`);

      if (response.data.success && response.data.roomUrl) {
        console.log(`✅ Sala obtenida del backend: ${roomName}`);
        console.log(`📍 URL base: ${response.data.roomUrl}`);
        
        // Agregar parámetros para permitir acceso desde diferentes contextos
        const url = new URL(response.data.roomUrl);
        
        // Cache busting: timestamp para evitar caché stale
        url.searchParams.set('t', String(Date.now()));
        
        // NO agregar daily_layout_mode aquí - es propiedad del frame, no del URL
        // daily_layout_mode se configura en el panel de Daily.co, no en la URL
        
        // Para navegadores móviles que no soportan WebRTC completo
        // pero pueden usar audio o view-only mode
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          console.log('📱 Dispositivo móvil detectado, optimizando parámetros...');
          // NO deshabilitar completamente, dejar que Daily.co lo intente
        }
        
        const finalUrl = url.toString();
        console.log(`📍 URL final: ${finalUrl}`);
        return finalUrl;
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error: any) {
      console.error(`\n${'='.repeat(60)}`);
      console.error(`❌ ERROR OBTENIENDO SALA: ${roomName}`);
      console.error(`${'='.repeat(60)}`);
      console.error(`❌ Error completo:`, error);
      console.error(`❌ Error message:`, error?.message);
      console.error(`❌ Error status:`, error?.response?.status);
      console.error(`❌ Error response:`, error?.response?.data);
      console.error(`${'='.repeat(60)}\n`);

      // Lanzar error con status code para que CallWindow.tsx lo pueda detectar
      const statusCode = error?.response?.status;
      if (statusCode === 400) {
        throw new Error(`No se pudo obtener la sala: Request failed with status code 400`);
      } else if (statusCode === 500) {
        throw new Error(`No se pudo obtener la sala: Error interno del servidor (500)`);
      } else {
        throw new Error(`No se pudo obtener la sala: ${error.response?.data?.error || error.message}`);
      }
    }
  },

  /**
   * Verificar que una sala existe
   * @param roomName - Nombre de la sala
   * @returns true si existe, false si no
   */
  async verifyRoom(roomName: string): Promise<boolean> {
    try {
      console.log(`🔍 Verificando sala: ${roomName}`);

      const response = await apiClient.get<any>(`/videocalls/verify/${roomName}`);

      if (response.data.success) {
        console.log(`✅ Sala verificada: ${response.data.exists ? 'EXISTE' : 'NO EXISTE'}`);
        return response.data.exists;
      }

      return false;
    } catch (error: any) {
      console.error(`❌ Error verificando sala: ${roomName}`, error);
      return false;
    }
  },

  /**
   * Eliminar una sala después de finalizar la llamada
   * @param roomName - Nombre de la sala
   */
  async deleteRoom(roomName: string): Promise<void> {
    try {
      console.log(`🗑️ Eliminando sala: ${roomName}`);

      const response = await apiClient.delete(`/videocalls/room/${roomName}`);

      if (response.data.success) {
        console.log(`✅ Sala eliminada: ${roomName}`);
      }
    } catch (error: any) {
      // No lanzar error si falla la eliminación
      console.warn(`⚠️ Error eliminando sala ${roomName}:`, error.response?.data?.error || error.message);
    }
  },

  /**
   * Verificar que Daily.co está configurado en el backend
   */
  async checkConfiguration(): Promise<boolean> {
    try {
      console.log(`⚙️ Verificando configuración de Daily.co...`);

      const response = await apiClient.get<any>(`/videocalls/config/status`);

      if (response.data.configured) {
        console.log(`✅ Daily.co configurado:`);
        console.log(`   Dominio: ${response.data.domain}`);
        console.log(`   Mensaje: ${response.data.message}`);
        return true;
      } else {
        console.error(`❌ ${response.data.message}`);
        return false;
      }
    } catch (error: any) {
      console.error(`❌ Error verificando configuración:`, error);
      return false;
    }
  },
};
