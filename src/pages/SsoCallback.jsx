import React, { useEffect, useState } from 'react';
import { AuthenticateWithRedirectCallback, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { apiAuthFetch } from '../lib/apiBase';

export default function SsoCallback() {
    const { isLoaded, isSignedIn, user } = useUser();
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        const checkAndRedirect = async () => {
            // Wait for Clerk to fully load and sign in the user
            if (!isLoaded || !isSignedIn || !user || isChecking) return;

            setIsChecking(true);
            console.log('[SsoCallback] User signed in, checking profile status...');

            // Small delay to ensure Clerk session is fully established
            await new Promise(resolve => setTimeout(resolve, 500));

            try {
                // Check if user profile exists in our database
                console.log('[SsoCallback] Fetching user profile from backend...');
                const res = await apiAuthFetch('/api/user/profile');
                
                if (res.ok) {
                    const { profile } = await res.json();
                    console.log('[SsoCallback] Profile data:', profile);
                    
                    // If no profile or profile has no operation_status, they're new -> onboarding
                    if (!profile || !profile.operation_status) {
                        console.log('[SsoCallback] New user detected (no profile or no operation_status), redirecting to /onboarding');
                        navigate('/onboarding', { replace: true });
                        return;
                    }
                    
                    // Existing user -> dashboard
                    console.log('[SsoCallback] Existing user with operation_status:', profile.operation_status, '-> redirecting to /app');
                    navigate('/app', { replace: true });
                } else {
                    // If profile fetch fails, assume new user
                    console.log('[SsoCallback] Profile fetch failed with status:', res.status, '-> assuming new user');
                    navigate('/onboarding', { replace: true });
                }
            } catch (err) {
                console.error('[SsoCallback] Error checking user profile:', err);
                // On error, go to onboarding to be safe
                navigate('/onboarding', { replace: true });
            }
        };

        checkAndRedirect();
    }, [isLoaded, isSignedIn, user, navigate, isChecking]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-8 shadow-lg">
                <div className="text-lg font-bold">Signing you in…</div>
                <div className="mt-2 text-sm text-slate-600">Please wait while we complete Google authentication.</div>
                <AuthenticateWithRedirectCallback
                    signInUrl="/sign-in"
                    signUpUrl="/sign-up"
                    afterSignInUrl="/sso-callback"
                    afterSignUpUrl="/sso-callback"
                    continueSignUpUrl="/sso-callback"
                />
            </div>
        </div>
    );
}
