import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FilterChip } from '@/components/FilterChip';
import { LoadingState } from '@/components/LoadingState';
import { StatusBadge } from '@/components/StatusBadge';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { getRegioes } from '@/services/regioesService';
import { screenStyles } from '@/styles/global';
import { RegiaoReadModel } from '@/types/regiao';
import { getApiErrorMessage } from '@/utils/apiError';
import { formatDate } from '@/utils/formatDate';
import { useResponsiveLayout } from '@/utils/responsive';

/* ── Constants ───────────────────────────────────────── */

type RegiaoFilter = 'todas' | 'ativas' | 'altavuln' | 'inativas';

const FILTERS: { id: RegiaoFilter; label: string }[] = [
  { id: 'todas',    label: 'TODAS' },
  { id: 'ativas',   label: 'ATIVAS' },
  { id: 'altavuln', label: 'ALTA VULN.' },
  { id: 'inativas', label: 'INATIVAS' },
];

const TIPO_AREA_LABEL: Record<string, string> = {
  AREA_URBANA:         'Área Urbana',
  REGIAO_RIBEIRINHA:   'Ribeirinha',
  ENCOSTA:             'Encosta',
  AREA_RURAL:          'Área Rural',
  COMUNIDADE:          'Comunidade',
  PONTE:               'Ponte',
  PROPRIEDADE_PRIVADA: 'Prop. Privada',
};

const VISIB_LABEL: Record<string, string> = {
  INSTITUCIONAL:   'Institucional',
  PRIVADA:         'Privada',
  AGREGADA_PUBLICA:'Pública',
};

/* ── Helpers ─────────────────────────────────────────── */

// nivelVulnerabilidade is not in the explicit Regiao type, so raw access returns unknown.
// This guard narrows it to number | undefined safely.
function getVuln(r: RegiaoReadModel): number | undefined {
  const v = r.raw?.nivelVulnerabilidade;
  return typeof v === 'number' ? v : undefined;
}

function vulnColor(score?: number): string {
  if (score === undefined) return '#6B7280';
  if (score >= 75) return '#D32F2F';
  if (score >= 50) return '#EF6C00';
  if (score >= 25) return '#F9A825';
  return '#2E7D32';
}

function fmtTipoArea(r: RegiaoReadModel): string {
  const v = r.raw?.tipoArea;  // typed string? in Regiao
  if (!v) return '—';
  return TIPO_AREA_LABEL[v] ?? v;
}

function fmtVisib(r: RegiaoReadModel): string {
  const v = r.tipoCliente;   // normalized from tipoVisibilidade
  if (!v) return '—';
  return VISIB_LABEL[v] ?? v;
}

function fmtLocal(r: RegiaoReadModel): string {
  return [r.cidade, r.estado].filter(Boolean).join(' / ') || '—';
}

function norm(v?: string | null): string {
  return v?.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() ?? '';
}

function regionPriority(r: RegiaoReadModel): number {
  if (r.ativo === false) return 10000;
  return 100 - (getVuln(r) ?? 0);  // higher vulnerability → lower number → sorts first
}

/* ── Screen ──────────────────────────────────────────── */

export default function RegioesScreen() {
  const [regioes, setRegioes] = useState<RegiaoReadModel[]>([]);
  const [filter, setFilter]   = useState<RegiaoFilter>('todas');
  const [search, setSearch]   = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const { isDesktop }         = useResponsiveLayout();
  const router                = useRouter();

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

  const inventorySummary = useMemo(() => ({
    total:    regioes.length,
    ativas:   regioes.filter((r) => r.ativo !== false).length,
    altaVuln: regioes.filter((r) => (getVuln(r) ?? 0) >= 70).length,
  }), [regioes]);

  const filtered = useMemo(() => {
    const q = norm(search.trim());
    return regioes.filter((r) => {
      if (q) {
        const haystack = norm([
          r.nome, r.cidade, r.estado, r.tipoCliente,
          r.raw?.tipoArea, r.raw?.tipoVisibilidade,
        ].filter(Boolean).join(' '));
        if (!haystack.includes(q)) return false;
      }
      if (filter === 'ativas')   return r.ativo !== false;
      if (filter === 'altavuln') return (getVuln(r) ?? 0) >= 70;
      if (filter === 'inativas') return r.ativo === false;
      return true;
    });
  }, [regioes, filter, search]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => regionPriority(a) - regionPriority(b)),
    [filtered],
  );

  const navigate = (regiao: RegiaoReadModel) =>
    router.push({ pathname: '/regioes/[id]', params: { id: String(regiao.id) } });

  return (
    <AppShell activeRoute="regioes">
      <SafeAreaView style={screenStyles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            screenStyles.scrollContent,
            isDesktop && screenStyles.desktopScrollContent,
          ]}>

          {/* ── Page header ──────────────────────────── */}
          <View style={[styles.pageHeader, isDesktop && styles.pageHeaderRow]}>
            <Text style={styles.pageTitle}>Regiões</Text>
            {!isLoading && !error ? (
              <View style={styles.totalChip}>
                <Text style={styles.totalChipText}>{regioes.length} regiões</Text>
              </View>
            ) : null}
          </View>

          {/* ── Inventory summary band ───────────────── */}
          {!isLoading && !error ? (
            <View style={styles.summaryBand}>
              <SummarySegment label="TOTAL"       value={inventorySummary.total} />
              <View style={styles.summaryDivider} />
              <SummarySegment label="ATIVAS"      value={inventorySummary.ativas} />
              <View style={styles.summaryDivider} />
              <SummarySegment label="ALTA VULN."  value={inventorySummary.altaVuln} />
            </View>
          ) : null}

          {/* ── Search ───────────────────────────────── */}
          <View style={styles.searchWrap}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por nome, cidade, estado ou tipo..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              clearButtonMode="while-editing"
            />
          </View>

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
          {isLoading ? <LoadingState message="Carregando regiões..." /> : null}
          {error ? <ErrorState message={error} onRetry={loadRegioes} /> : null}

          {!isLoading && !error && regioes.length === 0 ? (
            <EmptyState
              title="Nenhuma região cadastrada"
              description="Cadastre regiões em Gerenciar Regiões."
            />
          ) : null}

          {!isLoading && !error && regioes.length > 0 && sorted.length === 0 ? (
            <EmptyState
              title="Nenhuma região encontrada"
              description="Ajuste a busca ou os filtros."
            />
          ) : null}

          {/* ── Regional inventory ───────────────────── */}
          {!isLoading && !error && sorted.length > 0 ? (
            <View style={styles.tableContainer}>
              {isDesktop ? (
                <View style={styles.tableHead}>
                  <Text style={[styles.thCell, styles.colNome]}>REGIÃO</Text>
                  <Text style={[styles.thCell, styles.colArea]}>ÁREA</Text>
                  <Text style={[styles.thCell, styles.colVisib]}>VISIBILIDADE</Text>
                  <Text style={[styles.thCell, styles.colVuln]}>VULNERAB.</Text>
                  <Text style={[styles.thCell, styles.colStatus]}>STATUS</Text>
                  <Text style={[styles.thCell, styles.colData]}>ATUALIZADO</Text>
                  <Text style={[styles.thCell, styles.colAcao]}></Text>
                </View>
              ) : null}

              {sorted.map((regiao) => {
                const vuln     = getVuln(regiao);
                const highVuln = (vuln ?? 0) >= 70 && regiao.ativo !== false;
                return isDesktop ? (
                  <Pressable
                    key={String(regiao.id)}
                    onPress={() => navigate(regiao)}
                    style={({ hovered, pressed }) => [
                      styles.tableRow,
                      highVuln  && styles.tableRowHighVuln,
                      hovered   && styles.tableRowHover,
                      pressed   && styles.tableRowPressed,
                    ]}>
                    {highVuln && <View style={styles.rowAccent} />}
                    <View style={styles.colNome}>
                      <Text style={styles.rowNome}>{regiao.nome}</Text>
                      <Text style={styles.rowDesc}>{fmtLocal(regiao)}</Text>
                    </View>
                    <Text style={[styles.rowCell, styles.colArea]}>{fmtTipoArea(regiao)}</Text>
                    <Text style={[styles.rowCell, styles.colVisib]}>{fmtVisib(regiao)}</Text>
                    <View style={styles.colVuln}>
                      <VulnIndicator score={vuln} />
                    </View>
                    <View style={styles.colStatus}>
                      {regiao.ativo !== undefined
                        ? <StatusBadge status={regiao.ativo ? 'Ativo' : 'Inativo'} />
                        : <Text style={styles.dash}>—</Text>}
                    </View>
                    <Text style={[styles.rowCell, styles.colData]}>
                      {formatDate(regiao.raw?.dtAtualizadoEm)}
                    </Text>
                    <View style={styles.colAcao}>
                      <Text style={styles.detailLink}>Ver detalhes →</Text>
                    </View>
                  </Pressable>
                ) : (
                  <MobileRegiaoCard
                    key={String(regiao.id)}
                    regiao={regiao}
                    onPress={() => navigate(regiao)}
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

function SummarySegment({ label, value }: { label: string; value: number }) {
  return (
    <View style={ss.seg}>
      <Text style={ss.value}>{value}</Text>
      <Text style={ss.label}>{label}</Text>
    </View>
  );
}

function VulnIndicator({ score }: { score?: number }) {
  if (score === undefined) return <Text style={vi.dash}>—</Text>;
  const color = vulnColor(score);
  return (
    <View style={vi.wrap}>
      <Text style={[vi.score, { color }]}>{score}</Text>
      <View style={vi.track}>
        <View style={[vi.fill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function MobileRegiaoCard({
  regiao, onPress,
}: { regiao: RegiaoReadModel; onPress: () => void }) {
  const vuln     = getVuln(regiao);
  const highVuln = (vuln ?? 0) >= 70 && regiao.ativo !== false;
  const tipoArea = fmtTipoArea(regiao);

  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }) => [
        mob.card,
        highVuln && mob.highVuln,
        hovered  && mob.hover,
        pressed  && mob.pressed,
      ]}>
      {highVuln && <View style={mob.accent} />}
      <View style={mob.topRow}>
        <Text style={mob.nome} numberOfLines={1}>{regiao.nome}</Text>
        <VulnIndicator score={vuln} />
      </View>
      <Text style={mob.meta}>{fmtLocal(regiao)}</Text>
      <View style={mob.badges}>
        {tipoArea !== '—' ? <Text style={mob.tipoChip}>{tipoArea}</Text> : null}
        {regiao.ativo !== undefined
          ? <StatusBadge status={regiao.ativo ? 'Ativo' : 'Inativo'} />
          : null}
      </View>
      <Text style={mob.action}>Ver detalhes →</Text>
    </Pressable>
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
  pageTitle: { color: '#1F2937', fontSize: 24, fontWeight: '700' },
  totalChip: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C5CAE9',
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  totalChipText: { color: '#3F51B5', fontSize: 12, fontWeight: '600' },

  summaryBand: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE2EA',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  summaryDivider: { backgroundColor: '#DDE2EA', width: 1 },

  searchWrap: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE2EA',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: '#1F2937',
    fontSize: 14,
    height: 42,
  },

  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.md },

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
  thCell: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, paddingHorizontal: 4 },
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
  tableRowHighVuln: { backgroundColor: '#FFF8F0' },
  tableRowHover:    { backgroundColor: '#F8FAFF' },
  tableRowPressed:  { backgroundColor: '#EEF2FF' },
  rowAccent: {
    backgroundColor: '#EF6C00',
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 3,
  },

  colNome:   { flex: 2, paddingHorizontal: 4 },
  colArea:   { width: 130, paddingHorizontal: 4 },
  colVisib:  { width: 110, paddingHorizontal: 4 },
  colVuln:   { width: 90,  paddingHorizontal: 4 },
  colStatus: { width: 80,  paddingHorizontal: 4 },
  colData:   { width: 90,  paddingHorizontal: 4 },
  colAcao:   { width: 110, paddingHorizontal: 4 },

  rowNome:    { color: colors.neutralText, fontSize: 13, fontWeight: '600' },
  rowDesc:    { color: colors.mutedText, fontSize: 11, marginTop: 1 },
  rowCell:    { color: colors.mutedText, fontSize: 13 },
  detailLink: { color: '#3F51B5', fontSize: 12, fontWeight: '600' },
  dash:       { color: colors.mutedText, fontSize: 13 },
});

const ss = StyleSheet.create({
  seg: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  value: { color: '#1F2937', fontSize: 24, fontWeight: '700' },
  label: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

const vi = StyleSheet.create({
  wrap:  { gap: 3 },
  score: { fontSize: 13, fontWeight: '700' },
  dash:  { color: '#6B7280', fontSize: 13 },
  track: {
    backgroundColor: '#F3F4F6',
    borderRadius: 99,
    height: 4,
    overflow: 'hidden',
    width: 60,
  },
  fill: { borderRadius: 99, height: 4 },
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
  highVuln: { backgroundColor: '#FFF8F0', borderColor: '#FDBA74' },
  hover:    { backgroundColor: '#F8FAFF', borderColor: '#C5CAE9' },
  pressed:  { opacity: 0.88, transform: [{ translateY: 1 }] },
  accent: {
    backgroundColor: '#EF6C00',
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 3,
  },
  topRow:   { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  nome:     { color: colors.neutralText, flex: 1, fontSize: 14, fontWeight: '700' },
  meta:     { color: colors.mutedText, fontSize: 12 },
  badges:   { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tipoChip: {
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
