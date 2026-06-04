import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppShell } from '@/components/AppShell';
import { getDashboardSummary } from '@/services/dashboardService';
import { DashboardSummary } from '@/types/dashboard';
import { getApiErrorMessage } from '@/utils/apiError';

export default function HomeScreen() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (e) {
      setSummary(null);
      setError(getApiErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <AppShell activeRoute="dashboard">
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Dashboard Operacional</Text>

          {isLoading ? (
            <Text style={styles.status}>Carregando...</Text>
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Não foi possível carregar os dados da API.</Text>
              <Text style={styles.errorDetail}>{error}</Text>
            </View>
          ) : (
            <View style={styles.metricsGrid}>
              <MetricBox label="Regiões monitoradas" value={fmt(summary?.totalRegioes)} />
              <MetricBox label="Estações ativas"     value={fmt(summary?.totalEstacoesAtivas)} />
              <MetricBox label="Alertas ativos"      value={fmt(summary?.alertasAtivos)} />
              <MetricBox label="Alertas críticos"    value={fmt(summary?.alertasCriticos)} />
              <MetricBox label="Leituras válidas"    value={fmt(summary?.leiturasValidas)} />
              <MetricBox label="Maior risco atual"   value={summary?.maiorRiscoAtual ?? '—'} />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </AppShell>
  );
}

function fmt(v?: number | null): string {
  return v === undefined || v === null ? '—' : String(v);
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scroll: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
  },
  status: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  errorBox: {
    backgroundColor: '#fff5f5',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    gap: 4,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b91c1c',
  },
  errorDetail: {
    fontSize: 12,
    color: '#6b7280',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricBox: {
    backgroundColor: '#ffffff',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    minWidth: 160,
    flex: 1,
    gap: 6,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
});
