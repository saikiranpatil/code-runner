import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { getToken, setToken, removeToken } from "@/utils/token";
import type { ApiResponse, AuthData } from "@/types/api.types";
import { ENDPOINTS } from "@/api/endpoints";

const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL as string,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: unknown) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null): void => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else if (token) {
            promise.resolve(token);
        }
    });
    failedQueue = [];
};

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
            return new Promise((resolve, reject) => {
                failedQueue.push({
                    resolve: (token: string) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(api(originalRequest));
                    },
                    reject,
                });
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const response = await api.post<ApiResponse<AuthData>>(
                ENDPOINTS.AUTH.REFRESH.path
            );
            const newToken = response.data.data.accessToken;
            setToken(newToken);
            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            removeToken();
            window.dispatchEvent(new Event("auth:logout"));
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;