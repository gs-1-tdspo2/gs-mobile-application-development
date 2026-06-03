export type DashboardSummary = {
  totalRegioes?: number;
  totalAlertasAtivos?: number;
  totalAlertasResolvidos?: number;
  regioesEmRiscoCritico?: number;
  atualizadoEm?: string;
  [key: string]: unknown;
};
