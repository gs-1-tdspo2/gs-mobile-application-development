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
    borderRadius: 6,
    borderWidth: 1,
    boxShadow:
      '0px 2px 1px -1px rgba(0,0,0,.2), 0px 1px 1px 0px rgba(0,0,0,.14), 0px 1px 3px 0px rgba(0,0,0,.12)',
    elevation: 1,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
  },
  elevated: {
    borderColor: colors.border,
    boxShadow:
      '0px 3px 1px -2px rgba(0,0,0,.2), 0px 2px 2px 0px rgba(0,0,0,.14), 0px 1px 5px 0px rgba(0,0,0,.12)',
    elevation: 2,
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  critical: {
    backgroundColor: colors.surface,
    borderColor: '#F2B8B5',
    borderLeftColor: colors.criticalRed,
    borderLeftWidth: 4,
  },
  analytics: {
    backgroundColor: colors.analyticsPanel,
    borderColor: colors.analyticsBorder,
  },
  compact: {
    padding: 16,
  },
  title: {
    color: colors.neutralText,
    fontSize: 16,
    fontWeight: '700',
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
