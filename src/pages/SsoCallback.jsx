import React, { useEffect, useState } from 'react';
import { AuthenticateWithRedirectCallback, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { apiAuthFetch } from '../lib/apiBase';

export default function SsoCallback() {
    const { isLoaded, isSignedIn, user } = useUser();
    const navigate = useNavigate();
    const [authComplete, setAuthComplete] = useState(false);

    useEffect(() => {
        const checkAndRedirect = async () => {
            if (!authComplete || !isLoaded || !isSignedIn || !user) return;

            try {
                // Check if user profile exists in our database
                const res = await apiAuthFetch('/api/user/profile');
                if (res.ok) {
                    const { profile } = await res.json();
                    
                    // If no profile or profile has no operation_status, they're new -> onboarding
                    if (!profile || !profile.operation_status) {
                        console.log('New user detected, redirecting to onboarding');
                        navigate('/onboarding', { replace: true });
                        return;
                    }
                    
                    // Existing user -> dashboard
                    console.log('Existing user, redirecting to app');
                    navigate('/app', { replace: true });
                } else {
                    // If profile fetch fails, assume new user
                    console.log('Profile fetch failed, assuming new user');
                    navigate('/onboarding', { replace: true });
                }
            } catch (err) {
                console.error('Error checking user profile:', err);
                // On error, go to onboarding to be safe
                navigate('/onboarding', { replace: true });
            }
        };

        checkAndRedirect();
    }, [authComplete, isLoaded, isSignedIn, user, navigate]);

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
                    signInFallbackRedirectUrl="/sso-callback"
                    signUpFallbackRedirectUrl="/sso-callback"
                />
                {/* Hidden component to trigger our custom redirect logic */}
                {isSignedIn && !authComplete && setTimeout(() => setAuthComplete(true), 500) && null}
            </div>
        </div>
    );
}
