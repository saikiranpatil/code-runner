export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  stack?: string;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthData {
  user: ApiUser;
  accessToken: string;
}

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  }
};

export const authApi = {
  login: {
    path: '/api/v1/auth/login/',
    method: 'POST',
  },
  register: {
    path: '/api/v1/auth/register/',
    method: 'POST',
  },
  getCurrentUser: {
    path: '/api/v1/users/me/',
    method: 'GET',
  },
} as const;