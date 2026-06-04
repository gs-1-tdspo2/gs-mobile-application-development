import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FilterChip } from '@/components/FilterChip';
import { LoadingState } from '@/components/LoadingState';
import { RiskBadge } from '@/components/RiskBadge';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { getAlertas, resolverAlerta } from '@/services/alertasService';
import { screenStyles } from '@/styles/global';
import { AlertaReadModel } from '@/types/alerta';
import { RiscoNivel } from '@/types/risco';
import { getApiErrorMessage } from '@/utils/apiError';
import { formatDate } from '@/utils/formatDate';
import { useResponsiveLayout } from '@/utils/responsive';

/* ── Constants ───────────────────────────────────────── */

type Filter = 'todos' | 'ativos' | 'criticos' | 'resolvidos';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'todos',      label: 'TODOS' },
  { id: 'ativos',     label: 'ATIVOS' },
  { id: 'criticos',   label: 'CRÍTICOS' },
  { id: 'resolvidos', label: 'RESOLVIDOS' },
];

const SEVERITY_LEVELS: { nivel: RiscoNivel; label: string; color: string }[] = [
  { nivel: 'CRITICO',  label: 'CRÍTICO',  color: '#D32F2F' },
  { nivel: 'ALTO',     label: 'ALTO',     color: '#EF6C00' },
  { nivel: 'MODERADO', label: 'MODERADO', color: '#F9A825' },
  { nivel: 'BAIXO',    label: 'BAIXO',    color: '#2E7D32' },
];

type SeverityCount = { total: number } & Record<RiscoNivel, number>;

// Critical/unresolved first, then other active, then resolved.
function alertPriority(a: AlertaReadModel): number {
  if (a.resolvido)           return 3;
  if (a.nivel === 'CRITICO') return 0;
  if (a.nivel === 'ALTO')    return 1;
  return 2;
}

/* ── Screen ──────────────────────────────────────────── */

export default function AlertasScreen() {
  const [alertas, setAlertas]       = useState<AlertaReadModel[]>([]);
  const [filter, setFilter]         = useState<Filter>('todos');
  const [isLoading, setIsLoading]   = useState(true);
  const [resolvingId, setResolvingId] = useState<number | string | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [feedback, setFeedback]     = useState<{ ok: boolean; msg: string } | null>(null);
  const [loaded, setLoaded]         = useState(false);
  const { isDesktop }               = useResponsiveLayout();

  const loadAlertas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAlertas();
      setAlertas(data);
      setLoaded(true);
    } catch (e) {
      setAlertas([]);
      setLoaded(false);
      setError(getApiErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadAlertas(); }, [loadAlertas]);

  const summary = useMemo(() => {
    if (!loaded) return { total: '—', ativos: '—', criticos: '—', resolvidos: '—' };
    const ativos     = alertas.filter((a) => !a.resolvido).length;
    const criticos   = alertas.filter((a) => a.nivel === 'CRITICO').length;
    const resolvidos = alertas.filter((a) => a.resolvido).length;
    return { total: alertas.length, ativos, criticos, resolvidos };
  }, [alertas, loaded]);

  const severityCounts = useMemo((): SeverityCount | null => {
    if (!loaded) return null;
    const total = alertas.length;
    return {
      total,
      CRITICO:  alertas.filter((a) => a.nivel === 'CRITICO').length,
      ALTO:     alertas.filter((a) => a.nivel === 'ALTO').length,
      MODERADO: alertas.filter((a) => a.nivel === 'MODERADO').length,
      BAIXO:    alertas.filter((a) => a.nivel === 'BAIXO').length,
    };
  }, [alertas, loaded]);

  const filtered = useMemo(() => {
    return alertas.filter((a) => {
      if (filter === 'todos')      return true;
      if (filter === 'ativos')     return !a.resolvido;
      if (filter === 'criticos')   return a.nivel === 'CRITICO';
      return a.resolvido;
    });
  }, [alertas, filter]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => alertPriority(a) - alertPriority(b)),
    [filtered],
  );

  function confirmResolve(alerta: AlertaReadModel) {
    Alert.alert(
      'Resolver alerta',
      `Deseja marcar "${alerta.titulo}" como resolvido?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Resolver', onPress: () => { void handleResolve(alerta); } },
      ],
    );
  }

  async function handleResolve(alerta: AlertaReadModel) {
    setResolvingId(alerta.id);
    setFeedback(null);
    try {
      const updated = await resolverAlerta(alerta.id);
      if (updated) {
        setAlertas((prev) =>
          prev.map((item) => (String(item.id) === String(alerta.id) ? updated : item)),
        );
      } else {
        await loadAlertas();
      }
      setFeedback({ ok: true, msg: 'Alerta resolvido com sucesso.' });
    } catch (e) {
      setFeedback({ ok: false, msg: `Não foi possível resolver o alerta. ${getApiErrorMessage(e)}` });
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <AppShell activeRoute="alertas">
      <SafeAreaView style={screenStyles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            screenStyles.scrollContent,
            isDesktop && screenStyles.desktopScrollContent,
          ]}>

          {/* ── Page header ──────────────────────────── */}
          <View style={[styles.pageHeader, isDesktop && styles.pageHeaderRow]}>
            <Text style={styles.pageTitle}>Alertas Ambientais</Text>
            {loaded ? (
              <View style={styles.totalChip}>
                <Text style={styles.totalChipText}>{alertas.length} alertas</Text>
              </View>
            ) : null}
          </View>

          {/* ── Console status strip ─────────────────── */}
          <View style={styles.strip}>
            <ConsoleStat label="TOTAL"      value={summary.total} />
            <View style={styles.stripDivider} />
            <ConsoleStat label="ATIVOS"     value={summary.ativos} />
            <View style={styles.stripDivider} />
            <ConsoleStat label="CRÍTICOS"   value={summary.criticos} />
            <View style={styles.stripDivider} />
            <ConsoleStat label="RESOLVIDOS" value={summary.resolvidos} />
          </View>

          {/* ── Severity distribution ────────────────── */}
          {severityCounts ? (
            <View style={styles.distPanel}>
              <Text style={styles.distTitle}>Distribuição de Severidade</Text>
              <View style={styles.distDivider} />
              {SEVERITY_LEVELS.map(({ nivel, label, color }) => (
                <SeverityBar
                  key={nivel}
                  label={label}
                  count={severityCounts[nivel]}
                  total={severityCounts.total}
                  color={color}
                />
              ))}
            </View>
          ) : null}

          {/* ── Filters ──────────────────────────────── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {FILTERS.map((f) => (
                <FilterChip
                  key={f.id}
                  label={f.label}
                  selected={filter === f.id}
                  onPress={() => setFilter(f.id)}
                />
              ))}
            </View>
          </ScrollView>

          {/* ── Feedback ─────────────────────────────── */}
          {feedback ? (
            <View style={[styles.toast, feedback.ok ? styles.toastOk : styles.toastErr]}>
              <Text style={[styles.toastText, feedback.ok ? styles.toastTextOk : styles.toastTextErr]}>
                {feedback.msg}
              </Text>
            </View>
          ) : null}

          {/* ── States ───────────────────────────────── */}
          {isLoading ? <LoadingState message="Carregando alertas..." /> : null}
          {error ? <ErrorState message={error} onRetry={loadAlertas} /> : null}

          {!isLoading && !error && alertas.length === 0 ? (
            <EmptyState
              title="Nenhum alerta"
              description="Quando houver alertas, eles aparecerão aqui."
            />
          ) : null}

          {!isLoading && !error && alertas.length > 0 && sorted.length === 0 ? (
            <EmptyState
              title="Nenhum alerta neste filtro"
              description="Ajuste os filtros para ver outros alertas."
            />
          ) : null}

          {/* ── Triage queue ─────────────────────────── */}
          {!isLoading && !error && sorted.length > 0 ? (
            <View style={styles.tableContainer}>
              {isDesktop ? (
                <View style={styles.tableHead}>
                  <Text style={[styles.thCell, styles.thTitle]}>INCIDENTE</Text>
                  <Text style={[styles.thCell, styles.thRegiao]}>REGIÃO</Text>
                  <Text style={[styles.thCell, styles.thRisco]}>SEVERIDADE</Text>
                  <Text style={[styles.thCell, styles.thStatus]}>STATUS</Text>
                  <Text style={[styles.thCell, styles.thData]}>REGISTRADO</Text>
                  <Text style={[styles.thCell, styles.thAcao]}>AÇÃO</Text>
                </View>
              ) : null}

              {sorted.map((alerta) => {
                const critical = alerta.nivel === 'CRITICO' && !alerta.resolvido;
                const subLine  = alerta.tipoAlerta ?? alerta.descricao;
                return isDesktop ? (
                  <View
                    key={String(alerta.id)}
                    style={[styles.tableRow, critical && styles.tableRowCritical]}>
                    {critical && <View style={styles.rowAccent} />}
                    <View style={styles.thTitle}>
                      <Text style={styles.rowTitle}>{alerta.titulo}</Text>
                      {subLine ? (
                        <Text style={styles.rowDesc} numberOfLines={1}>{subLine}</Text>
                      ) : null}
                    </View>
                    <Text style={[styles.rowCell, styles.thRegiao]} numberOfLines={1}>
                      {alerta.regiaoNome ?? '—'}
                    </Text>
                    <View style={styles.thRisco}>
                      {alerta.nivel
                        ? <RiskBadge nivel={alerta.nivel} />
                        : <Text style={styles.dash}>—</Text>}
                    </View>
                    <View style={styles.thStatus}>
                      <View style={[styles.statusPill, alerta.resolvido ? styles.pillResolvido : styles.pillAtivo]}>
                        <Text style={[styles.pillText, alerta.resolvido ? styles.pillTextResolvido : styles.pillTextAtivo]}>
                          {alerta.resolvido ? '● Resolvido' : '● Ativo'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.rowCell, styles.thData]}>{formatDate(alerta.criadoEm)}</Text>
                    <View style={styles.thAcao}>
                      {!alerta.resolvido ? (
                        <AppButton
                          label={resolvingId === alerta.id ? '...' : 'Resolver'}
                          onPress={() => confirmResolve(alerta)}
                          disabled={resolvingId === alerta.id}
                          variant={critical ? 'danger' : 'primary'}
                          style={styles.resolveBtn}
                        />
                      ) : (
                        <Text style={styles.resolvedText}>{formatDate(alerta.resolvidoEm)}</Text>
                      )}
                    </View>
                  </View>
                ) : (
                  <MobileAlertCard
                    key={String(alerta.id)}
                    alerta={alerta}
                    resolving={resolvingId === alerta.id}
                    onResolve={() => confirmResolve(alerta)}
                  />
                );
              })}
            </View>
          ) : null}

        </ScrollView>
      </SafeAreaView>
    </AppShell>
  );
}

/* ── Sub-components ──────────────────────────────────── */

function ConsoleStat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={cs.segment}>
      <Text style={cs.label}>{label}</Text>
      <Text style={cs.value}>{value}</Text>
    </View>
  );
}

function SeverityBar({
  label, count, total, color,
}: {
  label: string; count: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <View style={sv.row}>
      <Text style={sv.label}>{label}</Text>
      <View style={sv.track}>
        <View style={[sv.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[sv.count, { color }]}>{count}</Text>
    </View>
  );
}

function MobileAlertCard({
  alerta, resolving, onResolve,
}: { alerta: AlertaReadModel; resolving: boolean; onResolve: () => void }) {
  const critical = alerta.nivel === 'CRITICO' && !alerta.resolvido;
  const subLine  = alerta.tipoAlerta ?? alerta.descricao;
  return (
    <View style={[mob.card, critical && mob.critical]}>
      {critical && <View style={mob.accent} />}
      <View style={mob.topRow}>
        <Text style={mob.title}>{alerta.titulo}</Text>
        {alerta.nivel ? <RiskBadge nivel={alerta.nivel} /> : null}
      </View>
      {subLine ? <Text style={mob.subLine}>{subLine}</Text> : null}
      {alerta.recomendacao ? <Text style={mob.recomendacao}>{alerta.recomendacao}</Text> : null}
      <Text style={mob.meta}>
        {alerta.regiaoNome ?? ''}
        {alerta.criadoEm ? `  ·  ${formatDate(alerta.criadoEm)}` : ''}
      </Text>
      {!alerta.resolvido ? (
        <AppButton
          label={resolving ? 'Resolvendo...' : 'Resolver alerta'}
          onPress={onResolve}
          disabled={resolving}
          variant={critical ? 'danger' : 'primary'}
          style={mob.btn}
        />
      ) : (
        <Text style={mob.resolved}>Resolvido em: {formatDate(alerta.resolvidoEm)}</Text>
      )}
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────── */

const styles = StyleSheet.create({
  pageHeader:    { gap: 6 },
  pageHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pageTitle: {
    color: '#1F2937',
    fontSize: 24,
    fontWeight: '700',
  },
  totalChip: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C5CAE9',
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  totalChipText: {
    color: '#3F51B5',
    fontSize: 12,
    fontWeight: '600',
  },

  strip: {
    backgroundColor: '#3347A8',
    borderRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  stripDivider: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 1,
  },

  distPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE2EA',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  distTitle: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    padding: 16,
    paddingBottom: 12,
  },
  distDivider: {
    backgroundColor: '#DDE2EA',
    height: 1,
  },

  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.md },

  toast: { borderRadius: 6, borderWidth: 1, padding: 12 },
  toastOk:  { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  toastErr: { backgroundColor: '#FFF5F5', borderColor: '#FCA5A5' },
  toastText: { fontSize: 13, fontWeight: '600' },
  toastTextOk:  { color: '#166534' },
  toastTextErr: { color: '#D32F2F' },

  tableContainer: {
    backgroundColor: colors.surface,
    borderColor: '#DDE2EA',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHead: {
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderBottomColor: '#DDE2EA',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  thCell:   { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, paddingHorizontal: 6 },
  thTitle:  { flex: 2 },
  thRegiao: { flex: 1 },
  thRisco:  { width: 90 },
  thStatus: { width: 100 },
  thData:   { width: 110 },
  thAcao:   { width: 110 },

  tableRow: {
    alignItems: 'center',
    borderBottomColor: '#EEF0F4',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'relative',
  },
  tableRowCritical: { backgroundColor: '#FFF5F5' },
  rowAccent: {
    backgroundColor: '#D32F2F',
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 4,
  },

  rowTitle: { color: colors.neutralText, fontSize: 13, fontWeight: '600', paddingHorizontal: 6 },
  rowDesc:  { color: colors.mutedText, fontSize: 11, paddingHorizontal: 6 },
  rowCell:  { color: colors.mutedText, fontSize: 13, paddingHorizontal: 6 },

  statusPill:       { borderRadius: 99, marginHorizontal: 6, paddingHorizontal: 8, paddingVertical: 3 },
  pillAtivo:        { backgroundColor: '#FEF3C7' },
  pillResolvido:    { backgroundColor: '#DCFCE7' },
  pillText:         { fontSize: 11, fontWeight: '700' },
  pillTextAtivo:    { color: '#92400E' },
  pillTextResolvido:{ color: '#166534' },

  resolveBtn:   { marginHorizontal: 6, minWidth: 80 },
  resolvedText: { color: '#166534', fontSize: 11, fontWeight: '600', paddingHorizontal: 6 },
  dash:         { color: colors.mutedText, fontSize: 13, paddingHorizontal: 6 },
});

const cs = StyleSheet.create({
  segment: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  label: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  value: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
});

const sv = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomColor: '#F3F4F6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  label: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
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
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    width: 28,
  },
});

const mob = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: '#DDE2EA',
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    overflow: 'hidden',
    padding: 14,
    position: 'relative',
  },
  critical:     { backgroundColor: '#FFF5F5', borderColor: '#FECACA' },
  accent:       { backgroundColor: '#D32F2F', bottom: 0, left: 0, position: 'absolute', top: 0, width: 4 },
  topRow:       { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  title:        { color: colors.neutralText, flex: 1, fontSize: 14, fontWeight: '700' },
  subLine:      { color: colors.mutedText, fontSize: 12, lineHeight: 17 },
  recomendacao: { color: '#3F51B5', fontSize: 12, fontStyle: 'italic', lineHeight: 17 },
  meta:         { color: colors.mutedText, fontSize: 12 },
  btn:          { marginTop: 4 },
  resolved:     { color: '#166534', fontSize: 12, fontWeight: '600' },
});
