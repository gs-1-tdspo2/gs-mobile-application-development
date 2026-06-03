import { AxiosError } from 'axios';

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const message = getMessageFromResponse(error.response?.data);
    return message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Erro inesperado ao acessar a API.';
}

function getMessageFromResponse(data: unknown): string | undefined {
  if (typeof data === 'string') {
    return data;
  }

  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    return typeof message === 'string' ? message : undefined;
  }

  return undefined;
}
