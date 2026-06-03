import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

type FilterChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

export function FilterChip({ label, selected = false, onPress }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}>
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.82,
  },
  label: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '700',
  },
  selectedLabel: {
    color: colors.primaryBase,
  },
});
