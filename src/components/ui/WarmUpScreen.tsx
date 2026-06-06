import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Colors } from '@constants/colors';
import { Spacing, FontSize, Radius } from '@constants/design';
import type { WarmUpStatus } from '@hooks/useWarmUp';

interface Props {
  status: WarmUpStatus;
  onRetry: () => void;
}

export function WarmUpScreen({ status, onRetry }: Props) {
  const isError = status === 'timeout' || status === 'error';

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Text style={styles.title}>Amanajé</Text>
        <Text style={styles.subtitle}>Monitoramento Ambiental e IoT</Text>
      </View>

      <View style={styles.status}>
        {!isError ? (
          <>
            <ActivityIndicator size="large" color={Colors.card} />
            <Text style={styles.statusText}>Aguardando servidor…</Text>
          </>
        ) : (
          <>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>
              {status === 'timeout'
                ? 'O servidor está inicializando.\nTente novamente em instantes.'
                : 'Não foi possível conectar ao servidor.'}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
              onPress={onRetry}
            >
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xxl,
  },
  brand: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: '700',
    color: Colors.card,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  status: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusText: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.85)',
  },
  errorIcon: {
    fontSize: 36,
  },
  errorText: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: '600',
  },
});
