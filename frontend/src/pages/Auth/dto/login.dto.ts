import type { ApiUser } from "@/types/api.types";

export interface LoginResponseDto {
    accessToken: string;
    user: ApiUser
}