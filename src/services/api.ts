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

/**
 * GET with automatic native-fetch fallback on web when Axios times out.
 * Use for read-only endpoints (dashboard summary, alertas, regioes, etc.).
 */
export async function webGet<T>(path: string): Promise<T> {
  try {
    const response = await api.get<T>(path);
    return response.data;
  } catch (error) {
    const isTimeout = error instanceof AxiosError && error.code === 'ECONNABORTED';
    const isNetworkError = error instanceof AxiosError && !error.response && error.code !== 'ECONNABORTED';

    if ((isTimeout || isNetworkError) && Platform.OS === 'web') {
      if (__DEV__) console.log(`[Amanaje API] Retrying with fetch: ${path}`);
      const url = `${API_BASE_URL}${path}`;
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} on ${path}`);
      }
      return res.json() as Promise<T>;
    }
    throw error;
  }
}
