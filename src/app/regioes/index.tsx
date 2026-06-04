import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FilterChip } from '@/components/FilterChip';
import { LoadingState } from '@/components/LoadingState';
import { RiskBadge } from '@/components/RiskBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { getRegioes } from '@/services/regioesService';
import { screenStyles } from '@/styles/global';
import { RegiaoReadModel } from '@/types/regiao';
import { getApiErrorMessage } from '@/utils/apiError';
import { useResponsiveLayout } from '@/utils/responsive';

type RegiaoFilter = 'todas' | 'governo' | 'ong' | 'risco';

const FILTERS: { id: RegiaoFilter; label: string }[] = [
  { id: 'todas',   label: 'TODAS' },
  { id: 'governo', label: 'GOVERNO / DEFESA CIVIL' },
  { id: 'ong',     label: 'ONG' },
  { id: 'risco',   label: 'EM RISCO' },
];

export default function RegioesScreen() {
  const [regioes, setRegioes] = useState<RegiaoReadModel[]>([]);
  const [filter, setFilter] = useState<RegiaoFilter>('todas');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDesktop } = useResponsiveLayout();

  const loadRegioes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setRegioes(await getRegioes());
    } catch (e) {
      setRegioes([]);
      setError(getApiErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadRegioes(); }, [loadRegioes]);

  const filtered = useMemo(() => {
    return regioes.filter((r) => {
      if (filter === 'todas') return true;
      if (filter === 'risco') return r.riscoNivel === 'ALTO' || r.riscoNivel === 'CRITICO';
      const t = norm(r.tipoCliente);
      if (filter === 'governo') return t.includes('governo') || t.includes('defesa');
      return t.includes('ong');
    });
  }, [regioes, filter]);

  return (
    <AppShell activeRoute="regioes">
      <SafeAreaView style={screenStyles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            screenStyles.scrollContent,
            isDesktop && screenStyles.desktopScrollContent,
          ]}>

          {/* ── Header ──────────────────────────────── */}
          <View style={styles.head}>
            <Text style={styles.title}>Regiões Monitoradas</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{regioes.length} regiões</Text>
            </View>
          </View>

          {/* ── Filters ─────────────────────────────── */}
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

          {/* ── States ──────────────────────────────── */}
          {isLoading ? <LoadingState message="Carregando regiões..." /> : null}
          {error ? <ErrorState message={error} onRetry={loadRegioes} /> : null}
          {!isLoading && !error && regioes.length === 0 ? (
            <EmptyState title="Nenhuma região cadastrada" description="Cadastre regiões em Gerenciar Regiões." />
          ) : null}
          {!isLoading && !error && regioes.length > 0 && filtered.length === 0 ? (
            <EmptyState title="Nenhuma região neste filtro" description="Ajuste os filtros." />
          ) : null}

          {/* ── Table / list ────────────────────────── */}
          {!isLoading && !error && filtered.length > 0 ? (
            <View style={styles.tableContainer}>
              {isDesktop ? (
                <View style={styles.tableHead}>
                  <Text style={[styles.th, styles.colNome]}>REGIÃO</Text>
                  <Text style={[styles.th, styles.colLocal]}>LOCALIZAÇÃO</Text>
                  <Text style={[styles.th, styles.colTipo]}>TIPO</Text>
                  <Text style={[styles.th, styles.colRisco]}>RISCO</Text>
                  <Text style={[styles.th, styles.colStatus]}>STATUS</Text>
                  <Text style={[styles.th, styles.colAlertas]}>ALERTAS</Text>
                  <Text style={[styles.th, styles.colAcao]}></Text>
                </View>
              ) : null}

              {filtered.map((regiao) => (
                isDesktop ? (
                  <Link
                    key={String(regiao.id)}
                    href={{ pathname: '/regioes/[id]', params: { id: String(regiao.id) } }}
                    asChild>
                    <Pressable
                      style={({ hovered, pressed }) => [
                        styles.tableRow,
                        hovered && styles.tableRowHover,
                        pressed && styles.tableRowPressed,
                      ]}>
                      <View style={styles.colNome}>
                        <Text style={styles.rowNome}>{regiao.nome}</Text>
                        {regiao.descricao ? (
                          <Text style={styles.rowDesc} numberOfLines={1}>{regiao.descricao}</Text>
                        ) : null}
                      </View>
                      <Text style={[styles.rowCell, styles.colLocal]}>{fmtLocal(regiao)}</Text>
                      <Text style={[styles.rowCell, styles.colTipo]}>{regiao.tipoCliente ?? '—'}</Text>
                      <View style={styles.colRisco}>
                        {regiao.riscoNivel
                          ? <RiskBadge nivel={regiao.riscoNivel} />
                          : <Text style={styles.dash}>—</Text>}
                      </View>
                      <View style={styles.colStatus}>
                        {regiao.ativo !== undefined
                          ? <StatusBadge status={regiao.ativo ? 'Ativo' : 'Inativo'} />
                          : <Text style={styles.dash}>—</Text>}
                      </View>
                      <Text style={[styles.rowCell, styles.colAlertas, regiao.alertasAtivos ? styles.alertCount : undefined]}>
                        {regiao.alertasAtivos ?? '—'}
                      </Text>
                      <View style={styles.colAcao}>
                        <Text style={styles.detailLink}>Ver detalhes →</Text>
                      </View>
                    </Pressable>
                  </Link>
                ) : (
                  <MobileRegiaoCard key={String(regiao.id)} regiao={regiao} />
                )
              ))}
            </View>
          ) : null}

        </ScrollView>
      </SafeAreaView>
    </AppShell>
  );
}

function MobileRegiaoCard({ regiao }: { regiao: RegiaoReadModel }) {
  return (
    <Link href={{ pathname: '/regioes/[id]', params: { id: String(regiao.id) } }} asChild>
      <Pressable style={({ hovered, pressed }) => [mob.card, hovered && mob.hover, pressed && mob.pressed]}>
        <View style={mob.topRow}>
          <Text style={mob.nome}>{regiao.nome}</Text>
          {regiao.riscoNivel ? <RiskBadge nivel={regiao.riscoNivel} /> : null}
        </View>
        <Text style={mob.meta}>{fmtLocal(regiao)}</Text>
        <View style={mob.badges}>
          {regiao.tipoCliente ? <Text style={mob.tipo}>{regiao.tipoCliente}</Text> : null}
          {regiao.ativo !== undefined ? <StatusBadge status={regiao.ativo ? 'Ativo' : 'Inativo'} /> : null}
        </View>
        <Text style={mob.action}>Ver detalhes →</Text>
      </Pressable>
    </Link>
  );
}

const mob = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: '#DDE1EA',
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  hover: { backgroundColor: '#F8F9FF', borderColor: '#C5CAE9', boxShadow: '0 2px 8px rgba(63,81,181,0.10)' },
  pressed: { opacity: 0.88, transform: [{ translateY: 1 }] },
  topRow: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  nome: { color: colors.neutralText, flex: 1, fontSize: 14, fontWeight: '700' },
  meta: { color: colors.mutedText, fontSize: 12 },
  badges: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  tipo: {
    backgroundColor: '#EEF2FF',
    borderRadius: 99,
    color: '#3F51B5',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  action: { color: '#3F51B5', fontSize: 12, fontWeight: '600', marginTop: 2 },
});

/* ── Helpers ──────────────────────────────────────────── */

function fmtLocal(r: RegiaoReadModel): string {
  return [r.cidade, r.estado].filter(Boolean).join(' / ') || 'Localização não informada';
}

function norm(v?: string): string {
  return v?.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() ?? '';
}

/* ── Styles ───────────────────────────────────────────── */

const styles = StyleSheet.create({
  head: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  title:   { color: colors.neutralText, fontSize: 22, fontWeight: '700' },
  badge: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C5CAE9',
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: '#3F51B5', fontSize: 12, fontWeight: '600' },

  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.md },

  tableContainer: {
    backgroundColor: colors.surface,
    borderColor: '#DDE1EA',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHead: {
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderBottomColor: '#DDE1EA',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  th: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, paddingHorizontal: 4 },
  tableRow: {
    alignItems: 'center',
    borderBottomColor: '#EEF0F4',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tableRowHover: { backgroundColor: '#F4F5FF' },
  tableRowPressed: { backgroundColor: '#E8EAF6' },
  colNome:    { flex: 2, paddingHorizontal: 4 },
  colLocal:   { flex: 1, paddingHorizontal: 4 },
  colTipo:    { width: 140, paddingHorizontal: 4 },
  colRisco:   { width: 90, paddingHorizontal: 4 },
  colStatus:  { width: 90, paddingHorizontal: 4 },
  colAlertas: { width: 70, paddingHorizontal: 4, textAlign: 'center' },
  colAcao:    { width: 110, paddingHorizontal: 4 },
  rowNome:  { color: colors.neutralText, fontSize: 13, fontWeight: '600' },
  rowDesc:  { color: colors.mutedText, fontSize: 11, marginTop: 1 },
  rowCell:  { color: colors.mutedText, fontSize: 13 },
  alertCount: { color: '#D32F2F', fontWeight: '700' },
  detailLink: { color: '#3F51B5', fontSize: 12, fontWeight: '600' },
  dash: { color: colors.mutedText, fontSize: 13 },
});
