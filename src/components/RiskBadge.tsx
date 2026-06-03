import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { RiscoNivel } from '@/types/risco';

type RiskBadgeProps = {
  nivel: RiscoNivel;
};

const riskColorByLevel: Record<RiscoNivel, { background: string; text: string }> = {
  BAIXO: { background: '#DDEFE6', text: colors.deepGreen },
  MODERADO: { background: '#D8F2F0', text: '#0D6F6D' },
  ALTO: { background: '#FFF0D6', text: '#9A5A00' },
  CRITICO: { background: '#FFE0DE', text: colors.criticalRed },
};

export function RiskBadge({ nivel }: RiskBadgeProps) {
  const palette = riskColorByLevel[nivel];

  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text style={[styles.label, { color: palette.text }]}>{nivel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
  },
});
