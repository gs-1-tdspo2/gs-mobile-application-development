import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
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
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RegiaoCard } from '@components/regioes/RegiaoCard';
import { LoadingState } from '@components/ui/LoadingState';
import { ErrorState } from '@components/ui/ErrorState';
import { EmptyState } from '@components/ui/EmptyState';
import { useRegioes } from '@hooks/useRegioes';
import { useAppContext } from '@contexts/AppContext';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import type { RegiaoMonitorada } from '@/types';

type Filter = 'ativas' | 'inativas';

export default function RegioesScreen() {
  const { data, status, errorMessage, load } = useRegioes();
  const { isGoverno } = useAppContext();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('ativas');
  const [searchText, setSearchText] = useState('');
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleNova = useCallback(() => {
    router.push('/regioes/nova');
  }, [router]);

  const handleCard = useCallback((regiao: RegiaoMonitorada) => {
    router.push(`/regioes/${regiao.idRegiao}`);
  }, [router]);

  // API only returns active regions; "inativas" filter will always be empty
  const filtered = useMemo(() => {
    if (filter === 'inativas') return [];
    if (!searchText.trim()) return data;
    const q = searchText.toLowerCase();
    return data.filter(
      r =>
        r.nome.toLowerCase().includes(q) ||
        r.cidade.toLowerCase().includes(q) ||
        r.estado.toLowerCase().includes(q),
    );
  }, [data, filter, searchText]);

  return (
    <View style={styles.root}>
      {/* No headerRight — FAB is the only create entry point */}
      <Stack.Screen options={{ headerRight: undefined }} />

      {/* Filter toggle */}
      <View style={[styles.filterBar, isDesktop && styles.filterBarDesktop]}>
        {(['ativas', 'inativas'] as Filter[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
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
          {filter === 'inativas' ? (
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
              ListHeaderComponent={
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
              }
              contentContainerStyle={[
                styles.list,
                isDesktop && styles.listDesktop,
                filtered.length === 0 && styles.listEmpty,
              ]}
              ListEmptyComponent={
                <EmptyState
                  message={
                    searchText.trim()
                      ? 'Nenhuma região encontrada para esta busca.'
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

  // Filter toggle bar
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
    maxWidth: 800,
    alignSelf: 'center' as const,
    width: '100%',
    borderBottomWidth: 0,
    paddingTop: Spacing.md,
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

  // Inativas info note
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
    maxWidth: 800,
    alignSelf: 'center' as const,
    width: '100%',
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
});
