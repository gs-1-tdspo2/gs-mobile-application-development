export type Cliente = {
  idCliente?: number;
  nome?: string;
  tipoCliente?: string;
  documento?: string;
  emailContato?: string;
  telefone?: string;
  stAtivo?: string;
  dtCriadoEm?: string;
  dtAtualizadoEm?: string;
  [key: string]: unknown;
};
