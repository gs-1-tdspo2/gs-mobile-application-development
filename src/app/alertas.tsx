import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FilterChip } from '@/components/FilterChip';
import { LoadingState } from '@/components/LoadingState';
import { MetricCard } from '@/components/MetricCard';
import { RiskBadge } from '@/components/RiskBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { getAlertas, resolverAlerta } from '@/services/alertasService';
import { screenStyles } from '@/styles/global';
import { AlertaReadModel } from '@/types/alerta';
import { getApiErrorMessage } from '@/utils/apiError';
import { formatDate } from '@/utils/formatDate';

type AlertFilter = 'todos' | 'ativos' | 'criticos' | 'resolvidos';

type Feedback = {
  type: 'success' | 'error';
  message: string;
};

const filters: { id: AlertFilter; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'ativos', label: 'Ativos' },
  { id: 'criticos', label: 'Críticos' },
  { id: 'resolvidos', label: 'Resolvidos' },
];

export default function AlertasScreen() {
  const [alertas, setAlertas] = useState<AlertaReadModel[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<AlertFilter>('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<number | string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const loadAlertas = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await getAlertas();
      setAlertas(data);
    } catch (error) {
      setAlertas([]);
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadAlertas);
  }, [loadAlertas]);

  const summary = useMemo(() => {
    const ativos = alertas.filter((alerta) => !alerta.resolvido).length;
    const criticos = alertas.filter((alerta) => alerta.nivel === 'CRITICO').length;
    const resolvidos = alertas.filter((alerta) => alerta.resolvido).length;

    return { total: alertas.length, ativos, criticos, resolvidos };
  }, [alertas]);

  const filteredAlertas = useMemo(() => {
    return alertas.filter((alerta) => {
      if (selectedFilter === 'todos') {
        return true;
      }

      if (selectedFilter === 'ativos') {
        return !alerta.resolvido;
      }

      if (selectedFilter === 'criticos') {
        return alerta.nivel === 'CRITICO';
      }

      return alerta.resolvido;
    });
  }, [alertas, selectedFilter]);

  function confirmResolve(alerta: AlertaReadModel) {
    Alert.alert(
      'Resolver alerta',
      `Deseja marcar "${alerta.titulo}" como resolvido?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resolver',
          onPress: () => {
            void handleResolve(alerta);
          },
        },
      ],
    );
  }

  async function handleResolve(alerta: AlertaReadModel) {
    setResolvingId(alerta.id);
    setFeedback(null);

    try {
      const updated = await resolverAlerta(alerta.id);

      if (updated) {
        setAlertas((current) =>
          current.map((item) => (String(item.id) === String(alerta.id) ? updated : item)),
        );
      } else {
        await loadAlertas();
      }

      setFeedback({ type: 'success', message: 'Alerta resolvido com sucesso.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: `Não foi possível resolver o alerta. ${getApiErrorMessage(error)}`,
      });
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <SafeAreaView style={screenStyles.safeArea}>
      <ScrollView contentContainerStyle={screenStyles.scrollContent}>
        <View style={screenStyles.header}>
          <Text style={screenStyles.title}>Alertas ambientais</Text>
          <Text style={screenStyles.subtitle}>
            Lista de ocorrências da API com severidade, status e ação de resolução.
          </Text>
        </View>

        {feedback ? <InlineFeedback type={feedback.type} message={feedback.message} /> : null}

        <View style={styles.summaryGrid}>
          <MetricCard label="Total" value={summary.total} supportingText="Alertas retornados" />
          <MetricCard
            label="Ativos"
            value={summary.ativos}
            supportingText="Aguardando ação"
            accentColor={colors.warningOrange}
          />
          <MetricCard
            label="Críticos"
            value={summary.criticos}
            supportingText="Severidade máxima"
            accentColor={colors.criticalRed}
          />
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

        {isLoading ? <LoadingState message="Carregando alertas ambientais..." /> : null}

        {errorMessage ? <ErrorState message={errorMessage} onRetry={loadAlertas} /> : null}

        {!isLoading && !errorMessage && alertas.length === 0 ? (
          <EmptyState
            title="Nenhum alerta encontrado"
            description="Quando a API retornar alertas ambientais, eles aparecerão aqui."
          />
        ) : null}

        {!isLoading && !errorMessage && alertas.length > 0 && filteredAlertas.length === 0 ? (
          <EmptyState
            title="Nenhum alerta neste filtro"
            description="Ajuste os filtros para visualizar outros alertas."
          />
        ) : null}

        {!isLoading && !errorMessage && filteredAlertas.length > 0 ? (
          <View style={styles.list}>
            {filteredAlertas.map((alerta) => {
              const isCritical = alerta.nivel === 'CRITICO';

              return (
                <AppCard
                  key={String(alerta.id)}
                  title={alerta.titulo}
                  subtitle={alerta.descricao}
                  style={isCritical && !alerta.resolvido ? styles.criticalCard : undefined}>
                  <View style={styles.cardContent}>
                    <View style={styles.badges}>
                      {alerta.nivel ? <RiskBadge nivel={alerta.nivel} /> : null}
                      <StatusBadge status={alerta.resolvido ? 'Resolvido' : 'Ativo'} />
                      {alerta.tipoAlerta ? <TypeBadge label={alerta.tipoAlerta} /> : null}
                    </View>

                    <Text style={styles.meta}>
                      Região: {alerta.regiaoNome ?? alerta.regiaoId ?? 'não informada'}
                    </Text>
                    <Text style={styles.meta}>Data: {formatDate(alerta.criadoEm)}</Text>
                    {alerta.recomendacao ? (
                      <Text style={styles.recommendation}>{alerta.recomendacao}</Text>
                    ) : null}

                    {!alerta.resolvido ? (
                      <AppButton
                        label={resolvingId === alerta.id ? 'Resolvendo...' : 'Resolver alerta'}
                        onPress={() => confirmResolve(alerta)}
                        disabled={resolvingId === alerta.id}
                        variant={isCritical ? 'danger' : 'primary'}
                      />
                    ) : (
                      <Text style={styles.resolvedText}>
                        Resolvido em: {formatDate(alerta.resolvidoEm)}
                      </Text>
                    )}
                  </View>
                </AppCard>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function TypeBadge({ label }: { label: string }) {
  return (
    <View style={styles.typeBadge}>
      <Text style={styles.typeBadgeText}>{label.replace(/_/g, ' ')}</Text>
    </View>
  );
}

function InlineFeedback({ type, message }: Feedback) {
  const isSuccess = type === 'success';

  return (
    <View style={[styles.feedback, isSuccess ? styles.successFeedback : styles.errorFeedback]}>
      <Text style={[styles.feedbackText, isSuccess ? styles.successText : styles.errorText]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryGrid: {
    gap: spacing.sm,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  criticalCard: {
    backgroundColor: colors.criticalSoftBackground,
    borderColor: colors.criticalRed,
  },
  cardContent: {
    gap: spacing.sm,
  },
  badges: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  meta: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  recommendation: {
    color: colors.neutralText,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  resolvedText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '700',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeBadgeText: {
    color: colors.primaryBase,
    fontSize: 12,
    fontWeight: '700',
  },
  feedback: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
  },
  successFeedback: {
    backgroundColor: colors.lowRiskBackground,
    borderColor: '#16A34A',
  },
  errorFeedback: {
    backgroundColor: colors.criticalSoftBackground,
    borderColor: colors.criticalRed,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  successText: {
    color: '#166534',
  },
  errorText: {
    color: colors.criticalRed,
  },
});
