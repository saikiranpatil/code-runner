export const ENDPOINTS = {
    AUTH: {
        LOGIN: {
            path: "/auth/login",
            method: "POST",
        },
        REGISTER: {
            path: "/auth/register",
            method: "POST",
        },
        LOGOUT: {
            path: "/auth/logout",
            method: "POST",
        },
        REFRESH: {
            path: "/auth/refresh",
            method: "POST",
        },
        PROFILE: {
            path: "/profile",
            method: "GET",
        },
        GITHUB: {
            path: "/auth/github",
            method: "GET",
        },
        GOOGLE: {
            path: "/auth/google",
            method: "GET",
        },
    },
} as const;