import { RiscoNivel } from '@/types/risco';

export type DashboardSummaryRaw = {
  totalRegioes?: number;
  totalRegions?: number;
  totalAlertasAtivos?: number;
  activeAlerts?: number;
  alertasAtivos?: number;
  totalAlertasCriticos?: number;
  criticalAlerts?: number;
  alertasCriticos?: number;
  totalAlertasResolvidos?: number;
  regioesEmRiscoCritico?: number;
  maiorRiscoAtual?: RiscoNivel | string;
  highestCurrentRisk?: RiscoNivel | string;
  maiorRisco?: RiscoNivel | string;
  atualizadoEm?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type DashboardSummary = {
  totalRegioes?: number;
  alertasAtivos?: number;
  alertasCriticos?: number;
  maiorRiscoAtual?: RiscoNivel;
  atualizadoEm?: string;
  raw?: DashboardSummaryRaw;
};
