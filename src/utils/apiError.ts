import { AxiosError } from 'axios';

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') {
      return 'A API demorou para responder. Verifique se o servidor Java esta rodando na porta 8080.';
    }

    if (!error.response) {
      return 'Nao foi possivel conectar a API. Verifique se o servidor Java esta rodando e se a URL base esta correta.';
    }

    if (error.response.status === 404) {
      return 'O recurso solicitado nao foi encontrado na API.';
    }

    if (error.response.status >= 500) {
      return 'A API encontrou um erro interno. Tente novamente em instantes.';
    }

    const message = getMessageFromResponse(error.response?.data);
    return message ?? 'Nao foi possivel concluir a requisicao.';
  }

  if (error instanceof Error) {
    return 'Nao foi possivel carregar os dados agora.';
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
