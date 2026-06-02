import type { User } from '@/module/user/user.types';
import authApi from '@/types/auth/authApi';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  _refreshTimer: ReturnType<typeof setTimeout> | null;

  init: () => Promise<void>;
  handleLogin: (user: User, token: string, expiresIn: number) => void;
  handleLogout: () => void;
  getUser: () => User | null;
  getToken: () => string | null;
  getIsAuthenticated: () => boolean;
  getStatus: () => AuthStatus;
}

const REFRESH_BUFFER_MS = 60_000;

const doRefresh = async () => {
  try {
    // Lazy import to avoid circular dependency with axios
    const { default: api } = await import('@/api/axios');
    const res = await api.post(authApi.auth.refresh.path);
    const { user, accessToken, expiresIn } = res.data;
    useAuthStore.getState().handleLogin(user, accessToken, expiresIn);
  } catch {
    useAuthStore.getState().handleLogout();
  }
};

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      user: null,
      token: null,
      status: 'idle',
      isAuthenticated: false,
      _refreshTimer: null,

      async init() {
        set({ status: 'loading' });
        try {
          const { default: api } = await import('@/api/axios');
          const res = await api.post(authApi.auth.refresh.path);
          const { user, accessToken, expiresIn } = res.data;
          get().handleLogin(user, accessToken, expiresIn);
        } catch {
          set({ status: 'unauthenticated', user: null, token: null, isAuthenticated: false });
        }
      },

      handleLogin(user, token, expiresIn) {
        const existing = get()._refreshTimer;
        if (existing) clearTimeout(existing);

        const delay = Math.max(expiresIn - REFRESH_BUFFER_MS, 0);
        const timer = setTimeout(doRefresh, delay);

        set({
          user,
          token,
          status: 'authenticated',
          isAuthenticated: true,
          _refreshTimer: timer,
        });
      },

      handleLogout() {
        const timer = get()._refreshTimer;
        if (timer) clearTimeout(timer);
        set({
          user: null,
          token: null,
          status: 'unauthenticated',
          isAuthenticated: false,
          _refreshTimer: null,
        });
      },

      getUser: () => get().user,
      getToken: () => get().token,
      getIsAuthenticated: () => get().isAuthenticated,
      getStatus: () => get().status,
    }),
    { name: 'auth-store' },
  ),
);

export const selectUser = (s: AuthState) => s.user;
export const selectIsAuthenticated = (s: AuthState) => s.isAuthenticated;
export const selectAuthStatus = (s: AuthState) => s.status;
export const selectToken = (s: AuthState) => s.token;

export const getAuthState = () => useAuthStore.getState();