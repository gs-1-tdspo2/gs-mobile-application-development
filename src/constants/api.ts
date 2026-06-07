// Render free-tier: spins down after ~15 min idle.
// Cold start can take 30–60 s. Use API_TIMEOUT_COLD_START for the
// /api/health warm-up probe; API_TIMEOUT for all subsequent calls.

export const API_BASE_URL = 'https://gs-java-advanced.onrender.com';

export const API_TIMEOUT = 15_000;
export const API_TIMEOUT_COLD_START = 65_000;

export const API_ENDPOINTS = {
  // Health — warm-up probe on app launch
  HEALTH: '/api/health',

  // Clientes
  CLIENTES: '/api/clientes',

  // Regiões
  REGIOES: '/api/regioes',
  REGIAO_BY_ID: (id: number) => `/api/regioes/${id}`,
  REGIAO_LEITURAS: (id: number) => `/api/regioes/${id}/leituras`,
  REGIAO_RISCO_ATUAL: (id: number) => `/api/regioes/${id}/risco-atual`,

  // Estações
  ESTACOES: '/api/estacoes',
  ESTACOES_BY_REGIAO: (idRegiao: number) => `/api/estacoes/regiao/${idRegiao}`,

  // Leituras
  LEITURAS: '/api/leituras',

  // Riscos
  RISCOS_AVALIAR: (idRegiao: number) => `/api/riscos/avaliar/${idRegiao}`,

  // Alertas
  ALERTAS: '/api/alertas',
  ALERTA_RESOLVER: (id: number) => `/api/alertas/${id}/resolver`,

  // Observações Climáticas
  REGIAO_OBS_CLIMATICA_ULTIMA: (id: number) => `/api/regioes/${id}/observacoes-climaticas/ultima`,

  // Dashboard & Indicadores
  DASHBOARD_SUMMARY: '/api/dashboard/summary',
  INDICADORES_REGIONAIS: '/api/indicadores-regionais',
} as const;
