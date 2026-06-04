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
  { label: 'Cobertura regional', value: '8', supportingText: 'Regiões com leitura operacional' },
  { label: 'Risco crítico', value: '4', supportingText: 'Alertas críticos acompanhados' },
  { label: 'Estações', value: 'IoT', supportingText: 'Sensores simulados por região' },
];

const rankingDemo = [
  { nome: 'Cais Mauá - Porto Alegre', percentual: 86 },
  { nome: 'Comunidade Ribeirinha Educandos', percentual: 76 },
  { nome: 'Encosta Vila Nova Esperança', percentual: 72 },
];

const distribuicaoDemo = [
  { label: 'Risco baixo', value: 42, color: '#2E7D32' },
  { label: 'Moderado', value: 31, color: colors.warningOrange },
  { label: 'Alto', value: 18, color: colors.highRisk },
  { label: 'Crítico', value: 9, color: colors.criticalRed },
];

const historicoDemo = [
  'Risco hídrico revisado nas regiões ribeirinhas.',
  'Alertas críticos priorizados para Defesa Civil.',
  'Tendências regionais consolidadas para análise institucional.',
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
            Painel analítico leve para comparar risco regional, cobertura e ocorrências ambientais.
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
            subtitle="Priorização regional para apoiar leitura executiva do risco."
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
            title="Distribuição de risco"
            subtitle="Composição dos níveis de risco no cenário monitorado."
            style={isDesktop && styles.analyticsCard}>
            <View style={styles.analyticsContent}>
              {distribuicaoDemo.map((item) => (
                <View key={item.label} style={styles.distributionItem}>
                  <View style={styles.distributionHeader}>
                    <Text style={styles.distributionLabel}>{item.label}</Text>
                    <Text style={styles.distributionValue}>{item.value}%</Text>
                  </View>
                  <View style={styles.darkTrack}>
                    <View
                      style={[
                        styles.darkProgress,
                        { backgroundColor: item.color, width: `${item.value}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </AnalyticsPanel>
        </View>

        <AppCard
          title="Histórico operacional"
          subtitle="Eventos recentes para contextualizar a operação ambiental."
          variant="elevated">
          <View style={styles.historyList}>
            {historicoDemo.map((item) => (
              <View key={item} style={styles.historyItem}>
                <View style={styles.historyDot} />
                <Text style={styles.historyText}>{item}</Text>
              </View>
            ))}
          </View>
        </AppCard>

        <AppCard title="Status do painel" subtitle="Indicadores em acompanhamento contínuo." variant="compact">
          <StatusBadge status="Em desenvolvimento" />
        </AppCard>
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
  distributionItem: {
    gap: spacing.xs,
  },
  distributionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distributionLabel: {
    color: colors.analyticsSurface,
    fontSize: 13,
    fontWeight: '700',
  },
  distributionValue: {
    color: colors.offWhite,
    fontSize: 13,
    fontWeight: '800',
  },
  darkTrack: {
    backgroundColor: '#FFFFFF24',
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  darkProgress: {
    borderRadius: 999,
    height: 8,
  },
  historyList: {
    gap: spacing.md,
  },
  historyItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  historyDot: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 999,
    height: 8,
    marginTop: 6,
    width: 8,
  },
  historyText: {
    color: colors.mutedText,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
