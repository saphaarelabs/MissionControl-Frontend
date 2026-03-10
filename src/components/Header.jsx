import React, { useState, useEffect } from 'react';

import { UserButton, useClerk } from "@clerk/clerk-react";
import { apiAuthFetch } from '../lib/apiBase';
import { Menu, X, PanelLeft, Plus, Home, MessageSquare, Settings as SettingsIcon, User as UserIcon } from 'lucide-react';
import CreateAgentModal from './CreateAgentModal';

const Header = ({ isSidebarOpen, toggleSidebar }) => {
    const { openUserProfile } = useClerk();

    const [gatewayStatus, setGatewayStatus] = useState('offline');
    const [agentCount, setAgentCount] = useState(0);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isSpawnOpen, setIsSpawnOpen] = useState(false);

    useEffect(() => {
        fetchGatewayStatus();
        fetchAgentCount();

        const healthInterval = setInterval(fetchGatewayStatus, 5000);
        const agentInterval = setInterval(fetchAgentCount, 60_000);
        return () => {
            clearInterval(healthInterval);
            clearInterval(agentInterval);
        };
    }, []);

    const fetchGatewayStatus = async () => {
        try {
            const response = await apiAuthFetch('/api/health');
            const data = await response.json().catch(() => null);
            setGatewayStatus(data?.status === 'online' ? 'online' : 'offline');
        } catch {
            setGatewayStatus('offline');
        }
    };

    const fetchAgentCount = async () => {
        try {
            const response = await apiAuthFetch(`/api/subagents?t=${Date.now()}`);
            if (!response.ok) return;
            const data = await response.json().catch(() => null);
            const count = Array.isArray(data?.subagents) ? data.subagents.length : 0;
            setAgentCount(count);
        } catch {
            // ignore
        }
    };

    return (
        <header className="sticky top-0 z-50 shrink-0 bg-white border-b border-slate-200 text-slate-900 shadow-sm">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-4">
                        <h1 className="min-w-0 text-base font-bold tracking-widest text-blue-600 sm:text-lg uppercase">
                            Magic Teams
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">


                        <button
                            type="button"
                            onClick={() => setIsSpawnOpen(true)}
                            className="hidden lg:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-extrabold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 uppercase tracking-wider"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Create Agents
                        </button>

                        <div className="hidden rounded-lg bg-blue-600 px-3 py-1.5 sm:block">
                            <span className="text-[11px] font-extrabold tabular-nums text-white uppercase tracking-wider">
                                {agentCount} Agent{agentCount !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:hidden"
                            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
                            onClick={() => setMobileOpen((v) => !v)}
                        >
                            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
                        </button>

                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    footer: "hidden",
                                    rootBox: "flex items-center"
                                }
                            }}
                        >
                            <UserButton.MenuItems>
                                <UserButton.Link
                                    label="Home"
                                    labelIcon={<Home className="w-4 h-4" />}
                                    href="/app"
                                />
                                <UserButton.Link
                                    label="Group chat"
                                    labelIcon={<MessageSquare className="w-4 h-4" />}
                                    href="/app/groupchat"
                                />
                                <UserButton.Link
                                    label="Settings"
                                    labelIcon={<SettingsIcon className="w-4 h-4" />}
                                    href="/app/settings"
                                />
                                <UserButton.Action label="manageAccount" />
                                <UserButton.Action label="signOut" />
                            </UserButton.MenuItems>
                        </UserButton>
                    </div>
                </div>

                {mobileOpen && (
                    <div className="border-t border-slate-100 py-4 sm:hidden">
                        <div className="mb-3 flex flex-col gap-3 rounded-lg bg-slate-50 px-3 py-3 border border-slate-100" aria-live="polite">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold tabular-nums text-blue-600">
                                    {agentCount} {agentCount === 1 ? 'Agent' : 'Agents'}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setMobileOpen(false);
                                    setIsSpawnOpen(true);
                                }}
                                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                Create Agents
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <CreateAgentModal
                isOpen={isSpawnOpen}
                onClose={() => setIsSpawnOpen(false)}
                onCreated={() => {
                    setIsSpawnOpen(false);
                    fetchAgentCount();
                    window.dispatchEvent(new Event('agentCreated'));
                }}
            />
        </header>
    );
};

export default Header;
