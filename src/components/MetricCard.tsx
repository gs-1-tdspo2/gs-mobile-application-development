import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

type MetricCardProps = {
  label: string;
  value: string | number;
  supportingText?: string;
  accentColor?: string;
  icon?: string;
  style?: StyleProp<ViewStyle>;
};

export function MetricCard({
  label,
  value,
  supportingText,
  accentColor = colors.primary500,
  icon,
  style,
}: MetricCardProps) {
  const badgeBg = accentColor + '1A'; // 10% opacity

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
        {icon ? (
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeIcon, { color: accentColor }]}>{icon}</Text>
          </View>
        ) : (
          <View style={[styles.dot, { backgroundColor: accentColor }]} />
        )}
      </View>
      <Text style={[styles.value, { color: colors.neutralText }]}>{value}</Text>
      {supportingText ? (
        <Text style={styles.support}>{supportingText}</Text>
      ) : null}
      <View style={[styles.bottomBar, { backgroundColor: accentColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: '#DDE1EA',
    borderRadius: 8,
    borderWidth: 1,
    boxShadow: '0px 1px 3px rgba(0,0,0,0.08), 0px 1px 2px rgba(0,0,0,0.06)',
    elevation: 1,
    minHeight: 100,
    overflow: 'hidden',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badge: {
    alignItems: 'center',
    borderRadius: 6,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  badgeIcon: {
    fontSize: 13,
    fontWeight: '700',
  },
  dot: {
    borderRadius: 99,
    height: 8,
    width: 8,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: 4,
  },
  support: {
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 16,
  },
  bottomBar: {
    borderRadius: 99,
    bottom: 8,
    height: 3,
    left: 16,
    position: 'absolute',
    width: 32,
  },
});
