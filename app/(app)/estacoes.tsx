import { useState, useCallback, useMemo, useEffect } from 'react';
import type { ComponentProps } from 'react';
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
import { Colors, RiskColors } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import {
  StatusEstacaoLabels,
  TipoEstacaoLabels,
} from '@constants/enums';
import type { StatusEstacao, TipoEstacao } from '@constants/enums';
import type { EstacaoIot, LeituraIot, RegiaoMonitorada } from '@/types';

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

// ─── Region chip row ──────────────────────────────────────────────────────────

interface RegionChipsProps {
  regioes: RegiaoMonitorada[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

function RegionChips({ regioes, selectedId, onSelect }: RegionChipsProps) {
  const active = regioes.filter(r => r.stAtivo !== 'N');
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={chips.row}
    >
      {active.map(r => {
        const sel = selectedId === r.idRegiao;
        return (
          <TouchableOpacity
            key={r.idRegiao}
            style={[chips.chip, sel && chips.chipActive]}
            onPress={() => onSelect(r.idRegiao)}
            activeOpacity={0.75}
          >
            <Text style={[chips.text, sel && chips.textActive]} numberOfLines={1}>
              {r.nome} · {r.estado}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const chips = StyleSheet.create({
  row: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  textActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

// ─── Filter chip row ──────────────────────────────────────────────────────────

interface FilterChipsProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (v: T) => void;
}

function FilterChips<T extends string>({ label, options, selected, onSelect }: FilterChipsProps<T>) {
  return (
    <View style={fchip.wrap}>
      <Text style={fchip.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={fchip.row}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[fchip.chip, selected === opt.value && fchip.chipActive]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.75}
          >
            <Text style={[fchip.text, selected === opt.value && fchip.textActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const fchip = StyleSheet.create({
  wrap: { marginBottom: Spacing.xs },
  label: {
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
  text: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  textActive: {
    color: Colors.primary,
  },
});

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
  ATIVA: '#2E7D32',
  INATIVA: '#757575',
  MANUTENCAO: '#EF6C00',
  FALHA: '#D32F2F',
  SEM_COM: '#F9A825',
};

interface SensorRowProps {
  label: string;
  value: number | null | undefined;
  unit: string;
  icon: string;
}

function SensorRow({ label, value, unit, icon }: SensorRowProps) {
  const available = value != null && !isNaN(Number(value));
  return (
    <View style={det.sensorRow}>
      <View style={det.sensorLeft}>
        <Ionicons name={icon as ComponentProps<typeof Ionicons>['name']} size={15} color={Colors.primary} />
        <Text style={det.sensorLabel}>{label}</Text>
      </View>
      {available ? (
        <Text style={det.sensorValue}>
          {Number(value).toFixed(1)}<Text style={det.sensorUnit}>{unit ? ` ${unit}` : ''}</Text>
        </Text>
      ) : (
        <Text style={det.sensorNA}>Dado não disponível</Text>
      )}
    </View>
  );
}

interface StationDetailModalProps {
  visible: boolean;
  estacao: EstacaoIot | null;
  regiaoId: number | null;
  onClose: () => void;
}

function StationDetailModal({ visible, estacao, regiaoId, onClose }: StationDetailModalProps) {
  const { data: leituras, status: leitStatus, load } = useLeituras(regiaoId);

  // Load on open
  useEffect(() => {
    if (visible && regiaoId !== null) void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, regiaoId]);

  // Poll every 10 s while open
  useEffect(() => {
    if (!visible || regiaoId === null) return;
    const id = setInterval(() => void load(), 10_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, regiaoId]);

  // Latest reading for this station
  const latest = useMemo<LeituraIot | null>(() => {
    if (!estacao || leituras.length === 0) return null;
    const forStation = leituras.filter(l => l.idEstacao === estacao.idEstacao);
    const pool = forStation.length > 0 ? forStation : leituras;
    return pool.slice().sort(
      (a, b) => new Date(b.dtLeit).getTime() - new Date(a.dtLeit).getTime()
    )[0] ?? null;
  }, [leituras, estacao]);

  if (!estacao) return null;
  const statusColor = STATUS_COLORS[estacao.statusEstacao] ?? Colors.textMuted;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={det.overlay}>
        <View style={det.sheet}>
          {/* Header */}
          <View style={det.header}>
            <View style={det.headerLeft}>
              <Text style={det.stationName} numberOfLines={2}>{estacao.nome}</Text>
              <Text style={det.stationCode}>{estacao.codigoEstacao}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={det.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Status + type badges */}
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

          {/* Last communication */}
          <Text style={det.lastComm}>
            Última comunicação: {formatDateShort(estacao.dtUltimaComunicacao)}
          </Text>

          <ScrollView style={det.scroll} showsVerticalScrollIndicator={false}>
            {/* Readings section */}
            <View style={det.section}>
              <Text style={det.sectionTitle}>Telemetria — última leitura</Text>

              {leitStatus === 'loading' && leituras.length === 0 && (
                <View style={det.loadingRow}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={det.loadingText}>Carregando leituras…</Text>
                </View>
              )}

              {leitStatus === 'error' && (
                <Text style={det.errorText}>Erro ao carregar leituras.</Text>
              )}

              {leitStatus === 'success' && latest === null && (
                <Text style={det.emptyText}>
                  Nenhuma leitura encontrada para esta estação.
                </Text>
              )}

              {latest && (
                <>
                  <Text style={det.readingDate}>
                    Coletado em {formatDateShort(latest.dtLeit)}
                  </Text>
                  <SensorRow label="Nível d'água"        value={latest.nivelAguaPct}       unit="%"      icon="water-outline" />
                  <SensorRow label="Distância ao nível"  value={latest.distanciaAguaCm}     unit="cm"     icon="resize-outline" />
                  <SensorRow label="Inclinação"          value={latest.inclinacaoGraus}     unit="°"      icon="trending-up-outline" />
                  <SensorRow label="Vibração"            value={latest.vibracao}            unit=""       icon="pulse-outline" />
                  <SensorRow label="Pressão atmosférica" value={latest.pressaoHpa}          unit="hPa"    icon="speedometer-outline" />
                  <SensorRow label="PM2.5"               value={latest.pm25}                unit="μg/m³"  icon="cloud-outline" />
                  <SensorRow label="PM10"                value={latest.pm10}                unit="μg/m³"  icon="cloudy-outline" />
                </>
              )}

              {leitStatus === 'idle' && (
                <Text style={det.emptyText}>
                  Observações climáticas externas ainda não estão disponíveis pela API.
                </Text>
              )}
            </View>

            {/* Coordinates */}
            {estacao.latitude != null && estacao.longitude != null && (
              <View style={det.section}>
                <Text style={det.sectionTitle}>Localização</Text>
                <Text style={det.coords}>
                  {Number(estacao.latitude).toFixed(5)}, {Number(estacao.longitude).toFixed(5)}
                </Text>
              </View>
            )}

            <View style={{ height: Spacing.xl }} />
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
    maxHeight: '85%',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
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
  stationCode: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
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
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
  },
  liveText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#1B5E20',
  },
  lastComm: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  scroll: { flex: 1 },
  section: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  loadingText: { fontSize: FontSize.sm, color: Colors.textMuted },
  errorText:   { fontSize: FontSize.sm, color: RiskColors.ALTO, fontStyle: 'italic' },
  emptyText:   { fontSize: FontSize.sm, color: Colors.textMuted, fontStyle: 'italic', lineHeight: 18 },
  readingDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sensorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  sensorLabel: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  sensorValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  sensorUnit: {
    fontSize: FontSize.xs,
    fontWeight: '400',
    color: Colors.textMuted,
  },
  sensorNA: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  coords: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
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

  // Search / filter state
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('TODOS');
  const [filterTipo, setFilterTipo] = useState<FilterTipo>('TODOS');

  const { data: estacoes, status: estStatus, errorMessage: estError, load: loadEstacoes } =
    useEstacoes(selectedRegiaoId);

  // Refresh regions on focus; refresh stations when region is selected
  useFocusEffect(
    useCallback(() => { loadRegioes(); }, [loadRegioes]),
  );

  useFocusEffect(
    useCallback(() => {
      if (selectedRegiaoId !== null) loadEstacoes();
    }, [selectedRegiaoId, loadEstacoes]),
  );

  // Poll station list every 10 s
  const pollEstacoes = useCallback(() => {
    if (selectedRegiaoId !== null) loadEstacoes();
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

  const handleFormSuccess = useCallback(() => {
    setFormVisible(false);
    showToast('Estação cadastrada com sucesso.', 'success');
    loadEstacoes();
  }, [showToast, loadEstacoes]);

  const selectedRegiao = useMemo(
    () => regioes.find(r => r.idRegiao === selectedRegiaoId) ?? null,
    [regioes, selectedRegiaoId],
  );

  // Filtered + searched station list
  const filteredEstacoes = useMemo(() => {
    return estacoes.filter(e => {
      if (filterStatus !== 'TODOS' && e.statusEstacao !== filterStatus) return false;
      if (filterTipo !== 'TODOS' && e.tipoEstacao !== filterTipo) return false;
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        if (
          !e.nome.toLowerCase().includes(q) &&
          !e.codigoEstacao.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [estacoes, filterStatus, filterTipo, searchText]);

  const screenTitle = isGoverno ? 'Estações IoT' : 'Estações de Monitoramento';
  const screenSubtitle = isGoverno
    ? 'Cadastro e acompanhamento das estações vinculadas às regiões monitoradas.'
    : 'Visualização das estações usadas no acompanhamento territorial.';

  const showFilters = selectedRegiaoId !== null && estStatus === 'success' && estacoes.length > 0;

  // ── List header ────────────────────────────────────────────────────────────

  const ListHeader = (
    <View>
      {/* Role-based header */}
      <View style={[styles.headerSection, isDesktop && styles.headerSectionDesktop]}>
        <Text style={styles.screenTitle}>{screenTitle}</Text>
        <Text style={styles.screenSubtitle}>{screenSubtitle}</Text>
      </View>

      {/* Region selector */}
      <View style={styles.selectorSection}>
        <Text style={styles.selectorLabel}>Selecione uma região</Text>
        {regStatus === 'loading' && regioes.length === 0 ? (
          <View style={styles.regLoadingRow}>
            <Text style={styles.regLoadingText}>Carregando regiões…</Text>
          </View>
        ) : (
          <RegionChips regioes={regioes} selectedId={selectedRegiaoId} onSelect={handleSelectRegiao} />
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

      {/* Search + filters — only when station list loaded */}
      {showFilters && (
        <View style={styles.filterBlock}>
          {/* Search box */}
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
              <TouchableOpacity onPress={() => setSearchText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          {/* Status filter */}
          <FilterChips label="Status" options={STATUS_FILTERS} selected={filterStatus} onSelect={setFilterStatus} />
          {/* Type filter */}
          <FilterChips label="Tipo" options={TIPO_FILTERS} selected={filterTipo} onSelect={setFilterTipo} />
        </View>
      )}

      {/* Station count header */}
      {selectedRegiaoId !== null && estStatus === 'success' && (
        <View style={[styles.stationsHeader, isDesktop && styles.stationsHeaderDesktop]}>
          <Text style={styles.stationsCount}>
            {filteredEstacoes.length !== estacoes.length
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

      {/* Station loading/error states */}
      {selectedRegiaoId !== null && estStatus === 'loading' && (
        <LoadingState message="Carregando estações…" />
      )}
      {selectedRegiaoId !== null && estStatus === 'error' && (
        <ErrorState message={estError ?? 'Erro ao carregar estações.'} onRetry={loadEstacoes} />
      )}
    </View>
  );

  const showStationList = selectedRegiaoId !== null && (estStatus === 'success' || (estStatus !== 'error' && estacoes.length > 0));

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
                  searchText || filterStatus !== 'TODOS' || filterTipo !== 'TODOS'
                    ? 'Nenhuma estação encontrada para os filtros selecionados.'
                    : 'Nenhuma estação cadastrada para esta região.'
                }
                icon="📡"
              />
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
    maxWidth: 900,
    alignSelf: 'center' as const,
    width: '100%',
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
  selectorLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.md,
    marginBottom: 4,
  },
  regLoadingRow: {
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
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    marginBottom: Spacing.sm,
  },

  // Search box
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 4,
    gap: Spacing.xs,
  },
  searchWrapDesktop: {
    marginHorizontal: Spacing.xl,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    paddingVertical: 0,
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
    maxWidth: 900,
    alignSelf: 'center' as const,
    width: '100%',
    paddingHorizontal: Spacing.xl,
  },
  stationsCount: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
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
    maxWidth: 900,
    alignSelf: 'center' as const,
    width: '100%',
    paddingHorizontal: Spacing.xl,
  },

  // Empty state wrapper
  emptyWrap: {
    paddingHorizontal: Spacing.md,
  },
  emptyWrapDesktop: {
    maxWidth: 900,
    alignSelf: 'center' as const,
    width: '100%',
    paddingHorizontal: Spacing.xl,
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
