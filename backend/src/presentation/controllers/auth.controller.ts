// backend/src/presentation/controllers/auth.controller.ts
import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { RegisterUserUseCase } from '../../application/use-cases/auth/RegisterUser.usecase';
import { LoginUserUseCase } from '../../application/use-cases/auth/LoginUser.usecase';
import { LogoutUserUseCase } from '../../application/use-cases/auth/LogoutUser.usecase';
import { MySQLUserRepository } from '../../infrastructure/database/repositories/MySQLUserRepository';
import { User } from '../../domain/entities/User.entity';

const userRepository = new MySQLUserRepository();
const registerUserUseCase = new RegisterUserUseCase(userRepository);
const loginUserUseCase = new LoginUserUseCase(userRepository);

export class AuthController {

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password } = req.body;

      //console.log('📝 Datos recibidos:', { username, email, password });

      const user = await registerUserUseCase.execute({
        username,
        email,
        password,
      });

      //console.log('✅ Usuario creado:', user);
      //console.log('🔍 Tipo de user:', typeof user);
      //console.log('🔍 Es instancia de User?:', user instanceof User);

      const response = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        status: user.status,
        about: user.about,
        lastSeen: user.lastSeen,
      };

      //console.log('📤 Respuesta a enviar:', response);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: response,
      });
    } catch (error) {
      //console.error('❌ Error en register:', error);
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(400).json({
          success: false,
          message: String(error),
        });
      }
    }
  }



  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const authResponse = await loginUserUseCase.execute({ email, password });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: authResponse,
      });
    } catch (error: any) {

      const statusCode = error.status || 401;
      const message =
        error.message || 'Correo o contraseña incorrectos';

      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }


  async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
        return;
      }

      const logoutUserUseCase = new LogoutUserUseCase(userRepository);
      await logoutUserUseCase.execute(req.userId);

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();