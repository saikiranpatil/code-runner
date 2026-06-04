import { Type } from "@/utils/request/types";
import type {
    AuthSuccessPayload,
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    RegisterRequest,
    RegisterResponse,
    User
} from "./auth";

export default {
    auth: {
        login: {
            path: "/auth/login",
            method: 'POST',
            noAuth: true,
            TBody: Type<LoginRequest>(),
            TRes: Type<LoginResponse>(),
        },
        register: {
            path: "/auth/register",
            method: 'POST',
            noAuth: true,
            TBody: Type<RegisterRequest>(),
            TRes: Type<RegisterResponse>(),
        },
        logout: {
            path: "/auth/logout",
            method: 'POST',
            TRes: Type<LogoutResponse>(),
        },
        refresh: {
            path: "/auth/refresh",
            method: 'POST',
            noAuth: true,
            TRes: Type<AuthSuccessPayload>(),
        },
        profile: {
            path: "/profile",
            method: 'GET',
            TRes: Type<User>(),
        },
        github: {
            path: "/auth/github",
            method: 'GET',
            noAuth: true,
        },
        google: {
            path: "/auth/google",
            method: 'GET',
            noAuth: true,
        },
    },
} as const;