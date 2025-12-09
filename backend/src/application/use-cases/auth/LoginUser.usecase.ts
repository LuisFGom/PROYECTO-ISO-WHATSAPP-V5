import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { AuthResponseDTO } from '../../interfaces/dtos/auth.dto';
import { UserStatus } from '../../../shared/types/user.types';
import { config } from '../../../config/environment';

export class LoginUserUseCase {
  constructor(private userRepository: IUserRepository) { }

  async execute(data: { email: string; password: string }): Promise<AuthResponseDTO> {
    const user = await this.userRepository.findByEmail(data.email);

    // ❌ Antes: throw new Error('Invalid email or password')
    // ✅ Ahora: lanzar un error con nombre y status
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      const error: any = new Error('Correo o contraseña incorrectos');
      error.status = 401;
      throw error;
    }


    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      const error: any = new Error('Correo o contraseña incorrectos');
      error.status = 401;
      throw error;
    }

    // Actualizar estado a online
    await this.userRepository.updateStatus(user.id, UserStatus.ONLINE);

    // Obtener usuario actualizado
    const updatedUser = await this.userRepository.findById(user.id);
    if (!updatedUser) {
      const error: any = new Error('Error al obtener datos del usuario');
      error.status = 500;
      throw error;
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        userId: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );

    // Retornar el usuario ACTUALIZADO (con status online)
    return {
      user: updatedUser.toPublic(),
      token,
    };
  }
}
