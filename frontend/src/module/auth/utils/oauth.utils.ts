import type { AuthProvider, OAuthResponse } from "../auth.types";

export const handleOAuthClick = (
    login: (user: any, token: string, expires: number) => void,
    provider: AuthProvider,
): Promise<OAuthResponse> => {
    return new Promise((resolve, reject) => {
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
            `${import.meta.env.VITE_API_BASE_URL}/auth/${provider}`,
            'oauth-popup',
            `width=${width},height=${height},top=${top},left=${left}`
        );

        const timer = setInterval(() => {
            if (popup?.closed) {
                clearInterval(timer);
                window.removeEventListener('message', handleMessage);
                reject(new Error('Popup closed by user'));
            }
        }, 500);

        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== import.meta.env.VITE_API_BASE_URL) return;
            if (event.data?.type !== 'OAUTH_SUCCESS') return;

            const { accessToken, expiresIn, user } = event.data.payload || {};

            if (!accessToken || !expiresIn || !user) {
                clearInterval(timer);
                window.removeEventListener('message', handleMessage);
                reject(new Error('Invalid token payload received'));
                return;
            }

            // Cleanup
            clearInterval(timer);
            window.removeEventListener('message', handleMessage);
            popup?.close();

            // Update global auth state
            login(user, accessToken, expiresIn);

            // Pass data to TanStack Query's onSuccess
            resolve(event.data.payload);
        };

        window.addEventListener('message', handleMessage);
    });
};