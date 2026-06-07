import { View, Text, StyleSheet, Platform } from 'react-native';
import { PolarChart, Pie } from 'victory-native';
import { SvgDonut } from './SvgDonut';
import type { PieSlice } from '@utils/chartTransforms';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius } from '@constants/design';

interface Props {
  data: PieSlice[];
}

export function RiskLevelDonut({ data }: Props) {
  const nonEmpty = data.filter(d => d.value > 0);
  const total = nonEmpty.reduce((s, d) => s + d.value, 0);

  return (
    <View style={styles.container}>
      {/* Donut ring */}
      {Platform.OS !== 'web' ? (
        <View style={styles.canvas}>
          <PolarChart
            data={nonEmpty}
            labelKey="label"
            valueKey="value"
            colorKey="color"
          >
            <Pie.Chart innerRadius="42%" />
          </PolarChart>
          <View pointerEvents="none" style={styles.centerLabel}>
            <Text style={styles.centerNumber}>{total}</Text>
            <Text style={styles.centerCaption}>regiões</Text>
          </View>
        </View>
      ) : (
        <SvgDonut
          data={nonEmpty}
          total={total}
          centerCaption="regiões"
          size={200}
        />
      )}

      {/* Legend */}
      <View style={styles.legend}>
        {nonEmpty.map(slice => (
          <View key={slice.key} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: slice.color }]} />
            <Text style={styles.legendLabel}>{slice.label}</Text>
            <Text style={[styles.legendCount, { color: slice.color }]}>
              {slice.value}
            </Text>
            <Text style={styles.legendPct}>
              {total > 0 ? `${Math.round((slice.value / total) * 100)}%` : '—'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const CHART_SIZE = 200;

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.sm,
  },
  canvas: {
    height: CHART_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    width: CHART_SIZE,
  },
  centerLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerNumber: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  centerCaption: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  legend: {
    marginTop: Spacing.md,
    rowGap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: Spacing.xs,
    paddingVertical: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
  },
  legendLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  legendCount: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'right',
  },
  legendPct: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    minWidth: 38,
    textAlign: 'right',
  },
});
