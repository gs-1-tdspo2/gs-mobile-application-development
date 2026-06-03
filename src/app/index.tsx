import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { MetricCard } from '@/components/MetricCard';
import { RiskBadge } from '@/components/RiskBadge';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { getDashboardSummary } from '@/services/dashboardService';
import { screenStyles } from '@/styles/global';
import { DashboardSummary } from '@/types/dashboard';
import { getApiErrorMessage } from '@/utils/apiError';

export default function HomeScreen() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (error) {
      setSummary(null);
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadDashboard);
  }, [loadDashboard]);

  return (
    <SafeAreaView style={screenStyles.safeArea}>
      <ScrollView contentContainerStyle={screenStyles.scrollContent}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Monitoramento climático e ambiental</Text>
          <Text style={styles.title}>Amanajé</Text>
          <Text style={styles.description}>
            MVP mobile para acompanhar regioes vulneraveis, risco ambiental, alertas e
            indicadores regionais conectados a API Java da Global Solution.
          </Text>
          <View style={styles.badges}>
            <RiskBadge nivel="BAIXO" />
            <RiskBadge nivel="MODERADO" />
            <RiskBadge nivel="ALTO" />
            <RiskBadge nivel="CRITICO" />
          </View>
        </View>

        {isLoading ? <LoadingState message="Carregando resumo do monitoramento..." /> : null}

        {errorMessage ? <ErrorState message={errorMessage} onRetry={loadDashboard} /> : null}

        {!isLoading && !errorMessage && !hasDashboardData(summary) ? (
          <EmptyState
            title="Resumo ainda indisponível"
            description="Quando a API retornar dados do dashboard, os indicadores principais aparecerao aqui."
          />
        ) : null}

        {!isLoading && !errorMessage && hasDashboardData(summary) ? (
          <View style={styles.metricsGrid}>
            <MetricCard
              label="Regiões monitoradas"
              value={formatMetric(summary.totalRegioes)}
              supportingText="Total cadastrado na API"
              accentColor={colors.primary}
            />
            <MetricCard
              label="Alertas ativos"
              value={formatMetric(summary.alertasAtivos)}
              supportingText="Pendências de monitoramento"
              accentColor={colors.warningOrange}
            />
            <MetricCard
              label="Alertas críticos"
              value={formatMetric(summary.alertasCriticos)}
              supportingText="Prioridade imediata"
              accentColor={colors.criticalRed}
            />
            <MetricCard
              label="Maior risco atual"
              value={summary.maiorRiscoAtual ?? '-'}
              supportingText="Nível consolidado mais severo"
              accentColor={colors.highRisk}
            />
          </View>
        ) : null}

        <View style={styles.grid}>
          <AppCard
            title="Regiões"
            subtitle="Visualize regiões monitoradas, risco atual e alertas ativos.">
            <AppButton label="Abrir regiões" href="/regioes" />
          </AppCard>

          <AppCard
            title="Gerenciar Regiões"
            subtitle="Espaço reservado para o futuro fluxo de cadastro e manutenção.">
            <AppButton label="Gerenciar" href="/gerenciar-regioes" variant="secondary" />
          </AppCard>

          <AppCard
            title="Alertas"
            subtitle="Acompanhe futuramente alertas ambientais e sua resolução.">
            <AppButton label="Ver alertas" href="/alertas" variant="secondary" />
          </AppCard>

          <AppCard
            title="Indicadores"
            subtitle="Consulte futuramente métricas regionais e sinais de risco.">
            <AppButton label="Ver indicadores" href="/indicadores" variant="secondary" />
          </AppCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function hasDashboardData(summary: DashboardSummary | null): summary is DashboardSummary {
  if (!summary) {
    return false;
  }

  return (
    summary.totalRegioes !== undefined ||
    summary.alertasAtivos !== undefined ||
    summary.alertasCriticos !== undefined ||
    summary.maiorRiscoAtual !== undefined
  );
}

function formatMetric(value?: number): string {
  return value === undefined ? '-' : String(value);
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  eyebrow: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.offWhite,
    fontSize: 34,
    fontWeight: '800',
  },
  description: {
    color: colors.offWhite,
    fontSize: 16,
    lineHeight: 24,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  metricsGrid: {
    gap: spacing.sm,
  },
  grid: {
    gap: spacing.md,
  },
});
