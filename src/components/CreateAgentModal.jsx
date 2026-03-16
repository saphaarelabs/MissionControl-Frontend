import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiAuthFetch } from '../lib/apiBase';
import { X, Zap, AlertCircle } from 'lucide-react';

const FOCUS_RING = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2';

const CreateAgentModal = ({ isOpen, onClose, onCreated }) => {
    const [availableModels, setAvailableModels] = useState([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [spawning, setSpawning] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        label: '',
        task: '',
        model: ''
    });

    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        setFormData({ label: '', task: '', model: '' });

        const load = async () => {
            setLoadingModels(true);
            try {
                const res = await apiAuthFetch('/api/models');
                const data = await res.json().catch(() => ({}));
                setAvailableModels(Array.isArray(data.models) ? data.models : []);
            } catch (err) {
                console.error('Failed to load models', err);
                setAvailableModels([]);
            } finally {
                setLoadingModels(false);
            }
        };

        load();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && !spawning) {
                onClose?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, spawning]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.task.trim()) return;
        setSpawning(true);
        setError(null);

        try {
            const body = {
                task: formData.task.trim(),
                label: formData.label.trim() || undefined,
                model: formData.model || undefined
                // Let backend generate agentId from label or timestamp
            };

            const response = await apiAuthFetch('/api/subagents/spawn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json().catch(() => null);
            if (!response.ok) throw new Error(data?.error || 'Failed to deploy agent');

            onCreated?.(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setSpawning(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm overscroll-contain sm:p-6"
            onClick={() => {
                if (!spawning) onClose?.();
            }}
        >
            <div className="flex min-h-full items-start justify-center py-6 sm:items-center sm:py-10">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="spawn-agent-title"
                    className="w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)] animate-in fade-in zoom-in duration-200"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="flex items-center justify-between border-b border-slate-200 bg-[linear-gradient(135deg,_#ffffff_0%,_#f8fafc_65%,_#eef4ff_100%)] px-6 py-5">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Subagent Creation</div>
                            <h3 id="spawn-agent-title" className="mt-2 flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
                                <Zap className="w-5 h-5 text-violet-600" />
                                Deploy Agent
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close dialog"
                            className={`rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 ${FOCUS_RING}`}
                        >
                            <X className="w-5 h-5" aria-hidden="true" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="max-h-[min(78vh,720px)] overflow-y-auto p-6 space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="spawn-label" className="mb-1 block text-sm font-medium text-gray-700">
                                Label <span className="font-normal text-gray-400">(optional)</span>
                            </label>
                            <input
                                id="spawn-label"
                                type="text"
                                value={formData.label}
                                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                autoComplete="off"
                                className={`w-full rounded-xl border border-gray-300 px-3 py-2.5 shadow-sm transition-colors ${FOCUS_RING}`}
                                placeholder="e.g. Research, Coder, Writer"
                            />
                        </div>

                        <div>
                            <label htmlFor="spawn-task" className="mb-1 block text-sm font-medium text-gray-700">
                                Task / Role <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="spawn-task"
                                value={formData.task}
                                onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                                required
                                rows={5}
                                className={`w-full rounded-xl border border-gray-300 px-3 py-2.5 shadow-sm transition-colors resize-y ${FOCUS_RING}`}
                                placeholder="Describe what this agent should do, e.g. 'Search the web and summarize news about AI. Focus on recent developments.'"
                            />
                            <p className="mt-1 text-xs text-gray-500">This becomes the agent's initial instruction.</p>
                        </div>

                        <div>
                            <label htmlFor="spawn-model" className="mb-1 block text-sm font-medium text-gray-700">
                                Model <span className="font-normal text-gray-400">(optional — uses default if blank)</span>
                            </label>
                            {loadingModels ? (
                                <div className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-400">
                                    Loading models…
                                </div>
                            ) : (
                                <select
                                    id="spawn-model"
                                    value={formData.model}
                                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                    className={`w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 shadow-sm transition-colors ${FOCUS_RING}`}
                                >
                                    <option value="">Use default model</option>
                                    {availableModels.map((m) => (
                                        <option key={m.key} value={m.key}>
                                            {m.name} ({m.key})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className={`rounded-xl px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-100 ${FOCUS_RING}`}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={spawning || !formData.task.trim()}
                                className={`flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
                            >
                                <Zap className="w-4 h-4" aria-hidden="true" />
                                {spawning ? 'Spawning…' : 'Spawn'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CreateAgentModal;
