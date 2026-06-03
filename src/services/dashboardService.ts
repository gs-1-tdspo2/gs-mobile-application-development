import { api } from '@/services/api';
import { DashboardSummary } from '@/types/dashboard';

export async function buscarResumoDashboard(): Promise<DashboardSummary> {
  const response = await api.get<DashboardSummary>('/api/dashboard/summary');
  return response.data;
}

export async function verificarSaudeApi(): Promise<unknown> {
  const response = await api.get('/api/health');
  return response.data;
}
