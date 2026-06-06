import {
  NivelRisco,
  CategoriaRisco,
  TipoAlerta,
  StatusAlerta,
  TipoCliente,
  TipoArea,
  Visibilidade,
  TipoEstacao,
  StatusEstacao,
} from '@constants/enums';

// ─── Demo Context ─────────────────────────────────────────────────────────────
export type DemoRole = 'GOVERNO_DEFESA_CIVIL' | 'ONG';

// ─── Cliente ──────────────────────────────────────────────────────────────────
// Field names match GET /api/clientes response (Java serialisation).
export interface Cliente {
  idCliente: number;
  nome: string;
  tipoCliente: TipoCliente;   // API field is tipoCliente, not tipo
  documento?: string;
  emailContato?: string;
  telefone?: string;
  stAtivo?: string;
  dtCriadoEm?: string;
  dtAtualizadoEm?: string | null;
}

export interface CreateClienteRequest {
  nome: string;
  documento?: string;
  tipo: TipoCliente;
}

// ─── Região Monitorada ────────────────────────────────────────────────────────
// Field names match GET /api/regioes response (Java serialisation).
export interface RegiaoMonitorada {
  idRegiao: number;
  idCliente?: number;
  nome: string;
  cidade: string;
  estado: string;
  nivelVulnerabilidade: number;
  tipoArea: TipoArea;
  tipoVisibilidade: Visibilidade;
  latitude?: number;
  longitude?: number;
  stAtivo?: string;         // 'S' | 'N'
  dtCriadoEm?: string;
  dtAtualizadoEm?: string | null;
}

// All fields required for POST. idCliente NOT NULL per DDL.
export interface CreateRegiaoRequest {
  idCliente: number;
  nome: string;
  cidade: string;
  estado: string;
  latitude: number;
  longitude: number;
  tipoArea: TipoArea;
  nivelVulnerabilidade: number;
  tipoVisibilidade: Visibilidade;
}

// PUT = full update: same shape as create.
export type UpdateRegiaoRequest = CreateRegiaoRequest;

// ─── Estação IoT ──────────────────────────────────────────────────────────────
// Field names match GET /api/estacoes/regiao/{idRegiao} response (Java serialisation).
export interface EstacaoIot {
  idEstacao: number;           // ID_ESTACAO
  idRegiao: number;            // ID_REGIAO
  codigoEstacao: string;       // CD_EST
  nome: string;                // NM_EST
  tipoEstacao: TipoEstacao;    // TP_EST: REAL | SIMULADA | REFERENCIA
  statusEstacao: StatusEstacao; // ST_EST: ATIVA | INATIVA | MANUTENCAO | FALHA | SEM_COM
  latitude?: number | null;    // NR_LATITUDE (nullable)
  longitude?: number | null;   // NR_LONGITUDE (nullable)
  dtUltimaComunicacao?: string | null; // DT_ULTIMA_COM — API serialises as dtUltimaComunicacao
  stAtivo?: string;            // ST_ATIVO: 'S' | 'N'
  dtCriadoEm?: string;
  dtAtualizadoEm?: string | null;
}

export interface CreateEstacaoRequest {
  idRegiao: number;
  codigoEstacao: string;       // required: must not be blank (API 400 if missing)
  nome: string;
  tipoEstacao: TipoEstacao;
  statusEstacao: StatusEstacao; // required: must not be null (API 400 if missing)
  latitude?: number;
  longitude?: number;
}

// ─── Leitura IoT ──────────────────────────────────────────────────────────────
// Sensor readings from TB_AMANAJE_LEIT_IOT.
// Climate fields (temperatura, umidade, etc.) belong to ObservacaoClimatica, not here.
// Field names match GET /api/regioes/{id}/leituras response (Java serialisation).
export interface LeituraIot {
  idLeitura?: number;              // ID_LEITURA
  idEstacao?: number;              // ID_ESTACAO
  idRegiao?: number;               // ID_REGIAO
  distanciaAguaCm?: number | null; // NR_DISTANCIA_AGUA_CM — HC-SR04, Enchente
  nivelAguaPct?: number | null;    // NR_NIVEL_AGUA_PCT — HC-SR04, Enchente
  inclinacaoGraus?: number | null; // NR_INCL_GRAUS — MPU6050, Deslizamento
  vibracao?: number | null;        // NR_VIBRACAO — MPU6050, Deslizamento
  pressaoHpa?: number | null;      // NR_PRESSAO_HPA — BMP180, Tempestade
  pm25?: number | null;            // NR_PM25 — Slider (sim. PMS5003), Qualidade do ar
  pm10?: number | null;            // NR_PM10 — Slider (sim. PMS5003), Qualidade do ar
  dtLeit: string;                  // DT_LEIT — reading timestamp
  dtRecebidoEm?: string;           // DT_RECEBIDO_EM
  stValida?: string;               // ST_VALIDA: 'S' | 'N'
}

export interface CreateLeituraRequest {
  idEstacao: number;
  distanciaAguaCm?: number;
  nivelAguaPct?: number;
  inclinacaoGraus?: number;
  vibracao?: number;
  pressaoHpa?: number;
  pm25?: number;
  pm10?: number;
}

// ─── Observação Climática ─────────────────────────────────────────────────────
// External climate observations from TB_AMANAJE_OBS_CLIM — separate from IoT readings.
export interface ObservacaoClimatica {
  id: number;
  regiaoId: number;
  fonte: string;
  temperaturaC?: number;
  umidadePct?: number;
  precipitacaoMm?: number;
  ventoKmh?: number;
  pressaoHpa?: number;
  radiacaoSolar?: number;
  indiceUv?: number;
  dtObs: string;
}

// ─── Risco ────────────────────────────────────────────────────────────────────
// GET /api/regioes/{id}/risco-atual — lightweight computed result
export interface RiscoAtual {
  regiaoId: number;
  nivelRisco: NivelRisco;
  tipoRisco?: CategoriaRisco;
  scoreRisco?: number;
  avaliadoEm: string;
}

// POST /api/riscos/avaliar/{idRegiao} response — maps TB_AMANAJE_AVAL_RISCO
export interface AvaliacaoRisco {
  id: number;
  regiaoId: number;
  leituraId?: number;
  observacaoId?: number;
  tipoRisco: CategoriaRisco;
  scoreRisco: number;
  nivelRisco: NivelRisco;
  motivo: string;
  avaliadoEm: string;
}

// ─── Alerta ───────────────────────────────────────────────────────────────────
// Maps TB_AMANAJE_ALERTA. Field names match GET /api/alertas response.
// tipoAlerta includes OPERACIONAL; CategoriaRisco does not.
export interface Alerta {
  idAlerta: number;
  idRegiao: number;
  idAvaliacao?: number | null;
  tipoAlerta: TipoAlerta;
  nivelRisco: NivelRisco;
  titulo: string;
  descricao: string;
  recomendacao: string;
  statusAlerta: StatusAlerta;
  dtAlerta: string;
  dtResolvidoEm?: string | null;
  stAtivo?: string;             // 'S' | 'N'
  dtCriadoEm?: string;
  dtAtualizadoEm?: string | null;
  // Enriched client-side (not from API)
  regiaoNome?: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
// Matches GET /api/dashboard/summary response shape (confirmed live 2026-06-06).
export interface DashboardSummary {
  totalClientesAtivos: number;
  totalRegioesAtivas: number;
  totalEstacoesAtivas: number;
  totalAlertasAtivos: number;
  totalAlertasCriticos: number;
  totalAlertasAltos: number;
  totalAlertasResolvidos: number;
  totalLeiturasValidas: number;
  totalObservacoesClimaticas: number;
  totalAvaliacoesRisco: number;
  regioesComRiscoAltoOuCritico: number;
  maiorNivelRiscoAtual: NivelRisco | null;
  atualizadoEm: string;
}

// ─── Indicador Regional ───────────────────────────────────────────────────────
// Maps TB_AMANAJE_IND_REG. Field names match GET /api/indicadores-regionais response.
// Note: idRegiao is null for the national aggregate entry (estado="BR").
export interface IndicadorRegional {
  idIndicador: number;
  idRegiao: number | null;
  estado: string;
  cidade: string;
  nomeRegiao?: string | null;
  tipoRisco: CategoriaRisco;
  scoreMedio: number;
  nivelRiscoMedio: NivelRisco;
  quantidadeEstacoes: number;
  quantidadeAlertasAtivos: number;
  fonteCalculo: string;
  dtCalculo: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────
export interface ApiError {
  status: number;
  message: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
