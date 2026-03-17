import React from 'react';
import { Check, Users, WandSparkles } from 'lucide-react';
import { useBroadcast } from '../contexts/BroadcastContext';

const FOCUS_RING = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2';

export default function BroadcastSidebar() {
    const { agents, selectedAgents, setSelectedAgents } = useBroadcast();
    const specialists = agents.filter((agent) => agent.id !== 'main');
    const manager = agents.find((agent) => agent.id === 'main') || null;
    const defaultTargets = specialists.length ? specialists : agents;

    const toggleAgent = (agentId) => {
        setSelectedAgents((previous) => (
            previous.includes(agentId)
                ? previous.filter((id) => id !== agentId)
                : [...previous, agentId]
        ));
    };

    const selectRoster = (mode) => {
        if (mode === 'specialists') {
            setSelectedAgents(specialists.map((agent) => agent.id));
            return;
        }
        if (mode === 'manager') {
            setSelectedAgents(manager ? [manager.id] : []);
            return;
        }
        setSelectedAgents(defaultTargets.map((agent) => agent.id));
    };

    const roster = manager ? [manager, ...specialists] : agents;

    return (
        <div className="flex h-full flex-col border-l border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-5">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Users className="h-4.5 w-4.5" />
                    </div>
                    <div>
                        <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-900">Team Roster</div>
                        <div className="mt-1 text-xs text-slate-500">Choose who should receive the next group prompt.</div>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => selectRoster('all')}
                        className={`rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50 ${FOCUS_RING}`}
                    >
                        All active
                    </button>
                    <button
                        type="button"
                        onClick={() => selectRoster('specialists')}
                        className={`rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50 ${FOCUS_RING}`}
                    >
                        Specialists
                    </button>
                    <button
                        type="button"
                        onClick={() => selectRoster('manager')}
                        className={`rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50 ${FOCUS_RING}`}
                    >
                        Manager only
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="mb-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">How this works</div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">
                        Send one prompt from the main composer. The selected agents receive it, and their replies and coordination notes stream into the center feed.
                    </div>
                </div>

                <div className="space-y-2">
                    {roster.map((agent) => {
                        const checked = selectedAgents.includes(agent.id);
                        const isManager = agent.id === 'main';
                        return (
                            <label
                                key={agent.id}
                                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition ${
                                    checked
                                        ? 'border-blue-200 bg-blue-50'
                                        : 'border-slate-200 bg-white hover:bg-slate-50'
                                }`}
                            >
                                <div className="relative mt-1 flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleAgent(agent.id)}
                                        className="peer h-4 w-4 appearance-none rounded border border-slate-300 checked:border-blue-600 checked:bg-blue-600"
                                    />
                                    <Check className="pointer-events-none absolute left-0.5 h-3 w-3 text-white opacity-0 transition peer-checked:opacity-100" />
                                </div>

                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700">
                                        {agent.identity?.emoji || agent.id.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="truncate text-sm font-bold text-slate-900">
                                                {agent.identity?.name || agent.label || agent.id}
                                            </div>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] ${
                                                isManager
                                                    ? 'bg-slate-900 text-white'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {isManager ? 'Manager' : 'Specialist'}
                                            </span>
                                        </div>
                                        <div className="mt-1 truncate text-xs text-slate-500">{agent.id}</div>
                                    </div>
                                </div>
                            </label>
                        );
                    })}
                </div>
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
                        <WandSparkles className="h-3.5 w-3.5" />
                        Selected now
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">
                        {selectedAgents.length} {selectedAgents.length === 1 ? 'agent' : 'agents'} will receive the next message.
                    </div>
                </div>
            </div>
        </div>
    );
}
