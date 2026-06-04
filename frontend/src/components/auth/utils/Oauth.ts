import type { User } from "@/types/auth/auth";

export type AuthProvider = 'github' | 'google';

export interface OAuthResponse {
    accessToken: string;
    expiresIn: number;
    user: User;
}

export const handleOAuthClick = (
    login: (user: any, token: string, expiresIn: number) => void,
    provider: AuthProvider,
): Promise<OAuthResponse> => {
    return new Promise((resolve, reject) => {
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
            `${import.meta.env.VITE_API_BASE_URL}/auth/${provider}`,
            `${provider}-oauth`,
            `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`,
        );

        if (!popup) {
            return reject(new Error('Popup was blocked. Please allow popups for this site.'));
        }

        const handleMessage = (event: MessageEvent) => {
            //  Origin check: only accept messages from our own domain
            if (event.origin !== window.location.origin) return;

            // Only handle oauth messages (ignore unrelated postMessages)
            if (!event.data || event.data.type !== 'oauth_callback') return;

            cleanup();

            if (event.data.error) {
                reject(new Error(event.data.error));
                return;
            }

            const payload = event.data.payload as OAuthResponse;
            login(payload.user, payload.accessToken, payload.expiresIn);
            resolve(payload);
        };

        // Clean up if user closes the popup manually
        const pollClosed = setInterval(() => {
            if (popup.closed) {
                cleanup();
                reject(new Error('OAuth popup was closed before completing sign-in.'));
            }
        }, 500);

        const cleanup = () => {
            window.removeEventListener('message', handleMessage);
            clearInterval(pollClosed);
        };

        window.addEventListener('message', handleMessage);
    });
};