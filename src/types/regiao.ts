import { RiscoAtual, RiscoNivel } from '@/types/risco';

export type TipoArea =
  | 'PONTE'
  | 'ENCOSTA'
  | 'AREA_RURAL'
  | 'COMUNIDADE'
  | 'PROPRIEDADE_PRIVADA'
  | 'REGIAO_RIBEIRINHA'
  | 'AREA_URBANA'
  | 'OUTRA';

export type TipoVisibilidade =
  | 'PRIVADA'
  | 'INSTITUCIONAL'
  | 'AGREGADA_PUBLICA';

export type Regiao = {
  id: number | string;
  idRegiao?: number | string;
  idCliente?: number;
  nome: string;
  name?: string;
  cidade?: string;
  city?: string;
  municipio?: string;
  estado?: string;
  state?: string;
  tipoCliente?: string;
  clientType?: string;
  tipoArea?: string;
  tipoVisibilidade?: string;
  bioma?: string;
  descricao?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  nivelVulnerabilidade?: number;
  ativo?: boolean;
  stAtivo?: string;
  status?: string;
  riscoAtual?: RiscoAtual | RiscoNivel;
  currentRisk?: RiscoAtual | RiscoNivel;
  alertasAtivos?: number;
  activeAlertsCount?: number;
  criadoEm?: string;
  atualizadoEm?: string;
  dtCriadoEm?: string;
  dtAtualizadoEm?: string;
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
  idCliente: number;
  nome: string;
  cidade: string;
  estado: string;
  latitude: number;
  longitude: number;
  tipoArea: TipoArea;
  nivelVulnerabilidade: number;
  tipoVisibilidade: TipoVisibilidade;
};

export type RegiaoUpdateRequest = RegiaoCreateRequest;
