import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { RiscoNivel } from '@/types/risco';

type RiskBadgeProps = {
  nivel: RiscoNivel;
};

const riskColorByLevel: Record<RiscoNivel, { background: string; text: string; border: string }> = {
  BAIXO: { background: colors.lowRiskBackground, text: '#166534', border: '#16A34A' },
  MODERADO: { background: colors.moderateRiskBackground, text: '#92400E', border: colors.warningOrange },
  ALTO: { background: colors.highRiskBackground, text: '#9A3412', border: colors.highRisk },
  CRITICO: { background: colors.criticalBackground, text: '#93000A', border: colors.criticalRed },
};

export function RiskBadge({ nivel }: RiskBadgeProps) {
  const palette = riskColorByLevel[nivel];

  return (
    <View style={[styles.badge, { backgroundColor: palette.background, borderColor: palette.border }]}>
      <Text style={[styles.label, { color: palette.text }]}>{nivel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
  },
});
