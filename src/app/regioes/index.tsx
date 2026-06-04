import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/AppCard';
import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FilterChip } from '@/components/FilterChip';
import { LoadingState } from '@/components/LoadingState';
import { RiskBadge } from '@/components/RiskBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { getRegioes } from '@/services/regioesService';
import { screenStyles } from '@/styles/global';
import { RegiaoReadModel } from '@/types/regiao';
import { getApiErrorMessage } from '@/utils/apiError';
import { useResponsiveLayout } from '@/utils/responsive';

type RegiaoFilter = 'todas' | 'governo' | 'ong' | 'risco';

const filters: { id: RegiaoFilter; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'governo', label: 'Governo / Defesa Civil' },
  { id: 'ong', label: 'ONG' },
  { id: 'risco', label: 'Em risco' },
];

export default function RegioesScreen() {
  const [regioes, setRegioes] = useState<RegiaoReadModel[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<RegiaoFilter>('todas');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { isDesktop } = useResponsiveLayout();

  const loadRegioes = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await getRegioes();
      setRegioes(data);
    } catch (error) {
      setRegioes([]);
      setErrorMessage(`Não foi possível carregar as regiões. ${getApiErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadRegioes);
  }, [loadRegioes]);

  const filteredRegioes = useMemo(() => {
    return regioes.filter((regiao) => {
      if (selectedFilter === 'todas') {
        return true;
      }

      if (selectedFilter === 'risco') {
        return regiao.riscoNivel === 'ALTO' || regiao.riscoNivel === 'CRITICO';
      }

      const tipoCliente = normalizeText(regiao.tipoCliente);
      if (selectedFilter === 'governo') {
        return tipoCliente.includes('governo') || tipoCliente.includes('defesa civil');
      }

      return tipoCliente.includes('ong');
    });
  }, [regioes, selectedFilter]);

  return (
    <AppShell activeRoute="regioes">
      <SafeAreaView style={screenStyles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            screenStyles.scrollContent,
            isDesktop && screenStyles.desktopScrollContent,
          ]}>
        <View style={screenStyles.header}>
          <Text style={screenStyles.title}>Regiões monitoradas</Text>
          <Text style={screenStyles.subtitle}>
            Carteira de áreas monitoradas com risco, status e acesso ao detalhe operacional.
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filters}>
            {filters.map((filter) => (
              <FilterChip
                key={filter.id}
                label={filter.label}
                selected={selectedFilter === filter.id}
                onPress={() => setSelectedFilter(filter.id)}
              />
            ))}
          </View>
        </ScrollView>

        {isLoading ? <LoadingState message="Carregando regiões monitoradas..." /> : null}

        {errorMessage ? <ErrorState message={errorMessage} onRetry={loadRegioes} /> : null}

        {!isLoading && !errorMessage && regioes.length === 0 ? (
          <EmptyState
            title="Nenhuma região cadastrada"
            description="Quando houver regiões monitoradas, elas aparecerão nesta lista."
          />
        ) : null}

        {!isLoading && !errorMessage && regioes.length > 0 && filteredRegioes.length === 0 ? (
          <EmptyState
            title="Nenhuma região neste filtro"
            description="Ajuste os filtros para visualizar outras regiões monitoradas."
          />
        ) : null}

        {!isLoading && !errorMessage && filteredRegioes.length > 0 ? (
          <View style={[styles.list, isDesktop && styles.desktopList]}>
            {filteredRegioes.map((regiao) => (
              <Link
                key={String(regiao.id)}
                href={{ pathname: '/regioes/[id]', params: { id: String(regiao.id) } }}
                asChild>
                <Pressable
                  style={({ hovered, pressed }) => [
                    isDesktop && styles.desktopCardPressable,
                    hovered && styles.hoveredCard,
                    pressed && styles.pressed,
                  ]}>
                  <AppCard
                    title={regiao.nome}
                    subtitle={regiao.descricao}
                    variant="compact"
                    style={isDesktop && styles.desktopCard}>
                    <View style={[styles.cardContent, isDesktop && styles.desktopCardContent]}>
                      <View style={styles.regionMain}>
                        <Text style={styles.meta}>{formatLocation(regiao)}</Text>
                        <View style={styles.badges}>
                          {regiao.tipoCliente ? (
                            <View style={styles.clientBadge}>
                              <Text style={styles.clientBadgeText}>{regiao.tipoCliente}</Text>
                            </View>
                          ) : null}
                          {regiao.ativo !== undefined ? (
                            <StatusBadge status={regiao.ativo ? 'Ativo' : 'Inativo'} />
                          ) : null}
                          {regiao.riscoNivel ? <RiskBadge nivel={regiao.riscoNivel} /> : null}
                        </View>
                      </View>
                      <View style={styles.regionAction}>
                        {regiao.alertasAtivos !== undefined ? (
                          <Text style={styles.alerts}>{regiao.alertasAtivos} alerta(s)</Text>
                        ) : null}
                        <Text style={styles.detailAction}>Ver detalhes</Text>
                      </View>
                    </View>
                  </AppCard>
                </Pressable>
              </Link>
            ))}
          </View>
        ) : null}
        </ScrollView>
      </SafeAreaView>
    </AppShell>
  );
}

function formatLocation(regiao: RegiaoReadModel): string {
  const location = [regiao.cidade, regiao.estado].filter(Boolean).join(' / ');
  return location || 'Localização não informada';
}

function normalizeText(value?: string): string {
  return (
    value
      ?.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase() ?? ''
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  desktopList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  desktopCardPressable: {
    flexBasis: '100%',
    flexGrow: 1,
  },
  hoveredCard: {
    transform: [{ translateY: -1 }],
  },
  desktopCard: {
    borderColor: '#D8DEEA',
  },
  cardContent: {
    gap: spacing.sm,
  },
  desktopCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  regionMain: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 260,
  },
  regionAction: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  meta: {
    color: colors.mutedText,
    fontSize: 14,
  },
  badges: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  clientBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clientBadgeText: {
    color: colors.primaryBase,
    fontSize: 12,
    fontWeight: '700',
  },
  alerts: {
    color: colors.criticalRed,
    fontSize: 13,
    fontWeight: '700',
  },
  detailAction: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary100,
    borderRadius: 4,
    borderWidth: 1,
    color: colors.primaryBase,
    fontSize: 13,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }],
  },
});
