import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { EmptyState } from '@/components/EmptyState';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { screenStyles } from '@/styles/global';

const regioesPlaceholder = [
  {
    id: 1,
    nome: 'Regiao piloto',
    municipio: 'Sao Paulo',
    resumo: 'Area de teste para validar a navegacao mobile antes da integracao com a API.',
  },
];

export default function RegioesScreen() {
  return (
    <SafeAreaView style={screenStyles.safeArea}>
      <ScrollView contentContainerStyle={screenStyles.scrollContent}>
        <View style={screenStyles.header}>
          <Text style={screenStyles.title}>Regioes monitoradas</Text>
          <Text style={screenStyles.subtitle}>
            Layout inicial para a futura listagem de regioes retornadas pelo backend.
          </Text>
        </View>

        {regioesPlaceholder.length === 0 ? (
          <EmptyState
            title="Nenhuma regiao cadastrada"
            description="Quando a API estiver integrada, as regioes monitoradas aparecerao aqui."
          />
        ) : (
          <View style={styles.list}>
            {regioesPlaceholder.map((regiao) => (
              <AppCard key={regiao.id} title={regiao.nome} subtitle={regiao.resumo}>
                <Text style={styles.meta}>{regiao.municipio}</Text>
                <AppButton
                  label="Abrir detalhe"
                  href={{ pathname: '/regioes/[id]', params: { id: String(regiao.id) } }}
                />
              </AppCard>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  meta: {
    color: colors.mutedText,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
});
