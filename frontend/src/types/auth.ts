/**
 * Auth-related TypeScript types and interfaces
 */

export interface RegisterFormData {
  email: string;
  password: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  created_at?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token?: string;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: any;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}
