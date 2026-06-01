import type { User } from "@/module/user/user.types";

export interface AuthData {
    user: User;
    accessToken: string;
};

export interface JwtPayload {
    sub: number;
    exp: number;
    iat: number;
}

export type AuthProvider = 'github' | 'google';

export interface OAuthResponse {
    accessToken: string;
    expiresIn: number;
    user: User;
}