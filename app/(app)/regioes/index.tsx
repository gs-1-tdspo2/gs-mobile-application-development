import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RegiaoCard } from '@components/regioes/RegiaoCard';
import { LoadingState } from '@components/ui/LoadingState';
import { ErrorState } from '@components/ui/ErrorState';
import { EmptyState } from '@components/ui/EmptyState';
import { FilterSelect, FilterPanel } from '@components/filters';
import { useRegioes } from '@hooks/useRegioes';
import { useAppContext } from '@contexts/AppContext';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import type { TipoArea, NivelRisco } from '@constants/enums';
import type { RegiaoMonitorada } from '@/types';

type ActiveFilter = 'ativas' | 'inativas';

function vulNivel(score: number): NivelRisco {
  if (score >= 75) return 'CRITICO';
  if (score >= 50) return 'ALTO';
  if (score >= 25) return 'MODERADO';
  return 'BAIXO';
}

const TIPO_AREA_OPTS: { value: TipoArea | 'TODOS'; label: string }[] = [
  { value: 'TODOS',              label: 'Todos' },
  { value: 'COMUNIDADE',         label: 'Comunidade' },
  { value: 'REGIAO_RIBEIRINHA',  label: 'Região ribeirinha' },
  { value: 'PONTE',              label: 'Ponte' },
  { value: 'ENCOSTA',            label: 'Encosta' },
  { value: 'AREA_RURAL',         label: 'Área rural' },
  { value: 'PROPRIEDADE_PRIVADA', label: 'Propriedade privada' },
  { value: 'AREA_URBANA',        label: 'Área urbana' },
  { value: 'OUTRA',              label: 'Outra' },
];

const NIVEL_OPTS: { value: NivelRisco | 'TODOS'; label: string }[] = [
  { value: 'TODOS',    label: 'Todos' },
  { value: 'CRITICO',  label: 'Crítico' },
  { value: 'ALTO',     label: 'Alto' },
  { value: 'MODERADO', label: 'Moderado' },
  { value: 'BAIXO',    label: 'Baixo' },
];

export default function RegioesScreen() {
  const { data, status, errorMessage, load } = useRegioes();
  const { isGoverno } = useAppContext();
  const router = useRouter();
  const { estado: estadoParam } = useLocalSearchParams<{ estado?: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('ativas');
  const [searchText, setSearchText] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>(
    typeof estadoParam === 'string' && estadoParam ? estadoParam : 'TODOS',
  );
  const [tipoAreaFilter, setTipoAreaFilter] = useState<TipoArea | 'TODOS'>('TODOS');
  const [nivelFilter, setNivelFilter] = useState<NivelRisco | 'TODOS'>('TODOS');
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  useFocusEffect(
    useCallback(() => { load(); }, [load]),
  );

  useEffect(() => {
    if (typeof estadoParam === 'string' && estadoParam) {
      setEstadoFilter(estadoParam);
    }
  }, [estadoParam]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleNova = useCallback(() => router.push('/regioes/nova'), [router]);

  const handleCard = useCallback((regiao: RegiaoMonitorada) => {
    router.push(`/regioes/${regiao.idRegiao}`);
  }, [router]);

  const availableEstados = useMemo(() => {
    const set = new Set<string>();
    data.forEach(r => set.add(r.estado));
    return Array.from(set).sort();
  }, [data]);

  const estadoOptions = useMemo<{ value: string; label: string }[]>(() => [
    { value: 'TODOS', label: 'Todos' },
    ...availableEstados.map(uf => ({ value: uf, label: uf })),
  ], [availableEstados]);

  const filtered = useMemo(() => {
    if (activeFilter === 'inativas') return [];
    return data.filter(r => {
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        if (!r.nome.toLowerCase().includes(q) &&
            !r.cidade.toLowerCase().includes(q) &&
            !r.estado.toLowerCase().includes(q)) return false;
      }
      if (estadoFilter !== 'TODOS' && r.estado !== estadoFilter) return false;
      if (tipoAreaFilter !== 'TODOS' && r.tipoArea !== tipoAreaFilter) return false;
      if (nivelFilter !== 'TODOS' && vulNivel(r.nivelVulnerabilidade) !== nivelFilter) return false;
      return true;
    });
  }, [data, activeFilter, searchText, estadoFilter, tipoAreaFilter, nivelFilter]);

  const hasFilters = !!(
    searchText.trim() ||
    estadoFilter !== 'TODOS' ||
    tipoAreaFilter !== 'TODOS' ||
    nivelFilter !== 'TODOS'
  );

  const clearFilters = useCallback(() => {
    setSearchText('');
    setEstadoFilter('TODOS');
    setTipoAreaFilter('TODOS');
    setNivelFilter('TODOS');
  }, []);

  const countLabel = (() => {
    if (activeFilter === 'inativas') return null;
    const n = filtered.length;
    return `${n} ${n === 1 ? 'região' : 'regiões'}`;
  })();

  const ListHeader = (
    <View>
      {/* Search box */}
      <View style={[styles.searchWrap, isDesktop && styles.searchWrapDesktop]}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar por nome, cidade ou estado…"
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
        {availableEstados.length > 1 && (
          <FilterSelect
            label="Estado"
            options={estadoOptions}
            selected={estadoFilter}
            onSelect={setEstadoFilter}
          />
        )}
        <FilterSelect
          label="Tipo de área"
          options={TIPO_AREA_OPTS}
          selected={tipoAreaFilter}
          onSelect={setTipoAreaFilter}
        />
        <FilterSelect
          label="Vulnerabilidade"
          options={NIVEL_OPTS}
          selected={nivelFilter}
          onSelect={setNivelFilter}
        />
      </FilterPanel>

      {/* Count + clear */}
      <View style={styles.metaRow}>
        {countLabel !== null && (
          <Text style={styles.countText}>{countLabel} encontrada{filtered.length !== 1 ? 's' : ''}</Text>
        )}
        {hasFilters && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearBtn} activeOpacity={0.75}>
            <Ionicons name="close-circle-outline" size={14} color={Colors.primary} />
            <Text style={styles.clearBtnText}>Limpar filtros</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerRight: undefined }} />

      {/* Ativas / Inativas toggle */}
      <View style={[styles.filterBar, isDesktop && styles.filterBarDesktop]}>
        {(['ativas', 'inativas'] as ActiveFilter[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
              {f === 'ativas' ? 'Ativas' : 'Inativas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {status === 'loading' && !refreshing && data.length === 0 && (
        <LoadingState message="Carregando regiões…" />
      )}

      {status === 'error' && data.length === 0 && (
        <ErrorState message={errorMessage ?? 'Erro ao carregar regiões.'} onRetry={load} />
      )}

      {(status === 'success' || (status !== 'error' && data.length > 0)) && (
        <>
          {activeFilter === 'inativas' ? (
            <View style={styles.inativasNote}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.textMuted} />
              <Text style={styles.inativasNoteText}>
                A API de listagem retorna apenas regiões ativas.{'\n'}
                Regiões inativadas não aparecem nesta lista.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => String(item.idRegiao)}
              renderItem={({ item }) => (
                <RegiaoCard regiao={item} onPress={() => handleCard(item)} />
              )}
              ListHeaderComponent={ListHeader}
              contentContainerStyle={[
                styles.list,
                isDesktop && styles.listDesktop,
                filtered.length === 0 && styles.listEmpty,
              ]}
              ListEmptyComponent={
                <EmptyState
                  message={
                    hasFilters
                      ? 'Nenhuma região encontrada para os filtros selecionados.'
                      : 'Nenhuma região monitorada cadastrada.'
                  }
                />
              }
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
        </>
      )}

      {isGoverno && (
        <TouchableOpacity style={styles.fab} onPress={handleNova} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color={Colors.card} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  filterBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterBarDesktop: {
    borderBottomWidth: 0,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  filterChip: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF0FB',
  },
  filterChipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  filterChipTextActive: {
    color: Colors.primary,
  },

  inativasNote: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  inativasNoteText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  listDesktop: {
    paddingHorizontal: Spacing.xl,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
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

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    backgroundColor: Colors.card,
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

  // Count + clear row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  countText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
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
});
