import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  FlatList,
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
  const filtered = filter === 'ativas' ? data : [];

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
              contentContainerStyle={[
                styles.list,
                isDesktop && styles.listDesktop,
                filtered.length === 0 && styles.listEmpty,
              ]}
              ListEmptyComponent={
                <EmptyState message="Nenhuma região monitorada cadastrada." />
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
});
