import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

type MetricCardProps = {
  label: string;
  value: string | number;
  supportingText?: string;
  accentColor?: string;
  icon?: string;
  style?: StyleProp<ViewStyle>;
};

export function MetricCard({ label, value, supportingText, style }: MetricCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {supportingText ? <Text style={styles.support}>{supportingText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  support: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});
