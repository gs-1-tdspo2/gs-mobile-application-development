// ─── Nível de Risco ───────────────────────────────────────────────────────────
export type NivelRisco = 'BAIXO' | 'MODERADO' | 'ALTO' | 'CRITICO';

export const NivelRiscoLabels: Record<NivelRisco, string> = {
  BAIXO: 'Baixo',
  MODERADO: 'Moderado',
  ALTO: 'Alto',
  CRITICO: 'Crítico',
};

// DDL score bands: BAIXO 0–24, MODERADO 25–49, ALTO 50–74, CRITICO 75–100
export const NivelRiscoThresholds: Record<NivelRisco, [number, number]> = {
  BAIXO: [0, 24],
  MODERADO: [25, 49],
  ALTO: [50, 74],
  CRITICO: [75, 100],
};

// ─── Categoria de Risco ───────────────────────────────────────────────────────
// TB_AMANAJE_AVAL_RISCO.TP_RISCO and TB_AMANAJE_IND_REG.TP_RISCO.
// OPERACIONAL is not a valid category here — use TipoAlerta for alerts.
export type CategoriaRisco =
  | 'ENCHENTE'
  | 'DESLIZAMENTO'
  | 'TEMPESTADE'
  | 'QUALIDADE_AR';

export const CategoriaRiscoLabels: Record<CategoriaRisco, string> = {
  ENCHENTE: 'Enchente',
  DESLIZAMENTO: 'Deslizamento',
  TEMPESTADE: 'Tempestade',
  QUALIDADE_AR: 'Qualidade do ar',
};

// ─── Tipo de Alerta ───────────────────────────────────────────────────────────
// TB_AMANAJE_ALERTA.TP_ALERTA — superset of CategoriaRisco.
// OPERACIONAL covers infrastructure/operational alerts not tied to environmental risk.
export type TipoAlerta =
  | 'ENCHENTE'
  | 'DESLIZAMENTO'
  | 'TEMPESTADE'
  | 'QUALIDADE_AR'
  | 'OPERACIONAL';

export const TipoAlertaLabels: Record<TipoAlerta, string> = {
  ENCHENTE: 'Enchente',
  DESLIZAMENTO: 'Deslizamento',
  TEMPESTADE: 'Tempestade',
  QUALIDADE_AR: 'Qualidade do ar',
  OPERACIONAL: 'Operacional',
};

// ─── Status do Alerta ─────────────────────────────────────────────────────────
export type StatusAlerta = 'ABERTO' | 'EM_ANALISE' | 'RESOLVIDO' | 'CANCELADO';

export const StatusAlertaLabels: Record<StatusAlerta, string> = {
  ABERTO: 'Aberto',
  EM_ANALISE: 'Em análise',
  RESOLVIDO: 'Resolvido',
  CANCELADO: 'Cancelado',
};

// ─── Tipo de Cliente ──────────────────────────────────────────────────────────
// TB_AMANAJE_CLI.TP_CLI
export type TipoCliente =
  | 'GOVERNO_DEFESA_CIVIL'
  | 'ONG'
  | 'FAZENDA_PRIVADO'
  | 'COOPERATIVA'
  | 'PESQUISA_UNIVERSIDADE';

export const TipoClienteLabels: Record<TipoCliente, string> = {
  GOVERNO_DEFESA_CIVIL: 'Governo / Defesa Civil',
  ONG: 'ONG',
  FAZENDA_PRIVADO: 'Fazenda privada',
  COOPERATIVA: 'Cooperativa',
  PESQUISA_UNIVERSIDADE: 'Pesquisa / Universidade',
};

// ─── Tipo de Área da Região ───────────────────────────────────────────────────
export type TipoArea =
  | 'PONTE'
  | 'ENCOSTA'
  | 'AREA_RURAL'
  | 'COMUNIDADE'
  | 'PROPRIEDADE_PRIVADA'
  | 'REGIAO_RIBEIRINHA'
  | 'AREA_URBANA'
  | 'OUTRA';

export const TipoAreaLabels: Record<TipoArea, string> = {
  PONTE: 'Ponte',
  ENCOSTA: 'Encosta',
  AREA_RURAL: 'Área rural',
  COMUNIDADE: 'Comunidade',
  PROPRIEDADE_PRIVADA: 'Propriedade privada',
  REGIAO_RIBEIRINHA: 'Região ribeirinha',
  AREA_URBANA: 'Área urbana',
  OUTRA: 'Outra',
};

// ─── Visibilidade da Região ───────────────────────────────────────────────────
export type Visibilidade = 'PRIVADA' | 'INSTITUCIONAL' | 'AGREGADA_PUBLICA';

export const VisibilidadeLabels: Record<Visibilidade, string> = {
  PRIVADA: 'Privada',
  INSTITUCIONAL: 'Institucional',
  AGREGADA_PUBLICA: 'Agregada pública',
};

// ─── Tipo de Estação ──────────────────────────────────────────────────────────
export type TipoEstacao = 'REAL' | 'SIMULADA' | 'REFERENCIA';

export const TipoEstacaoLabels: Record<TipoEstacao, string> = {
  REAL: 'Real',
  SIMULADA: 'Simulada',
  REFERENCIA: 'Referência',
};

// ─── Status da Estação ────────────────────────────────────────────────────────
export type StatusEstacao =
  | 'ATIVA'
  | 'INATIVA'
  | 'MANUTENCAO'
  | 'FALHA'
  | 'SEM_COM';

export const StatusEstacaoLabels: Record<StatusEstacao, string> = {
  ATIVA: 'Ativa',
  INATIVA: 'Inativa',
  MANUTENCAO: 'Em manutenção',
  FALHA: 'Falha',
  SEM_COM: 'Sem comunicação',
};
