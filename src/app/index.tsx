import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnalyticsPanel } from '@/components/AnalyticsPanel';
import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { AppShell } from '@/components/AppShell';
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
import { useResponsiveLayout } from '@/utils/responsive';

export default function HomeScreen() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { isDesktop } = useResponsiveLayout();

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
    <AppShell activeRoute="dashboard">
      <SafeAreaView style={screenStyles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            screenStyles.scrollContent,
            isDesktop && screenStyles.desktopScrollContent,
          ]}>
        <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
          <Text style={styles.eyebrow}>Monitoramento climático e ambiental</Text>
          <Text style={styles.title}>Amanajé</Text>
          <Text style={styles.description}>
            MVP mobile para acompanhar regiões vulneráveis, risco ambiental, alertas e
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
            description="Quando a API retornar dados do dashboard, os indicadores principais aparecerão aqui."
          />
        ) : null}

        {!isLoading && !errorMessage && hasDashboardData(summary) ? (
          <View style={[styles.metricsGrid, isDesktop && styles.desktopGrid]}>
            <MetricCard
              label="Regiões monitoradas"
              value={formatMetric(summary.totalRegioes)}
              supportingText="Total cadastrado na API"
              accentColor={colors.primary}
              style={isDesktop && styles.metricDesktopItem}
            />
            <MetricCard
              label="Alertas ativos"
              value={formatMetric(summary.alertasAtivos)}
              supportingText="Pendências de monitoramento"
              accentColor={colors.warningOrange}
              style={isDesktop && styles.metricDesktopItem}
            />
            <MetricCard
              label="Alertas críticos"
              value={formatMetric(summary.alertasCriticos)}
              supportingText="Prioridade imediata"
              accentColor={colors.criticalRed}
              style={isDesktop && styles.metricDesktopItem}
            />
            <MetricCard
              label="Maior risco atual"
              value={summary.maiorRiscoAtual ?? '-'}
              supportingText="Nível consolidado mais severo"
              accentColor={colors.highRisk}
              style={isDesktop && styles.metricDesktopItem}
            />
          </View>
        ) : null}

        <AnalyticsPanel
          title="Operação conectada"
          subtitle="Layout web responsivo inspirado nos painéis desktop do Stitch, com API Java consumida pelo cliente Expo.">
          <View style={styles.panelRows}>
            <Text style={styles.panelText}>Base demo: https://gs-java-advanced.onrender.com</Text>
            <Text style={styles.panelText}>Render pode demorar na primeira chamada após inatividade.</Text>
          </View>
        </AnalyticsPanel>

        <View style={[styles.grid, isDesktop && styles.desktopGrid]}>
          <AppCard
            title="Regiões"
            subtitle="Visualize regiões monitoradas, risco atual e alertas ativos."
            style={isDesktop && styles.quickDesktopItem}>
            <AppButton label="Abrir regiões" href="/regioes" />
          </AppCard>

          <AppCard
            title="Gerenciar Regiões"
            subtitle="Crie, edite e remova regiões monitoradas pela API."
            style={isDesktop && styles.quickDesktopItem}>
            <AppButton label="Gerenciar" href="/gerenciar-regioes" variant="secondary" />
          </AppCard>

          <AppCard
            title="Alertas"
            subtitle="Acompanhe alertas ambientais e resolva ocorrências ativas."
            style={isDesktop && styles.quickDesktopItem}>
            <AppButton label="Ver alertas" href="/alertas" variant="secondary" />
          </AppCard>

          <AppCard
            title="Indicadores"
            subtitle="Consulte futuramente métricas regionais e sinais de risco."
            style={isDesktop && styles.quickDesktopItem}>
            <AppButton label="Ver indicadores" href="/indicadores" variant="secondary" />
          </AppCard>
        </View>
        </ScrollView>
      </SafeAreaView>
    </AppShell>
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
  heroDesktop: {
    padding: spacing.xl,
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
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricDesktopItem: {
    flexGrow: 1,
    flexBasis: '23%',
    minWidth: 220,
  },
  quickDesktopItem: {
    flexGrow: 1,
    flexBasis: '48%',
    minWidth: 280,
  },
  panelRows: {
    gap: spacing.xs,
  },
  panelText: {
    color: colors.analyticsSurface,
    fontSize: 14,
    lineHeight: 20,
  },
});
