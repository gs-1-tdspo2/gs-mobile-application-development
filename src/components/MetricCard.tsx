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
  const accent = accentColor ?? colors.primary;

  return (
    <AppCard
      variant={variant === 'compact' ? 'compact' : variant}
      style={[styles.card, style]}>
      <View style={[styles.leftBorder, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color: accent === colors.primary ? colors.neutralText : accent }]}>
          {value}
        </Text>
        {supportingText ? (
          <Text style={styles.supportingText}>{supportingText}</Text>
        ) : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 96,
    overflow: 'hidden',
    padding: 0,
  },
  leftBorder: {
    bottom: 0,
    borderBottomLeftRadius: 6,
    borderTopLeftRadius: 6,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 4,
  },
  body: {
    gap: spacing.xs,
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 38,
    fontWeight: '700',
    lineHeight: 44,
  },
  supportingText: {
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
});
