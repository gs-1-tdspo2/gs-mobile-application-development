import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/AppCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { RiskBadge } from '@/components/RiskBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { getRegiaoById } from '@/services/regioesService';
import { screenStyles } from '@/styles/global';
import { RegiaoReadModel } from '@/types/regiao';
import { getApiErrorMessage } from '@/utils/apiError';

export default function RegiaoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [regiao, setRegiao] = useState<RegiaoReadModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRegiao = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      setErrorMessage('Identificador da região não foi informado.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await getRegiaoById(id);
      setRegiao(data);
    } catch (error) {
      setRegiao(null);
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(loadRegiao);
  }, [loadRegiao]);

  return (
    <SafeAreaView style={screenStyles.safeArea}>
      <ScrollView contentContainerStyle={screenStyles.scrollContent}>
        <View style={screenStyles.header}>
          <Text style={screenStyles.title}>Detalhe da região</Text>
          <Text style={screenStyles.subtitle}>
            Prévia integrada ao endpoint de leitura da região. Seções completas ficam para a próxima etapa.
          </Text>
        </View>

        {isLoading ? <LoadingState message="Carregando região..." /> : null}

        {errorMessage ? <ErrorState message={errorMessage} onRetry={loadRegiao} /> : null}

        {!isLoading && !errorMessage && !regiao ? (
          <EmptyState
            title="Região não encontrada"
            description="A API não retornou dados para o identificador informado."
          />
        ) : null}

        {!isLoading && !errorMessage && regiao ? (
          <>
            <AppCard title={regiao.nome} subtitle={regiao.descricao}>
              <View style={styles.identity}>
                <Text style={styles.meta}>{formatLocation(regiao)}</Text>
                <Text style={styles.routeId}>ID da rota: {id}</Text>
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
            </AppCard>

            <View style={styles.placeholderGrid}>
              <AppCard
                title="Risco atual"
                subtitle="A seção completa será integrada com /api/regioes/{id}/risco-atual.">
                {regiao.riscoNivel ? <RiskBadge nivel={regiao.riscoNivel} /> : <Text style={styles.meta}>Ainda não informado pela API.</Text>}
              </AppCard>

              <AppCard
                title="Estações IoT"
                subtitle="Próxima etapa: listar estações vinculadas à região.">
                <StatusBadge status="Em desenvolvimento" />
              </AppCard>

              <AppCard
                title="Últimas leituras"
                subtitle="Próxima etapa: exibir medições recentes de sensores.">
                <StatusBadge status="Em desenvolvimento" />
              </AppCard>

              <AppCard
                title="Alertas recentes"
                subtitle="Próxima etapa: relacionar alertas recentes desta região.">
                <StatusBadge status="Em desenvolvimento" />
              </AppCard>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatLocation(regiao: RegiaoReadModel): string {
  const location = [regiao.cidade, regiao.estado].filter(Boolean).join(' / ');
  return location || 'Localização não informada';
}

const styles = StyleSheet.create({
  identity: {
    gap: spacing.xs,
  },
  meta: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  routeId: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
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
  placeholderGrid: {
    gap: spacing.md,
  },
});
