// frontend/src/application/use-cases/auth/RegisterUseCase.ts
import { apiClient } from '../../../infrastructure/api/apiClient';
import type { RegisterFormData } from '../../../shared/types/auth.types';

export class RegisterUseCase {
  async execute(data: RegisterFormData): Promise<void> {
    try {
      // Validar que las contraseñas coincidan
      if (data.password !== data.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      await apiClient.post('/auth/register', {
        username: data.username,
        email: data.email,
        password: data.password,
      });

      // Si llega aquí, el registro fue exitoso
      // No necesitamos retornar nada
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Error al registrarse');
    }
  }
}

export const registerUseCase = new RegisterUseCase();