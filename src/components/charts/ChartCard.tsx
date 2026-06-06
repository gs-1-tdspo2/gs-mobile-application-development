import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Card } from '@components/ui';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius } from '@constants/design';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  metric?: string;
  accentColor?: string;
  filterSlot?: ReactNode;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  children?: ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  metric,
  accentColor,
  filterSlot,
  loading,
  error,
  empty,
  emptyMessage = 'Sem dados disponíveis.',
  children,
}: Props) {
  return (
    <Card style={[styles.card, accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 3 } : null]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {metric ? (
          <View style={styles.metricBadge}>
            <Text style={styles.metricText}>{metric}</Text>
          </View>
        ) : null}
      </View>

      {/* Inline filter toolbar */}
      {filterSlot ? <View style={styles.filterSlot}>{filterSlot}</View> : null}

      {/* Content states */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="small" />
          <Text style={styles.stateText}>Carregando...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : empty ? (
        <View style={styles.center}>
          <Text style={styles.stateText}>{emptyMessage}</Text>
        </View>
      ) : (
        children
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    columnGap: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
    rowGap: 3,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  metricBadge: {
    backgroundColor: Colors.background,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  filterSlot: {
    marginBottom: Spacing.sm,
  },
  center: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    rowGap: Spacing.xs,
  },
  stateText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FontSize.sm,
    color: '#D32F2F',
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
});
