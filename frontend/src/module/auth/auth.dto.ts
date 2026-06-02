import type { User } from '@/module/user/user.types';

// Request bodies
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

// Response payloads
export interface LoginResponse {
  user: User;
  accessToken: string;
  expiresIn: number;
}

export interface RegisterResponse {
  user: User;
  accessToken: string;
  expiresIn: number;
}

export interface RefreshResponse {
  user: User;
  accessToken: string;
  expiresIn: number;
}