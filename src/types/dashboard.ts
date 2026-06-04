import { RiscoNivel } from '@/types/risco';

export type DashboardSummaryRaw = {
  totalClientesAtivos?: number;
  totalRegioes?: number;
  totalRegioesAtivas?: number;
  totalRegions?: number;
  totalEstacoesAtivas?: number;
  totalAlertasAtivos?: number;
  totalAlertasAltos?: number;
  activeAlerts?: number;
  alertasAtivos?: number;
  totalAlertasCriticos?: number;
  criticalAlerts?: number;
  alertasCriticos?: number;
  totalAlertasResolvidos?: number;
  totalLeiturasValidas?: number;
  totalObservacoesClimaticas?: number;
  totalAvaliacoesRisco?: number;
  regioesComRiscoAltoOuCritico?: number;
  regioesEmRiscoCritico?: number;
  maiorNivelRiscoAtual?: RiscoNivel | string;
  maiorRiscoAtual?: RiscoNivel | string;
  highestCurrentRisk?: RiscoNivel | string;
  maiorRisco?: RiscoNivel | string;
  atualizadoEm?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type DashboardSummary = {
  totalClientesAtivos?: number;
  totalRegioes?: number;
  totalEstacoesAtivas?: number;
  alertasAtivos?: number;
  alertasCriticos?: number;
  alertasAltos?: number;
  alertasResolvidos?: number;
  leiturasValidas?: number;
  observacoesClimaticas?: number;
  avaliacoesRisco?: number;
  regioesComRiscoAltoOuCritico?: number;
  maiorRiscoAtual?: RiscoNivel;
  atualizadoEm?: string;
  raw?: DashboardSummaryRaw;
};
