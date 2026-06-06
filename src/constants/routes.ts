export const Routes = {
  // Entry
  CONTEXT_SELECTOR: '/context-selector' as const,

  // Main app tabs
  DASHBOARD: '/(app)/dashboard' as const,
  REGIOES: '/(app)/regioes' as const,
  ALERTAS: '/(app)/alertas' as const,
  INDICADORES: '/(app)/indicadores' as const,

  // Defesa Civil only (Phases 7–8)
  GERENCIAR: '/(app)/gerenciar' as const,
  ESTACOES: '/(app)/estacoes' as const,

  // Detail screens (Phase 4)
  REGIAO_DETAIL: (id: number) => `/regioes/${id}` as const,
} as const;
