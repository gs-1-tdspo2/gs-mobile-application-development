import { RiscoNivel } from '@/types/risco';

export type Alerta = {
  id: number;
  titulo?: string;
  mensagem?: string;
  nivel?: RiscoNivel;
  regiaoId?: number;
  regiaoNome?: string;
  resolvido?: boolean;
  criadoEm?: string;
  resolvidoEm?: string;
  [key: string]: unknown;
};
