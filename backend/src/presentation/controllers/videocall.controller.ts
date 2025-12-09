// backend/src/presentation/controllers/videocall.controller.ts - CONTROLADOR DE VIDEOLLAMADAS
import { Request, Response } from 'express';
import { dailyService } from '../../infrastructure/services/daily.service';

export interface AuthRequest extends Request {
  userId?: number;
}

export class VideoCallController {
  /**
   * Crear o obtener una sala de videollamada
   * GET /api/videocalls/room/:roomName
   */
  async getOrCreateRoom(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { roomName } = req.params;
      const userId = req.userId;

      console.log(`\n${'='.repeat(60)}`);
      console.log(`🎬 SOLICITUD DE VIDEOLLAMADA`);
      console.log(`${'='.repeat(60)}`);
      console.log(`📍 Room Name: ${roomName}`);
      console.log(`🔐 Usuario ID: ${userId || 'ANÓNIMO'}`);
      console.log(`🔑 API Key configurado: ${process.env.DAILY_API_KEY ? 'SÍ' : 'NO'}`);
      console.log(`🌐 Dominio: ${process.env.DAILY_DOMAIN}`);

      if (!roomName) {
        console.error(`❌ roomName es requerido`);
        res.status(400).json({ 
          error: 'roomName es requerido' 
        });
        return;
      }

      // Crear o obtener la sala
      console.log(`🔄 Llamando a dailyService.getOrCreateRoom()...`);
      const roomUrl = await dailyService.getOrCreateRoom(roomName);

      console.log(`✅ ÉXITO: Sala disponible`);
      console.log(`📍 URL: ${roomUrl}`);
      console.log(`${'='.repeat(60)}\n`);

      res.json({
        success: true,
        roomName,
        roomUrl,
        domain: process.env.DAILY_DOMAIN || 'whatsappp.daily.co',
      });
    } catch (error: any) {
      console.error(`\n${'='.repeat(60)}`);
      console.error(`❌ ERROR EN VIDEOCALL CONTROLLER`);
      console.error(`${'='.repeat(60)}`);
      console.error(`❌ Error name: ${error.name}`);
      console.error(`❌ Error message: ${error.message}`);
      console.error(`❌ Error stack: ${error.stack}`);
      console.error(`${'='.repeat(60)}\n`);

      res.status(500).json({
        error: error.message || 'Error al obtener la sala de videollamada',
      });
    }
  }

  /**
   * Verificar si una sala existe
   * GET /api/videocalls/verify/:roomName
   */
  async verifyRoom(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { roomName } = req.params;

      if (!roomName) {
        res.status(400).json({ 
          error: 'roomName es requerido' 
        });
        return;
      }

      const roomData = await dailyService.getRoom(roomName);

      if (roomData) {
        console.log(`✅ Sala verificada: ${roomName}`);
        res.json({
          success: true,
          exists: true,
          roomData,
        });
      } else {
        console.log(`ℹ️ Sala no existe: ${roomName}`);
        res.json({
          success: true,
          exists: false,
        });
      }
    } catch (error: any) {
      console.error('❌ Error en verifyRoom:', error);

      res.status(500).json({
        error: error.message || 'Error al verificar la sala',
      });
    }
  }

  /**
   * Obtener URL de una sala
   * GET /api/videocalls/url/:roomName
   */
  async getRoomUrl(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { roomName } = req.params;

      if (!roomName) {
        res.status(400).json({ 
          error: 'roomName es requerido' 
        });
        return;
      }

      const roomUrl = dailyService.getRoomUrl(roomName);

      res.json({
        success: true,
        roomName,
        roomUrl,
      });
    } catch (error: any) {
      console.error('❌ Error en getRoomUrl:', error);

      res.status(500).json({
        error: error.message || 'Error al obtener URL de sala',
      });
    }
  }

  /**
   * Eliminar una sala
   * DELETE /api/videocalls/room/:roomName
   */
  async deleteRoom(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { roomName } = req.params;
      const userId = req.userId;

      if (!roomName) {
        res.status(400).json({ 
          error: 'roomName es requerido' 
        });
        return;
      }

      if (!userId) {
        res.status(401).json({ 
          error: 'No autenticado' 
        });
        return;
      }

      console.log(`🗑️ Usuario ${userId} eliminando sala: ${roomName}`);

      await dailyService.deleteRoom(roomName);

      console.log(`✅ Sala eliminada: ${roomName}`);

      res.json({
        success: true,
        message: `Sala ${roomName} eliminada`,
      });
    } catch (error: any) {
      console.error('❌ Error en deleteRoom:', error);

      res.status(500).json({
        error: error.message || 'Error al eliminar la sala',
      });
    }
  }

  /**
   * Generar un token JWT para acceder a una sala
   * GET /api/videocalls/token/:roomName
   */
  async generateToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { roomName } = req.params;
      const userId = req.userId;
      const { userName } = req.query;

      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔐 GENERANDO TOKEN PARA SALA`);
      console.log(`${'='.repeat(60)}`);
      console.log(`📍 Room Name: ${roomName}`);
      console.log(`👤 User ID: ${userId || 'ANÓNIMO'}`);
      console.log(`📝 User Name: ${userName || 'Usuario'}`);

      if (!roomName) {
        console.error(`❌ roomName es requerido`);
        res.status(400).json({ 
          error: 'roomName es requerido' 
        });
        return;
      }

      // Primero crear la sala si no existe
      console.log(`🔄 Asegurando que la sala existe...`);
      const roomUrl = await dailyService.getOrCreateRoom(roomName);
      console.log(`✅ Sala lista: ${roomUrl}`);

      // Generar token JWT firmado
      console.log(`🔐 Generando token JWT...`);
      const token = await dailyService.generateToken({
        roomName,
        userName: (userName as string) || 'Usuario',
        userID: userId?.toString() || 'anonymous',
        isOwner: false,
      });

      console.log(`✅ ÉXITO: Token generado`);
      console.log(`${'='.repeat(60)}\n`);

      res.json({
        success: true,
        token,
        roomName,
        roomUrl,
        domain: process.env.DAILY_DOMAIN || 'whatsappp.daily.co',
      });
    } catch (error: any) {
      console.error(`\n${'='.repeat(60)}`);
      console.error(`❌ ERROR GENERANDO TOKEN`);
      console.error(`${'='.repeat(60)}`);
      console.error(`❌ Error:`, error.message);
      console.error(`${'='.repeat(60)}\n`);

      res.status(500).json({
        error: error.message || 'Error al generar token de acceso',
      });
    }
  }

  /**
   * Verificar configuración de Daily.co
   * GET /api/videocalls/config/status
   */
  async checkConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const isValid = await dailyService.verifyConfiguration();

      if (isValid) {
        res.json({
          success: true,
          configured: true,
          domain: process.env.DAILY_DOMAIN || 'whatsappp.daily.co',
          message: '✅ Daily.co configurado correctamente',
        });
      } else {
        res.status(400).json({
          success: false,
          configured: false,
          message: '❌ Daily.co no está configurado correctamente',
        });
      }
    } catch (error: any) {
      console.error('❌ Error en checkConfiguration:', error);

      res.status(500).json({
        error: error.message || 'Error al verificar configuración',
      });
    }
  }

  /**
   * ENDPOINT DE DEBUG: Decodificar y analizar un token JWT
   * GET /api/videocalls/debug/token
   * Body: { token: "..." }
   */
  async debugToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          error: 'Token es requerido en el body'
        });
        return;
      }

      console.log(`\n${'='.repeat(80)}`);
      console.log(`🐛 DEBUG ENDPOINT - ANALIZANDO TOKEN`);
      console.log(`${'='.repeat(80)}`);

      const decoded = dailyService.decodeToken(token);

      if (decoded) {
        res.json({
          success: true,
          decoded: decoded,
          token: token.substring(0, 50) + '...',
          fullLength: token.length
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Token inválido o no pudo decodificarse'
        });
      }
    } catch (error: any) {
      console.error('❌ Error en debugToken:', error);

      res.status(500).json({
        error: error.message || 'Error al analizar token',
      });
    }
  }
}

export const videoCallController = new VideoCallController();
