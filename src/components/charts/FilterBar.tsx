import {
  ScrollView,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius } from '@constants/design';

export interface FilterOption<T extends string = string> {
  key: T | null;
  label: string;
}

interface Props<T extends string = string> {
  label?: string;
  options: FilterOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
}

export function FilterBar<T extends string>({ label, options, value, onChange }: Props<T>) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const chips = options.map(opt => {
    const active = opt.key === value;
    return (
      <TouchableOpacity
        key={String(opt.key)}
        style={[styles.chip, active && styles.chipActive]}
        onPress={() => onChange(opt.key)}
        activeOpacity={0.7}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {opt.label}
        </Text>
      </TouchableOpacity>
    );
  });

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {isWide ? (
        <View style={styles.chipWrap}>{chips}</View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {chips}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    rowGap: Spacing.xs,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    columnGap: Spacing.xs,
    paddingRight: Spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: Colors.card,
    fontWeight: '600',
  },
});
