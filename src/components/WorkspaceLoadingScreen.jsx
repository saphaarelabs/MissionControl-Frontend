import React from 'react';

const shellClassName = 'relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/90 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur';

export default function WorkspaceLoadingScreen({
    title = 'Loading workspace',
    body = 'We are syncing your workspace and preparing the next surface.',
    mode = 'page',
}) {
    const isOverlay = mode === 'overlay';

    const content = (
        <div className={`${shellClassName} ${isOverlay ? 'w-full max-w-md p-5' : 'w-full max-w-2xl p-8 sm:p-10'}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.10),_transparent_36%)]" />

            <div className="relative">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)]">
                        <span className="text-xs font-black tracking-[0.22em]">MT</span>
                    </div>
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">Mission Control</div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.45)]" />
                            Syncing workspace state
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid gap-3">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                            <div className="h-2 w-16 rounded bg-slate-100" />
                            <div className="mt-3 h-3 w-24 rounded bg-slate-200" />
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                            <div className="h-2 w-14 rounded bg-slate-100" />
                            <div className="mt-3 h-3 w-20 rounded bg-slate-200" />
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                            <div className="h-2 w-20 rounded bg-slate-100" />
                            <div className="mt-3 h-3 w-16 rounded bg-slate-200" />
                        </div>
                    </div>
                </div>

                <h1 className={`mt-7 font-black tracking-tight text-slate-900 ${isOverlay ? 'text-xl' : 'text-3xl sm:text-4xl'}`}>{title}</h1>
                <p className={`mt-3 max-w-2xl leading-6 text-slate-600 ${isOverlay ? 'text-sm' : 'text-[15px]'}`}>{body}</p>
            </div>
        </div>
    );

    if (isOverlay) {
        return (
            <div className="pointer-events-none fixed inset-0 z-40 flex items-start justify-center px-6 pt-24">
                {content}
            </div>
        );
    }

    return (
        <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_42%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] px-6 py-16">
            {content}
        </div>
    );
}
