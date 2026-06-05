import { StyleSheet, Text, View, ViewStyle } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function ChartCard({ title, subtitle, children, style }: Props) {
  return (
    <View style={[cc.card, style]}>
      <View style={cc.header}>
        <Text style={cc.title}>{title}</Text>
        {subtitle ? <Text style={cc.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={cc.body}>{children}</View>
    </View>
  );
}

const cc = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE2EA',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    borderBottomColor: '#EEF0F4',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
  },
  body: {
    padding: 16,
  },
});
