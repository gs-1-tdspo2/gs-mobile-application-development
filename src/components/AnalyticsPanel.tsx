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
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
  },
  title: {
    color: colors.offWhite,
    fontSize: 18,
    fontWeight: '800',
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

