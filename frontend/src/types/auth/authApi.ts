import { Type, HttpMethod } from "@/utils/request/types";
import type { AuthSuccessPayload, LoginRequest, LogoutResponse, RegisterRequest, UserProfile } from "./auth";

export default {
    auth: {
        login: {
            path: "/auth/login",
            method: HttpMethod.POST,
            noAuth: true,
            TBody: Type<LoginRequest>(),
            TRes: Type<AuthSuccessPayload>(),
        },
        register: {
            path: "/auth/register",
            method: HttpMethod.POST,
            noAuth: true,
            TBody: Type<RegisterRequest>(),
            TRes: Type<AuthSuccessPayload>(),
        },
        logout: {
            path: "/auth/logout",
            method: HttpMethod.POST,
            TRes: Type<LogoutResponse>(),
        },
        refresh: {
            path: "/auth/refresh",
            method: HttpMethod.POST,
            noAuth: true,
            TRes: Type<AuthSuccessPayload>(),
        },
        profile: {
            path: "/profile",
            method: HttpMethod.GET,
            TRes: Type<UserProfile>(),
        },
        github: {
            path: "/auth/github",
            method: HttpMethod.GET,
            noAuth: true,
        },
        google: {
            path: "/auth/google",
            method: HttpMethod.GET,
            noAuth: true,
        },
    },
} as const;