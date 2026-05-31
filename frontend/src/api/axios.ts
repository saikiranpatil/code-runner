import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";

import { ENDPOINTS } from "@/api/endpoints";
import type { AuthData } from "@/module/auth/auth.types";
import { getAuthState } from "@/module/auth/auth.store";
import type { RefreshResponse } from "@/module/auth/auth.dto";

interface QueueEntry {
    resolve: (value: AxiosResponse) => void;
    reject: (reason: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueEntry[] = [];

const flushQueue = (error: unknown, token: string | null = null): void => {
    for (const entry of failedQueue) {
        if (token) {
            entry.resolve(token as unknown as AxiosResponse);
        } else {
            entry.reject(error);
        }
    }
    failedQueue = [];
};

const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL as string,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getAuthState().getToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: unknown) => Promise.reject(error)
);

api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: unknown) => {
        if (!axios.isAxiosError(error) || !error.config) {
            return Promise.reject(error);
        }

        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        const status = error.response?.status;
        const requestUrl = originalRequest.url ?? "";

        if (requestUrl.includes(ENDPOINTS.AUTH.REFRESH.path)) {
            return Promise.reject(error);
        }

        if (status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise<AxiosResponse>((resolve, reject) => {
                failedQueue.push({
                    resolve: (_ignored) => {
                        const token = getAuthState().getToken();
                        if (token) originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(api(originalRequest));
                    },
                    reject,
                });
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const { data } = await api.post<RefreshResponse>(
                ENDPOINTS.AUTH.REFRESH.path
            );
            const { user, accessToken, expiresIn } = data;
            getAuthState().handleLogin(user, accessToken, expiresIn);

            flushQueue(null, accessToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
        } catch (refreshError) {
            getAuthState().handleLogout();
            flushQueue(refreshError, null);
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;