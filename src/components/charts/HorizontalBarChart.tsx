import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

export type HBarItem = {
  label: string;
  value: number;
  max?: number;
  color?: string;
  subLabel?: string;
};

type Props = {
  data: HBarItem[];
  defaultColor?: string;
  showValues?: boolean;
  valueUnit?: string;
  emptyText?: string;
  labelWidth?: number;
};

export function HorizontalBarChart({
  data,
  defaultColor = '#3F51B5',
  showValues = true,
  valueUnit,
  emptyText = 'Sem dados',
  labelWidth = 100,
}: Props) {
  const { width: screenW } = useWindowDimensions();
  const maxLabelW = Math.floor(screenW * 0.32);
  const effectiveLabelW = Math.min(labelWidth, maxLabelW);

  if (data.length === 0) {
    return <Text style={hb.empty}>{emptyText}</Text>;
  }
  const domainMax = Math.max(...data.map((d) => d.max ?? d.value), 1);

  return (
    <View style={hb.root}>
      {data.map((item, i) => {
        const pct = Math.min((item.value / domainMax) * 100, 100);
        const col = item.color ?? defaultColor;
        return (
          <View key={i} style={hb.row}>
            <View style={[hb.labelCol, { width: effectiveLabelW }]}>
              <Text style={hb.label} numberOfLines={1}>{item.label}</Text>
              {item.subLabel ? (
                <Text style={hb.subLabel} numberOfLines={1}>{item.subLabel}</Text>
              ) : null}
            </View>
            <View style={hb.track}>
              <View style={[hb.fill, { width: `${pct}%` as `${number}%`, backgroundColor: col }]} />
            </View>
            {showValues ? (
              <Text style={[hb.value, { color: col }]}>
                {item.value}{valueUnit ?? ''}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const hb = StyleSheet.create({
  root:     { gap: 10 },
  row:      { alignItems: 'center', flexDirection: 'row', gap: 8 },
  labelCol: { gap: 1 },
  label:    { color: '#374151', fontSize: 12, fontWeight: '500' },
  subLabel: { color: '#9CA3AF', fontSize: 10 },
  track: {
    backgroundColor: '#F3F4F6',
    borderRadius: 99,
    flex: 1,
    height: 8,
    overflow: 'hidden',
  },
  fill:  { borderRadius: 99, height: 8 },
  value: { fontSize: 12, fontWeight: '700', minWidth: 32, textAlign: 'right' },
  empty: { color: '#9CA3AF', fontSize: 13, paddingVertical: 16, textAlign: 'center' },
});
