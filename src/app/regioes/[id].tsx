import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { MetricCard } from '@/components/MetricCard';
import { RiskBadge } from '@/components/RiskBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import {
  getEstacoesByRegiao,
  getLeiturasByRegiao,
  getRegiaoById,
  getRegioes,
  getRiscoAtualByRegiao,
} from '@/services/regioesService';
import { screenStyles } from '@/styles/global';
import { EstacaoReadModel } from '@/types/estacao';
import { LeituraReadModel } from '@/types/leitura';
import { RegiaoReadModel } from '@/types/regiao';
import { RiscoAtualReadModel } from '@/types/risco';
import { getApiErrorMessage } from '@/utils/apiError';
import { formatDate } from '@/utils/formatDate';
import { useResponsiveLayout } from '@/utils/responsive';

type SectionErrors = {
  regiao?: string;
  risco?: string;
  estacoes?: string;
  leituras?: string;
};

export default function RegiaoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [regiao, setRegiao] = useState<RegiaoReadModel | null>(null);
  const [risco, setRisco] = useState<RiscoAtualReadModel | null>(null);
  const [estacoes, setEstacoes] = useState<EstacaoReadModel[]>([]);
  const [leituras, setLeituras] = useState<LeituraReadModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sectionErrors, setSectionErrors] = useState<SectionErrors>({});
  const { isDesktop } = useResponsiveLayout();

  const latestReading = leituras[0];
  const effectiveRisk = risco?.nivel ?? regiao?.riscoNivel;

  const readingMetrics = useMemo(
    () => [
      { label: 'Temperatura', value: formatMetric(latestReading?.temperatura, '°C') },
      { label: 'Umidade', value: formatMetric(latestReading?.umidade, '%') },
      { label: 'Índice UV', value: formatMetric(latestReading?.indiceUv) },
      { label: 'Chuva', value: formatMetric(latestReading?.chuva, 'mm') },
      { label: 'Gás/Fumaça', value: formatMetric(latestReading?.gasFumaca) },
    ],
    [latestReading],
  );

  const loadDetails = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      setErrorMessage('Identificador da região não foi informado.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSectionErrors({});

    const nextErrors: SectionErrors = {};
    let regiaoData: RegiaoReadModel | null = null;

    try {
      regiaoData = await getRegiaoById(id);
    } catch (error) {
      nextErrors.regiao = getApiErrorMessage(error);

      try {
        const regioes = await getRegioes();
        regiaoData = regioes.find((item) => String(item.id) === String(id)) ?? null;
      } catch {
        regiaoData = null;
      }
    }

    const [riscoResult, estacoesResult, leiturasResult] = await Promise.allSettled([
      getRiscoAtualByRegiao(id),
      getEstacoesByRegiao(id),
      getLeiturasByRegiao(id),
    ]);

    if (riscoResult.status === 'fulfilled') {
      setRisco(riscoResult.value);
    } else {
      setRisco(null);
      nextErrors.risco = getApiErrorMessage(riscoResult.reason);
    }

    if (estacoesResult.status === 'fulfilled') {
      setEstacoes(estacoesResult.value);
    } else {
      setEstacoes([]);
      nextErrors.estacoes = getApiErrorMessage(estacoesResult.reason);
    }

    if (leiturasResult.status === 'fulfilled') {
      setLeituras(leiturasResult.value);
    } else {
      setLeituras([]);
      nextErrors.leituras = getApiErrorMessage(leiturasResult.reason);
    }

    setRegiao(regiaoData);
    setSectionErrors(nextErrors);
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(loadDetails);
  }, [loadDetails]);

  return (
    <AppShell activeRoute="regioes">
      <SafeAreaView style={screenStyles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            screenStyles.scrollContent,
            isDesktop && screenStyles.desktopScrollContent,
          ]}>
        <View style={screenStyles.header}>
          <Text style={screenStyles.title}>{regiao?.nome ?? `Região ${id ?? ''}`}</Text>
          <Text style={screenStyles.subtitle}>
            Monitoramento regional com risco atual, estações IoT e últimas leituras da API.
          </Text>
        </View>

        {isLoading ? <LoadingState message="Carregando detalhe da região..." /> : null}

        {errorMessage ? <ErrorState message={errorMessage} onRetry={loadDetails} /> : null}

        {!isLoading && !errorMessage ? (
          <>
            <AppCard title={regiao?.nome ?? 'Identidade da região'} variant="elevated">
              <View style={styles.identity}>
                {sectionErrors.regiao ? (
                  <Text style={styles.warningText}>
                    Não foi possível carregar /api/regioes/{id}. Exibindo dados parciais quando
                    disponíveis.
                  </Text>
                ) : null}
                <Text style={styles.meta}>{regiao ? formatLocation(regiao) : 'ID da rota: ' + id}</Text>
                <View style={styles.badges}>
                  {regiao?.tipoCliente ? <ClientBadge label={regiao.tipoCliente} /> : null}
                  {regiao?.ativo !== undefined ? (
                    <StatusBadge status={regiao.ativo ? 'Ativo' : 'Inativo'} />
                  ) : null}
                  {effectiveRisk ? <RiskBadge nivel={effectiveRisk} /> : null}
                </View>
              </View>
            </AppCard>

            <View style={[styles.sectionStack, isDesktop && styles.desktopColumns]}>
              <AppCard
                title="Risco atual"
                subtitle="Consolidado retornado pela API para esta região."
                variant="elevated"
                style={isDesktop && styles.desktopColumnCard}>
                {sectionErrors.risco ? (
                  <ErrorState message={sectionErrors.risco} onRetry={loadDetails} />
                ) : risco || effectiveRisk ? (
                  <View style={styles.sectionStack}>
                    {effectiveRisk ? <RiskBadge nivel={effectiveRisk} /> : null}
                    {risco?.score !== undefined ? (
                      <Text style={styles.metricLine}>Score consolidado: {risco.score}</Text>
                    ) : null}
                    {risco?.descricao ? <Text style={styles.meta}>{risco.descricao}</Text> : null}
                    <Text style={styles.meta}>Atualizado em: {formatDate(risco?.atualizadoEm)}</Text>
                  </View>
                ) : (
                  <EmptyState
                    title="Risco não informado"
                    description="A API não retornou risco atual para esta região."
                  />
                )}
              </AppCard>

              <AppCard
                title="Estações IoT"
                subtitle="Estações vinculadas à região monitorada."
                variant="elevated"
                style={isDesktop && styles.desktopColumnCard}>
                {sectionErrors.estacoes ? (
                  <ErrorState message={sectionErrors.estacoes} onRetry={loadDetails} />
                ) : estacoes.length > 0 ? (
                  <View style={styles.sectionStack}>
                    {estacoes.map((estacao) => (
                      <View key={String(estacao.id)} style={styles.listRow}>
                        <View style={styles.rowText}>
                          <Text style={styles.rowTitle}>{estacao.nome}</Text>
                          <Text style={styles.meta}>{estacao.codigo ?? estacao.tipo ?? 'Sem código'}</Text>
                          <Text style={styles.meta}>
                            Última comunicação: {formatDate(estacao.ultimaLeituraEm)}
                          </Text>
                        </View>
                        <StatusBadge status={estacao.ativa === false ? 'Inativo' : 'Ativo'} />
                      </View>
                    ))}
                  </View>
                ) : (
                  <EmptyState
                    title="Nenhuma estação encontrada"
                    description="A API não retornou estações para esta região."
                  />
                )}
              </AppCard>
            </View>

            <View style={[styles.sectionStack, isDesktop && styles.desktopColumns]}>
              <AppCard
                title="Últimas leituras"
                subtitle="Leitura mais recente em cartões compactos."
                variant="elevated"
                style={isDesktop && styles.desktopMainCard}>
                {sectionErrors.leituras ? (
                  <ErrorState message={sectionErrors.leituras} onRetry={loadDetails} />
                ) : latestReading ? (
                  <View style={[styles.readingsGrid, isDesktop && styles.desktopReadingsGrid]}>
                    {readingMetrics.map((metric) => (
                      <MetricCard
                        key={metric.label}
                        label={metric.label}
                        value={metric.value}
                        supportingText={`Data: ${formatDate(latestReading.dataHora)}`}
                        style={[styles.readingMetric, isDesktop && styles.desktopReadingMetric]}
                      />
                    ))}
                    {latestReading.nivelAguaPercentual !== undefined ? (
                      <MetricCard
                        label="Nível de água"
                        value={formatMetric(latestReading.nivelAguaPercentual, '%')}
                        supportingText={`Distância: ${formatMetric(latestReading.distanciaAguaCm, 'cm')}`}
                        accentColor={colors.primary}
                        style={[styles.readingMetric, isDesktop && styles.desktopReadingMetric]}
                      />
                    ) : null}
                    {latestReading.pm25 !== undefined || latestReading.pm10 !== undefined ? (
                      <MetricCard
                        label="Particulados"
                        value={`PM2.5 ${formatMetric(latestReading.pm25)}`}
                        supportingText={`PM10 ${formatMetric(latestReading.pm10)}`}
                        accentColor={colors.warningOrange}
                        style={[styles.readingMetric, isDesktop && styles.desktopReadingMetric]}
                      />
                    ) : null}
                  </View>
                ) : (
                  <EmptyState
                    title="Nenhuma leitura encontrada"
                    description="A API não retornou leituras recentes para esta região."
                  />
                )}
              </AppCard>

              <AppCard
                title="Alertas recentes"
                subtitle="Acesse a lista consolidada de alertas ambientais."
                variant="compact"
                style={isDesktop && styles.desktopSideCard}>
                <AppButton label="Ir para Alertas" href="/alertas" />
              </AppCard>
            </View>
          </>
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

function formatMetric(value?: number, suffix = ''): string {
  return value === undefined ? '-' : `${value}${suffix}`;
}

function ClientBadge({ label }: { label: string }) {
  return (
    <View style={styles.clientBadge}>
      <Text style={styles.clientBadgeText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  identity: {
    gap: spacing.xs,
  },
  sectionStack: {
    gap: spacing.md,
  },
  desktopColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  desktopColumnCard: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 360,
  },
  desktopMainCard: {
    flexBasis: '68%',
    flexGrow: 1,
    minWidth: 520,
  },
  desktopSideCard: {
    flexBasis: '28%',
    flexGrow: 1,
    minWidth: 280,
  },
  meta: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  warningText: {
    color: colors.warningOrange,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  metricLine: {
    color: colors.neutralText,
    fontSize: 18,
    fontWeight: '800',
  },
  badges: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
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
  listRow: {
    alignItems: 'flex-start',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTitle: {
    color: colors.neutralText,
    fontSize: 15,
    fontWeight: '800',
  },
  readingsGrid: {
    gap: spacing.sm,
  },
  desktopReadingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  readingMetric: {
    minHeight: 108,
  },
  desktopReadingMetric: {
    flexBasis: '30%',
    flexGrow: 1,
    minWidth: 180,
  },
});
