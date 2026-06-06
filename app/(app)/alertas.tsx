import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Platform,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlertas } from '@hooks/useAlertas';
import { useResolverAlerta } from '@hooks/useResolverAlerta';
import { useRegioes } from '@hooks/useRegioes';
import { useAppContext } from '@contexts/AppContext';
import { useToast } from '@contexts/ToastContext';
import { LoadingState } from '@components/ui/LoadingState';
import { ErrorState } from '@components/ui/ErrorState';
import { EmptyState } from '@components/ui/EmptyState';
import { Colors, RiskColors, RiskBackgrounds } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import {
  NivelRiscoLabels,
  TipoAlertaLabels,
  StatusAlertaLabels,
} from '@constants/enums';
import type { NivelRisco, TipoAlerta, StatusAlerta } from '@constants/enums';
import type { Alerta } from '@/types';

// ─── Filter types ─────────────────────────────────────────────────────────────

type FilterStatus = StatusAlerta | 'TODOS';
type FilterNivel = NivelRisco | 'TODOS';
type FilterTipo = TipoAlerta | 'TODOS';

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'ABERTO', label: 'Aberto' },
  { value: 'EM_ANALISE', label: 'Em análise' },
  { value: 'RESOLVIDO', label: 'Resolvido' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

const NIVEL_FILTERS: { value: FilterNivel; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'CRITICO', label: 'Crítico' },
  { value: 'ALTO', label: 'Alto' },
  { value: 'MODERADO', label: 'Moderado' },
  { value: 'BAIXO', label: 'Baixo' },
];

const TIPO_FILTERS: { value: FilterTipo; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'ENCHENTE', label: 'Enchente' },
  { value: 'DESLIZAMENTO', label: 'Deslizamento' },
  { value: 'TEMPESTADE', label: 'Tempestade' },
  { value: 'QUALIDADE_AR', label: 'Qualidade do ar' },
  { value: 'OPERACIONAL', label: 'Operacional' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadgeColor(s: StatusAlerta): string {
  switch (s) {
    case 'ABERTO': return '#B71C1C';
    case 'EM_ANALISE': return '#E65100';
    case 'RESOLVIDO': return '#1B5E20';
    case 'CANCELADO': return '#616161';
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Alert card ───────────────────────────────────────────────────────────────

interface AlertCardProps {
  alerta: Alerta;
  regiaoNome: string;
  canResolve: boolean;
  onResolvePress: (alerta: Alerta) => void;
}

function AlertCard({ alerta, regiaoNome, canResolve, onResolvePress }: AlertCardProps) {
  const borderColor = RiskColors[alerta.nivelRisco] ?? Colors.border;
  const bgColor = RiskBackgrounds[alerta.nivelRisco] ?? Colors.card;
  const isOpen = alerta.statusAlerta === 'ABERTO' || alerta.statusAlerta === 'EM_ANALISE';
  const showResolve = canResolve && isOpen;

  return (
    <View style={[card.root, { borderLeftColor: borderColor }]}>
      {/* Badge row */}
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
        <View style={[card.statusBadge, { backgroundColor: statusBadgeColor(alerta.statusAlerta) }]}>
          <Text style={card.statusBadgeText}>
            {StatusAlertaLabels[alerta.statusAlerta] ?? alerta.statusAlerta}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={card.title} numberOfLines={2}>{alerta.titulo}</Text>

      {/* Region */}
      <View style={card.regionRow}>
        <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
        <Text style={card.regionText} numberOfLines={1}>{regiaoNome}</Text>
      </View>

      {/* Description */}
      <Text style={card.body} numberOfLines={3}>{alerta.descricao}</Text>

      {/* Recommendation */}
      {!!alerta.recomendacao && (
        <View style={card.recBox}>
          <Ionicons name="shield-checkmark-outline" size={13} color={Colors.primary} />
          <Text style={card.recText} numberOfLines={2}>{alerta.recomendacao}</Text>
        </View>
      )}

      {/* Footer row */}
      <View style={card.footer}>
        <View style={card.footerLeft}>
          <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
          <Text style={card.dateText}>{formatDate(alerta.dtAlerta)}</Text>
        </View>
        {showResolve && (
          <TouchableOpacity
            style={card.resolveBtn}
            onPress={() => onResolvePress(alerta)}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={15} color="#FFFFFF" />
            <Text style={card.resolveBtnText}>Resolver</Text>
          </TouchableOpacity>
        )}
        {alerta.statusAlerta === 'RESOLVIDO' && alerta.dtResolvidoEm && (
          <Text style={card.resolvedText}>
            Resolvido {formatDate(alerta.dtResolvidoEm)}
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
    marginLeft: 'auto',
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
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  dateText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1B5E20',
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
  },
  resolveBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resolvedText: {
    fontSize: FontSize.xs,
    color: '#1B5E20',
    fontWeight: '600',
  },
});

// ─── Counter chip ─────────────────────────────────────────────────────────────

interface CounterChipProps {
  value: number;
  label: string;
  accent?: string;
}

function CounterChip({ value, label, accent = Colors.primary }: CounterChipProps) {
  return (
    <View style={counter.chip}>
      <Text style={[counter.value, { color: accent }]}>{value}</Text>
      <Text style={counter.label}>{label}</Text>
    </View>
  );
}

const counter = StyleSheet.create({
  chip: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    minWidth: 72,
    ...Shadow.sm,
    marginRight: Spacing.sm,
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

// ─── Filter chip row ──────────────────────────────────────────────────────────

interface FilterRowProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (v: T) => void;
}

function FilterRow<T extends string>({ label, options, selected, onSelect }: FilterRowProps<T>) {
  return (
    <View style={filter.rowWrap}>
      <Text style={filter.rowLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={filter.row}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[filter.chip, selected === opt.value && filter.chipActive]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.75}
          >
            <Text style={[filter.chipText, selected === opt.value && filter.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const filter = StyleSheet.create({
  rowWrap: {
    marginBottom: Spacing.xs,
  },
  rowLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    paddingHorizontal: Spacing.md,
  },
  row: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  chip: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm + 4,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF0FB',
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: Colors.primary,
  },
});

// ─── Resolve confirmation modal ───────────────────────────────────────────────

interface ResolveModalProps {
  alerta: Alerta | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ResolveModal({ alerta, loading, onConfirm, onCancel }: ResolveModalProps) {
  if (!alerta) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={modal.overlay}>
        <View style={modal.dialog}>
          <View style={modal.iconWrap}>
            <Ionicons name="checkmark-circle" size={40} color="#1B5E20" />
          </View>
          <Text style={modal.title}>Resolver alerta?</Text>
          <Text style={modal.body} numberOfLines={3}>
            "{alerta.titulo}"
          </Text>
          <Text style={modal.hint}>
            O status mudará para <Text style={modal.hintBold}>RESOLVIDO</Text>. Esta ação não pode ser desfeita.
          </Text>
          <View style={modal.actions}>
            <TouchableOpacity
              style={modal.cancelBtn}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.75}
            >
              <Text style={modal.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modal.confirmBtn, loading && modal.confirmBtnDisabled]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={modal.confirmText}>Resolver</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  dialog: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...Shadow.md,
  },
  iconWrap: {
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  body: {
    fontSize: FontSize.md,
    color: Colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  hint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 19,
  },
  hintBold: {
    fontWeight: '700',
    color: '#1B5E20',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AlertasScreen() {
  const { data: rawAlertas, status, errorMessage, load } = useAlertas();
  const { data: regioes, load: loadRegioes } = useRegioes();
  const { execute: resolver, status: resolveStatus, reset: resetResolver } = useResolverAlerta();
  const { isGoverno } = useAppContext();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('TODOS');
  const [filterNivel, setFilterNivel] = useState<FilterNivel>('TODOS');
  const [filterTipo, setFilterTipo] = useState<FilterTipo>('TODOS');
  const [resolveTarget, setResolveTarget] = useState<Alerta | null>(null);

  // Build idRegiao → nome map from regions list
  const regiaoMap = useMemo(() => {
    const map: Record<number, string> = {};
    regioes.forEach(r => { map[r.idRegiao] = r.nome; });
    return map;
  }, [regioes]);

  // Refresh both lists on focus
  useFocusEffect(
    useCallback(() => {
      load();
      loadRegioes();
    }, [load, loadRegioes]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([load(), loadRegioes()]);
    setRefreshing(false);
  }, [load, loadRegioes]);

  // Summary counters
  const counters = useMemo(() => ({
    total: rawAlertas.length,
    abertos: rawAlertas.filter(a => a.statusAlerta === 'ABERTO').length,
    emAnalise: rawAlertas.filter(a => a.statusAlerta === 'EM_ANALISE').length,
    resolvidos: rawAlertas.filter(a => a.statusAlerta === 'RESOLVIDO').length,
    criticos: rawAlertas.filter(a => a.nivelRisco === 'CRITICO').length,
    altos: rawAlertas.filter(a => a.nivelRisco === 'ALTO').length,
  }), [rawAlertas]);

  // Apply filters
  const filtered = useMemo(() =>
    rawAlertas.filter(a => {
      if (filterStatus !== 'TODOS' && a.statusAlerta !== filterStatus) return false;
      if (filterNivel !== 'TODOS' && a.nivelRisco !== filterNivel) return false;
      if (filterTipo !== 'TODOS' && a.tipoAlerta !== filterTipo) return false;
      return true;
    }),
    [rawAlertas, filterStatus, filterNivel, filterTipo],
  );

  const handleResolvePress = useCallback((alerta: Alerta) => {
    resetResolver();
    setResolveTarget(alerta);
  }, [resetResolver]);

  const handleConfirmResolve = useCallback(async () => {
    if (!resolveTarget) return;
    const result = await resolver(resolveTarget.idAlerta);
    if (result) {
      setResolveTarget(null);
      showToast('Alerta resolvido com sucesso.', 'success');
      load();
    } else {
      showToast('Erro ao resolver alerta. Tente novamente.', 'error');
    }
  }, [resolveTarget, resolver, showToast, load]);

  const handleCancelResolve = useCallback(() => {
    setResolveTarget(null);
    resetResolver();
  }, [resetResolver]);

  const screenTitle = isGoverno ? 'Console de Alertas' : 'Alertas em Acompanhamento';

  // List header: counters + filters
  const ListHeader = (
    <View>
      {/* Summary counters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.countersRow, isDesktop && styles.countersRowDesktop]}
      >
        <CounterChip value={counters.total} label="Total" accent={Colors.primary} />
        <CounterChip value={counters.abertos} label="Abertos" accent={RiskColors.ALTO} />
        <CounterChip value={counters.emAnalise} label="Em análise" accent="#E65100" />
        <CounterChip value={counters.resolvidos} label="Resolvidos" accent="#1B5E20" />
        <CounterChip value={counters.criticos} label="Críticos" accent={RiskColors.CRITICO} />
        <CounterChip value={counters.altos} label="Altos" accent={RiskColors.ALTO} />
      </ScrollView>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <FilterRow
          label="Status"
          options={STATUS_FILTERS}
          selected={filterStatus}
          onSelect={setFilterStatus}
        />
        <FilterRow
          label="Nível"
          options={NIVEL_FILTERS}
          selected={filterNivel}
          onSelect={setFilterNivel}
        />
        <FilterRow
          label="Tipo"
          options={TIPO_FILTERS}
          selected={filterTipo}
          onSelect={setFilterTipo}
        />
      </View>

      {/* Result count */}
      {status === 'success' && (
        <Text style={[styles.resultCount, isDesktop && styles.resultCountDesktop]}>
          {filtered.length === rawAlertas.length
            ? `${filtered.length} alerta${filtered.length !== 1 ? 's' : ''}`
            : `${filtered.length} de ${rawAlertas.length} alertas`}
        </Text>
      )}
    </View>
  );

  const isLoading = status === 'loading' && !refreshing && rawAlertas.length === 0;
  const isError = status === 'error' && rawAlertas.length === 0;

  return (
    <View style={styles.root}>
      {/* Screen title (mobile: shown in tab header; desktop: shown inline) */}
      {isDesktop && (
        <View style={styles.desktopHeader}>
          <Text style={styles.desktopTitle}>{screenTitle}</Text>
        </View>
      )}

      {isLoading && <LoadingState message="Carregando alertas…" />}
      {isError && <ErrorState message={errorMessage ?? 'Erro ao carregar alertas.'} onRetry={load} />}

      {!isLoading && !isError && (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.idAlerta)}
          renderItem={({ item }) => (
            <AlertCard
              alerta={item}
              regiaoNome={regiaoMap[item.idRegiao] ?? `Região ${item.idRegiao}`}
              canResolve={isGoverno}
              onResolvePress={handleResolvePress}
            />
          )}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            status === 'success' ? (
              <EmptyState message="Nenhum alerta encontrado para os filtros selecionados." />
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

      <ResolveModal
        alerta={resolveTarget}
        loading={resolveStatus === 'loading'}
        onConfirm={handleConfirmResolve}
        onCancel={handleCancelResolve}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Desktop inline title
  desktopHeader: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    maxWidth: 900,
    alignSelf: 'center' as const,
    width: '100%',
  },
  desktopTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },

  // Summary counters row
  countersRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  countersRowDesktop: {
    paddingHorizontal: 0,
  },

  // Filters container
  filtersSection: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    marginBottom: Spacing.sm,
  },

  // Result count
  resultCount: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
    fontWeight: '500',
  },
  resultCountDesktop: {
    paddingHorizontal: 0,
  },

  // FlatList content
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  listContentDesktop: {
    maxWidth: 900,
    alignSelf: 'center' as const,
    width: '100%',
    paddingHorizontal: Spacing.xl,
  },
  listContentEmpty: {
    flex: 1,
  },
});
