/** Public env (Vite). Base origin only, e.g. `http://localhost:5000` (no `/api` required). */
export const VITE_API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? '';

/** When true, always use demo catalog for discovery/detail (no API attempt for listing). */
export const VITE_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

/** Resolves to `.../api` for fetch calls. Empty string when `VITE_API_URL` is unset. */
export function resolveApiBaseUrl(): string {
  const raw = VITE_API_URL.replace(/\/$/, '');
  if (!raw) return '';
  if (raw.endsWith('/api')) return raw;
  return `${raw}/api`;
}

/** Demo catalog: no API URL or forced demo mode (listing skips API). */
export function shouldPreferDemoCatalog(): boolean {
  return VITE_DEMO_MODE || !VITE_API_URL;
}
