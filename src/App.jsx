import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { AnimatePresence, motion } from 'framer-motion';
import { BroadcastProvider } from './contexts/BroadcastContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Broadcast from './pages/Broadcast';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import SignInPage from './pages/SignIn';
import SignUpPage from './pages/SignUp';
import SsoCallback from './pages/SsoCallback';
import OAuthCallback from './pages/OAuthCallback';
import Onboarding from './pages/Onboarding';
import Provisioning from './pages/Provisioning';
import './index.css';

const PageWrapper = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="h-full w-full"
    >
        {children}
    </motion.div>
);

function AppRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* Public Routes */}
                <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />

                {/* Clerk Auth Routes */}
                <Route path="/sign-in/*" element={<PageWrapper><SignInPage /></PageWrapper>} />
                <Route path="/sign-up/*" element={<PageWrapper><SignUpPage /></PageWrapper>} />
                <Route path="/sso-callback" element={<PageWrapper><SsoCallback /></PageWrapper>} />
                <Route path="/oauth/callback" element={<PageWrapper><OAuthCallback /></PageWrapper>} />
                <Route path="/onboarding" element={<PageWrapper><Onboarding /></PageWrapper>} />
                <Route path="/provisioning" element={<PageWrapper><Provisioning /></PageWrapper>} />

                {/* Protected Routes */}
                <Route
                    path="/app"
                    element={
                        <>
                            <SignedIn>
                                <BroadcastProvider>
                                    <Layout />
                                </BroadcastProvider>
                            </SignedIn>
                            <SignedOut>
                                <RedirectToSignIn />
                            </SignedOut>
                        </>
                    }
                >
                    <Route index element={<PageWrapper><Home /></PageWrapper>} />
                    <Route path="chat" element={<PageWrapper><Chat /></PageWrapper>} />
                    <Route path="groupchat" element={<PageWrapper><Broadcast /></PageWrapper>} />
                    <Route path="settings" element={<PageWrapper><Settings /></PageWrapper>} />
                </Route>

                {/* Catch all - redirect to landing */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}

export default App;
