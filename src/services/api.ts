import { AxiosError, create } from 'axios';

import { API_BASE_URL } from '@/constants/api';

export const api = create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

if (__DEV__) {
  api.interceptors.request.use((config) => {
    const method = (config.method ?? 'GET').toUpperCase();
    const baseURL = config.baseURL ?? '';
    const url = config.url ?? '';
    console.log(`[Amanaje API] ${method} ${baseURL}${url}`);
    return config;
  });

  api.interceptors.response.use(
    (response) => {
      console.log(`[Amanaje API] ${response.status} ${response.config.url ?? ''}`);
      return response;
    },
    (error: unknown) => {
      if (error instanceof AxiosError) {
        console.error(`[Amanaje API] ERROR code=${error.code ?? 'unknown'} message=${error.message}`);
      }
      return Promise.reject(error);
    },
  );
}
