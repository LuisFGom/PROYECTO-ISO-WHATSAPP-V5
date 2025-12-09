// frontend/src/application/use-cases/auth/LoginUseCase.ts
import { apiClient } from '../../../infrastructure/api/apiClient';
import type { LoginFormData, AuthResponse } from '../../../shared/types/auth.types';

export class LoginUseCase {
  async execute(data: LoginFormData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email: data.email.trim(),
        password: data.password,
      });

      return response.data;
    } catch (error: any) {
      // ✅ En lugar de lanzar un Error (que puede romper React y forzar reload),
      // devolvemos un objeto con estado de error controlado
      console.error('🚨 Error en LoginUseCase:', error);

      const message =
        error?.response?.data?.message ||
        (error?.message === 'Network Error'
          ? 'No se puede conectar con el servidor'
          : 'Error al iniciar sesión');

      return Promise.reject({ type: 'LOGIN_ERROR', message });
    }
  }
}

export const loginUseCase = new LoginUseCase();
