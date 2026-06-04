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
import { getApiErrorMessage } from '@/utils/apiError';
import { formatDate } from '@/utils/formatDate';
import { useResponsiveLayout } from '@/utils/responsive';

type Filter = 'todos' | 'ativos' | 'criticos' | 'resolvidos';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'todos',     label: 'TODOS' },
  { id: 'ativos',    label: 'ATIVOS' },
  { id: 'criticos',  label: 'CRÍTICOS' },
  { id: 'resolvidos',label: 'RESOLVIDOS' },
];

export default function AlertasScreen() {
  const [alertas, setAlertas] = useState<AlertaReadModel[]>([]);
  const [filter, setFilter] = useState<Filter>('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<number | string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { isDesktop } = useResponsiveLayout();

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
    const ativos    = alertas.filter((a) => !a.resolvido).length;
    const criticos  = alertas.filter((a) => a.nivel === 'CRITICO').length;
    const resolvidos = alertas.filter((a) => a.resolvido).length;
    return { total: alertas.length, ativos, criticos, resolvidos };
  }, [alertas, loaded]);

  const filtered = useMemo(() => {
    return alertas.filter((a) => {
      if (filter === 'todos')     return true;
      if (filter === 'ativos')    return !a.resolvido;
      if (filter === 'criticos')  return a.nivel === 'CRITICO';
      return a.resolvido;
    });
  }, [alertas, filter]);

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
          <View>
            <Text style={styles.eyebrow}>CONSOLE DE ALERTAS</Text>
            <Text style={styles.title}>Alertas Ambientais</Text>
            <Text style={styles.subtitle}>Console de ocorrências com severidade, status e resolução.</Text>
          </View>

          {/* ── Summary cards ────────────────────────── */}
          <View style={[styles.summaryRow, isDesktop && styles.summaryRowDesktop]}>
            <SummaryCard label="TOTAL"     value={summary.total}     sub="alertas"      />
            <SummaryCard label="ATIVOS"    value={summary.ativos}    sub="Monitorando"  accent="#EF6C00" />
            <SummaryCard label="CRÍTICOS"  value={summary.criticos}  sub="Urgentes"     accent="#D32F2F" />
            <SummaryCard label="RESOLVIDOS" value={summary.resolvidos} sub="histórico"  accent="#2E7D32" />
          </View>

          {/* ── Feedback ─────────────────────────────── */}
          {feedback ? (
            <View style={[styles.toast, feedback.ok ? styles.toastOk : styles.toastErr]}>
              <Text style={[styles.toastText, feedback.ok ? styles.toastTextOk : styles.toastTextErr]}>
                {feedback.msg}
              </Text>
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

          {/* ── States ───────────────────────────────── */}
          {isLoading ? <LoadingState message="Carregando alertas..." /> : null}
          {error ? <ErrorState message={error} onRetry={loadAlertas} /> : null}

          {!isLoading && !error && alertas.length === 0 ? (
            <EmptyState title="Nenhum alerta" description="Quando houver alertas, eles aparecerão aqui." />
          ) : null}

          {!isLoading && !error && alertas.length > 0 && filtered.length === 0 ? (
            <EmptyState title="Nenhum alerta neste filtro" description="Ajuste os filtros para ver outros alertas." />
          ) : null}

          {/* ── Alert list / table ───────────────────── */}
          {!isLoading && !error && filtered.length > 0 ? (
            <View style={styles.tableContainer}>
              {isDesktop ? (
                <View style={styles.tableHead}>
                  <Text style={[styles.thCell, styles.thTitle]}>TÍTULO</Text>
                  <Text style={[styles.thCell, styles.thRegiao]}>REGIÃO</Text>
                  <Text style={[styles.thCell, styles.thRisco]}>RISCO</Text>
                  <Text style={[styles.thCell, styles.thStatus]}>STATUS</Text>
                  <Text style={[styles.thCell, styles.thData]}>DATA/HORA</Text>
                  <Text style={[styles.thCell, styles.thAcao]}>AÇÃO</Text>
                </View>
              ) : null}

              {filtered.map((alerta) => {
                const critical = alerta.nivel === 'CRITICO' && !alerta.resolvido;
                return isDesktop ? (
                  <View
                    key={String(alerta.id)}
                    style={[styles.tableRow, critical && styles.tableRowCritical]}>
                    {critical && <View style={styles.rowAccent} />}
                    <View style={styles.thTitle}>
                      <Text style={styles.rowTitle}>{alerta.titulo}</Text>
                      {alerta.descricao ? (
                        <Text style={styles.rowDesc} numberOfLines={1}>{alerta.descricao}</Text>
                      ) : null}
                    </View>
                    <Text style={[styles.rowCell, styles.thRegiao]} numberOfLines={1}>
                      {alerta.regiaoNome ?? '—'}
                    </Text>
                    <View style={styles.thRisco}>
                      {alerta.nivel ? <RiskBadge nivel={alerta.nivel} /> : <Text style={styles.dash}>—</Text>}
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

function SummaryCard({
  label, value, sub, accent = colors.primary500,
}: { label: string; value: string | number; sub: string; accent?: string }) {
  return (
    <View style={sum.card}>
      <Text style={sum.label}>{label}</Text>
      <Text style={[sum.value, { color: accent }]}>{value}</Text>
      <Text style={sum.sub}>{sub}</Text>
    </View>
  );
}

const sum = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: '#DDE1EA',
    borderRadius: 8,
    borderWidth: 1,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    flex: 1,
    minWidth: 100,
    padding: 16,
  },
  label: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  value: { fontSize: 28, fontWeight: '700', lineHeight: 34, marginTop: 4 },
  sub:   { color: colors.mutedText, fontSize: 12, marginTop: 2 },
});

function MobileAlertCard({
  alerta, resolving, onResolve,
}: { alerta: AlertaReadModel; resolving: boolean; onResolve: () => void }) {
  const critical = alerta.nivel === 'CRITICO' && !alerta.resolvido;
  return (
    <View style={[mob.card, critical && mob.critical]}>
      {critical && <View style={mob.accent} />}
      <View style={mob.topRow}>
        <Text style={mob.title}>{alerta.titulo}</Text>
        {alerta.nivel ? <RiskBadge nivel={alerta.nivel} /> : null}
      </View>
      {alerta.descricao ? <Text style={mob.desc}>{alerta.descricao}</Text> : null}
      <Text style={mob.meta}>
        {alerta.regiaoNome ? `Região: ${alerta.regiaoNome}` : ''}{alerta.criadoEm ? `  ·  ${formatDate(alerta.criadoEm)}` : ''}
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

const mob = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: '#DDE1EA',
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    overflow: 'hidden',
    padding: 14,
    position: 'relative',
  },
  critical: { borderColor: '#FECACA', backgroundColor: '#FFFBFB' },
  accent: { backgroundColor: '#D32F2F', bottom: 0, left: 0, position: 'absolute', top: 0, width: 4 },
  topRow: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  title: { color: colors.neutralText, flex: 1, fontSize: 14, fontWeight: '700' },
  desc: { color: colors.mutedText, fontSize: 13, lineHeight: 18 },
  meta: { color: colors.mutedText, fontSize: 12 },
  btn: { marginTop: 4 },
  resolved: { color: '#166534', fontSize: 12, fontWeight: '600' },
});

/* ── Screen styles ───────────────────────────────────── */

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary500, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  title:   { color: colors.neutralText, fontSize: 22, fontWeight: '700' },
  subtitle:{ color: colors.mutedText, fontSize: 13, lineHeight: 18, marginTop: 2 },

  summaryRow: { gap: spacing.sm },
  summaryRowDesktop: { flexDirection: 'row', gap: spacing.md },

  toast: { borderRadius: 6, borderWidth: 1, padding: 12 },
  toastOk: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  toastErr: { backgroundColor: '#FFF5F5', borderColor: '#FCA5A5' },
  toastText: { fontSize: 13, fontWeight: '600' },
  toastTextOk: { color: '#166534' },
  toastTextErr: { color: '#D32F2F' },

  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.md },

  tableContainer: {
    backgroundColor: colors.surface,
    borderColor: '#DDE1EA',
    borderRadius: 8,
    borderWidth: 1,
    gap: 0,
    overflow: 'hidden',
  },
  tableHead: {
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderBottomColor: '#DDE1EA',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  thCell: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, paddingHorizontal: 6 },
  thTitle: { flex: 2 },
  thRegiao: { flex: 1 },
  thRisco: { width: 80 },
  thStatus: { width: 100 },
  thData: { width: 110 },
  thAcao: { width: 110 },

  tableRow: {
    alignItems: 'center',
    borderBottomColor: '#EEF0F4',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 0,
    minHeight: 52,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'relative',
  },
  tableRowCritical: { backgroundColor: '#FFFBFB' },
  rowAccent: { backgroundColor: '#D32F2F', bottom: 0, left: 0, position: 'absolute', top: 0, width: 3 },

  rowTitle: { color: colors.neutralText, fontSize: 13, fontWeight: '600', paddingHorizontal: 6 },
  rowDesc: { color: colors.mutedText, fontSize: 11, paddingHorizontal: 6 },
  rowCell: { color: colors.mutedText, fontSize: 13, paddingHorizontal: 6 },

  statusPill: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, marginHorizontal: 6 },
  pillAtivo: { backgroundColor: '#FEF3C7' },
  pillResolvido: { backgroundColor: '#DCFCE7' },
  pillText: { fontSize: 11, fontWeight: '700' },
  pillTextAtivo: { color: '#92400E' },
  pillTextResolvido: { color: '#166534' },

  resolveBtn: { marginHorizontal: 6, minWidth: 80 },
  resolvedText: { color: '#166534', fontSize: 11, fontWeight: '600', paddingHorizontal: 6 },
  dash: { color: colors.mutedText, fontSize: 13, paddingHorizontal: 6 },
});
