import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

type AnalyticsPanelProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}>;

export function AnalyticsPanel({ title, subtitle, children, style }: AnalyticsPanelProps) {
  return (
    <View style={[styles.panel, style]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.analyticsPanel,
    borderColor: colors.analyticsBorder,
    borderRadius: 6,
    borderWidth: 1,
    boxShadow:
      '0px 3px 1px -2px rgba(0,0,0,.2), 0px 2px 2px 0px rgba(0,0,0,.14), 0px 1px 5px 0px rgba(0,0,0,.12)',
    elevation: 2,
    padding: 18,
  },
  title: {
    color: colors.offWhite,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.analyticsSurface,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  content: {
    marginTop: spacing.md,
  },
});
