import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

type StatusBadgeStatus = 'Ativo' | 'Inativo' | 'Resolvido' | 'Em desenvolvimento';

type StatusBadgeProps = {
  status: StatusBadgeStatus;
};

const statusPalette: Record<StatusBadgeStatus, { background: string; text: string }> = {
  Ativo: { background: colors.lowRiskBackground, text: '#166534' },
  Inativo: { background: '#E5E7EB', text: colors.mutedText },
  Resolvido: { background: '#DEE1FF', text: '#283D9E' },
  'Em desenvolvimento': { background: colors.moderateRiskBackground, text: '#92400E' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const palette = statusPalette[status];

  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text style={[styles.label, { color: palette.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
