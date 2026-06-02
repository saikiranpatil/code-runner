export const URLs = {
  home: '/',
  login: '/login',
  register: '/register',
  problems: '/problems',
  oauthCallback: '/oauth/callback',
  notFound: '*',
} as const;

export type AppUrl = (typeof URLs)[keyof typeof URLs];