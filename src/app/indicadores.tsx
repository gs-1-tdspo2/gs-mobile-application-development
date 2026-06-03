import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnalyticsPanel } from '@/components/AnalyticsPanel';
import { AppCard } from '@/components/AppCard';
import { AppShell } from '@/components/AppShell';
import { MetricCard } from '@/components/MetricCard';
import { StatusBadge } from '@/components/StatusBadge';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { screenStyles } from '@/styles/global';
import { useResponsiveLayout } from '@/utils/responsive';

const indicadoresDemo = [
  { label: 'Cobertura regional', value: '8', supportingText: 'Regiões com dados públicos na API' },
  { label: 'Risco crítico', value: '4', supportingText: 'Alertas críticos na base de demo' },
  { label: 'Estações', value: 'IoT', supportingText: 'Sensores simulados por região' },
];

const rankingDemo = [
  { nome: 'Cais Mauá - Porto Alegre', percentual: 86 },
  { nome: 'Comunidade Ribeirinha Educandos', percentual: 76 },
  { nome: 'Encosta Vila Nova Esperança', percentual: 72 },
];

export default function IndicadoresScreen() {
  const { isDesktop } = useResponsiveLayout();

  return (
    <AppShell activeRoute="indicadores">
      <SafeAreaView style={screenStyles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            screenStyles.scrollContent,
            isDesktop && screenStyles.desktopScrollContent,
          ]}>
        <View style={screenStyles.header}>
          <Text style={screenStyles.title}>Indicadores regionais</Text>
          <Text style={screenStyles.subtitle}>
            Visão compacta para a demonstração final. A integração analítica completa fica preparada
            para evoluir sobre /api/indicadores-regionais.
          </Text>
        </View>

        <View style={[styles.metrics, isDesktop && styles.desktopMetrics]}>
          {indicadoresDemo.map((indicador) => (
            <MetricCard
              key={indicador.label}
              label={indicador.label}
              value={indicador.value}
              supportingText={indicador.supportingText}
              accentColor={colors.primary}
              style={isDesktop && styles.desktopMetric}
            />
          ))}
        </View>

        <View style={[styles.contentColumns, isDesktop && styles.desktopColumns]}>
          <AppCard
            title="Ranking de atenção"
            subtitle="Barras simples mantêm a tela leve, sem dependência de gráficos."
            style={isDesktop && styles.rankingCard}>
            <View style={styles.ranking}>
              {rankingDemo.map((item) => (
                <View key={item.nome} style={styles.rankingItem}>
                  <View style={styles.rankingHeader}>
                    <Text style={styles.regionName}>{item.nome}</Text>
                    <Text style={styles.percent}>{item.percentual}%</Text>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.progress, { width: `${item.percentual}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          </AppCard>

          <AnalyticsPanel
            title="Analytics leve"
            subtitle="Painel indigo para web, alinhado ao Stitch desktop sem dependência de biblioteca gráfica."
            style={isDesktop && styles.analyticsCard}>
            <View style={styles.analyticsContent}>
              <StatusBadge status="Em desenvolvimento" />
              <Text style={styles.analyticsText}>
                Próxima evolução: consumir /api/indicadores-regionais e substituir os dados de
                demonstração por métricas reais.
              </Text>
            </View>
          </AnalyticsPanel>
        </View>
        </ScrollView>
      </SafeAreaView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  metrics: {
    gap: spacing.sm,
  },
  desktopMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  desktopMetric: {
    flexBasis: '30%',
    flexGrow: 1,
    minWidth: 220,
  },
  contentColumns: {
    gap: spacing.md,
  },
  desktopColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rankingCard: {
    flexBasis: '62%',
    flexGrow: 1,
    minWidth: 520,
  },
  analyticsCard: {
    flexBasis: '30%',
    flexGrow: 1,
    minWidth: 300,
  },
  ranking: {
    gap: spacing.md,
  },
  rankingItem: {
    gap: spacing.xs,
  },
  rankingHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  regionName: {
    color: colors.neutralText,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  percent: {
    color: colors.primaryBase,
    fontSize: 13,
    fontWeight: '800',
  },
  track: {
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  progress: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 8,
  },
  analyticsContent: {
    gap: spacing.md,
  },
  analyticsText: {
    color: colors.analyticsSurface,
    fontSize: 14,
    lineHeight: 20,
  },
});
