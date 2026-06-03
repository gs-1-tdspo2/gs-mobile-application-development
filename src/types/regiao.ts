import { RiscoAtual, RiscoNivel } from '@/types/risco';

export type Regiao = {
  id: number | string;
  nome: string;
  name?: string;
  cidade?: string;
  city?: string;
  municipio?: string;
  estado?: string;
  state?: string;
  tipoCliente?: string;
  clientType?: string;
  bioma?: string;
  descricao?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  ativo?: boolean;
  status?: string;
  riscoAtual?: RiscoAtual | RiscoNivel;
  currentRisk?: RiscoAtual | RiscoNivel;
  alertasAtivos?: number;
  activeAlertsCount?: number;
  criadoEm?: string;
  atualizadoEm?: string;
  [key: string]: unknown;
};

export type RegiaoReadModel = {
  id: number | string;
  nome: string;
  cidade?: string;
  estado?: string;
  tipoCliente?: string;
  descricao?: string;
  ativo?: boolean;
  status?: string;
  riscoNivel?: RiscoNivel;
  alertasAtivos?: number;
  raw?: Regiao;
};

export type RegiaoCreateRequest = {
  nome: string;
  cidade: string;
  municipio?: string;
  estado?: string;
  tipoCliente: string;
  descricao?: string;
  ativo?: boolean;
};

export type RegiaoUpdateRequest = Partial<RegiaoCreateRequest> & {
  ativo?: boolean;
};
