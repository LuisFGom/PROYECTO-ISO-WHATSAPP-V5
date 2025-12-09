// backend/src/presentation/routes/auth.routes.ts
import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { registerValidator, loginValidator } from '../validators/auth.validator';
import { validationMiddleware } from '../middlewares/validation.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  registerValidator,
  validationMiddleware,
  authController.register.bind(authController)
);

// POST /api/auth/login
router.post(
  '/login',
  loginValidator,
  validationMiddleware,
  authController.login.bind(authController)
);

// POST /api/auth/logout
router.post(
  '/logout',
  authMiddleware,
  authController.logout.bind(authController)
);

export default router;