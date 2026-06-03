import { AxiosError } from 'axios';

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') {
      return 'A API demorou para responder. Tente novamente.';
    }

    if (!error.response) {
      return 'Não foi possível conectar à API. Aguarde alguns segundos e tente novamente.';
    }

    if (error.response.status === 404) {
      return 'Registro não encontrado.';
    }

    if (error.response.status >= 500) {
      return 'A API encontrou um erro interno. Aguarde alguns segundos e tente novamente.';
    }

    const message = getMessageFromResponse(error.response?.data);
    return message ?? 'Não foi possível carregar os dados.';
  }

  if (error instanceof Error) {
    return 'Não foi possível carregar os dados.';
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
