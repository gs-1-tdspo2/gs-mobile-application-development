import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppContext } from '@contexts/AppContext';
import { Colors } from '@constants/colors';
import { FontSize, Radius, Shadow, Spacing } from '@constants/design';
import type { DemoRole } from '@/types';

interface ContextCard {
  role: DemoRole;
  icon: string;
  title: string;
  description: string;
  capabilities: string[];
}

const CARDS: ContextCard[] = [
  {
    role: 'GOVERNO_DEFESA_CIVIL',
    icon: '🏛️',
    title: 'Governo / Defesa Civil',
    description: 'Acesso operacional completo.',
    capabilities: [
      'Configurar e gerenciar regiões',
      'Registrar e monitorar estações IoT',
      'Acionar avaliação de risco',
      'Triagem e resolução de alertas',
      'Painel e indicadores regionais',
    ],
  },
  {
    role: 'ONG',
    icon: '🤝',
    title: 'ONG',
    description: 'Monitoramento e visualização.',
    capabilities: [
      'Painel de indicadores regionais',
      'Consultar alertas gerados',
      'Visualizar regiões e leituras',
      'Acompanhar níveis de risco',
    ],
  },
];

export default function ContextSelector() {
  const router = useRouter();
  const { setRole } = useAppContext();

  function handleSelect(role: DemoRole) {
    setRole(role);
    router.replace('/(app)/dashboard');
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.appName}>Amanajé</Text>
        <Text style={styles.appTagline}>Monitoramento Ambiental e IoT</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.prompt}>Selecione seu contexto de acesso</Text>

        {CARDS.map((card) => (
          <Pressable
            key={card.role}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => handleSelect(card.role)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{card.icon}</Text>
              <View style={styles.cardTitles}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardDescription}>{card.description}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.capabilitiesList}>
              {card.capabilities.map((cap) => (
                <View key={cap} style={styles.capabilityRow}>
                  <Text style={styles.capabilityDot}>•</Text>
                  <Text style={styles.capabilityText}>{cap}</Text>
                </View>
              ))}
            </View>
            <View style={styles.selectRow}>
              <Text style={styles.selectLabel}>Entrar como {card.title}</Text>
              <Text style={styles.selectArrow}>→</Text>
            </View>
          </Pressable>
        ))}

        <Text style={styles.disclaimer}>
          Contexto demo — não requer autenticação. Os dados são carregados da API em tempo real.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  appName: {
    fontSize: FontSize.title,
    fontWeight: '700',
    color: Colors.card,
    letterSpacing: 0.5,
  },
  appTagline: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  prompt: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadow.md,
  },
  cardPressed: {
    borderColor: Colors.primary,
    opacity: 0.95,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardIcon: {
    fontSize: 36,
  },
  cardTitles: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  cardDescription: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  capabilitiesList: {
    gap: Spacing.xs,
  },
  capabilityRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  capabilityDot: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    marginTop: 1,
  },
  capabilityText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
  },
  selectLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  selectArrow: {
    fontSize: FontSize.lg,
    color: Colors.primary,
  },
  disclaimer: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
});
