export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSuccessPayload {
  accessToken: string;
  user: UserProfile;
}

export interface RegisterRequest {
  email: string;
  name?: string;
  password?: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LogoutResponse {
  message: string;
}