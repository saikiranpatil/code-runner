export const ENDPOINTS = {
    home: {
        base: '/',
    },
    auth: {
        register: '/auth/register',
        login: '/auth/login',
        logout: '/auth/logout',
        refreshToken: '/auth/refresh',
    },
} as const;