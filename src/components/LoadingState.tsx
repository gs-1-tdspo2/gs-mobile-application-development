import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = 'Carregando dados...' }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.teal} size="large" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  message: {
    color: colors.mutedText,
    fontSize: 14,
  },
});
