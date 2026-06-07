import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRegioes } from '@hooks/useRegioes';
import { useEstacoes } from '@hooks/useEstacoes';
import { useAppContext } from '@contexts/AppContext';
import { useToast } from '@contexts/ToastContext';
import { usePolling } from '@hooks/usePolling';
import { LoadingState } from '@components/ui/LoadingState';
import { ErrorState } from '@components/ui/ErrorState';
import { EmptyState } from '@components/ui/EmptyState';
import { EstacaoCard, EstacaoForm } from '@components/estacoes';
import { FilterSelect, FilterPanel, HybridSelect } from '@components/filters';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import type { StatusEstacao, TipoEstacao } from '@constants/enums';

// ─── Filter types ──────────────────────────────────────────────────────────────

type FilterStatus = StatusEstacao | 'TODOS';
type FilterTipo   = TipoEstacao  | 'TODOS';

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'TODOS',      label: 'Todas' },
  { value: 'ATIVA',      label: 'Ativa' },
  { value: 'INATIVA',    label: 'Inativa' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
  { value: 'FALHA',      label: 'Falha' },
  { value: 'SEM_COM',    label: 'Sem com.' },
];

const TIPO_FILTERS: { value: FilterTipo; label: string }[] = [
  { value: 'TODOS',      label: 'Todos' },
  { value: 'REAL',       label: 'Real' },
  { value: 'SIMULADA',   label: 'Simulada' },
  { value: 'REFERENCIA', label: 'Referência' },
];

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function EstacoesScreen() {
  const { data: regioes, status: regStatus, load: loadRegioes } = useRegioes();
  const { isGoverno } = useAppContext();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const router = useRouter();

  const [selectedRegiaoId, setSelectedRegiaoId] = useState<number | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('TODOS');
  const [filterTipo, setFilterTipo] = useState<FilterTipo>('TODOS');

  const { data: estacoes, status: estStatus, errorMessage: estError, load: loadEstacoes } =
    useEstacoes(selectedRegiaoId);

  useFocusEffect(
    useCallback(() => { loadRegioes(); }, [loadRegioes]),
  );

  useFocusEffect(
    useCallback(() => {
      if (selectedRegiaoId !== null) loadEstacoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRegiaoId]),
  );

  const pollEstacoes = useCallback(() => {
    if (selectedRegiaoId !== null) loadEstacoes({ silent: true });
  }, [selectedRegiaoId, loadEstacoes]);
  usePolling(pollEstacoes);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRegioes();
    if (selectedRegiaoId !== null) await loadEstacoes();
    setRefreshing(false);
  }, [loadRegioes, loadEstacoes, selectedRegiaoId]);

  const handleSelectRegiao = useCallback((id: number) => {
    setSelectedRegiaoId(id);
    setSearchText('');
    setFilterStatus('TODOS');
    setFilterTipo('TODOS');
  }, []);

  const [regiaoText, setRegiaoText] = useState('');

  const regiaoDisplayOptions = useMemo(() =>
    regioes
      .filter(r => r.stAtivo !== 'N')
      .map(r => ({ value: String(r.idRegiao), label: `${r.nome} (${r.estado})` })),
    [regioes],
  );

  const handleRegiaoChange = useCallback((t: string) => {
    setRegiaoText(t);
    if (!t.trim()) setSelectedRegiaoId(null);
  }, []);

  const handleRegiaoOptionSelect = useCallback((value: string, label: string) => {
    if (!value) return;
    handleSelectRegiao(Number(value));
    setRegiaoText(label);
  }, [handleSelectRegiao]);

  const handleFormSuccess = useCallback(() => {
    setFormVisible(false);
    showToast('Estação cadastrada com sucesso.', 'success');
    loadEstacoes();
  }, [showToast, loadEstacoes]);

  const selectedRegiao = useMemo(
    () => regioes.find(r => r.idRegiao === selectedRegiaoId) ?? null,
    [regioes, selectedRegiaoId],
  );

  const filteredEstacoes = useMemo(() =>
    estacoes.filter(e => {
      if (filterStatus !== 'TODOS' && e.statusEstacao !== filterStatus) return false;
      if (filterTipo   !== 'TODOS' && e.tipoEstacao   !== filterTipo)   return false;
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        if (!e.nome.toLowerCase().includes(q) && !e.codigoEstacao.toLowerCase().includes(q)) return false;
      }
      return true;
    }),
    [estacoes, filterStatus, filterTipo, searchText],
  );

  const hasFilters = !!(searchText.trim() || filterStatus !== 'TODOS' || filterTipo !== 'TODOS');

  const clearFilters = useCallback(() => {
    setSearchText('');
    setFilterStatus('TODOS');
    setFilterTipo('TODOS');
  }, []);

  const showFilters = selectedRegiaoId !== null && estStatus === 'success';

  const screenTitle    = isGoverno ? 'Estações IoT' : 'Estações de Monitoramento';
  const screenSubtitle = isGoverno
    ? 'Cadastro e acompanhamento das estações vinculadas às regiões monitoradas.'
    : 'Visualização das estações usadas no acompanhamento territorial.';

  // ── List header ──────────────────────────────────────────────────────────────

  const ListHeader = (
    <View>
      {/* Role header */}
      <View style={[styles.headerSection, isDesktop && styles.headerSectionDesktop]}>
        <Text style={styles.screenTitle}>{screenTitle}</Text>
        <Text style={styles.screenSubtitle}>{screenSubtitle}</Text>
      </View>

      {/* Region selector */}
      <View style={styles.selectorSection}>
        {regStatus === 'loading' && regioes.length === 0 ? (
          <View style={styles.regLoadingRow}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.regLoadingText}>Carregando regiões…</Text>
          </View>
        ) : (
          <View style={[styles.regiaoSelectWrap, isDesktop && styles.regiaoSelectWrapDesktop]}>
            <HybridSelect
              label="Região"
              placeholder="Buscar região…"
              options={regiaoDisplayOptions}
              value={regiaoText}
              onChange={handleRegiaoChange}
              onOptionSelect={handleRegiaoOptionSelect}
              disabled={regioes.length === 0}
            />
          </View>
        )}
      </View>

      {/* No-region prompt */}
      {selectedRegiaoId === null && regStatus !== 'loading' && (
        <View style={[styles.promptBox, isDesktop && styles.promptBoxDesktop]}>
          <Ionicons name="radio-outline" size={36} color={Colors.border} />
          <Text style={styles.promptText}>
            Selecione uma região para visualizar ou cadastrar estações.
          </Text>
        </View>
      )}

      {/* Filters block */}
      {showFilters && (
        <View style={styles.filterBlock}>
          <View style={[styles.searchWrap, isDesktop && styles.searchWrapDesktop]}>
            <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Buscar por nome ou código…"
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
          <FilterPanel>
            <FilterSelect
              label="Status"
              options={STATUS_FILTERS}
              selected={filterStatus}
              onSelect={setFilterStatus}
            />
            <FilterSelect
              label="Tipo"
              options={TIPO_FILTERS}
              selected={filterTipo}
              onSelect={setFilterTipo}
            />
          </FilterPanel>
          {hasFilters && (
            <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersBtn} activeOpacity={0.75}>
              <Ionicons name="close-circle-outline" size={14} color={Colors.primary} />
              <Text style={styles.clearFiltersBtnText}>Limpar filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Stations count + add button */}
      {selectedRegiaoId !== null && estStatus === 'success' && (
        <View style={[styles.stationsHeader, isDesktop && styles.stationsHeaderDesktop]}>
          <Text style={styles.stationsCount}>
            {hasFilters
              ? `${filteredEstacoes.length} de ${estacoes.length} ${estacoes.length === 1 ? 'estação' : 'estações'}`
              : `${estacoes.length} ${estacoes.length === 1 ? 'estação' : 'estações'}`}
            {selectedRegiao ? ` · ${selectedRegiao.nome}` : ''}
          </Text>
          {isGoverno && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setFormVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Cadastrar estação</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Station loading/error */}
      {selectedRegiaoId !== null && estStatus === 'loading' && (
        <LoadingState message="Carregando estações…" />
      )}
      {selectedRegiaoId !== null && estStatus === 'error' && (
        <ErrorState message={estError ?? 'Erro ao carregar estações.'} onRetry={loadEstacoes} />
      )}
    </View>
  );

  const showStationList = selectedRegiaoId !== null &&
    (estStatus === 'success' || (estStatus !== 'error' && estacoes.length > 0));

  return (
    <View style={styles.root}>
      <FlatList
        data={showStationList ? filteredEstacoes : []}
        keyExtractor={item => String(item.idEstacao)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.cardWrap, isDesktop && styles.cardWrapDesktop]}
            onPress={() => router.push(`/estacoes/${item.idEstacao}?idRegiao=${item.idRegiao}`)}
            activeOpacity={0.8}
          >
            <EstacaoCard estacao={item} regiaoNome={selectedRegiao?.nome} />
            <View style={styles.telemetriaHint}>
              <Ionicons name="pulse-outline" size={12} color={Colors.primary} />
              <Text style={styles.telemetriaHintText}>Ver telemetria</Text>
              <Ionicons name="arrow-forward" size={12} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          showStationList ? (
            <View style={[styles.emptyWrap, isDesktop && styles.emptyWrapDesktop]}>
              <EmptyState
                message={
                  hasFilters
                    ? 'Nenhuma estação encontrada para os filtros selecionados.'
                    : 'Nenhuma estação cadastrada para esta região.'
                }
                icon="📡"
              />
              {!hasFilters && isGoverno && (
                <TouchableOpacity
                  style={styles.emptyCreateBtn}
                  onPress={() => setFormVisible(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add-circle-outline" size={18} color={Colors.card} />
                  <Text style={styles.emptyCreateBtnText}>Cadastrar estação</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
        contentContainerStyle={[
          styles.listContent,
          (!showStationList || filteredEstacoes.length === 0) && styles.listContentEmpty,
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

      {/* FAB — mobile Governo only */}
      {isGoverno && selectedRegiaoId !== null && estStatus === 'success' && !isDesktop && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setFormVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color={Colors.card} />
        </TouchableOpacity>
      )}

      {/* Create station modal */}
      {selectedRegiao && (
        <EstacaoForm
          visible={formVisible}
          regiao={selectedRegiao}
          onClose={() => setFormVisible(false)}
          onSuccess={handleFormSuccess}
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
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  listContentEmpty: {
    flex: 1,
  },

  headerSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerSectionDesktop: {
    paddingHorizontal: Spacing.xl,
  },
  screenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
    lineHeight: 19,
  },

  selectorSection: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    marginBottom: Spacing.sm,
  },
  regiaoSelectWrap: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  regiaoSelectWrapDesktop: {
    paddingHorizontal: Spacing.xl,
    maxWidth: 360,
  },
  regLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  regLoadingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },

  promptBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  promptBoxDesktop: {
    maxWidth: 480,
    alignSelf: 'center' as const,
    width: '100%',
  },
  promptText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  filterBlock: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    marginBottom: Spacing.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 4,
    gap: Spacing.xs,
  },
  searchWrapDesktop: {},
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    paddingVertical: 0,
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 2,
  },
  clearFiltersBtnText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },

  stationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  stationsHeaderDesktop: {
    paddingHorizontal: Spacing.xl,
  },
  stationsCount: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
    flex: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  addBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  cardWrap: {
    paddingHorizontal: Spacing.md,
  },
  cardWrapDesktop: {
    paddingHorizontal: Spacing.xl,
  },
  telemetriaHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    marginHorizontal: Spacing.xs,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.xs,
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  telemetriaHintText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
    flex: 1,
  },

  emptyWrap: {
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  emptyWrapDesktop: {
    paddingHorizontal: Spacing.xl,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
    ...Shadow.sm,
  },
  emptyCreateBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.card,
  },

  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
});
