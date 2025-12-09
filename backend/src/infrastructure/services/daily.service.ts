// backend/src/infrastructure/services/daily.service.ts - SERVICIO DAILY.CO
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

interface DailyRoomCreatePayload {
  name: string;
  privacy?: 'private' | 'public';
  properties?: {
    maxParticipants?: number;
    expiration?: string;
    lang?: string;
  };
}

interface DailyRoomResponse {
  name: string;
  id: string;
  api_created: boolean;
  privacy: string;
  url: string;
  created_at: string;
  config: any;
}

interface DailyTokenPayload {
  roomName: string;
  userName?: string;
  userID?: string;
  exp?: number;
  isOwner?: boolean;
}

interface DailyTokenResponse {
  token: string;
}

export class DailyService {
  private apiKey: string;
  private domain: string;
  private domainId: string = '6f1c5be1-2679-497b-a20f-0d1fd62d07a6'; // ⚠️ CRÍTICO: Domain UUID
  private httpClient: AxiosInstance;
  private readonly API_BASE_URL = 'https://api.daily.co/v1';

  constructor() {
    this.apiKey = process.env.DAILY_API_KEY || '';
    this.domain = process.env.DAILY_DOMAIN || 'whatsappp.daily.co';

    if (!this.apiKey) {
      console.warn('⚠️ DAILY_API_KEY no configurado en .env');
    }

    this.httpClient = axios.create({
      baseURL: this.API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Crear una sala de reunión en Daily.co
   * @param roomName - Nombre único de la sala
   * @param maxParticipants - Máximo de participantes (default: 100)
   * @returns Room data con URL para unirse
   */
  async createRoom(
    roomName: string,
    maxParticipants: number = 100
  ): Promise<DailyRoomResponse> {
    try {
      console.log(`🔨 Creando sala Daily.co: ${roomName}`);
      console.log(`🔑 Usando API Key: ${this.apiKey.substring(0, 10)}...`);
      console.log(`🌐 URL de API: ${this.API_BASE_URL}`);

      // Validar que el nombre de la sala sea válido
      if (!roomName || roomName.length === 0) {
        throw new Error('El nombre de la sala no puede estar vacío');
      }

      // Sanitizar el nombre de la sala (Daily.co solo acepta ciertos caracteres)
      const sanitizedName = roomName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      console.log(`📝 Nombre sanitizado: ${sanitizedName}`);

      // Payload mínimo recomendado por Daily.co
      const payload: any = {
        name: sanitizedName,
        privacy: 'public',
      };

      console.log(`📤 Enviando payload:`, JSON.stringify(payload, null, 2));
      console.log(`🔐 Headers: Authorization: Bearer ${this.apiKey.substring(0, 10)}...`);

      const response = await this.httpClient.post<DailyRoomResponse>('/rooms', payload);

      console.log(`✅ Sala creada exitosamente: ${sanitizedName}`);
      console.log(`📍 URL de la sala: ${response.data.url}`);
      console.log(`📊 Sala ID: ${response.data.id}`);
      console.log(`🔐 Privacy: ${response.data.privacy}`);

      return response.data;
    } catch (error: any) {
      console.error(`\n${'='.repeat(60)}`);
      console.error(`❌ ERROR CREANDO SALA EN DAILY.CO`);
      console.error(`${'='.repeat(60)}`);
      console.error(`❌ Room Name: ${roomName}`);
      console.error(`❌ Status code:`, error.response?.status);
      console.error(`❌ Status text:`, error.response?.statusText);
      console.error(`❌ Error message:`, error.response?.data?.error?.message || error.message);
      console.error(`❌ Error type:`, error.response?.data?.error?.type);
      console.error(`❌ Error data (full):`, JSON.stringify(error.response?.data, null, 2));
      console.error(`❌ Error headers:`, error.response?.headers);
      console.error(`❌ Axios message:`, error.message);
      console.error(`${'='.repeat(60)}\n`);
      
      // Interpretar el error
      if (error.response?.status === 400) {
        const errorType = error.response?.data?.error?.type;
        if (errorType === 'invalid-parameters') {
          console.error(`⚠️ SOLUCIÓN: El nombre de la sala contiene caracteres inválidos`);
        } else if (errorType === 'unauthorized') {
          console.error(`⚠️ SOLUCIÓN: Verifica que DAILY_API_KEY en .env es correcto`);
        } else {
          console.error(`⚠️ SOLUCIÓN: Revisa el payload enviado a Daily.co`);
        }
      } else if (error.response?.status === 401) {
        console.error(`⚠️ SOLUCIÓN: API key inválido o expirado - verifica .env`);
      } else if (error.response?.status === 403) {
        console.error(`⚠️ SOLUCIÓN: No tienes permisos - verifica configuración de Daily.co`);
      } else if (error.response?.status === 429) {
        console.error(`⚠️ SOLUCIÓN: Rate limiting - espera antes de crear nueva sala`);
      }
      
      throw new Error(`No se pudo crear la sala: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Obtener información de una sala existente
   * @param roomName - Nombre de la sala
   * @returns Room data
   */
  async getRoom(roomName: string): Promise<DailyRoomResponse> {
    try {
      console.log(`🔍 Obteniendo información de sala: ${roomName}`);

      const response = await this.httpClient.get<DailyRoomResponse>(`/rooms/${roomName}`);

      console.log(`✅ Sala encontrada: ${roomName}`);
      return response.data;
    } catch (error: any) {
      // Si la sala no existe, es normal en contexto de crear/unirse
      if (error.response?.status === 404) {
        console.log(`ℹ️ Sala no existe aún: ${roomName}`);
        return null as any;
      }

      console.error(`❌ Error obteniendo sala: ${roomName}`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Crear o obtener una sala de reunión
   * @param roomName - Nombre único de la sala
   * @returns URL de la sala
   */
  async getOrCreateRoom(roomName: string): Promise<string> {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔄 INICIANDO GET-OR-CREATE ROOM`);
      console.log(`${'='.repeat(60)}`);
      console.log(`📍 Room Name solicitado: ${roomName}`);

      if (!roomName) {
        throw new Error('Room name no puede estar vacío');
      }

      // Sanitizar el nombre de la sala
      const sanitizedName = roomName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      console.log(`📝 Room Name sanitizado: ${sanitizedName}`);

      // Verificar API key
      if (!this.apiKey || this.apiKey.length === 0) {
        console.error(`❌ CRITICAL: API KEY NO CONFIGURADO`);
        throw new Error('DAILY_API_KEY no está configurado en .env');
      }
      console.log(`✅ API Key configurado: ${this.apiKey.substring(0, 15)}...`);

      // Paso 1: Intentar obtener la sala existente
      console.log(`\n📌 PASO 1: Buscando sala existente...`);
      try {
        const existingRoom = await this.getRoom(sanitizedName);
        if (existingRoom && existingRoom.url) {
          console.log(`✅ Sala encontrada en Daily.co`);
          console.log(`♻️ Reutilizando sala existente: ${sanitizedName}`);
          console.log(`📍 URL: ${existingRoom.url}`);
          console.log(`${'='.repeat(60)}\n`);
          return existingRoom.url;
        }
      } catch (getError: any) {
        if (getError.response?.status === 404) {
          console.log(`ℹ️ Sala no existe aún (404) - procederemos a crear`);
        } else if (getError.response?.status === 401 || getError.response?.status === 403) {
          console.error(`⚠️ ERROR DE AUTENTICACIÓN - API KEY INVÁLIDO O EXPIRADO`);
          console.error(`Status: ${getError.response?.status}`);
          console.error(`Message: ${getError.response?.data?.error?.message}`);
          throw new Error(`API Key inválido: ${getError.response?.data?.error?.message || 'autenticación fallida'}`);
        } else {
          console.warn(`⚠️ Error al buscar sala (status ${getError.response?.status}):`, getError.message);
          console.warn(`ℹ️ Procederemos a intentar crear nueva sala`);
        }
      }

      // Paso 2: Si no existe, crear la sala
      console.log(`\n📌 PASO 2: Creando sala nueva...`);
      console.log(`🔨 Llamando a createRoom(${sanitizedName})`);
      
      let newRoom: any;
      try {
        newRoom = await this.createRoom(sanitizedName);
      } catch (createError: any) {
        // Si falla la creación, lanzar error con detalles
        const errorMsg = createError.response?.data?.error?.message || createError.message;
        const errorType = createError.response?.data?.error?.type || 'unknown';
        
        console.error(`\n${'='.repeat(60)}`);
        console.error(`❌ FALLO CRÍTICO EN CREACIÓN DE SALA`);
        console.error(`${'='.repeat(60)}`);
        console.error(`Status Code: ${createError.response?.status}`);
        console.error(`Error Type: ${errorType}`);
        console.error(`Error Message: ${errorMsg}`);
        
        if (createError.response?.status === 401 || createError.response?.status === 403) {
          console.error(`⚠️ PROBLEMA: API Key inválido o expirado`);
          console.error(`SOLUCIÓN: Verifica que DAILY_API_KEY en .env es correcto`);
        }
        
        console.error(`${'='.repeat(60)}\n`);
        throw createError;
      }
      
      console.log(`✅ Sala creada exitosamente`);
      console.log(`📍 URL: ${newRoom.url}`);
      console.log(`${'='.repeat(60)}\n`);
      
      return newRoom.url;
      
    } catch (error: any) {
      console.error(`\n${'='.repeat(60)}`);
      console.error(`❌ ERROR EN GET-OR-CREATE ROOM`);
      console.error(`${'='.repeat(60)}`);
      console.error(`📍 Room Name: ${roomName}`);
      console.error(`❌ Error message: ${error.message}`);
      console.error(`❌ Error response status: ${error.response?.status}`);
      console.error(`❌ Error full:`, JSON.stringify({
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      }, null, 2));
      console.error(`${'='.repeat(60)}\n`);
      
      throw error;
    }
  }

  /**
   * Generar un token JWT firmado para acceder a una sala
   * FORMATO CORRECTO DAILY.CO: Claims cortas (r, d, iat, exp)
   * NO usar room_name, user_name, iss, sub, etc (esos son INVÁLIDOS para Daily.co)
   * @param payload - Datos del token (roomName, userName, etc.)
   * @returns Token JWT firmado
   */
  async generateToken(payload: DailyTokenPayload): Promise<string> {
    try {
      console.log('\n' + '='.repeat(80));
      console.log('🔐 GENERANDO TOKEN JWT - FORMATO CORRECTO DAILY.CO');
      console.log('='.repeat(80));

      // PASO 1: Crear header
      const header = {
        typ: 'JWT',
        alg: 'HS256'
      };
      console.log('📋 PASO 1 - Header:');
      console.log(JSON.stringify(header, null, 2));

      // PASO 2: Crear payload con CLAIMS CORTAS corretas para Daily.co
      // ⚠️ CRÍTICO: Usar 'r', 'd', 'iat', 'exp' - NO room_name, user_name, iss!
      const now = Math.floor(Date.now() / 1000);
      const exp = payload.exp || (now + 3600); // 1 hora
      
      const tokenPayload = {
        r: payload.roomName,  // room name (claim corta!)
        d: this.domainId,     // domain id (claim corta!)
        iat: now,
        exp: exp,
      };

      console.log('\n📋 PASO 2 - Payload (CLAIMS CORRECTAS PARA DAILY.CO):');
      console.log(JSON.stringify(tokenPayload, null, 2));
      console.log('\n   📌 Valores críticos:');
      console.log(`   ✓ r (room): ${payload.roomName}`);
      console.log(`   ✓ d (domain_id): ${this.domainId}`);
      console.log(`   ✓ iat (issued at): ${now} (${new Date(now * 1000).toISOString()})`);
      console.log(`   ✓ exp (expira): ${exp} (${new Date(exp * 1000).toISOString()})`);
      console.log(`   ✓ Tiempo restante: ${exp - now} segundos`);

      // PASO 3: Codificar
      const headerStr = JSON.stringify(header);
      const payloadStr = JSON.stringify(tokenPayload);
      
      const encodedHeader = this.base64UrlEncode(headerStr);
      const encodedPayload = this.base64UrlEncode(payloadStr);

      console.log('\n📋 PASO 3 - Codificación Base64URL:');
      console.log(`   Header codificado: ${encodedHeader.substring(0, 30)}...`);
      console.log(`   Payload codificado: ${encodedPayload.substring(0, 30)}...`);

      // PASO 4: Crear firma
      const messageToSign = `${encodedHeader}.${encodedPayload}`;
      const signature = this.createHmacSignature(messageToSign, this.apiKey);

      console.log('\n📋 PASO 4 - Firma HMAC-SHA256:');
      console.log(`   Mensaje a firmar: ${messageToSign.substring(0, 50)}...`);
      console.log(`   Secret (API key): ${this.apiKey.substring(0, 20)}...`);
      console.log(`   Firma generada: ${signature.substring(0, 30)}...`);

      // PASO 5: Construir JWT
      const token = `${encodedHeader}.${encodedPayload}.${signature}`;

      console.log('\n📋 PASO 5 - Token JWT Final:');
      console.log(`   Token completo:\n${token}`);
      console.log(`\n   Longitud: ${token.length} caracteres`);
      console.log(`   Partes: ${token.split('.').length}`);

      console.log('\n✅ TOKEN GENERADO EXITOSAMENTE (FORMATO CORRECTO)');
      console.log('='.repeat(80) + '\n');
      
      return token;
    } catch (error: any) {
      console.error('\n' + '='.repeat(80));
      console.error('❌ ERROR GENERANDO TOKEN JWT');
      console.error('='.repeat(80));
      console.error(`Error: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
      console.error('='.repeat(80) + '\n');
      throw error;
    }
  }

  /**
   * Codificar string a base64url (URL-safe base64)
   */
  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Crear firma HMAC-SHA256
   */
  private createHmacSignature(message: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(message);
    return hmac
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Eliminar una sala
   * @param roomName - Nombre de la sala a eliminar
   */
  async deleteRoom(roomName: string): Promise<void> {
    try {
      console.log(`🗑️ Eliminando sala: ${roomName}`);

      await this.httpClient.delete(`/rooms/${roomName}`);

      console.log(`✅ Sala eliminada: ${roomName}`);
    } catch (error: any) {
      // Si ya no existe, no es error
      if (error.response?.status === 404) {
        console.log(`ℹ️ Sala ya no existe: ${roomName}`);
        return;
      }

      console.error(`❌ Error eliminando sala: ${roomName}`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtener la URL de la sala con el dominio configurado
   * @param roomName - Nombre de la sala
   * @returns URL completa de la sala
   */
  getRoomUrl(roomName: string): string {
    return `https://${this.domain}/${roomName}`;
  }

  /**
   * Decodificar y verificar un token JWT
   * Útil para debug y validación
   */
  decodeToken(token: string): any {
    try {
      console.log('\n' + '='.repeat(80));
      console.log('🔍 DECODIFICANDO TOKEN JWT - ANÁLISIS DETALLADO');
      console.log('='.repeat(80));

      const parts = token.split('.');
      
      if (parts.length !== 3) {
        console.error(`❌ Token inválido: tiene ${parts.length} partes en lugar de 3`);
        return null;
      }

      // Decodificar cada parte
      const headerStr = Buffer.from(parts[0], 'base64').toString('utf-8');
      const payloadStr = Buffer.from(parts[1], 'base64').toString('utf-8');
      const signature = parts[2];

      const header = JSON.parse(headerStr);
      const payload = JSON.parse(payloadStr);

      console.log('\n📋 HEADER:');
      console.log(JSON.stringify(header, null, 2));

      console.log('\n📦 PAYLOAD:');
      console.log(JSON.stringify(payload, null, 2));

      console.log('\n🔐 FIRMA:');
      console.log(`   ${signature.substring(0, 50)}...`);

      // Verificar firma
      console.log('\n✓ VERIFICANDO FIRMA:');
      const messageToSign = `${parts[0]}.${parts[1]}`;
      const expectedSignature = this.createHmacSignature(messageToSign, this.apiKey);
      const signatureMatch = signature === expectedSignature;

      console.log(`   Mensaje: ${messageToSign.substring(0, 50)}...`);
      console.log(`   Secret: ${this.apiKey.substring(0, 20)}...`);
      console.log(`   Firma esperada: ${expectedSignature.substring(0, 50)}...`);
      console.log(`   Firma actual:   ${signature.substring(0, 50)}...`);
      console.log(`   ✓ Coincide: ${signatureMatch ? '✅ SÍ' : '❌ NO'}`);

      // Verificar expiración
      console.log('\n⏰ VERIFICANDO EXPIRACIÓN:');
      const now = Math.floor(Date.now() / 1000);
      const expiration = payload.exp;
      const timeRemaining = expiration - now;

      console.log(`   Hora actual: ${now} (${new Date(now * 1000).toISOString()})`);
      console.log(`   Expira: ${expiration} (${new Date(expiration * 1000).toISOString()})`);
      console.log(`   Tiempo restante: ${timeRemaining} segundos`);
      console.log(`   ✓ Válido: ${timeRemaining > 0 ? '✅ SÍ' : '❌ NO (EXPIRADO)'}`);

      // Verificar issuer
      console.log('\n🆔 VERIFICANDO ISSUER:');
      console.log(`   Issuer en token: ${payload.iss.substring(0, 20)}...`);
      console.log(`   API Key: ${this.apiKey.substring(0, 20)}...`);
      console.log(`   ✓ Coincide: ${payload.iss === this.apiKey ? '✅ SÍ' : '❌ NO'}`);

      console.log('\n' + '='.repeat(80));
      console.log('✅ DECODIFICACIÓN COMPLETADA');
      console.log('='.repeat(80) + '\n');

      return {
        header,
        payload,
        signature,
        valid: {
          signatureMatch,
          notExpired: timeRemaining > 0,
          issuerMatch: payload.iss === this.apiKey
        }
      };
    } catch (error: any) {
      console.error('\n❌ ERROR DECODIFICANDO TOKEN:', error.message);
      return null;
    }
  }

  /**
   * Verificar configuración de Daily.co
   */
  async verifyConfiguration(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.error('❌ DAILY_API_KEY no configurado');
        return false;
      }

      // Intentar una llamada simple a la API
      const response = await this.httpClient.get('/rooms');
      console.log('✅ Configuración de Daily.co válida');
      return true;
    } catch (error: any) {
      console.error('❌ Error verificando configuración de Daily.co:', error.response?.data || error.message);
      return false;
    }
  }
}

// Exportar instancia singleton
export const dailyService = new DailyService();
