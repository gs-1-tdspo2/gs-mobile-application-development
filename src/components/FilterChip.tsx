import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/colors';

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
      style={({ hovered, pressed }) => [
        styles.chip,
        hovered && !selected && styles.hovered,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  hovered: {
    backgroundColor: '#F1F3FF',
    borderColor: colors.primary100,
  },
  selected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary200,
  },
  pressed: {
    backgroundColor: colors.primary100,
    opacity: 0.95,
    transform: [{ translateY: 1 }],
  },
  label: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '500',
  },
  selectedLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
});
