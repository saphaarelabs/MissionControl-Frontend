import React, { useEffect, useState } from 'react';
import { AuthenticateWithRedirectCallback, useUser } from '@clerk/clerk-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resolveWorkspaceRoute } from '../lib/apiBase';

export default function SsoCallback() {
    const { isLoaded, isSignedIn, user } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(false);
    const searchParams = new URLSearchParams(location.search);
    const shouldShowCallback = searchParams.get('oauth_complete') !== '1';

    useEffect(() => {
        const checkAndRedirect = async () => {
            if (shouldShowCallback) return;
            // Wait for Clerk to fully load and sign in the user
            if (!isLoaded || !isSignedIn || !user || isChecking) return;

            setIsChecking(true);
            console.log('[SsoCallback] User signed in, checking profile status...');

            // Small delay to ensure Clerk session is fully established
            await new Promise(resolve => setTimeout(resolve, 500));

            try {
                const next = await resolveWorkspaceRoute();
                console.log('[SsoCallback] Workspace route resolution:', next);
                window.history.replaceState({}, document.title, window.location.pathname);
                navigate(next.route, { replace: true });
            } catch (err) {
                console.error('[SsoCallback] Error checking user profile:', err);
                // On error, go to onboarding to be safe
                window.history.replaceState({}, document.title, window.location.pathname);
                navigate('/onboarding', { replace: true });
            }
        };

        checkAndRedirect();
    }, [isLoaded, isSignedIn, user, navigate, isChecking, shouldShowCallback]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-8 shadow-lg">
                <div className="text-lg font-bold">Signing you in…</div>
                <div className="mt-2 text-sm text-slate-600">Please wait while we complete Google authentication.</div>
                {shouldShowCallback && (
                    <AuthenticateWithRedirectCallback
                        signInUrl="/sign-in"
                        signUpUrl="/sign-up"
                        signInForceRedirectUrl="/sso-callback?oauth_complete=1&intent=sign-in"
                        signUpForceRedirectUrl="/sso-callback?oauth_complete=1&intent=sign-up"
                        continueSignUpUrl="/sso-callback?oauth_complete=1&intent=sign-up"
                    />
                )}
            </div>
        </div>
    );
}
