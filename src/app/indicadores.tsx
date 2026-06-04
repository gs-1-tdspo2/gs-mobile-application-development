import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/AppCard';
import { AppShell } from '@/components/AppShell';
import { MetricCard } from '@/components/MetricCard';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { screenStyles } from '@/styles/global';
import { useResponsiveLayout } from '@/utils/responsive';

const metrics = [
  { label: 'Cobertura regional',  value: '8',    sub: 'Regiões com leitura ativa', accent: '#3F51B5', icon: '◎' },
  { label: 'Risco crítico',       value: '4',    sub: 'Alertas críticos ativos',   accent: '#D32F2F', icon: '⚠' },
  { label: 'Estações ativas',     value: '10',   sub: 'Sensores em operação',      accent: '#009688', icon: '●' },
  { label: 'Leituras válidas',    value: '205',  sub: 'Amostras aceitas',          accent: '#2E7D32', icon: '✓' },
];

const ranking = [
  { nome: 'Cais Mauá – Porto Alegre',         pct: 86, color: '#D32F2F' },
  { nome: 'Comunidade Ribeirinha Educandos',  pct: 74, color: '#EF6C00' },
  { nome: 'Encosta Vila Nova Esperança',      pct: 58, color: '#F9A825' },
  { nome: 'Parque das Águas',                 pct: 31, color: '#3F51B5' },
  { nome: 'Zona Industrial Norte',            pct: 12, color: '#3F51B5' },
];

const ocorrencias = [
  { tipo: 'CALOR EXTREMO',  qt: 124, color: '#D32F2F' },
  { tipo: 'CHUVA INTENSA',  qt: 82,  color: '#3F51B5' },
  { tipo: 'UV ELEVADO',     qt: 61,  color: '#9FA8DA' },
  { tipo: 'AR SECO',        qt: 42,  color: '#3F51B5' },
  { tipo: 'VENTOS FORTES',  qt: 12,  color: '#C5CAE9' },
];

const historico = [
  { ts: '2024-11-24 14:12', regiao: 'Zona Norte',  tipo: 'Temp > 38°C',       nivel: 'CRÍTICO', status: 'Ativo',     cor: '#D32F2F' },
  { ts: '2024-11-24 13:55', regiao: 'Centro',       tipo: 'Umidade < 15%',     nivel: 'ALTO',    status: 'Resolvido', cor: '#EF6C00' },
  { ts: '2024-11-24 12:30', regiao: 'Zona Leste',   tipo: 'Foco de calor',     nivel: 'MÉDIO',   status: 'Análise',   cor: '#F9A825' },
];

export default function IndicadoresScreen() {
  const { isDesktop } = useResponsiveLayout();

  const maxQt = Math.max(...ocorrencias.map((o) => o.qt));

  return (
    <AppShell activeRoute="indicadores">
      <SafeAreaView style={screenStyles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            screenStyles.scrollContent,
            isDesktop && screenStyles.desktopScrollContent,
          ]}>

          {/* ── Page header ─────────────────────────── */}
          <Text style={styles.title}>Indicadores Regionais</Text>

          {/* ── Metric cards ────────────────────────── */}
          <View style={[styles.metricsRow, isDesktop && styles.metricsRowDesktop]}>
            {metrics.map((m) => (
              <MetricCard
                key={m.label}
                label={m.label}
                value={m.value}
                supportingText={m.sub}
                accentColor={m.accent}
                icon={m.icon}
                style={[styles.metric, isDesktop && styles.metricDesktop]}
              />
            ))}
          </View>

          {/* ── Mid row: ranking + ocorrências ──────── */}
          <View style={[styles.midRow, isDesktop && styles.midRowDesktop]}>

            <AppCard
              title="Ranking de Risco Regional"
              subtitle="Priorização de regiões por nível de exposição ao risco."
              variant="elevated"
              style={[styles.rankingCard, isDesktop && styles.rankingCardDesktop]}>
              <View style={styles.rankingList}>
                {ranking.map((item) => (
                  <View key={item.nome} style={styles.rankItem}>
                    <View style={styles.rankHeader}>
                      <Text style={styles.rankNome}>{item.nome}</Text>
                      <Text style={[styles.rankPct, { color: item.color }]}>{item.pct}%</Text>
                    </View>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
                    </View>
                  </View>
                ))}
              </View>
              <Text style={styles.footnote}>* Dados consolidados via sensoriamento e estações terrestres.</Text>
            </AppCard>

            <AppCard
              title="Tipos de Ocorrência"
              subtitle="Distribuição de eventos por categoria no período."
              variant="elevated"
              style={[styles.occCard, isDesktop && styles.occCardDesktop]}>
              <View style={styles.occList}>
                {ocorrencias.map((o) => (
                  <View key={o.tipo} style={styles.occRow}>
                    <Text style={styles.occTipo}>{o.tipo}</Text>
                    <View style={styles.occBarWrap}>
                      <View style={[styles.occBar, { width: `${(o.qt / maxQt) * 100}%`, backgroundColor: o.color }]} />
                    </View>
                    <Text style={styles.occQt}>{o.qt}</Text>
                  </View>
                ))}
              </View>
            </AppCard>

          </View>

          {/* ── History table ───────────────────────── */}
          <AppCard
            title="Histórico Recente de Alertas"
            subtitle="Ocorrências processadas no período atual."
            variant="elevated">
            {isDesktop ? (
              <View style={styles.histTable}>
                <View style={styles.histHead}>
                  {['TIMESTAMP', 'REGIÃO', 'TIPO', 'SEVERIDADE', 'STATUS'].map((h) => (
                    <Text key={h} style={[styles.histTh, h === 'TIMESTAMP' ? styles.colTs : h === 'TIPO' ? styles.colTipo : styles.colDefault]}>
                      {h}
                    </Text>
                  ))}
                </View>
                {historico.map((row) => (
                  <View key={row.ts} style={styles.histRow}>
                    <Text style={[styles.histCell, styles.colTs, styles.tsText]}>{row.ts}</Text>
                    <Text style={[styles.histCell, styles.colDefault]}>{row.regiao}</Text>
                    <Text style={[styles.histCell, styles.colTipo]}>{row.tipo}</Text>
                    <View style={[styles.colDefault]}>
                      <View style={[styles.nivelBadge, { backgroundColor: row.cor }]}>
                        <Text style={styles.nivelBadgeText}>{row.nivel}</Text>
                      </View>
                    </View>
                    <Text style={[styles.histCell, styles.colDefault, styles.statusText]}>{row.status}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.mobileHistList}>
                {historico.map((row) => (
                  <View key={row.ts} style={styles.mobileHistRow}>
                    <View style={[styles.mobileHistDot, { backgroundColor: row.cor }]} />
                    <View style={styles.mobileHistText}>
                      <Text style={styles.mobileHistTitle}>{row.tipo}</Text>
                      <Text style={styles.mobileHistMeta}>{row.regiao} · {row.ts}</Text>
                      <Text style={[styles.mobileHistStatus, { color: row.cor }]}>{row.nivel} · {row.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </AppCard>

        </ScrollView>
      </SafeAreaView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  title:   { color: colors.neutralText, fontSize: 22, fontWeight: '700' },

  metricsRow: { gap: spacing.sm },
  metricsRowDesktop: { flexDirection: 'row', gap: spacing.md },
  metric: { flex: 1 },
  metricDesktop: { flexBasis: '22%', flexGrow: 1, minWidth: 160 },

  midRow: { gap: spacing.md },
  midRowDesktop: { flexDirection: 'row', alignItems: 'flex-start' },

  rankingCard: { flex: 1 },
  rankingCardDesktop: { flexBasis: '60%', flexGrow: 1 },
  rankingList: { gap: 14 },
  rankItem: { gap: 5 },
  rankHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  rankNome: { color: colors.neutralText, flex: 1, fontSize: 13, fontWeight: '500' },
  rankPct: { fontSize: 12, fontWeight: '700' },
  track: { backgroundColor: '#EEF0F4', borderRadius: 99, height: 6, overflow: 'hidden' },
  fill: { borderRadius: 99, height: 6 },
  footnote: { color: colors.mutedText, fontSize: 11, fontStyle: 'italic', marginTop: 14 },

  occCard: { flex: 1 },
  occCardDesktop: { flexBasis: '36%', flexGrow: 1 },
  occList: { gap: 10 },
  occRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  occTipo: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.3, width: 100 },
  occBarWrap: { backgroundColor: '#EEF0F4', borderRadius: 99, flex: 1, height: 8, overflow: 'hidden' },
  occBar: { borderRadius: 99, height: 8 },
  occQt: { color: colors.neutralText, fontSize: 12, fontWeight: '700', textAlign: 'right', width: 32 },

  histTable: { gap: 0 },
  histHead: {
    backgroundColor: '#F8F9FB',
    borderBottomColor: '#DDE1EA',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 8,
  },
  histTh: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, paddingHorizontal: 6 },
  histRow: {
    alignItems: 'center',
    borderBottomColor: '#EEF0F4',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 44,
    paddingVertical: 8,
  },
  histCell: { color: colors.mutedText, fontSize: 13, paddingHorizontal: 6 },
  colTs: { width: 140 },
  colTipo: { flex: 1 },
  colDefault: { width: 120 },
  tsText: { color: colors.primary500, fontWeight: '500' },
  statusText: { color: '#166534' },

  nivelBadge: { alignSelf: 'flex-start', borderRadius: 4, marginHorizontal: 6, paddingHorizontal: 8, paddingVertical: 3 },
  nivelBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  mobileHistList: { gap: 12 },
  mobileHistRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10 },
  mobileHistDot: { borderRadius: 99, height: 8, marginTop: 4, width: 8 },
  mobileHistText: { flex: 1 },
  mobileHistTitle: { color: colors.neutralText, fontSize: 13, fontWeight: '600' },
  mobileHistMeta: { color: colors.mutedText, fontSize: 12, marginTop: 1 },
  mobileHistStatus: { fontSize: 12, fontWeight: '600', marginTop: 1 },
});
