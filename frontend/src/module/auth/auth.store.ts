import { ENDPOINTS } from "@/api/endpoints";
import type { User } from "@/module/user/user.types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { RefreshResponse } from "@/module/auth/auth.dto";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
    user: User | null;
    token: string | null;
    status: AuthStatus;
    isAuthenticated: boolean;

    init: () => Promise<void>;
    handleLogin: (user: User, token: string, expiresIn: number) => void;
    handleLogout: () => void;
    getUser: () => User | null;
    getToken: () => string | null;
    getIsAuthenticated: () => boolean;
    getStatus: () => AuthStatus;
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export const scheduleTokenRefresh = (
    expiresIn: number,
    doRefresh: () => Promise<void>,
): void => {
    if (refreshTimer) clearTimeout(refreshTimer);

    const delay = Math.max(expiresIn - 60_000, 0);

    refreshTimer = setTimeout(async () => {
        try {
            await doRefresh();
        } catch {
            // Interceptor in api.ts handles calling handleLogout on failure
        }
    }, delay);
};

export const cancelTokenRefresh = (): void => {
    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
    }
};

export const useAuthStore = create<AuthState>()(
    devtools(
        (set, get) => ({
            user: null,
            token: null,
            status: "idle",
            isAuthenticated: false,

            async init() {
                set({ status: "loading" });
                try {
                    // Dynamic import keeps api.ts out of this module's
                    // static dependency graph, preventing a circular ref.
                    const { default: api } = await import("@/api/axios");
                    const { data } = await api.post<RefreshResponse>(
                        ENDPOINTS.AUTH.REFRESH.path,
                    );

                    set({
                        user: data.user,
                        token: data.accessToken,
                        isAuthenticated: true,
                        status: "authenticated",
                    });

                    scheduleTokenRefresh(data.expiresIn, () =>
                        api.post(ENDPOINTS.AUTH.REFRESH.path),
                    );
                } catch {
                    set({ status: "unauthenticated" });
                }
            },

            handleLogin(user, token, expiresIn) {
                set({ user, token, isAuthenticated: true, status: "authenticated" });

                import("@/api/axios").then(({ default: api }) => {
                    scheduleTokenRefresh(expiresIn, () =>
                        api.post(ENDPOINTS.AUTH.REFRESH.path),
                    );
                });
            },

            handleLogout() {
                cancelTokenRefresh();
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    status: "unauthenticated",
                });
            },

            getToken: () => get().token,
            getUser: () => get().user,
            getStatus: () => get().status,
            getIsAuthenticated: () => get().isAuthenticated,
        }),
        { name: "AuthStore" },
    ),
);

export const selectUser = (s: AuthState) => s.user;
export const selectIsAuthenticated = (s: AuthState) => s.isAuthenticated;
export const selectAuthStatus = (s: AuthState) => s.status;
export const selectToken = (s: AuthState) => s.token;

export const getAuthState = () => useAuthStore.getState();