import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@constants/colors';
import { Spacing, FontSize } from '@constants/design';

interface Props {
  message?: string;
  icon?: string;
}

export function EmptyState({ message = 'Nenhum item encontrado.', icon = '📭' }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    backgroundColor: Colors.background,
  },
  icon: {
    fontSize: 40,
  },
  message: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
