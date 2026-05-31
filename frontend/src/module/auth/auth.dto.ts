import type { User } from "@/module/user/user.types";

export interface RefreshResponse {
    user: User;
    accessToken: string;
    expiresIn: number;
}

export interface LoginResponse {
    user: User;
    accessToken: string;
    expiresIn: number;
}