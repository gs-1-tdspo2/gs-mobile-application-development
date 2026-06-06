import { api } from './api';
import { API_ENDPOINTS } from '@constants/api';
import type { DashboardSummary } from '@/types';

// Returns undefined when the server responds with HTTP 204 (no data yet).
export async function fetchDashboardSummary(): Promise<DashboardSummary | undefined> {
  return api.get<DashboardSummary | undefined>(API_ENDPOINTS.DASHBOARD_SUMMARY);
}
