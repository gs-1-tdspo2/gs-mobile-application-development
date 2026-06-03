import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title = 'Nao foi possivel carregar', message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <AppButton label="Tentar novamente" onPress={onRetry} variant="ghost" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.criticalRed,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  title: {
    color: colors.criticalRed,
    fontSize: 18,
    fontWeight: '800',
  },
  message: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
});
