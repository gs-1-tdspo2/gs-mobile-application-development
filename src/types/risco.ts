export type RiscoNivel = 'BAIXO' | 'MODERADO' | 'ALTO' | 'CRITICO';

export const RISCO_NIVEIS: RiscoNivel[] = ['BAIXO', 'MODERADO', 'ALTO', 'CRITICO'];

export type RiscoAtual = {
  regiaoId?: number;
  nivel?: RiscoNivel;
  score?: number;
  descricao?: string;
  calculadoEm?: string;
  fatores?: string[];
  [key: string]: unknown;
};
