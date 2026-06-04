/**
 * OAuthCallback.tsx
 *
 * The backend redirects here after a successful OAuth flow with the token
 * payload in the ?data= query param. This page posts the payload to the
 * opener window and closes itself.
 *
 * Route: /oauth/callback
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '@/components/ui/spinner';
import { URLs } from '@/common/urls';

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('data');

    if (!raw) {
      // No data — something went wrong on the backend side
      if (window.opener) {
        window.opener.postMessage(
          { type: 'oauth_callback', error: 'OAuth failed. No data received.' },
          window.location.origin,
        );
        window.close();
      } else {
        navigate(URLs.login);
      }
      return;
    }

    try {
      const payload = JSON.parse(decodeURIComponent(raw));
      if (window.opener) {
        window.opener.postMessage(
          { type: 'oauth_callback', payload },
          window.location.origin,
        );
        window.close();
      } else {
        // Fallback: not a popup — store and redirect
        navigate(URLs.home);
      }
    } catch {
      if (window.opener) {
        window.opener.postMessage(
          { type: 'oauth_callback', error: 'Failed to parse OAuth response.' },
          window.location.origin,
        );
        window.close();
      } else {
        navigate(URLs.login);
      }
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <Spinner size="md" />
    </div>
  );
}