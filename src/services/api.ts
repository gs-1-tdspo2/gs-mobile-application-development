import { API_BASE_URL, API_TIMEOUT, API_TIMEOUT_COLD_START } from '@constants/api';
import { ApiError } from '@/types';

async function request<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs: number = API_TIMEOUT,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      let apiError: ApiError = { status: response.status, message: response.statusText };
      try {
        apiError = await response.json();
      } catch {
        // non-JSON error body — keep default
      }
      throw apiError;
    }

    if (response.status === 204) return undefined as T;

    return response.json() as Promise<T>;
  } catch (err: unknown) {
    clearTimeout(timer);
    if ((err as Error).name === 'AbortError') {
      throw {
        status: 408,
        message: 'O servidor está inicializando. Tente novamente em instantes.',
      } satisfies ApiError;
    }
    throw err;
  }
}

export const api = {
  // Pass coldStart = true only for the /api/health warm-up probe
  get: <T>(path: string, coldStart = false) =>
    request<T>(path, { method: 'GET' }, coldStart ? API_TIMEOUT_COLD_START : API_TIMEOUT),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};
