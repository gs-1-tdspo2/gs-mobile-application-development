import { AxiosError, create } from 'axios';
import { Platform } from 'react-native';

import { API_BASE_URL } from '@/constants/api';

export const api = create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
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
 * Perform a GET request.
 *
 * On web, uses native fetch directly — avoids Axios XHR timeout issues and
 * the CORS-preflight triggered by Axios's Content-Type header on GET requests.
 *
 * On native, uses Axios as normal.
 */
export async function webGet<T>(path: string): Promise<T> {
  if (Platform.OS === 'web') {
    const url = buildAbsoluteUrl(path);
    if (__DEV__) console.log(`[Amanaje API] GET (fetch) ${url}`);
    // Do NOT send Content-Type on GET — it triggers a CORS preflight.
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} — ${path}`);
    }
    return res.json() as Promise<T>;
  }

  // Native (iOS / Android): use Axios
  const response = await api.get<T>(path);
  return response.data;
}
