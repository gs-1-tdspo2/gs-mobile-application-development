export type Estacao = {
  id?: number | string;
  idEstacao?: number | string;
  nome?: string;
  name?: string;
  codigo?: string;
  code?: string;
  codigoEstacao?: string;
  status?: string;
  statusEstacao?: string;
  ativa?: boolean;
  stAtivo?: string;
  tipo?: string;
  type?: string;
  tipoEstacao?: string;
  ultimaLeitura?: string;
  lastReadingAt?: string;
  dtUltimaComunicacao?: string;
  [key: string]: unknown;
};

export type EstacaoReadModel = {
  id: number | string;
  nome: string;
  codigo?: string;
  status?: string;
  ativa?: boolean;
  tipo?: string;
  ultimaLeituraEm?: string;
  raw?: Estacao;
};
