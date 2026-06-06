import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRegioes } from '@hooks/useRegioes';
import { useEstacoes } from '@hooks/useEstacoes';
import { useAppContext } from '@contexts/AppContext';
import { useToast } from '@contexts/ToastContext';
import { LoadingState } from '@components/ui/LoadingState';
import { ErrorState } from '@components/ui/ErrorState';
import { EmptyState } from '@components/ui/EmptyState';
import { EstacaoCard, EstacaoForm } from '@components/estacoes';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import type { RegiaoMonitorada } from '@/types';

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

  const { data: estacoes, status: estStatus, errorMessage: estError, load: loadEstacoes } =
    useEstacoes(selectedRegiaoId);

  // Refresh regions on focus; refresh stations when region is selected
  useFocusEffect(
    useCallback(() => {
      loadRegioes();
    }, [loadRegioes]),
  );

  // Load stations whenever region selection changes
  useFocusEffect(
    useCallback(() => {
      if (selectedRegiaoId !== null) {
        loadEstacoes();
      }
    }, [selectedRegiaoId, loadEstacoes]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRegioes();
    if (selectedRegiaoId !== null) await loadEstacoes();
    setRefreshing(false);
  }, [loadRegioes, loadEstacoes, selectedRegiaoId]);

  const handleSelectRegiao = useCallback((id: number) => {
    setSelectedRegiaoId(id);
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

  const screenTitle = isGoverno ? 'Estações IoT' : 'Estações de Monitoramento';
  const screenSubtitle = isGoverno
    ? 'Cadastro e acompanhamento das estações vinculadas às regiões monitoradas.'
    : 'Visualização das estações usadas no acompanhamento territorial.';

  // ── List header (inline in FlatList) ────────────────────────────────────────

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
          <RegionChips
            regioes={regioes}
            selectedId={selectedRegiaoId}
            onSelect={handleSelectRegiao}
          />
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

      {/* Station count header */}
      {selectedRegiaoId !== null && estStatus === 'success' && (
        <View style={[styles.stationsHeader, isDesktop && styles.stationsHeaderDesktop]}>
          <Text style={styles.stationsCount}>
            {estacoes.length} estação{estacoes.length !== 1 ? 'ões' : ''} · {selectedRegiao?.nome ?? ''}
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
        <ErrorState
          message={estError ?? 'Erro ao carregar estações.'}
          onRetry={loadEstacoes}
        />
      )}
    </View>
  );

  const showStationList = selectedRegiaoId !== null && (estStatus === 'success' || (estStatus !== 'error' && estacoes.length > 0));

  return (
    <View style={styles.root}>
      <FlatList
        data={showStationList ? estacoes : []}
        keyExtractor={item => String(item.idEstacao)}
        renderItem={({ item }) => (
          <View style={[styles.cardWrap, isDesktop && styles.cardWrapDesktop]}>
            <EstacaoCard estacao={item} regiaoNome={selectedRegiao?.nome} />
          </View>
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          showStationList ? (
            <View style={[styles.emptyWrap, isDesktop && styles.emptyWrapDesktop]}>
              <EmptyState
                message="Nenhuma estação cadastrada para esta região."
                icon="📡"
              />
            </View>
          ) : null
        }
        contentContainerStyle={[
          styles.listContent,
          (!showStationList || estacoes.length === 0) && styles.listContentEmpty,
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

      {/* FAB — mobile Governo only, shown when a region is selected */}
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
