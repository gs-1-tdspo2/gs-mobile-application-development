import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TextInput,
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
import { useRegioes } from '@hooks/useRegioes';
import { useEstacoes } from '@hooks/useEstacoes';
import { useLeituras } from '@hooks/useLeituras';
import { useAppContext } from '@contexts/AppContext';
import { useToast } from '@contexts/ToastContext';
import { usePolling } from '@hooks/usePolling';
import { LoadingState } from '@components/ui/LoadingState';
import { ErrorState } from '@components/ui/ErrorState';
import { EmptyState } from '@components/ui/EmptyState';
import { EstacaoCard, EstacaoForm } from '@components/estacoes';
import { FilterSelect, FilterPanel } from '@components/filters';
import { SensorReadingSection } from '@components/charts';
import { Colors, RiskColors } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import { StatusEstacaoLabels, TipoEstacaoLabels } from '@constants/enums';
import type { StatusEstacao, TipoEstacao } from '@constants/enums';
import type { EstacaoIot, RegiaoMonitorada } from '@/types';
import { extractSensorAnalysis } from '@utils/sensorTransforms';

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterStatus = StatusEstacao | 'TODOS';
type FilterTipo = TipoEstacao | 'TODOS';

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'TODOS', label: 'Todas' },
  { value: 'ATIVA', label: 'Ativa' },
  { value: 'INATIVA', label: 'Inativa' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
  { value: 'FALHA', label: 'Falha' },
  { value: 'SEM_COM', label: 'Sem com.' },
];

const TIPO_FILTERS: { value: FilterTipo; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'REAL', label: 'Real' },
  { value: 'SIMULADA', label: 'Simulada' },
  { value: 'REFERENCIA', label: 'Referência' },
];


// ─── Station detail modal ─────────────────────────────────────────────────────

function formatDateShort(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

const STATUS_COLORS: Record<StatusEstacao, string> = {
  ATIVA:      '#2E7D32',
  INATIVA:    '#757575',
  MANUTENCAO: '#EF6C00',
  FALHA:      '#D32F2F',
  SEM_COM:    '#F9A825',
};

interface StationDetailModalProps {
  visible: boolean;
  estacao: EstacaoIot | null;
  regiaoId: number | null;
  regiaoNome?: string;
  onClose: () => void;
}

function StationDetailModal({ visible, estacao, regiaoId, regiaoNome, onClose }: StationDetailModalProps) {
  const { data: leituras, status: leitStatus, load } = useLeituras(regiaoId);

  useEffect(() => {
    if (visible && regiaoId !== null) void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, regiaoId]);

  useEffect(() => {
    if (!visible || regiaoId === null) return;
    const id = setInterval(() => void load(), 10_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, regiaoId]);

  // Filter by station if idEstacao is present in readings; fall back to all region readings
  const stationPool = useMemo(() => {
    if (!estacao || leituras.length === 0) return [];
    const forStation = leituras.filter(l => l.idEstacao === estacao.idEstacao);
    return forStation.length > 0 ? forStation : leituras;
  }, [leituras, estacao]);

  const isRegionFallback = useMemo(() => {
    if (!estacao || leituras.length === 0) return false;
    const forStation = leituras.filter(l => l.idEstacao === estacao.idEstacao);
    return forStation.length === 0 && leituras.length > 0;
  }, [leituras, estacao]);

  const analysis = useMemo(() => extractSensorAnalysis(stationPool), [stationPool]);

  if (!estacao) return null;

  const statusColor = STATUS_COLORS[estacao.statusEstacao] ?? Colors.textMuted;
  const hasData = stationPool.length > 0;
  const isLoading = (leitStatus === 'loading' || leitStatus === 'idle') && !hasData;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={det.overlay}>
        <View style={det.sheet}>
          {/* Drag handle */}
          <View style={det.handle} />

          {/* Header */}
          <View style={det.header}>
            <View style={det.headerLeft}>
              <Text style={det.stationName} numberOfLines={2}>{estacao.nome}</Text>
              <View style={det.codeRow}>
                <Text style={det.stationCode}>{estacao.codigoEstacao}</Text>
                {regiaoNome ? (
                  <Text style={det.regiaoLabel}> · {regiaoNome}</Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={det.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Status + type + live badges */}
          <View style={det.badgeRow}>
            <View style={[det.statusBadge, { backgroundColor: statusColor + '22' }]}>
              <Text style={[det.statusBadgeText, { color: statusColor }]}>
                {StatusEstacaoLabels[estacao.statusEstacao] ?? estacao.statusEstacao}
              </Text>
            </View>
            <View style={det.tipoBadge}>
              <Text style={det.tipoBadgeText}>
                {TipoEstacaoLabels[estacao.tipoEstacao] ?? estacao.tipoEstacao}
              </Text>
            </View>
            <View style={det.livePill}>
              <View style={det.liveDot} />
              <Text style={det.liveText}>Ao vivo</Text>
            </View>
          </View>

          {/* Last communication + optional coordinates */}
          <Text style={det.lastComm}>
            Última comunicação: {formatDateShort(estacao.dtUltimaComunicacao)}
          </Text>
          {estacao.latitude != null && estacao.longitude != null && (
            <Text style={det.coords}>
              {Number(estacao.latitude).toFixed(5)}, {Number(estacao.longitude).toFixed(5)}
            </Text>
          )}

          <ScrollView style={det.scroll} showsVerticalScrollIndicator={false}>
            {/* Loading */}
            {isLoading && (
              <View style={det.loadingRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={det.loadingText}>Carregando leituras…</Text>
              </View>
            )}

            {/* Error */}
            {leitStatus === 'error' && (
              <Text style={det.errorText}>Erro ao carregar leituras.</Text>
            )}

            {/* No data */}
            {!isLoading && leitStatus !== 'error' && !hasData && (
              <Text style={det.emptyText}>
                Nenhuma leitura encontrada para esta estação.
              </Text>
            )}

            {/* Telemetry data */}
            {hasData && (
              <View>
                {/* Region fallback disclosure */}
                {isRegionFallback && (
                  <View style={det.disclosureBox}>
                    <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
                    <Text style={det.disclosureText}>
                      A API retorna leituras por região. Não foi possível isolar esta estação individualmente.
                    </Text>
                  </View>
                )}

                {/* Reading range */}
                {analysis.rangeLabel && (
                  <Text style={det.rangeText}>
                    {analysis.totalLeituras} {analysis.totalLeituras === 1 ? 'leitura' : 'leituras'} · {analysis.rangeLabel}
                  </Text>
                )}

                {/* Sensor sections */}
                <SensorReadingSection
                  title="Nível de água"
                  componente="HC-SR04"
                  color="#1565C0"
                  seriesMap={{
                    distancia: analysis.agua.distancia,
                    nivel: analysis.agua.nivel,
                  }}
                />
                <SensorReadingSection
                  title="Qualidade do ar"
                  componente="Potenciômetro (sim. PMS5003)"
                  color="#6A1B9A"
                  seriesMap={{
                    pm25: analysis.particulado.pm25,
                    pm10: analysis.particulado.pm10,
                  }}
                />
                <SensorReadingSection
                  title="Pressão atmosférica"
                  componente="BMP180"
                  color="#00695C"
                  seriesMap={{ pressao: analysis.pressao }}
                />
                <SensorReadingSection
                  title="Inclinação e vibração"
                  componente="MPU6050"
                  color="#BF360C"
                  seriesMap={{
                    inclinacao: analysis.movimento.inclinacao,
                    vibracao: analysis.movimento.vibracao,
                  }}
                />
              </View>
            )}

            <View style={{ height: Spacing.xxl }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const det = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 0,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerLeft: { flex: 1, marginRight: Spacing.sm },
  stationName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  stationCode: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  regiaoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  closeBtn: { padding: 4 },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  statusBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  tipoBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: '#EEF0FB',
  },
  tipoBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    marginLeft: 'auto',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2E7D32' },
  liveText: { fontSize: FontSize.xs, fontWeight: '700', color: '#1B5E20' },
  lastComm: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  coords: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  scroll: { flex: 1 },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  loadingText: { fontSize: FontSize.sm, color: Colors.textMuted },
  errorText:   { fontSize: FontSize.sm, color: RiskColors.ALTO, fontStyle: 'italic', paddingVertical: Spacing.md },
  emptyText:   { fontSize: FontSize.sm, color: Colors.textMuted, fontStyle: 'italic', paddingVertical: Spacing.md, lineHeight: 18 },
  disclosureBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  disclosureText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },
  rangeText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    marginTop: 2,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function EstacoesScreen() {
  const { data: regioes, status: regStatus, load: loadRegioes } = useRegioes();
  const { isGoverno } = useAppContext();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [selectedRegiaoId, setSelectedRegiaoId] = useState<number | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEstacao, setSelectedEstacao] = useState<EstacaoIot | null>(null);

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
    }, [selectedRegiaoId, loadEstacoes]),
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

  const regiaoOptions = useMemo<{ value: string; label: string }[]>(() => {
    const active = regioes.filter(r => r.stAtivo !== 'N');
    return [
      { value: 'NONE', label: 'Selecionar…' },
      ...active.map(r => ({ value: String(r.idRegiao), label: `${r.nome} (${r.estado})` })),
    ];
  }, [regioes]);

  const selectedRegiaoValue = selectedRegiaoId === null ? 'NONE' : String(selectedRegiaoId);

  const handleRegiaoSelect = useCallback((v: string) => {
    if (v === 'NONE') return;
    handleSelectRegiao(Number(v));
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

  const filteredEstacoes = useMemo(() => {
    return estacoes.filter(e => {
      if (filterStatus !== 'TODOS' && e.statusEstacao !== filterStatus) return false;
      if (filterTipo !== 'TODOS' && e.tipoEstacao !== filterTipo) return false;
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        if (!e.nome.toLowerCase().includes(q) && !e.codigoEstacao.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [estacoes, filterStatus, filterTipo, searchText]);

  const hasFilters = !!(searchText.trim() || filterStatus !== 'TODOS' || filterTipo !== 'TODOS');

  const clearFilters = useCallback(() => {
    setSearchText('');
    setFilterStatus('TODOS');
    setFilterTipo('TODOS');
  }, []);

  // Show filters as soon as a region is selected and we have a completed load
  const showFilters = selectedRegiaoId !== null && estStatus === 'success';

  const screenTitle = isGoverno ? 'Estações IoT' : 'Estações de Monitoramento';
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
            <FilterSelect
              label="Região"
              options={regiaoOptions}
              selected={selectedRegiaoValue}
              onSelect={handleRegiaoSelect}
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
          {/* Search */}
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
              <Text style={styles.addBtnText}>Cadastrar</Text>
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
            onPress={() => setSelectedEstacao(item)}
            activeOpacity={0.8}
          >
            <EstacaoCard estacao={item} regiaoNome={selectedRegiao?.nome} />
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

      {/* Station detail modal */}
      <StationDetailModal
        visible={!!selectedEstacao}
        estacao={selectedEstacao}
        regiaoId={selectedEstacao?.idRegiao ?? null}
        regiaoNome={selectedRegiao?.nome}
        onClose={() => setSelectedEstacao(null)}
      />
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

  // Header section
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

  // Region selector section
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

  // No-region prompt
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

  // Filter block
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

  // Stations list header
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

  // Card wrapper
  cardWrap: {
    paddingHorizontal: Spacing.md,
  },
  cardWrapDesktop: {
    paddingHorizontal: Spacing.xl,
  },

  // Empty state
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

  // FAB
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
