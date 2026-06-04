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
      <View style={styles.accent} />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {onRetry ? (
        <AppButton
          label="Tentar novamente"
          onPress={onRetry}
          variant="secondary"
          style={styles.retryButton}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.criticalSoftBackground,
    borderColor: '#F2B8B5',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.md,
  },
  accent: {
    backgroundColor: colors.criticalRed,
    borderRadius: 999,
    height: 36,
    width: 4,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 220,
  },
  title: {
    color: colors.criticalRed,
    fontSize: 14,
    fontWeight: '800',
  },
  message: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    minHeight: 38,
  },
});
