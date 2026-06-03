export type RiscoNivel = 'BAIXO' | 'MODERADO' | 'ALTO' | 'CRITICO';

export const RISCO_NIVEIS: RiscoNivel[] = ['BAIXO', 'MODERADO', 'ALTO', 'CRITICO'];

export type RiscoAtual = {
  id?: number | string;
  regiaoId?: number;
  idRegiao?: number;
  nivel?: RiscoNivel;
  nivelRisco?: RiscoNivel | string;
  nivelConsolidado?: RiscoNivel | string;
  riskLevel?: RiscoNivel | string;
  score?: number;
  pontuacao?: number;
  scoreConsolidado?: number;
  descricao?: string;
  description?: string;
  calculadoEm?: string;
  atualizadoEm?: string;
  createdAt?: string;
  updatedAt?: string;
  fatores?: string[];
  [key: string]: unknown;
};

export type RiscoAtualReadModel = {
  nivel?: RiscoNivel;
  score?: number;
  descricao?: string;
  atualizadoEm?: string;
  raw?: RiscoAtual;
};
