export const URLs = {
  home: '/',
  auth: {
    login: '/login',
    register: '/register',
  },
  problems: {
    list: '/problems',
    details: '/problems'
  },
  oauthCallback: '/oauth/callback',
  notFound: '*',
} as const;

export type AppUrl = (typeof URLs)[keyof typeof URLs];