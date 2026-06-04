import { AxiosError, create } from 'axios';
import { Platform } from 'react-native';

import { API_BASE_URL } from '@/constants/api';

// No global default headers — avoids sending Content-Type/Accept on every
// request, which can trigger CORS preflights on cross-origin GETs.
export const api = create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

if (__DEV__) {
  api.interceptors.request.use((config) => {
    const method = (config.method ?? 'GET').toUpperCase();
    console.log(`[Amanaje API] ${method} ${config.baseURL ?? ''}${config.url ?? ''}`);
    return config;
  });

  api.interceptors.response.use(
    (response) => {
      console.log(`[Amanaje API] ${response.status} ${response.config.url ?? ''}`);
      return response;
    },
    (error: unknown) => {
      if (error instanceof AxiosError) {
        console.error(`[Amanaje API] ERROR code=${error.code ?? 'unknown'} msg=${error.message}`);
      }
      return Promise.reject(error);
    },
  );
}

/** Build an absolute URL from a relative path, avoiding double slashes. */
function buildAbsoluteUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * GET helper.
 *
 * On web: uses bare fetch(url) — no options, no headers — matching exactly
 * what a manual browser fetch() call does. Avoids CORS preflights.
 *
 * On native (iOS/Android): uses Axios.
 */
export async function webGet<T>(path: string): Promise<T> {
  if (Platform.OS === 'web') {
    const url = buildAbsoluteUrl(path);
    if (__DEV__) console.log(`[Amanaje API] GET (fetch-minimal) ${url}`);
    try {
      const res = await fetch(url);
      if (__DEV__) console.log(`[Amanaje API] OK ${res.status} ${url}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<T>;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (__DEV__) console.error(`[Amanaje API] FETCH FAILED ${url} ${msg}`);
      throw err;
    }
  }

  // Native: Axios
  const response = await api.get<T>(path);
  return response.data;
}
