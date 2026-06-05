import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart, type barDataItem } from 'react-native-gifted-charts';

export type VBarItem = {
  label: string;
  value: number;
  color?: string;
};

type Props = {
  data: VBarItem[];
  maxBarHeight?: number;
  defaultColor?: string;
  emptyText?: string;
};

function trunc(s: string, max = 8): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export function VerticalBarChart({
  data,
  maxBarHeight = 90,
  defaultColor = '#3F51B5',
  emptyText = 'Sem dados',
}: Props) {
  const [containerW, setContainerW] = useState(0);

  const active = data.filter((d) => d.value > 0);
  if (active.length === 0) {
    return <Text style={vb.empty}>{emptyText}</Text>;
  }

  const maxVal  = Math.max(...active.map((d) => d.value));
  const barW    = containerW > 0
    ? Math.max(18, Math.min(40, Math.floor((containerW - 44) / data.length) - 10))
    : 28;
  const spacing = containerW > 0
    ? Math.max(6, Math.floor((containerW - 44 - barW * data.length) / (data.length + 1)))
    : 10;

  const barData: barDataItem[] = data.map((d) => ({
    value:       d.value,
    label:       trunc(d.label),
    frontColor:  d.value > 0 ? (d.color ?? defaultColor) : '#E5E7EB',
    topLabelComponent: d.value > 0
      ? () => <Text style={[vb.topLabel, { color: d.color ?? defaultColor }]}>{d.value}</Text>
      : undefined,
  }));

  return (
    <View onLayout={(e) => setContainerW(e.nativeEvent.layout.width)} style={vb.wrap}>
      {containerW > 0 ? (
        <BarChart
          data={barData}
          maxValue={maxVal}
          width={Math.max(0, containerW - 44)}
          height={maxBarHeight}
          barWidth={barW}
          spacing={spacing}
          initialSpacing={spacing}
          noOfSections={Math.min(maxVal, 4)}
          hideYAxisText
          yAxisThickness={0}
          xAxisColor="#E5E7EB"
          xAxisLabelTextStyle={vb.xLabel}
          barBorderRadius={3}
          rulesColor="#F3F4F6"
          rulesType="solid"
          isAnimated
          animationDuration={500}
          backgroundColor="transparent"
        />
      ) : null}
    </View>
  );
}

const vb = StyleSheet.create({
  wrap:     { width: '100%' },
  topLabel: { fontSize: 9, marginBottom: 2, textAlign: 'center' },
  xLabel:   { color: '#6B7280', fontSize: 9, textAlign: 'center' },
  empty:    { color: '#9CA3AF', fontSize: 13, paddingVertical: 16, textAlign: 'center' },
});
