const API_BASE =
    import.meta.env.VITE_API_BASE
    || (typeof window !== 'undefined' && window.__API_BASE__)
    || (import.meta.env.MODE === 'production' ? 'https://missioncontrol-backend.vercel.app' : '')
    || '';

export function apiUrl(path) {
    if (!path) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    if (!API_BASE) return normalized;
    return `${API_BASE.replace(/\/$/, '')}${normalized}`;
}

export async function getClerkJwt() {
    try {
        if (typeof window === 'undefined') return null;
        const clerk = window.Clerk;
        if (!clerk?.session?.getToken) return null;
        const token = await clerk.session.getToken();
        return typeof token === 'string' && token.trim() ? token : null;
    } catch {
        return null;
    }
}

export async function apiAuthFetch(input, options = {}) {
    const token = await getClerkJwt();
    const headers = new Headers(options.headers || {});

    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const target = typeof input === 'string' ? apiUrl(input) : input;
    const method = (options.method || 'GET').toUpperCase();
    const url = typeof target === 'string' ? target : String(target);

    if (!token) {
        console.warn(`[api] ${method} ${url} — no Clerk JWT (Clerk not ready yet?)`);
    }

    const res = await fetch(target, { ...options, headers });

    const flag = res.ok ? '✓' : res.status >= 500 ? '✗' : '!';
    console.log(`[api] ${flag} ${method} ${url} → ${res.status}`);

    return res;
}
