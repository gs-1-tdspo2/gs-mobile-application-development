import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { RiskBadge } from '@/components/RiskBadge';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { screenStyles } from '@/styles/global';

export default function HomeScreen() {
  return (
    <SafeAreaView style={screenStyles.safeArea}>
      <ScrollView contentContainerStyle={screenStyles.scrollContent}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Monitoramento climático e ambiental</Text>
          <Text style={styles.title}>Amanajé</Text>
          <Text style={styles.description}>
            MVP mobile para acompanhar regioes vulneraveis, risco ambiental, alertas e
            indicadores regionais conectados a API Java da Global Solution.
          </Text>
          <View style={styles.badges}>
            <RiskBadge nivel="BAIXO" />
            <RiskBadge nivel="MODERADO" />
            <RiskBadge nivel="ALTO" />
            <RiskBadge nivel="CRITICO" />
          </View>
        </View>

        <View style={styles.grid}>
          <AppCard
            title="Regioes"
            subtitle="Visualize a lista inicial de regioes monitoradas e teste a rota dinamica.">
            <AppButton label="Abrir regioes" href="/regioes" />
          </AppCard>

          <AppCard
            title="Gerenciar regioes"
            subtitle="Espaco reservado para o futuro fluxo de cadastro e manutencao.">
            <AppButton label="Gerenciar" href="/gerenciar-regioes" variant="secondary" />
          </AppCard>

          <AppCard
            title="Alertas"
            subtitle="Acompanhe futuramente alertas ambientais e sua resolucao.">
            <AppButton label="Ver alertas" href="/alertas" variant="secondary" />
          </AppCard>

          <AppCard
            title="Indicadores"
            subtitle="Consulte futuramente metricas regionais e sinais de risco.">
            <AppButton label="Ver indicadores" href="/indicadores" variant="secondary" />
          </AppCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.deepGreen,
    borderRadius: 8,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  eyebrow: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.offWhite,
    fontSize: 34,
    fontWeight: '800',
  },
  description: {
    color: colors.offWhite,
    fontSize: 16,
    lineHeight: 24,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  grid: {
    gap: spacing.md,
  },
});
