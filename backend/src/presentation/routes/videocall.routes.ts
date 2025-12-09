// backend/src/presentation/routes/videocall.routes.ts - RUTAS VIDEOLLAMADAS
import { Router } from 'express';
import { videoCallController } from '../controllers/videocall.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * GET /api/videocalls/room/:roomName
 * Crear o obtener una sala de videollamada
 * NO requiere autenticación para desarrollo
 */
router.get(
  '/room/:roomName',
  (req, res) => videoCallController.getOrCreateRoom(req as any, res)
);

/**
 * GET /api/videocalls/verify/:roomName
 * Verificar si una sala existe
 */
router.get(
  '/verify/:roomName',
  (req, res) => videoCallController.verifyRoom(req as any, res)
);

/**
 * GET /api/videocalls/url/:roomName
 * Obtener URL de una sala
 */
router.get(
  '/url/:roomName',
  (req, res) => videoCallController.getRoomUrl(req as any, res)
);

/**
 * GET /api/videocalls/token/:roomName
 * Generar token JWT para acceder a una sala
 * Este es el nuevo endpoint que genera tokens firmados
 */
router.get(
  '/token/:roomName',
  (req, res) => videoCallController.generateToken(req as any, res)
);

/**
 * DELETE /api/videocalls/room/:roomName
 * Eliminar una sala (después de finalizar la llamada)
 * Requiere autenticación
 */
router.delete(
  '/room/:roomName',
  authMiddleware,
  (req, res) => videoCallController.deleteRoom(req as any, res)
);

/**
 * GET /api/videocalls/config/status
 * Verificar configuración de Daily.co
 */
router.get(
  '/config/status',
  (req, res) => videoCallController.checkConfiguration(req, res)
);

/**
 * POST /api/videocalls/debug/token
 * ENDPOINT DE DEBUG: Decodificar y analizar un token JWT
 * Útil para diagnosticar problemas con tokens inválidos
 */
router.post(
  '/debug/token',
  (req, res) => videoCallController.debugToken(req as any, res)
);

export default router;
