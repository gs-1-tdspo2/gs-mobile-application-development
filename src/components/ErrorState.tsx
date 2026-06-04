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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderLeftColor: colors.criticalRed,
    borderLeftWidth: 4,
    borderRadius: 6,
    borderWidth: 1,
    boxShadow:
      '0px 2px 1px -1px rgba(0,0,0,.2), 0px 1px 1px 0px rgba(0,0,0,.14), 0px 1px 3px 0px rgba(0,0,0,.12)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.md,
  },
  accent: {
    backgroundColor: colors.criticalSoftBackground,
    borderRadius: 4,
    height: 32,
    width: 32,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 220,
  },
  title: {
    color: colors.neutralText,
    fontSize: 14,
    fontWeight: '800',
  },
  message: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    minHeight: 36,
  },
});
