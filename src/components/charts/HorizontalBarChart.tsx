import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { BarEntry } from '@utils/chartTransforms';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius } from '@constants/design';

interface Props {
  data: BarEntry[];
  showValues?: boolean;
  onBarPress?: (key: string) => void;
  activeKey?: string;
}

export function HorizontalBarChart({ data, showValues = true, onBarPress, activeKey }: Props) {
  const activeData = data.filter(d => d.value > 0);
  if (activeData.length === 0) return null;

  const maxVal = Math.max(...activeData.map(d => d.maxValue ?? d.value), 1);

  return (
    <View style={styles.wrapper}>
      {activeData.map(entry => {
        const pct = maxVal > 0 ? (entry.value / maxVal) * 100 : 0;
        const isDimmed = activeKey !== undefined && entry.key !== activeKey;
        return (
          <TouchableOpacity
            key={entry.key}
            style={[styles.row, isDimmed && styles.rowDimmed]}
            onPress={onBarPress ? () => onBarPress(entry.key) : undefined}
            activeOpacity={onBarPress ? 0.75 : 1}
          >
            <Text style={styles.label} numberOfLines={2}>{entry.label}</Text>
            <View style={styles.trackArea}>
              <View style={styles.track}>
                <View
                  style={[
                    styles.bar,
                    { width: `${Math.max(pct, 3)}%` as unknown as number, backgroundColor: entry.color },
                  ]}
                />
              </View>
              {entry.sublabel ? (
                <Text style={styles.sublabel}>{entry.sublabel}</Text>
              ) : null}
            </View>
            {showValues ? (
              <Text style={[styles.value, { color: entry.color }]}>{entry.value}</Text>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    rowGap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: Spacing.sm,
    minHeight: 36,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    width: 118,
    lineHeight: 17,
  },
  trackArea: {
    flex: 1,
    rowGap: 2,
  },
  track: {
    height: 28,
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: Radius.sm,
  },
  sublabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  value: {
    fontSize: FontSize.md,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'right',
  },
  rowDimmed: {
    opacity: 0.4,
  },
});
