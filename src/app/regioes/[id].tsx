import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/AppCard';
import { RiskBadge } from '@/components/RiskBadge';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { screenStyles } from '@/styles/global';

export default function RegiaoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={screenStyles.safeArea}>
      <ScrollView contentContainerStyle={screenStyles.scrollContent}>
        <View style={screenStyles.header}>
          <Text style={screenStyles.title}>Detalhe da regiao</Text>
          <Text style={screenStyles.subtitle}>
            Rota dinamica pronta para receber dados reais quando a integracao for implementada.
          </Text>
        </View>

        <AppCard title="Identificador recebido">
          <View style={styles.idBox}>
            <Text style={styles.idLabel}>ID da rota</Text>
            <Text style={styles.idValue}>{id}</Text>
          </View>
        </AppCard>

        <AppCard
          title="Risco atual"
          subtitle="Placeholder sem chamada ao backend nesta fase de fundacao.">
          <RiskBadge nivel="MODERADO" />
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  idBox: {
    backgroundColor: colors.offWhite,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  idLabel: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  idValue: {
    color: colors.deepGreen,
    fontSize: 28,
    fontWeight: '800',
  },
});
