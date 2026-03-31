import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    Bot,
    CheckCircle2,
    KeyRound,
    LogOut,
    MessageSquare,
    ShieldCheck,
    Sparkles,
    User as UserIcon,
    Zap,
} from 'lucide-react';
import { apiAuthFetch, resolveWorkspaceRoute } from '../lib/apiBase';
import WorkspaceLoadingScreen from '../components/WorkspaceLoadingScreen';

const STEPS = [
    {
        id: 'identity',
        title: 'Workspace profile',
        description: 'Set the identity that appears across your control plane and agent workspace.',
    },
    {
        id: 'model-access',
        title: 'Model access',
        description: 'Choose whether to start with the managed default stack or add your own provider credentials.',
    },
    {
        id: 'channels',
        title: 'Channels',
        description: 'Choose the communication surfaces you expect to wire in first.',
    },
    {
        id: 'review',
        title: 'Review and launch',
        description: 'Confirm the deployment details before we provision your dedicated instance.',
    },
];

const PROVIDERS = [
    {
        id: 'anthropic',
        label: 'Anthropic',
        note: 'Claude models with API-key auth',
        keyPlaceholder: 'sk-ant-...',
        modelPlaceholder: 'claude-sonnet-4-5',
    },
    {
        id: 'openai',
        label: 'OpenAI',
        note: 'GPT models with API-key auth',
        keyPlaceholder: 'sk-...',
        modelPlaceholder: 'gpt-4o',
    },
    {
        id: 'google',
        label: 'Google',
        note: 'Gemini models with API-key auth',
        keyPlaceholder: 'AIza...',
        modelPlaceholder: 'gemini-2.5-pro',
    },
    {
        id: 'deepseek',
        label: 'DeepSeek',
        note: 'DeepSeek models with API-key auth',
        keyPlaceholder: 'sk-...',
        modelPlaceholder: 'deepseek-chat',
    },
];

const CHANNELS = [
    {
        id: 'whatsapp',
        title: 'WhatsApp',
        description: 'Prepare the workspace for WhatsApp handoff and credential setup after launch.',
        accent: 'from-emerald-500/20 to-emerald-100',
    },
    {
        id: 'telegram',
        title: 'Telegram',
        description: 'Pre-stage the workspace for Telegram bot configuration from Settings.',
        accent: 'from-sky-500/20 to-sky-100',
    },
];

function deriveUsername(user) {
    if (user?.username) return user.username;
    const email = user?.emailAddresses?.[0]?.emailAddress || '';
    return email ? email.split('@')[0] : '';
}

function normalizeUsername(value) {
    return value.trim().replace(/^@+/, '').replace(/\s+/g, '-');
}

function validationForStep(stepIndex, formData) {
    const errors = {};

    if (stepIndex === 0) {
        if (!formData.fullName.trim()) errors.fullName = 'Enter the name you want displayed in Mission Control.';
        if (!normalizeUsername(formData.username)) errors.username = 'Choose a username to identify this workspace.';
    }

    if (stepIndex === 1 && formData.llmType === 'custom') {
        if (!formData.provider) errors.provider = 'Choose the provider you want to authorize.';
        if (!formData.apiKey.trim()) errors.apiKey = 'Add the provider API key so we can store access during provisioning.';
    }

    return errors;
}

function stepSummary(formData) {
    if (formData.llmType === 'default') {
        return 'Managed default stack';
    }

    const provider = PROVIDERS.find((item) => item.id === formData.provider);
    return `${provider?.label || 'Custom'} credentials`;
}

export default function Onboarding() {
    const navigate = useNavigate();
    const { signOut } = useClerk();
    const { user, isLoaded } = useUser();
    const [currentStep, setCurrentStep] = useState(0);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [loading, setLoading] = useState(false);
    const [submissionError, setSubmissionError] = useState('');
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        phoneNumber: '',
        llmType: 'default',
        provider: 'anthropic',
        model: '',
        apiKey: '',
        channels: {
            whatsapp: false,
            telegram: false,
        },
    });

    useEffect(() => {
        const checkStatus = async () => {
            if (!isLoaded || !user) return;

            try {
                const next = await resolveWorkspaceRoute();
                if (next.route === '/app') {
                    navigate('/app', { replace: true });
                    return;
                }

                if (next.route === '/provisioning') {
                    navigate('/provisioning', { replace: true });
                    return;
                }
            } catch (error) {
                console.error('[onboarding] failed to check profile status:', error);
            }

            setFormData((previous) => ({
                ...previous,
                fullName: user.fullName || '',
                username: deriveUsername(user),
            }));
            setCheckingStatus(false);
        };

        checkStatus();
    }, [isLoaded, navigate, user]);

    const selectedProvider = useMemo(
        () => PROVIDERS.find((item) => item.id === formData.provider) || PROVIDERS[0],
        [formData.provider],
    );

    const progress = ((currentStep + 1) / STEPS.length) * 100;

    const goNext = () => {
        const nextErrors = validationForStep(currentStep, formData);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSubmissionError('');
        setCurrentStep((value) => Math.min(value + 1, STEPS.length - 1));
    };

    const goBack = () => {
        setSubmissionError('');
        setCurrentStep((value) => Math.max(value - 1, 0));
    };

    const startProvisioning = async () => {
        const nextErrors = validationForStep(currentStep, formData);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setLoading(true);
        setSubmissionError('');

        try {
            const res = await apiAuthFetch('/api/user/profile/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: normalizeUsername(formData.username),
                    fullName: formData.fullName.trim(),
                    phoneNumber: formData.phoneNumber.trim(),
                    onboardingData: {
                        llm: {
                            type: formData.llmType,
                            provider: formData.llmType === 'custom' ? formData.provider : '',
                            model: formData.model.trim(),
                            apiKey: formData.llmType === 'custom' ? formData.apiKey.trim() : '',
                        },
                        channels: formData.channels,
                    },
                    triggerProvision: true,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || 'Unable to start provisioning.');
            }

            navigate('/provisioning');
        } catch (error) {
            console.error('[onboarding] provisioning start failed:', error);
            setSubmissionError(error?.message || 'Unable to start provisioning.');
            setLoading(false);
        }
    };

    if (checkingStatus) {
        return (
            <WorkspaceLoadingScreen
                title="Preparing your setup"
                body="We are checking whether this workspace is new, already provisioning, or ready to open."
            />
        );
    }

    return (
        <div className="min-h-dvh bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_38%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] text-slate-900" style={{ fontFamily: '"Satoshi", sans-serif' }}>
            <header className="px-6 py-6 sm:px-8">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 shadow-[0_14px_30px_rgba(37,99,235,0.24)] ring-1 ring-white/40">
                            <span className="text-sm font-black tracking-[0.2em] text-white">MT</span>
                        </div>
                        <div>
                            <div className="text-sm font-black uppercase tracking-[0.24em] text-slate-900">Magic Teams</div>
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace Launch</div>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut(() => navigate('/'))}
                        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>
            </header>

            <main className="px-6 pb-16 sm:px-8">
                <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="rounded-[32px] border border-slate-200 bg-white/80 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] backdrop-blur">
                        <div className="rounded-3xl bg-slate-950 p-6 text-white">
                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-200">Mission Control Setup</div>
                            <h1 className="mt-4 text-3xl font-black tracking-tight">Launch your workspace with confidence</h1>
                            <p className="mt-4 text-sm leading-6 text-slate-300">
                                A short setup, then we provision your workspace and hand you into Mission Control.
                            </p>
                        </div>

                        <div className="mt-6">
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                <span>Setup progress</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                                <motion.div
                                    animate={{ width: `${progress}%` }}
                                    transition={{ type: 'spring', stiffness: 180, damping: 24 }}
                                    className="h-full rounded-full bg-blue-600"
                                />
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            {STEPS.map((step, index) => {
                                const isActive = index === currentStep;
                                const isComplete = index < currentStep;
                                return (
                                    <button
                                        key={step.id}
                                        type="button"
                                        onClick={() => {
                                            if (index <= currentStep) setCurrentStep(index);
                                        }}
                                        className={`w-full rounded-2xl border p-4 text-left transition-all ${
                                            isActive
                                                ? 'border-blue-200 bg-blue-50 shadow-sm'
                                                : isComplete
                                                    ? 'border-emerald-200 bg-emerald-50/70'
                                                    : 'border-slate-200 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                                                isComplete
                                                    ? 'bg-emerald-600 text-white'
                                                    : isActive
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {isComplete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900">{step.title}</div>
                                                <div className="mt-1 text-xs leading-5 text-slate-500">{step.description}</div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">After launch</div>
                            <div className="mt-3 space-y-3 text-sm text-slate-600">
                                <div className="flex gap-3">
                                    <ShieldCheck className="mt-0.5 h-4 w-4 text-blue-600" />
                                    <span>Your profile is saved and queued for provisioning.</span>
                                </div>
                                <div className="flex gap-3">
                                    <Bot className="mt-0.5 h-4 w-4 text-blue-600" />
                                    <span>A dedicated OpenClaw instance is prepared on your VPS.</span>
                                </div>
                                <div className="flex gap-3">
                                    <Sparkles className="mt-0.5 h-4 w-4 text-blue-600" />
                                    <span>You can refine models, apps, and channels later in Settings.</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8">
                        {currentStep === 0 && (
                            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
                                        <UserIcon className="h-3.5 w-3.5" />
                                        Workspace profile
                                    </div>
                                    <h2 className="mt-5 text-4xl font-black tracking-tight text-slate-900">Set the identity of your control plane</h2>
                                    <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                                        Choose the name and handle we should use across the workspace.
                                    </p>

                                    <div className="mt-8 grid gap-5">
                                        <div>
                                            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Display name</label>
                                            <input
                                                type="text"
                                                value={formData.fullName}
                                                onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-slate-900 outline-none transition-colors focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                                                placeholder="John Doe"
                                            />
                                            {errors.fullName && <p className="mt-2 text-sm text-red-600">{errors.fullName}</p>}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Workspace username</label>
                                            <div className="relative">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">@</span>
                                                <input
                                                    type="text"
                                                    value={formData.username}
                                                    onChange={(event) => setFormData({ ...formData, username: normalizeUsername(event.target.value) })}
                                                    className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-10 pr-5 text-base text-slate-900 outline-none transition-colors focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                                                    placeholder="operations-lead"
                                                />
                                            </div>
                                            {errors.username && <p className="mt-2 text-sm text-red-600">{errors.username}</p>}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Phone number</label>
                                            <input
                                                type="tel"
                                                value={formData.phoneNumber}
                                                onChange={(event) => setFormData({ ...formData, phoneNumber: event.target.value })}
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-slate-900 outline-none transition-colors focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                                                placeholder="+1 555 000 0000"
                                            />
                                            <p className="mt-2 text-sm text-slate-500">Optional. Add it now if you plan to use operator-facing channels later.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Preview</div>
                                    <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-xl font-black text-slate-900 shadow-sm ring-1 ring-slate-200">
                                        {(formData.fullName || formData.username || 'MT').trim().charAt(0).toUpperCase()}
                                    </div>
                                    <div className="mt-5 text-xl font-black text-slate-900">{formData.fullName || 'Your workspace name'}</div>
                                    <div className="mt-1 text-sm font-semibold text-blue-700">@{normalizeUsername(formData.username) || 'workspace-handle'}</div>
                                    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                                        This shows up across provisioning, operator context, and workspace summaries.
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
                                    <KeyRound className="h-3.5 w-3.5" />
                                    Model access
                                </div>
                                <h2 className="mt-5 text-4xl font-black tracking-tight text-slate-900">Decide how this workspace gets model access</h2>
                                <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
                                    Start with the managed default, or add your own provider key now.
                                </p>

                                <div className="mt-8 grid gap-4 lg:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, llmType: 'default', apiKey: '' })}
                                        className={`rounded-[28px] border p-6 text-left transition-all ${formData.llmType === 'default' ? 'border-blue-200 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                                                <Sparkles className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-slate-900">Managed default</div>
                                                <div className="text-sm text-slate-500">Fastest path into the workspace.</div>
                                            </div>
                                        </div>
                                        <p className="mt-5 text-sm leading-6 text-slate-600">
                                            Fastest path. You can adjust providers and routing later in Settings.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, llmType: 'custom' })}
                                        className={`rounded-[28px] border p-6 text-left transition-all ${formData.llmType === 'custom' ? 'border-blue-200 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                                                <Zap className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-slate-900">Bring your own key</div>
                                                <div className="text-sm text-slate-500">Store provider access during setup.</div>
                                            </div>
                                        </div>
                                        <p className="mt-5 text-sm leading-6 text-slate-600">
                                            Store provider access during setup. Exact routing can still be changed later.
                                        </p>
                                    </button>
                                </div>

                                {formData.llmType === 'custom' && (
                                    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                                        <div>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {PROVIDERS.map((provider) => (
                                                    <button
                                                        key={provider.id}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, provider: provider.id })}
                                                        className={`rounded-2xl border p-4 text-left transition-all ${formData.provider === provider.id ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                                    >
                                                        <div className="text-sm font-black text-slate-900">{provider.label}</div>
                                                        <div className="mt-1 text-xs leading-5 text-slate-500">{provider.note}</div>
                                                    </button>
                                                ))}
                                            </div>
                                            {errors.provider && <p className="mt-2 text-sm text-red-600">{errors.provider}</p>}

                                            <div className="mt-6">
                                                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Provider API key</label>
                                                <input
                                                    type="password"
                                                    value={formData.apiKey}
                                                    onChange={(event) => setFormData({ ...formData, apiKey: event.target.value })}
                                                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-slate-900 outline-none transition-colors focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                                                    placeholder={selectedProvider.keyPlaceholder}
                                                />
                                                {errors.apiKey && <p className="mt-2 text-sm text-red-600">{errors.apiKey}</p>}
                                            </div>

                                            <div className="mt-6">
                                                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Preferred model ID</label>
                                                <input
                                                    type="text"
                                                    value={formData.model}
                                                    onChange={(event) => setFormData({ ...formData, model: event.target.value })}
                                                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-slate-900 outline-none transition-colors focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                                                    placeholder={selectedProvider.modelPlaceholder}
                                                />
                                                <p className="mt-2 text-sm text-slate-500">Optional. Treat this as a starting preference.</p>
                                            </div>
                                        </div>

                                        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                                            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Provisioning note</div>
                                            <div className="mt-4 text-lg font-black text-slate-900">{selectedProvider.label} credential capture</div>
                                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                                We only store what is needed for provider authentication. Full provider setup stays editable after launch.
                                            </p>
                                            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                                                This keeps setup dependable and avoids locking model routing too early.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    Channels
                                </div>
                                <h2 className="mt-5 text-4xl font-black tracking-tight text-slate-900">Choose the channels you expect to wire first</h2>
                                <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
                                    This just stages the workspace. You can finish channel setup later in Settings.
                                </p>

                                <div className="mt-8 grid gap-4 lg:grid-cols-2">
                                    {CHANNELS.map((channel) => {
                                        const enabled = formData.channels[channel.id];
                                        return (
                                            <button
                                                key={channel.id}
                                                type="button"
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    channels: {
                                                        ...formData.channels,
                                                        [channel.id]: !enabled,
                                                    },
                                                })}
                                                className={`rounded-[28px] border p-6 text-left transition-all ${enabled ? 'border-blue-200 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <div className="text-lg font-black text-slate-900">{channel.title}</div>
                                                        <p className="mt-3 text-sm leading-6 text-slate-600">{channel.description}</p>
                                                    </div>
                                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${enabled ? 'border-blue-200 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-400'}`}>
                                                        {enabled ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                                                    </div>
                                                </div>
                                                <div className={`mt-6 h-16 rounded-3xl bg-gradient-to-r ${channel.accent}`} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Review
                                    </div>
                                    <h2 className="mt-5 text-4xl font-black tracking-tight text-slate-900">Review the workspace launch plan</h2>
                                    <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
                                        Final check before we queue provisioning and move you into the live status screen.
                                    </p>

                                    <div className="mt-8 grid gap-4">
                                        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                                            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Identity</div>
                                            <div className="mt-3 text-xl font-black text-slate-900">{formData.fullName || 'Unnamed workspace'}</div>
                                            <div className="mt-1 text-sm font-semibold text-blue-700">@{normalizeUsername(formData.username) || 'workspace-handle'}</div>
                                            {formData.phoneNumber && <div className="mt-3 text-sm text-slate-600">{formData.phoneNumber}</div>}
                                        </div>

                                        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                                            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Model access</div>
                                            <div className="mt-3 text-xl font-black text-slate-900">{stepSummary(formData)}</div>
                                            <div className="mt-2 text-sm leading-6 text-slate-600">
                                                {formData.llmType === 'default'
                                                    ? 'We will provision first, then you can refine providers and routing in Settings.'
                                                    : `${selectedProvider.label} credentials will be stored now. Preferred model: ${formData.model.trim() || 'set later in Settings'}.`}
                                            </div>
                                        </div>

                                        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                                            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Channels</div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {CHANNELS.filter((channel) => formData.channels[channel.id]).length > 0 ? (
                                                    CHANNELS.filter((channel) => formData.channels[channel.id]).map((channel) => (
                                                        <div key={channel.id} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
                                                            {channel.title}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-sm text-slate-500">No channels pre-selected. You can still configure them later.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-200">Deployment sequence</div>
                                    <div className="mt-6 space-y-4">
                                        <div>
                                            <div className="text-sm font-bold">1. Sync profile</div>
                                            <div className="mt-1 text-sm text-slate-300">Save onboarding data and queue the workspace.</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold">2. Allocate infrastructure</div>
                                            <div className="mt-1 text-sm text-slate-300">Assign capacity or queue a node if needed.</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold">3. Hand off to live operations</div>
                                            <div className="mt-1 text-sm text-slate-300">Move you to live provisioning status.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {submissionError && (
                            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {submissionError}
                            </div>
                        )}

                        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-slate-500">
                                Step {currentStep + 1} of {STEPS.length}
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={goBack}
                                    disabled={currentStep === 0 || loading}
                                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back
                                </button>

                                {currentStep < STEPS.length - 1 ? (
                                    <button
                                        type="button"
                                        onClick={goNext}
                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
                                    >
                                        Continue
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={startProvisioning}
                                        disabled={loading}
                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {loading ? 'Launching workspace...' : 'Launch workspace'}
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
