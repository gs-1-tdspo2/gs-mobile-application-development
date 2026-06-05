import { StyleSheet, Text, View } from 'react-native';

export type LegendItem = {
  label: string;
  value?: number;
  color: string;
};

type Props = {
  items: LegendItem[];
  compact?: boolean;
};

export function ChartLegend({ items, compact = false }: Props) {
  return (
    <View style={[cl.root, compact && cl.compact]}>
      {items.map((item, i) => (
        <View key={i} style={cl.row}>
          <View style={[cl.dot, { backgroundColor: item.color }]} />
          <Text style={cl.label} numberOfLines={1}>{item.label}</Text>
          {item.value !== undefined ? (
            <Text style={[cl.value, { color: item.color }]}>{item.value}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const cl = StyleSheet.create({
  root:    { gap: 7 },
  compact: { gap: 4 },
  row:     { alignItems: 'center', flexDirection: 'row', gap: 7 },
  dot:     { borderRadius: 99, flexShrink: 0, height: 9, width: 9 },
  label:   { color: '#6B7280', flex: 1, fontSize: 12 },
  value:   { fontSize: 13, fontWeight: '700', marginLeft: 4 },
});
