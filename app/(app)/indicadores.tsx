import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { usePolling } from '@hooks/usePolling';
import { useAppContext } from '@contexts/AppContext';
import { useIndicadores } from '@hooks/useIndicadores';
import { useRegioes } from '@hooks/useRegioes';
import { useEstacoes } from '@hooks/useEstacoes';
import { useLeituras } from '@hooks/useLeituras';
import { Colors, RiskColors, RiskBackgrounds } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import {
  NivelRiscoLabels,
  CategoriaRiscoLabels,
  TipoEstacaoLabels,
  StatusEstacaoLabels,
} from '@constants/enums';
import type { NivelRisco, CategoriaRisco } from '@constants/enums';
import { RegionSelector } from '@components/charts/RegionSelector';
import { FilterSelect, FilterPanel } from '@components/filters';
import { SensorDimensionGrid } from '@components/charts/SensorDimensionCard';
import { SensorReadingSection } from '@components/charts/SensorReadingSection';
import { ChartCard } from '@components/charts/ChartCard';
import { HorizontalBarChart } from '@components/charts/HorizontalBarChart';
import { Card } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import { extractSensorAnalysis } from '@utils/sensorTransforms';
import { buildRegionalRanking } from '@utils/chartTransforms';
import type { BarEntry } from '@utils/chartTransforms';
import type { EstacaoIot, RegiaoMonitorada } from '@/types';

// ─── Filter options ───────────────────────────────────────────────────────────

const TIPO_RISCO_FILTERS: { value: CategoriaRisco | 'TODOS'; label: string }[] = [
  { value: 'TODOS',        label: 'Todos' },
  { value: 'ENCHENTE',     label: 'Enchente' },
  { value: 'DESLIZAMENTO', label: 'Deslizamento' },
  { value: 'TEMPESTADE',   label: 'Tempestade' },
  { value: 'QUALIDADE_AR', label: 'Qualidade do ar' },
];

const NIVEL_RISCO_FILTERS: { value: NivelRisco | 'TODOS'; label: string }[] = [
  { value: 'TODOS',    label: 'Todos' },
  { value: 'CRITICO',  label: 'Crítico' },
  { value: 'ALTO',     label: 'Alto' },
  { value: 'MODERADO', label: 'Moderado' },
  { value: 'BAIXO',    label: 'Baixo' },
];

// Colors per risk type for charts
const TIPO_RISCO_COLORS: Record<string, string> = {
  ENCHENTE:     '#1565C0',
  DESLIZAMENTO: '#BF360C',
  TEMPESTADE:   '#4A148C',
  QUALIDADE_AR: '#1B5E20',
};


// ─── Station row ──────────────────────────────────────────────────────────────

function EstacaoRow({ estacao }: { estacao: EstacaoIot }) {
  const STATUS_COLORS: Record<string, string> = {
    ATIVA: '#2E7D32', INATIVA: '#757575',
    MANUTENCAO: '#EF6C00', FALHA: '#D32F2F', SEM_COM: '#9E9E9E',
  };
  const color = STATUS_COLORS[estacao.statusEstacao] ?? Colors.textMuted;

  return (
    <View style={st.row}>
      <View style={st.rowTop}>
        <Text style={st.estNome} numberOfLines={1}>{estacao.nome}</Text>
        <View style={[st.statusBadge, { backgroundColor: color + '22' }]}>
          <Text style={[st.statusText, { color }]}>
            {StatusEstacaoLabels[estacao.statusEstacao] ?? estacao.statusEstacao}
          </Text>
        </View>
      </View>
      <View style={st.rowMeta}>
        <Text style={st.meta}>{estacao.codigoEstacao}</Text>
        <Text style={st.metaSep}>·</Text>
        <Text style={st.meta}>{TipoEstacaoLabels[estacao.tipoEstacao] ?? estacao.tipoEstacao}</Text>
        {estacao.dtUltimaComunicacao ? (
          <>
            <Text style={st.metaSep}>·</Text>
            <Text style={st.meta}>
              Últ. com.: {estacao.dtUltimaComunicacao.slice(0, 16).replace('T', ' ')}
            </Text>
          </>
        ) : null}
      </View>
      {estacao.latitude != null && estacao.longitude != null && (
        <Text style={st.coords}>{Number(estacao.latitude).toFixed(4)}, {Number(estacao.longitude).toFixed(4)}</Text>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  row: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  estNome: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, flex: 1, marginRight: Spacing.sm },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.pill },
  statusText: { fontSize: FontSize.xs, fontWeight: '600' },
  rowMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: Spacing.xs },
  meta: { fontSize: FontSize.xs, color: Colors.textMuted },
  metaSep: { fontSize: FontSize.xs, color: Colors.border },
  coords: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
});

// ─── Indicator row ────────────────────────────────────────────────────────────

function IndicadorRow({
  item, isLast,
}: {
  item: {
    nomeRegiao: string; cidade: string; estado: string;
    tipoRisco: string; scoreMedio: number;
    nivelRiscoMedio: NivelRisco; quantidadeAlertasAtivos: number;
  };
  isLast: boolean;
}) {
  const riskColor = RiskColors[item.nivelRiscoMedio];
  const riskBg    = RiskBackgrounds[item.nivelRiscoMedio];

  return (
    <View style={[ind.row, isLast && ind.rowLast]}>
      <View style={ind.rowLeft}>
        <Text style={ind.nome} numberOfLines={1}>{item.nomeRegiao}</Text>
        <Text style={ind.sub}>{item.cidade} · {item.estado}</Text>
        <Text style={ind.tipo}>
          {CategoriaRiscoLabels[item.tipoRisco as CategoriaRisco] ?? item.tipoRisco}
        </Text>
      </View>
      <View style={ind.rowRight}>
        <View style={[ind.nivelBadge, { backgroundColor: riskBg }]}>
          <Text style={[ind.nivelText, { color: riskColor }]}>
            {NivelRiscoLabels[item.nivelRiscoMedio]}
          </Text>
        </View>
        <Text style={ind.score}>
          {item.scoreMedio.toFixed(0)}<Text style={ind.scoreUnit}> pts</Text>
        </Text>
        {item.quantidadeAlertasAtivos > 0 && (
          <Text style={ind.alertas}>
            {item.quantidadeAlertasAtivos} alerta{item.quantidadeAlertasAtivos > 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </View>
  );
}

const ind = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLeft: { flex: 1, marginRight: Spacing.sm, rowGap: 2 },
  nome: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  sub: { fontSize: FontSize.xs, color: Colors.textMuted },
  tipo: { fontSize: FontSize.xs, color: Colors.textMuted },
  rowRight: { alignItems: 'flex-end', rowGap: 2 },
  nivelBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.pill },
  nivelText: { fontSize: FontSize.xs, fontWeight: '700' },
  score: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  scoreUnit: { fontSize: FontSize.xs, fontWeight: '400', color: Colors.textMuted },
  alertas: { fontSize: FontSize.xs, color: '#D32F2F', fontWeight: '600' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function IndicadoresScreen() {
  const { isGoverno } = useAppContext();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  // ── Data hooks (unconditional) ────────────────────────────────────────────
  const { status: indStatus, data: indicadores, errorMessage: indError, load: loadInd } = useIndicadores();
  const { status: regStatus, data: regioes, errorMessage: regError, load: loadReg } = useRegioes();
  const [selectedRegiaoId, setSelectedRegiaoId] = useState<number | null>(null);
  const { status: estStatus, data: estacoes, errorMessage: estError, load: loadEst } = useEstacoes(selectedRegiaoId);
  const { status: leitStatus, data: leituras, errorMessage: leitError, load: loadLeit } = useLeituras(selectedRegiaoId);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [refreshing,     setRefreshing]     = useState(false);
  const [searchText,     setSearchText]     = useState('');
  const [filterTipo,     setFilterTipo]     = useState<CategoriaRisco | 'TODOS'>('TODOS');
  const [filterNivel,    setFilterNivel]    = useState<NivelRisco | 'TODOS'>('TODOS');
  const [filterEstado,   setFilterEstado]   = useState('TODOS');
  const [filterCidade,   setFilterCidade]   = useState('TODOS');

  useEffect(() => { setFilterCidade('TODOS'); }, [filterEstado]);

  // ── Dynamic filter options ────────────────────────────────────────────────
  const availableEstados = useMemo(() => {
    const set = new Set<string>();
    indicadores.forEach(i => {
      if (i.idRegiao !== null && i.estado && i.estado !== 'BR') set.add(i.estado);
    });
    return Array.from(set).sort();
  }, [indicadores]);

  const estadoFilterOptions = useMemo<{ value: string; label: string }[]>(() => {
    if (availableEstados.length <= 1) return [];
    return [
      { value: 'TODOS', label: 'Todos' },
      ...availableEstados.map(uf => ({ value: uf, label: uf })),
    ];
  }, [availableEstados]);

  const availableCidades = useMemo(() => {
    const set = new Set<string>();
    indicadores.forEach(i => {
      if (i.idRegiao === null) return;
      if (filterEstado !== 'TODOS' && i.estado !== filterEstado) return;
      if (i.cidade) set.add(i.cidade);
    });
    return Array.from(set).sort();
  }, [indicadores, filterEstado]);

  const cidadeFilterOptions = useMemo<{ value: string; label: string }[]>(() => {
    if (availableCidades.length <= 1) return [];
    return [
      { value: 'TODOS', label: 'Todas' },
      ...availableCidades.map(c => ({ value: c, label: c })),
    ];
  }, [availableCidades]);

  const hasFilters = !!(
    searchText.trim() ||
    filterTipo !== 'TODOS' || filterNivel !== 'TODOS' ||
    filterEstado !== 'TODOS' || filterCidade !== 'TODOS'
  );

  const clearFilters = useCallback(() => {
    setSearchText('');
    setFilterTipo('TODOS');
    setFilterNivel('TODOS');
    setFilterEstado('TODOS');
    setFilterCidade('TODOS');
  }, []);

  // ── Filtered indicadores (excludes national aggregate) ───────────────────
  const filteredIndicadores = useMemo(() => {
    return indicadores.filter(i => {
      if (i.idRegiao === null) return false; // skip national aggregate
      if (filterTipo   !== 'TODOS' && i.tipoRisco      !== filterTipo)   return false;
      if (filterNivel  !== 'TODOS' && i.nivelRiscoMedio !== filterNivel)  return false;
      if (filterEstado !== 'TODOS' && i.estado          !== filterEstado) return false;
      if (filterCidade !== 'TODOS' && i.cidade          !== filterCidade) return false;
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        const nome   = (i.nomeRegiao ?? '').toLowerCase();
        const cidade = i.cidade.toLowerCase();
        const estado = i.estado.toLowerCase();
        if (!nome.includes(q) && !cidade.includes(q) && !estado.includes(q)) return false;
      }
      return true;
    });
  }, [indicadores, filterTipo, filterNivel, filterEstado, filterCidade, searchText]);

  // ── Derived data (all useMemo unconditional) ──────────────────────────────
  const rankingRows = useMemo(
    () => buildRegionalRanking(filteredIndicadores, null, null, filteredIndicadores.length),
    [filteredIndicadores],
  );

  const nivelDistribution = useMemo((): BarEntry[] => {
    if (filteredIndicadores.length === 0) return [];
    const counts: Record<string, number> = {};
    filteredIndicadores.forEach(i => {
      counts[i.nivelRiscoMedio] = (counts[i.nivelRiscoMedio] ?? 0) + 1;
    });
    const maxCount = Math.max(...Object.values(counts), 1);
    const ORDER: NivelRisco[] = ['CRITICO', 'ALTO', 'MODERADO', 'BAIXO'];
    return ORDER
      .filter(n => (counts[n] ?? 0) > 0)
      .map(n => ({
        key: n,
        label: NivelRiscoLabels[n],
        value: counts[n] ?? 0,
        maxValue: maxCount,
        color: RiskColors[n],
      }));
  }, [filteredIndicadores]);

  const tipoDistribution = useMemo((): BarEntry[] => {
    if (filteredIndicadores.length === 0) return [];
    const counts: Record<string, number> = {};
    filteredIndicadores.forEach(i => {
      counts[i.tipoRisco] = (counts[i.tipoRisco] ?? 0) + 1;
    });
    const maxCount = Math.max(...Object.values(counts), 1);
    return Object.entries(counts).map(([tipo, count]) => ({
      key: tipo,
      label: CategoriaRiscoLabels[tipo as CategoriaRisco] ?? tipo,
      value: count,
      maxValue: maxCount,
      color: TIPO_RISCO_COLORS[tipo] ?? Colors.primary,
    }));
  }, [filteredIndicadores]);

  const sensorAnalysis = useMemo(() => extractSensorAnalysis(leituras), [leituras]);

  const selectedRegiao: RegiaoMonitorada | null = useMemo(
    () => regioes.find(r => r.idRegiao === selectedRegiaoId) ?? null,
    [regioes, selectedRegiaoId],
  );

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => { loadInd(); loadReg(); }, [loadInd, loadReg]);

  const pollFn = useCallback(() => {
    loadInd({ silent: true });
    if (selectedRegiaoId !== null) { loadEst({ silent: true }); loadLeit({ silent: true }); }
  }, [loadInd, selectedRegiaoId, loadEst, loadLeit]);
  usePolling(pollFn);

  useEffect(() => {
    if (selectedRegiaoId !== null) { loadEst(); loadLeit(); }
  }, [selectedRegiaoId, loadEst, loadLeit]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const tasks: Promise<void>[] = [loadInd(), loadReg()];
    if (selectedRegiaoId !== null) tasks.push(loadEst(), loadLeit());
    await Promise.all(tasks);
    setRefreshing(false);
  }, [loadInd, loadReg, loadEst, loadLeit, selectedRegiaoId]);

  // ── Copy ──────────────────────────────────────────────────────────────────
  const subtitle = isGoverno
    ? 'Priorização de risco, cobertura de estações e telemetria operacional por região.'
    : 'Evidências ambientais e monitoramento territorial das comunidades acompanhadas.';

  const indicadoresTitle = isGoverno
    ? 'Situação territorial por região'
    : 'Indicadores de risco por comunidade';

  const globalLoading = indStatus === 'loading' && indicadores.length === 0;
  const globalError   = indStatus === 'error'   && indicadores.length === 0;

  // Empty series placeholder for loading state
  const emptySeries = useCallback((label: string, unit: string): import('@utils/sensorTransforms').SensorSeries => ({
    unit, label, available: false, points: [],
    latestValue: null, latestLabel: null, min: null, max: null,
  }), []);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, isWide && styles.contentWide]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Indicadores e Sensores</Text>
        <Text style={styles.pageSubtitle}>{subtitle}</Text>
      </View>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 1 — INDICADORES REGIONAIS                                   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <View style={styles.sectionDivider}>
        <View style={styles.sectionDividerLine} />
        <Text style={styles.sectionDividerLabel}>Indicadores regionais</Text>
        <View style={styles.sectionDividerLine} />
      </View>

      {/* ── Search + filters ─────────────────────────────────────────────── */}
      {!globalLoading && !globalError && (
        <View style={styles.filterBlock}>
          {/* Search */}
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Buscar por região, cidade ou estado…"
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
          <FilterPanel>
            <FilterSelect
              label="Tipo de risco"
              options={TIPO_RISCO_FILTERS}
              selected={filterTipo}
              onSelect={setFilterTipo}
            />
            <FilterSelect
              label="Nível de risco"
              options={NIVEL_RISCO_FILTERS}
              selected={filterNivel}
              onSelect={setFilterNivel}
            />
            {estadoFilterOptions.length > 0 && (
              <FilterSelect
                label="Estado"
                options={estadoFilterOptions}
                selected={filterEstado}
                onSelect={setFilterEstado}
              />
            )}
            {cidadeFilterOptions.length > 0 && (
              <FilterSelect
                label="Cidade"
                options={cidadeFilterOptions}
                selected={filterCidade}
                onSelect={setFilterCidade}
              />
            )}
          </FilterPanel>

          {/* Limpar filtros */}
          {hasFilters && (
            <TouchableOpacity onPress={clearFilters} style={styles.clearBtn} activeOpacity={0.75}>
              <Ionicons name="close-circle-outline" size={14} color={Colors.primary} />
              <Text style={styles.clearBtnText}>Limpar filtros</Text>
            </TouchableOpacity>
          )}

          {/* Count */}
          {indStatus === 'success' && (
            <Text style={styles.countText}>
              {hasFilters
                ? `${filteredIndicadores.length} de ${indicadores.filter(i => i.idRegiao !== null).length} regiões`
                : `${filteredIndicadores.length} ${filteredIndicadores.length === 1 ? 'região' : 'regiões'}`}
            </Text>
          )}
        </View>
      )}

      {/* ── Ranking list ──────────────────────────────────────────────────── */}
      <ChartCard
        title={indicadoresTitle}
        subtitle={
          hasFilters
            ? `${filteredIndicadores.length} resultado${filteredIndicadores.length !== 1 ? 's' : ''} com os filtros aplicados.`
            : 'Score médio, nível de risco e alertas ativos por região monitorada.'
        }
        loading={globalLoading}
        error={globalError ? (indError ?? 'Erro ao carregar indicadores regionais.') : null}
        empty={!globalLoading && !globalError && rankingRows.length === 0}
        emptyMessage={
          hasFilters
            ? 'Nenhum indicador encontrado para os filtros selecionados.'
            : 'Nenhum indicador regional encontrado.'
        }
      >
        <View>
          {rankingRows.map((item, i) => (
            <IndicadorRow
              key={item.idIndicador}
              item={item}
              isLast={i === rankingRows.length - 1}
            />
          ))}
        </View>
      </ChartCard>

      {/* ── Distribution charts (visible only when there is data) ────────── */}
      {nivelDistribution.length > 0 && (
        <ChartCard
          title="Distribuição por nível de risco"
          subtitle="Contagem de regiões por nível de vulnerabilidade atual."
        >
          <HorizontalBarChart data={nivelDistribution} />
        </ChartCard>
      )}

      {tipoDistribution.length > 0 && (
        <ChartCard
          title="Distribuição por tipo de risco"
          subtitle="Contagem de regiões por categoria de ameaça principal."
        >
          <HorizontalBarChart data={tipoDistribution} />
        </ChartCard>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 2 — ANÁLISE POR SENSORES                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <View style={styles.sectionDivider}>
        <View style={styles.sectionDividerLine} />
        <Text style={styles.sectionDividerLabel}>Análise por sensores</Text>
        <View style={styles.sectionDividerLine} />
      </View>

      <Text style={styles.sensorHint}>
        {isGoverno
          ? 'Selecione uma região para visualizar leituras IoT, cobertura de estações e telemetria operacional.'
          : 'Selecione uma região para visualizar as leituras ambientais de sensores de campo.'}
      </Text>

      {/* ── Region selector ──────────────────────────────────────────────── */}
      {regStatus === 'success' && regioes.length > 0 ? (
        <RegionSelector
          regioes={regioes}
          selectedId={selectedRegiaoId}
          onSelect={id => setSelectedRegiaoId(id)}
        />
      ) : regStatus === 'loading' ? (
        <Text style={styles.loadingText}>Carregando regiões…</Text>
      ) : regStatus === 'error' ? (
        <View style={styles.callout}>
          <Text style={styles.calloutText}>Erro ao carregar regiões: {regError}</Text>
        </View>
      ) : null}

      {/* ── Sensor dimension reference cards ─────────────────────────────── */}
      <View style={styles.sensorSectionHeader}>
        <Text style={styles.sensorSectionTitle}>Dimensões de sensores IoT</Text>
        <Text style={styles.sensorSectionSubtitle}>
          Amanajé integra quatro tipos de sensores para cobertura multidimensional de risco ambiental.
        </Text>
      </View>
      <SensorDimensionGrid />

      {/* ── Region-specific telemetry ─────────────────────────────────────── */}
      {selectedRegiaoId !== null && (
        <>
          <View style={styles.sensorSectionHeader}>
            <Text style={styles.sensorSectionTitle}>
              {selectedRegiao?.nome ?? 'Região selecionada'} · {selectedRegiao?.estado ?? ''}
            </Text>
            <Text style={styles.sensorSectionSubtitle}>
              {isGoverno
                ? 'Estações operacionais e telemetria de sensores para esta região.'
                : 'Estações de monitoramento e leituras ambientais para esta comunidade.'}
            </Text>
          </View>

          {/* Station list */}
          <ChartCard
            title="Cobertura de estações"
            subtitle={
              estStatus === 'success'
                ? `${estacoes.length} ${estacoes.length === 1 ? 'estação vinculada' : 'estações vinculadas'}`
                : undefined
            }
            loading={estStatus === 'loading'}
            error={estStatus === 'error' ? (estError ?? 'Erro ao carregar estações.') : null}
            empty={estStatus === 'success' && estacoes.length === 0}
            emptyMessage="Nenhuma estação IoT encontrada para esta região."
          >
            <View>
              {estacoes.map(est => <EstacaoRow key={est.idEstacao} estacao={est} />)}
            </View>
          </ChartCard>

          {/* Sensor reading sections */}
          {leitStatus !== 'idle' && (
            <>
              <SensorReadingSection
                title="Nível de água"
                componente="HC-SR04 · Ultrassônico"
                color="#1565C0"
                loading={leitStatus === 'loading'}
                error={leitStatus === 'error' ? (leitError ?? 'Erro ao carregar leituras.') : null}
                seriesMap={leitStatus === 'success' ? {
                  distancia: sensorAnalysis.agua.distancia,
                  nivel: sensorAnalysis.agua.nivel,
                } : {
                  distancia: emptySeries('Distância à água', 'cm'),
                  nivel:     emptySeries('Nível de água', '%'),
                }}
              />
              <SensorReadingSection
                title="Material particulado"
                componente="Potenciômetro Slider (simulação PMS5003)"
                color="#6A1B9A"
                loading={leitStatus === 'loading'}
                error={leitStatus === 'error' ? (leitError ?? 'Erro ao carregar leituras.') : null}
                seriesMap={leitStatus === 'success' ? {
                  pm25: sensorAnalysis.particulado.pm25,
                  pm10: sensorAnalysis.particulado.pm10,
                } : {
                  pm25: emptySeries('PM2.5', 'µg/m³'),
                  pm10: emptySeries('PM10', 'µg/m³'),
                }}
              />
              <SensorReadingSection
                title="Pressão atmosférica"
                componente="BMP180 · Barométrico"
                color="#00695C"
                loading={leitStatus === 'loading'}
                error={leitStatus === 'error' ? (leitError ?? 'Erro ao carregar leituras.') : null}
                seriesMap={leitStatus === 'success' ? {
                  pressao: sensorAnalysis.pressao,
                } : {
                  pressao: emptySeries('Pressão atmosférica', 'hPa'),
                }}
              />
              <SensorReadingSection
                title="Movimento físico"
                componente="MPU6050 · Acelerômetro / Giroscópio"
                color="#BF360C"
                loading={leitStatus === 'loading'}
                error={leitStatus === 'error' ? (leitError ?? 'Erro ao carregar leituras.') : null}
                seriesMap={leitStatus === 'success' ? {
                  inclinacao: sensorAnalysis.movimento.inclinacao,
                  vibracao:   sensorAnalysis.movimento.vibracao,
                } : {
                  inclinacao: emptySeries('Inclinação', '°'),
                  vibracao:   emptySeries('Vibração', 'índice'),
                }}
              />

              {/* Reading summary */}
              {leitStatus === 'success' && sensorAnalysis.totalLeituras > 0 && (
                <Card style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Resumo das leituras</Text>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>{sensorAnalysis.totalLeituras}</Text>
                      <Text style={styles.summaryLabel}>Leituras IoT</Text>
                    </View>
                    {sensorAnalysis.rangeLabel && (
                      <View style={styles.summaryItemWide}>
                        <Text style={styles.summaryValue}>{sensorAnalysis.rangeLabel}</Text>
                        <Text style={styles.summaryLabel}>Intervalo de dados</Text>
                      </View>
                    )}
                  </View>
                </Card>
              )}
            </>
          )}
        </>
      )}

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  contentWide: { paddingHorizontal: Spacing.xl },

  pageHeader: { marginBottom: Spacing.lg },
  pageTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },

  // Section dividers
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  sectionDividerLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Filter block
  filterBlock: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    ...Shadow.sm,
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
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    paddingVertical: 0,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearBtnText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  countText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },

  // Sensor section
  sensorHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    lineHeight: 19,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  callout: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  calloutText: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
  sensorSectionHeader: { marginTop: Spacing.sm, marginBottom: Spacing.sm },
  sensorSectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  sensorSectionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },

  // Reading summary
  summaryCard: { marginBottom: Spacing.md },
  summaryTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: Spacing.lg,
    rowGap: Spacing.sm,
  },
  summaryItem: { alignItems: 'flex-start' },
  summaryItemWide: { flex: 1, alignItems: 'flex-start' },
  summaryValue: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
});
