import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

type AppCardProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'elevated' | 'critical' | 'analytics' | 'compact';
  style?: StyleProp<ViewStyle>;
}>;

export function AppCard({ title, subtitle, children, variant = 'default', style }: AppCardProps) {
  return (
    <View style={[styles.card, variantStyles[variant], style]}>
      {title ? <Text style={[styles.title, variant === 'analytics' && styles.analyticsTitle]}>{title}</Text> : null}
      {subtitle ? (
        <Text style={[styles.subtitle, variant === 'analytics' && styles.analyticsSubtitle]}>
          {subtitle}
        </Text>
      ) : null}
      {children ? <View style={[styles.content, variant === 'compact' && styles.compactContent]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.lg,
    shadowColor: colors.navDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  elevated: {
    borderColor: '#D8DEEA',
    shadowOpacity: 0.14,
    shadowRadius: 14,
  },
  critical: {
    backgroundColor: colors.criticalSoftBackground,
    borderColor: '#F2B8B5',
    borderLeftColor: colors.criticalRed,
    borderLeftWidth: 4,
  },
  analytics: {
    backgroundColor: colors.analyticsPanel,
    borderColor: colors.analyticsBorder,
  },
  compact: {
    padding: spacing.md,
  },
  title: {
    color: colors.neutralText,
    fontSize: 16,
    fontWeight: '800',
  },
  analyticsTitle: {
    color: colors.offWhite,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  analyticsSubtitle: {
    color: colors.analyticsSurface,
  },
  content: {
    marginTop: spacing.md,
  },
  compactContent: {
    marginTop: spacing.sm,
  },
});

const variantStyles = {
  default: undefined,
  elevated: styles.elevated,
  critical: styles.critical,
  analytics: styles.analytics,
  compact: styles.compact,
};
