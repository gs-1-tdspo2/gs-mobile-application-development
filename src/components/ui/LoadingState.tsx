import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors } from '@constants/colors';
import { Spacing, FontSize } from '@constants/design';

interface Props {
  message?: string;
}

export function LoadingState({ message = 'Carregando...' }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
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
    paddingVertical: Spacing.xxl,
    backgroundColor: Colors.background,
  },
  message: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
