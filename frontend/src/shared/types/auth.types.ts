// frontend/src/shared/types/auth.types.ts

export interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  status: 'online' | 'offline' | 'away';
  about: string;
  lastSeen: Date | null;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface AuthError {
  success: false;
  message: string;
  errors?: Array<{ msg: string; param: string }>;
}

