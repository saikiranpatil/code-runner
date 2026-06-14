export interface User {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSuccessPayload {
  user: User;
  accessToken: string;
  expiresIn: number;
}

export interface LogoutResponse {
  message: string;
}

export interface LoginRequest {
  email: string,
  password: string,
}

export type LoginResponse = AuthSuccessPayload;

export interface RegisterRequest {
  email: string,
  name: string,
  password: string,
}

export type RegisterResponse = AuthSuccessPayload;

export type RefreshResponse = AuthSuccessPayload;