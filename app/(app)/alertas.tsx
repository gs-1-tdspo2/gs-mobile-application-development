import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlertas } from '@hooks/useAlertas';
import { useRegioes } from '@hooks/useRegioes';
import { useAppContext } from '@contexts/AppContext';
import { usePolling } from '@hooks/usePolling';
import { LoadingState } from '@components/ui/LoadingState';
import { ErrorState } from '@components/ui/ErrorState';
import { EmptyState } from '@components/ui/EmptyState';
import { FilterSelect, FilterPanel } from '@components/filters';
import { Colors, RiskColors, RiskBackgrounds } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import { NivelRiscoLabels, TipoAlertaLabels, StatusAlertaLabels } from '@constants/enums';
import type { NivelRisco, TipoAlerta, StatusAlerta } from '@constants/enums';
import type { Alerta } from '@/types';

// ─── Filter types ─────────────────────────────────────────────────────────────

type FilterStatus = StatusAlerta | 'TODOS';
type FilterNivel  = NivelRisco   | 'TODOS';
type FilterTipo   = TipoAlerta   | 'TODOS';

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'TODOS',      label: 'Todos' },
  { value: 'ABERTO',     label: 'Aberto' },
  { value: 'EM_ANALISE', label: 'Em análise' },
  { value: 'RESOLVIDO',  label: 'Resolvido' },
  { value: 'CANCELADO',  label: 'Cancelado' },
];

const NIVEL_FILTERS: { value: FilterNivel; label: string }[] = [
  { value: 'TODOS',    label: 'Todos' },
  { value: 'CRITICO',  label: 'Crítico' },
  { value: 'ALTO',     label: 'Alto' },
  { value: 'MODERADO', label: 'Moderado' },
  { value: 'BAIXO',    label: 'Baixo' },
];

const TIPO_FILTERS: { value: FilterTipo; label: string }[] = [
  { value: 'TODOS',        label: 'Todos' },
  { value: 'ENCHENTE',     label: 'Enchente' },
  { value: 'DESLIZAMENTO', label: 'Deslizamento' },
  { value: 'TEMPESTADE',   label: 'Tempestade' },
  { value: 'QUALIDADE_AR', label: 'Qualidade do ar' },
  { value: 'OPERACIONAL',  label: 'Operacional' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadgeColor(s: StatusAlerta): string {
  switch (s) {
    case 'ABERTO':     return '#B71C1C';
    case 'EM_ANALISE': return '#E65100';
    case 'RESOLVIDO':  return '#1B5E20';
    case 'CANCELADO':  return '#616161';
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
}

// ─── Alert card ───────────────────────────────────────────────────────────────

interface RegiaoInfo {
  nome: string;
  cidade: string;
  estado: string;
}

interface AlertCardProps {
  alerta: Alerta;
  regiaoInfo: RegiaoInfo | null;
}

function AlertCard({ alerta, regiaoInfo }: AlertCardProps) {
  const borderColor = RiskColors[alerta.nivelRisco] ?? Colors.border;
  const bgColor     = RiskBackgrounds[alerta.nivelRisco] ?? Colors.card;
  const statusColor = statusBadgeColor(alerta.statusAlerta);

  const regiaoLabel = regiaoInfo
    ? `${regiaoInfo.nome} · ${regiaoInfo.cidade}/${regiaoInfo.estado}`
    : `Região ${alerta.idRegiao}`;

  return (
    <View style={[card.root, { borderLeftColor: borderColor }]}>
      {/* Badge row: nivel + tipo + status — wraps on narrow screens */}
      <View style={card.badgeRow}>
        <View style={[card.nivelBadge, { backgroundColor: bgColor, borderColor }]}>
          <Text style={[card.nivelBadgeText, { color: borderColor }]}>
            {NivelRiscoLabels[alerta.nivelRisco] ?? alerta.nivelRisco}
          </Text>
        </View>
        <View style={card.tipoBadge}>
          <Text style={card.tipoBadgeText}>
            {TipoAlertaLabels[alerta.tipoAlerta] ?? alerta.tipoAlerta}
          </Text>
        </View>
        <View style={[card.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={card.statusBadgeText}>
            {StatusAlertaLabels[alerta.statusAlerta] ?? alerta.statusAlerta}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={card.title} numberOfLines={2}>{alerta.titulo || '—'}</Text>

      {/* Region: nome · cidade/UF */}
      <View style={card.regionRow}>
        <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
        <Text style={card.regionText} numberOfLines={1}>{regiaoLabel}</Text>
      </View>

      {/* Description */}
      {!!alerta.descricao && (
        <Text style={card.body} numberOfLines={3}>{alerta.descricao}</Text>
      )}

      {/* Recommendation */}
      {!!alerta.recomendacao && (
        <View style={card.recBox}>
          <Ionicons name="shield-checkmark-outline" size={13} color={Colors.primary} style={card.recIcon} />
          <Text style={card.recText} numberOfLines={3}>{alerta.recomendacao}</Text>
        </View>
      )}

      {/* Footer: timestamp + resolved timestamp */}
      <View style={card.footer}>
        <View style={card.footerLeft}>
          <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
          <Text style={card.dateText} numberOfLines={1}>{formatDate(alerta.dtAlerta)}</Text>
        </View>
        {alerta.statusAlerta === 'RESOLVIDO' && alerta.dtResolvidoEm && (
          <Text style={card.resolvedText} numberOfLines={1}>
            Res. {formatDate(alerta.dtResolvidoEm)}
          </Text>
        )}
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  root: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderLeftWidth: 4,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  nivelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  nivelBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tipoBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    backgroundColor: '#EEF0FB',
  },
  tipoBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  statusBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  regionText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    flex: 1,
  },
  body: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 19,
    marginBottom: Spacing.sm,
  },
  recBox: {
    flexDirection: 'row',
    gap: 5,
    backgroundColor: '#EEF0FB',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    alignItems: 'flex-start',
  },
  recIcon: { marginTop: 1 },
  recText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    flex: 1,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  dateText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    flexShrink: 1,
  },
  resolvedText: {
    fontSize: FontSize.xs,
    color: '#1B5E20',
    fontWeight: '600',
    flexShrink: 0,
  },
});

// ─── Counter chip ─────────────────────────────────────────────────────────────

interface CounterChipProps {
  value: number;
  label: string;
  accent?: string;
  onPress?: () => void;
}

function CounterChip({ value, label, accent = Colors.primary, onPress }: CounterChipProps) {
  return (
    <TouchableOpacity
      style={ctr.chip}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <Text style={[ctr.value, { color: accent }]}>{value}</Text>
      <Text style={ctr.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const ctr = StyleSheet.create({
  chip: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    minWidth: 68,
    ...Shadow.sm,
  },
  value: {
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AlertasScreen() {
  const { data: rawAlertas, status, errorMessage, load } = useAlertas();
  const { data: regioes, load: loadRegioes } = useRegioes();
  const { isGoverno } = useAppContext();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const rawParams = useLocalSearchParams<{ status?: string; tipo?: string }>();
  const paramStatus = typeof rawParams.status === 'string' ? rawParams.status : undefined;
  const paramTipo   = typeof rawParams.tipo   === 'string' ? rawParams.tipo   : undefined;

  const [refreshing,   setRefreshing]   = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(
    paramStatus && STATUS_FILTERS.some(f => f.value === paramStatus)
      ? (paramStatus as FilterStatus) : 'TODOS',
  );
  const [filterNivel,  setFilterNivel]  = useState<FilterNivel>('TODOS');
  const [filterTipo,   setFilterTipo]   = useState<FilterTipo>(
    paramTipo && TIPO_FILTERS.some(f => f.value === paramTipo)
      ? (paramTipo as FilterTipo) : 'TODOS',
  );
  const [filterRegiao, setFilterRegiao] = useState('TODOS');
  const [filterEstado, setFilterEstado] = useState('TODOS');
  const [searchText,   setSearchText]   = useState('');

  // idRegiao → { nome, cidade, estado }
  const regiaoInfoMap = useMemo(() => {
    const map: Record<number, RegiaoInfo> = {};
    regioes.forEach(r => { map[r.idRegiao] = { nome: r.nome, cidade: r.cidade, estado: r.estado }; });
    return map;
  }, [regioes]);

  const loadAll = useCallback(() => { load(); loadRegioes(); }, [load, loadRegioes]);
  const pollAll = useCallback(() => { load({ silent: true }); loadRegioes({ silent: true }); }, [load, loadRegioes]);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));
  usePolling(pollAll);

  // Sync URL params when navigating from Dashboard
  useEffect(() => {
    if (paramStatus && STATUS_FILTERS.some(f => f.value === paramStatus)) {
      setFilterStatus(paramStatus as FilterStatus);
    }
  }, [paramStatus]);

  useEffect(() => {
    if (paramTipo && TIPO_FILTERS.some(f => f.value === paramTipo)) {
      setFilterTipo(paramTipo as FilterTipo);
    }
  }, [paramTipo]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([load(), loadRegioes()]);
    setRefreshing(false);
  }, [load, loadRegioes]);

  // Region filter options — only regions that appear in the alert list
  const regiaoFilterOptions = useMemo<{ value: string; label: string }[]>(() => {
    const seen = new Map<number, string>();
    rawAlertas.forEach(a => {
      if (!seen.has(a.idRegiao)) {
        const info = regiaoInfoMap[a.idRegiao];
        seen.set(a.idRegiao, info ? `${info.nome} (${info.estado})` : `Região ${a.idRegiao}`);
      }
    });
    if (seen.size <= 1) return [];
    return [
      { value: 'TODOS', label: 'Todas' },
      ...Array.from(seen.entries()).map(([id, lbl]) => ({ value: String(id), label: lbl })),
    ];
  }, [rawAlertas, regiaoInfoMap]);

  // Estado filter options — only UFs present in the alert list
  const estadoFilterOptions = useMemo<{ value: string; label: string }[]>(() => {
    const states = new Set<string>();
    rawAlertas.forEach(a => {
      const info = regiaoInfoMap[a.idRegiao];
      if (info?.estado) states.add(info.estado);
    });
    if (states.size <= 1) return [];
    return [
      { value: 'TODOS', label: 'Todos' },
      ...Array.from(states).sort().map(uf => ({ value: uf, label: uf })),
    ];
  }, [rawAlertas, regiaoInfoMap]);

  // Summary counters — always unfiltered totals
  const counters = useMemo(() => ({
    total:      rawAlertas.length,
    abertos:    rawAlertas.filter(a => a.statusAlerta === 'ABERTO').length,
    emAnalise:  rawAlertas.filter(a => a.statusAlerta === 'EM_ANALISE').length,
    resolvidos: rawAlertas.filter(a => a.statusAlerta === 'RESOLVIDO').length,
    criticos:   rawAlertas.filter(a => a.nivelRisco === 'CRITICO').length,
    altos:      rawAlertas.filter(a => a.nivelRisco === 'ALTO').length,
  }), [rawAlertas]);

  // Filtered alert list
  const filtered = useMemo(() =>
    rawAlertas.filter(a => {
      if (filterStatus !== 'TODOS' && a.statusAlerta !== filterStatus) return false;
      if (filterNivel  !== 'TODOS' && a.nivelRisco   !== filterNivel)  return false;
      if (filterTipo   !== 'TODOS' && a.tipoAlerta   !== filterTipo)   return false;
      if (filterRegiao !== 'TODOS' && String(a.idRegiao) !== filterRegiao) return false;
      if (filterEstado !== 'TODOS') {
        const info = regiaoInfoMap[a.idRegiao];
        if (!info || info.estado !== filterEstado) return false;
      }
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        const hit =
          (a.titulo?.toLowerCase().includes(q) ?? false) ||
          (a.descricao?.toLowerCase().includes(q) ?? false) ||
          (a.recomendacao?.toLowerCase().includes(q) ?? false);
        if (!hit) return false;
      }
      return true;
    }),
    [rawAlertas, filterStatus, filterNivel, filterTipo, filterRegiao, filterEstado, searchText, regiaoInfoMap],
  );

  const hasFilters = !!(
    searchText.trim() ||
    filterStatus !== 'TODOS' || filterNivel !== 'TODOS' ||
    filterTipo   !== 'TODOS' || filterRegiao !== 'TODOS' || filterEstado !== 'TODOS'
  );

  const clearFilters = useCallback(() => {
    setSearchText('');
    setFilterStatus('TODOS');
    setFilterNivel('TODOS');
    setFilterTipo('TODOS');
    setFilterRegiao('TODOS');
    setFilterEstado('TODOS');
  }, []);

  const screenTitle = isGoverno ? 'Console de Alertas' : 'Alertas em Acompanhamento';

  // ── List header ──────────────────────────────────────────────────────────────

  const ListHeader = (
    <View>
      {/* Title — desktop only (mobile uses navigator header) */}
      {isDesktop && (
        <View style={styles.desktopTitleWrap}>
          <Text style={styles.desktopTitle}>{screenTitle}</Text>
        </View>
      )}

      {/* Summary counters — always total geral; tappable to quick-filter */}
      <View style={styles.countersSection}>
        {hasFilters && (
          <Text style={styles.countersSectionLabel}>Total geral</Text>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.countersRow}
        >
          <CounterChip
            value={counters.total}     label="Total"
            accent={Colors.primary}   onPress={clearFilters}
          />
          <CounterChip
            value={counters.abertos}   label="Abertos"
            accent={RiskColors.ALTO}   onPress={() => { clearFilters(); setFilterStatus('ABERTO'); }}
          />
          <CounterChip
            value={counters.emAnalise} label="Em análise"
            accent="#E65100"           onPress={() => { clearFilters(); setFilterStatus('EM_ANALISE'); }}
          />
          <CounterChip
            value={counters.resolvidos} label="Resolvidos"
            accent="#1B5E20"            onPress={() => { clearFilters(); setFilterStatus('RESOLVIDO'); }}
          />
          <CounterChip
            value={counters.criticos}  label="Críticos"
            accent={RiskColors.CRITICO} onPress={() => { clearFilters(); setFilterNivel('CRITICO'); }}
          />
          <CounterChip
            value={counters.altos}     label="Altos"
            accent={RiskColors.ALTO}   onPress={() => { clearFilters(); setFilterNivel('ALTO'); }}
          />
        </ScrollView>
      </View>

      {/* Search box */}
      <View style={[styles.searchWrap, isDesktop && styles.searchWrapDesktop]}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar por título, descrição ou recomendação…"
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchText('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown filters */}
      <FilterPanel style={styles.filterPanel}>
        <FilterSelect
          label="Status"
          options={STATUS_FILTERS}
          selected={filterStatus}
          onSelect={setFilterStatus}
        />
        <FilterSelect
          label="Nível"
          options={NIVEL_FILTERS}
          selected={filterNivel}
          onSelect={setFilterNivel}
        />
        <FilterSelect
          label="Tipo"
          options={TIPO_FILTERS}
          selected={filterTipo}
          onSelect={setFilterTipo}
        />
        {regiaoFilterOptions.length > 0 && (
          <FilterSelect
            label="Região"
            options={regiaoFilterOptions}
            selected={filterRegiao}
            onSelect={setFilterRegiao}
          />
        )}
        {estadoFilterOptions.length > 0 && (
          <FilterSelect
            label="Estado"
            options={estadoFilterOptions}
            selected={filterEstado}
            onSelect={setFilterEstado}
          />
        )}
      </FilterPanel>
      {hasFilters && (
        <TouchableOpacity onPress={clearFilters} style={styles.clearBtn} activeOpacity={0.75}>
          <Ionicons name="close-circle-outline" size={14} color={Colors.primary} />
          <Text style={styles.clearBtnText}>Limpar filtros</Text>
        </TouchableOpacity>
      )}

      {/* Result count */}
      {status === 'success' && (
        <Text style={[styles.resultCount, isDesktop && styles.resultCountDesktop]}>
          {hasFilters
            ? `${filtered.length} de ${rawAlertas.length} ${rawAlertas.length === 1 ? 'alerta' : 'alertas'}`
            : `${rawAlertas.length} ${rawAlertas.length === 1 ? 'alerta' : 'alertas'}`}
        </Text>
      )}
    </View>
  );

  const isLoading = status === 'loading' && !refreshing && rawAlertas.length === 0;
  const isError   = status === 'error'   && rawAlertas.length === 0;

  return (
    <View style={styles.root}>
      {isLoading && <LoadingState message="Carregando alertas…" />}
      {isError   && <ErrorState  message={errorMessage ?? 'Erro ao carregar alertas.'} onRetry={load} />}

      {!isLoading && !isError && (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.idAlerta)}
          renderItem={({ item }) => (
            <AlertCard
              alerta={item}
              regiaoInfo={regiaoInfoMap[item.idRegiao] ?? null}
            />
          )}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            status === 'success' ? (
              <EmptyState
                message={
                  hasFilters
                    ? 'Nenhum alerta encontrado para os filtros selecionados.'
                    : 'Nenhum alerta registrado.'
                }
              />
            ) : null
          }
          contentContainerStyle={[
            styles.listContent,
            isDesktop && styles.listContentDesktop,
            filtered.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  desktopTitleWrap: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  desktopTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },

  // Counters
  countersSection: {
    paddingTop: Spacing.sm,
  },
  countersSectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.md,
    marginBottom: 4,
  },
  countersRow: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 4,
    gap: Spacing.xs,
  },
  searchWrapDesktop: { marginHorizontal: 0 },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    paddingVertical: 0,
  },

  // Filters block
  filterPanel: {
    marginBottom: Spacing.xs,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  clearBtnText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Result count
  resultCount: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
    fontWeight: '500',
  },
  resultCountDesktop: { paddingHorizontal: 0 },

  // List
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  listContentDesktop: {
    paddingHorizontal: Spacing.xl,
  },
  listContentEmpty: {
    flex: 1,
  },
});
