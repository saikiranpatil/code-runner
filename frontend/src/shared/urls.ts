export const URLs = {
    home: {
        base: '/home',
    },
    auth: {
        login: '/auth/login',
        register: '/auth/register',
    },
    problems: {
        base: '/problems',
        problem: ':id',
    },
} as const;