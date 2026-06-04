import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppShell } from '@/components/AppShell';
import { getDashboardSummary } from '@/services/dashboardService';
import { DashboardSummary } from '@/types/dashboard';
import { getApiErrorMessage } from '@/utils/apiError';
import { useResponsiveLayout } from '@/utils/responsive';

function fmt(v?: number | null): string {
  return v === undefined || v === null ? '—' : String(v);
}

function fmtTime(ts?: string): string | null {
  if (!ts) return null;
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return null;
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return null;
  }
}

function riskColor(nivel?: string): string {
  if (nivel === 'CRITICO')  return '#D32F2F';
  if (nivel === 'ALTO')     return '#EF6C00';
  if (nivel === 'MODERADO') return '#F9A825';
  if (nivel === 'BAIXO')    return '#2E7D32';
  return '#3F51B5';
}

export default function HomeScreen() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDesktop } = useResponsiveLayout();

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

  const updatedAt = summary ? fmtTime(summary.atualizadoEm) : null;
  const kpiStyle  = isDesktop ? styles.kpiCardDesktop : styles.kpiCardMobile;

  return (
    <AppShell activeRoute="dashboard">
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            isDesktop && styles.scrollDesktop,
          ]}>

          {/* ── Page header ──────────────────────────── */}
          <View style={[styles.pageHeader, isDesktop && styles.pageHeaderRow]}>
            <Text style={styles.pageTitle}>Dashboard</Text>
            {updatedAt ? (
              <Text style={styles.updatedAt}>Atualizado: {updatedAt}</Text>
            ) : null}
          </View>

          {/* ── Loading ──────────────────────────────── */}
          {isLoading ? (
            <View style={styles.statusCard}>
              <Text style={styles.statusText}>Carregando dados operacionais...</Text>
            </View>
          ) : null}

          {/* ── Error ────────────────────────────────── */}
          {!isLoading && error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Não foi possível carregar os dados.</Text>
              <Text style={styles.errorDetail}>{error}</Text>
            </View>
          ) : null}

          {/* ── Data ─────────────────────────────────── */}
          {!isLoading && !error && summary ? (
            <>

              {/* ── KPI grid ─────────────────────────── */}
              <View style={styles.kpiGrid}>
                {([
                  { label: 'Regiões Monitoradas', value: fmt(summary.totalRegioes),        footer: 'áreas cadastradas',    accent: '#3F51B5' },
                  { label: 'Estações Ativas',      value: fmt(summary.totalEstacoesAtivas), footer: 'sensores em operação', accent: '#009688' },
                  { label: 'Alertas Ativos',       value: fmt(summary.alertasAtivos),       footer: 'ocorrências abertas',  accent: '#EF6C00' },
                  { label: 'Alertas Críticos',     value: fmt(summary.alertasCriticos),     footer: 'urgência máxima',      accent: '#D32F2F' },
                  { label: 'Leituras Válidas',     value: fmt(summary.leiturasValidas),     footer: 'amostras processadas', accent: '#3F51B5' },
                  { label: 'Maior Risco Atual',    value: summary.maiorRiscoAtual ?? '—',  footer: 'nível consolidado',    accent: riskColor(summary.maiorRiscoAtual) },
                ] as const).map((item) => (
                  <KpiCard key={item.label} {...item} style={kpiStyle} />
                ))}
              </View>

              {/* ── Operational panels ───────────────── */}
              <View style={[styles.panelRow, isDesktop && styles.panelRowDesktop]}>

                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Panorama Operacional</Text>
                  <View style={styles.panelDivider} />
                  <SummaryRow label="Clientes ativos"                value={fmt(summary.totalClientesAtivos)} />
                  <SummaryRow label="Regiões em risco alto/crítico"  value={fmt(summary.regioesComRiscoAltoOuCritico)} />
                  <SummaryRow label="Observações climáticas"         value={fmt(summary.observacoesClimaticas)} />
                  <SummaryRow label="Avaliações de risco"            value={fmt(summary.avaliacoesRisco)} />
                </View>

                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Alertas e Resposta</Text>
                  <View style={styles.panelDivider} />
                  <AlertBar label="Ativos"     value={summary.alertasAtivos}    max={summary.alertasAtivos}   color="#EF6C00" />
                  <AlertBar label="Críticos"   value={summary.alertasCriticos}  max={summary.alertasAtivos}   color="#D32F2F" />
                  <AlertBar label="Altos"      value={summary.alertasAltos}     max={summary.alertasAtivos}   color="#F9A825" />
                  <AlertBar
                    label="Resolvidos"
                    value={summary.alertasResolvidos}
                    max={(summary.alertasAtivos ?? 0) + (summary.alertasResolvidos ?? 0)}
                    color="#2E7D32"
                  />
                </View>

              </View>

            </>
          ) : null}

        </ScrollView>
      </SafeAreaView>
    </AppShell>
  );
}

/* ── Sub-components ──────────────────────────────────── */

function KpiCard({
  label, value, footer, accent, style,
}: {
  label: string; value: string; footer: string; accent: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[kpi.card, { borderTopColor: accent }, style]}>
      <Text style={kpi.label}>{label}</Text>
      <Text style={[kpi.value, { color: accent }]}>{value}</Text>
      <Text style={kpi.footer}>{footer}</Text>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={sr.row}>
      <Text style={sr.label}>{label}</Text>
      <Text style={sr.value}>{value}</Text>
    </View>
  );
}

function AlertBar({
  label, value, max, color,
}: {
  label: string; value?: number; max?: number; color: string;
}) {
  const pct     = value !== undefined && max ? Math.round((value / max) * 100) : 0;
  const display = value !== undefined ? String(value) : '—';
  return (
    <View style={ab.row}>
      <Text style={ab.label}>{label}</Text>
      <View style={ab.track}>
        <View style={[ab.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[ab.count, { color }]}>{display}</Text>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────── */

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F4F5F7',
    flex: 1,
  },
  scroll: {
    gap: 20,
    padding: 20,
  },
  scrollDesktop: {
    alignSelf: 'center',
    maxWidth: 1320,
    padding: 24,
    paddingBottom: 48,
    width: '100%',
  },

  pageHeader: { gap: 4 },
  pageHeaderRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pageTitle: {
    color: '#1F2937',
    fontSize: 24,
    fontWeight: '700',
  },
  updatedAt: {
    color: '#6B7280',
    fontSize: 12,
  },

  statusCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE2EA',
    borderRadius: 8,
    borderWidth: 1,
    padding: 20,
  },
  statusText: {
    color: '#6B7280',
    fontSize: 14,
  },

  errorCard: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FECACA',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 16,
  },
  errorTitle: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '600',
  },
  errorDetail: {
    color: '#6B7280',
    fontSize: 12,
  },

  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCardMobile: {
    flex: 1,
    minWidth: 150,
  },
  kpiCardDesktop: {
    flexBasis: '30%',
    flexGrow: 1,
  },

  panelRow:        { gap: 16 },
  panelRowDesktop: { flexDirection: 'row' },

  panel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE2EA',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
  },
  panelTitle: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    padding: 16,
    paddingBottom: 12,
  },
  panelDivider: {
    backgroundColor: '#DDE2EA',
    height: 1,
  },
});

const kpi = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE2EA',
    borderRadius: 8,
    borderTopWidth: 3,
    borderWidth: 1,
    gap: 4,
    padding: 16,
  },
  label: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  footer: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
});

const sr = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomColor: '#F3F4F6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    color: '#6B7280',
    flex: 1,
    fontSize: 13,
  },
  value: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 16,
    textAlign: 'right',
  },
});

const ab = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomColor: '#F3F4F6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  label: {
    color: '#6B7280',
    fontSize: 12,
    width: 72,
  },
  track: {
    backgroundColor: '#F3F4F6',
    borderRadius: 99,
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 99,
    height: 6,
  },
  count: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    width: 28,
  },
});
