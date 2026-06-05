import { StyleSheet, Text, View } from 'react-native';
import { PieChart, type pieDataItem } from 'react-native-gifted-charts';

export type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerValue?: string | number;
  centerLabel?: string;
  emptyText?: string;
};

export function DonutChart({
  data,
  size = 130,
  thickness = 28,
  centerValue,
  centerLabel,
  emptyText = 'Sem dados',
}: Props) {
  const total    = data.reduce((s, d) => s + d.value, 0);
  const radius   = Math.floor(size / 2);
  const inner    = radius - thickness;
  const dispVal  = centerValue !== undefined ? String(centerValue) : String(total);

  const mapped: pieDataItem[] = total === 0
    ? [{ value: 1, color: '#E5E7EB' }]
    : data.filter((d) => d.value > 0).map((d) => ({ value: d.value, color: d.color }));

  return (
    <View style={ds.root}>
      <PieChart
        donut
        data={mapped}
        radius={radius}
        innerRadius={inner}
        innerCircleColor="#FFFFFF"
        isAnimated
        animationDuration={600}
        centerLabelComponent={() => (
          <View style={ds.center}>
            {centerLabel ? <Text style={ds.sub}>{centerLabel}</Text> : null}
            <Text style={total === 0 ? ds.empty : ds.value}>{total === 0 ? emptyText : dispVal}</Text>
          </View>
        )}
      />
    </View>
  );
}

const ds = StyleSheet.create({
  root:  { alignItems: 'center' },
  center: { alignItems: 'center' },
  sub:   { color: '#6B7280', fontSize: 9 },
  value: { color: '#1F2937', fontSize: 18, fontWeight: '700' },
  empty: { color: '#9CA3AF', fontSize: 10, textAlign: 'center' },
});
