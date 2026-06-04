export const tokenSecondsRemaining = (expiresAt: number | null): number => {
  if (!expiresAt) return 0;
  return Math.floor((expiresAt - Date.now()) / 1000);
};

export const isTokenExpiringSoon = (
  expiresAt: number | null,
  bufferSeconds = 60
): boolean => tokenSecondsRemaining(expiresAt) < bufferSeconds;