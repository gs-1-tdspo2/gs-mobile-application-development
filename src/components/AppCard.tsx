import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';

type AppCardProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'elevated' | 'critical' | 'analytics' | 'compact';
  style?: StyleProp<ViewStyle>;
}>;

export function AppCard({ title, subtitle, children, variant = 'default', style }: AppCardProps) {
  const isAnalytics = variant === 'analytics';
  const hasHeader = Boolean(title);

  return (
    <View style={[styles.card, variantStyles[variant], style]}>
      {hasHeader ? (
        <View style={[styles.header, isAnalytics && styles.analyticsHeader]}>
          <Text style={[styles.title, isAnalytics && styles.analyticsTitle]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, isAnalytics && styles.analyticsSubtitle]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
      {children ? (
        <View style={[styles.content, hasHeader && styles.contentWithHeader]}>
          {children}
        </View>
      ) : null}
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
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
  },
  header: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: 2,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  analyticsHeader: {
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  title: {
    color: colors.neutralText,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  analyticsTitle: {
    color: colors.offWhite,
    fontSize: 15,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  analyticsSubtitle: {
    color: colors.analyticsSurface,
  },
  content: {
    padding: 18,
  },
  contentWithHeader: {
    paddingTop: 14,
  },
  elevated: {
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
    // same as default, content handled inline
  },
});

const variantStyles = {
  default: undefined,
  elevated: styles.elevated,
  critical: styles.critical,
  analytics: styles.analytics,
  compact: styles.compact,
};
