import axios from 'axios';
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import type { ApiResponse } from '@/api/types';
import { getAuthState } from '@/store/auth.store';
import authApi from '@/types/auth/authApi';
import type { RefreshResponse } from '@/types/auth/auth';

// Queue for requests that arrive while a token refresh is in flight
interface QueueEntry {
  resolve: (value: AxiosResponse) => void;
  reject: (reason: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueEntry[] = [];

const flushQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token as any);
  });
  failedQueue = [];
};

// Axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  withCredentials: true, // send httpOnly refresh cookie
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach access token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: unwrap envelope + handle 401 refresh
api.interceptors.response.use(
  // Unwrap the { success, message, data } envelope transparently.
  // Callers receive `response.data` as the inner `data` field.
  (response: AxiosResponse<ApiResponse>) => {
    if (response.data && 'data' in response.data) {
      response.data = response.data.data as any;
    }
    return response;
  },

  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401, and only once per request
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh if the failing request IS the refresh call
    if (originalRequest.url?.includes(authApi.refresh.path)) {
      getAuthState().handleLogout();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If already refreshing, queue this request until the token arrives
    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const { data } = await api.post<ApiResponse<RefreshResponse>>(authApi.refresh.path, {}, { silent: true } as any);

      // data is already unwrapped by the response interceptor above,
      // but this call may run before the interceptor on the inner axios call.
      const payload = (data as any).data ?? data;
      const { accessToken, user, expiresIn } = payload as RefreshResponse;

      getAuthState().handleLogin(user, accessToken, expiresIn);
      flushQueue(null, accessToken);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      getAuthState().handleLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;