import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { AppCard } from '@/components/AppCard';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

type MetricCardProps = {
  label: string;
  value: string | number;
  supportingText?: string;
  accentColor?: string;
  variant?: 'default' | 'elevated' | 'compact';
  style?: StyleProp<ViewStyle>;
};

export function MetricCard({
  label,
  value,
  supportingText,
  accentColor,
  variant = 'elevated',
  style,
}: MetricCardProps) {
  return (
    <AppCard variant={variant === 'compact' ? 'compact' : variant} style={[styles.card, style]}>
      <View style={[styles.accentLine, { backgroundColor: accentColor ?? colors.primary }]} />
      <View style={styles.header}>
        {accentColor ? <View style={[styles.indicator, { backgroundColor: accentColor }]} /> : null}
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {supportingText ? <Text style={styles.supportingText}>{supportingText}</Text> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 104,
    overflow: 'hidden',
    paddingTop: 18,
  },
  accentLine: {
    borderRadius: 999,
    height: 3,
    left: 18,
    position: 'absolute',
    right: 18,
    top: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  indicator: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  value: {
    color: colors.neutralText,
    fontSize: 30,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  supportingText: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
});
