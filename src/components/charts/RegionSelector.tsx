import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import type { RegiaoMonitorada } from '@/types';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius } from '@constants/design';

interface Props {
  regioes: RegiaoMonitorada[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export function RegionSelector({ regioes, selectedId, onSelect }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const active = regioes.filter(r => r.stAtivo !== 'N');

  function chipLabel(r: RegiaoMonitorada): string {
    return `${r.nome} · ${r.estado}`;
  }

  const chips = (
    <>
      <Pressable
        style={[styles.chip, selectedId === null && styles.chipActive]}
        onPress={() => onSelect(null)}
        accessibilityRole="button"
        accessibilityState={{ selected: selectedId === null }}
      >
        <Text style={[styles.chipText, selectedId === null && styles.chipTextActive]}>
          Visão geral
        </Text>
      </Pressable>

      {active.map(r => {
        const sel = selectedId === r.idRegiao;
        return (
          <Pressable
            key={r.idRegiao}
            style={[styles.chip, sel && styles.chipActive]}
            onPress={() => onSelect(r.idRegiao)}
            accessibilityRole="button"
            accessibilityState={{ selected: sel }}
          >
            <Text style={[styles.chipText, sel && styles.chipTextActive]} numberOfLines={1}>
              {chipLabel(r)}
            </Text>
          </Pressable>
        );
      })}
    </>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Região</Text>
      {isWide ? (
        <View style={styles.wideRow}>{chips}</View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {chips}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  scrollContent: {
    paddingRight: Spacing.md,
    columnGap: Spacing.sm,
    flexDirection: 'row',
  },
  wideRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
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
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.card,
    fontWeight: '600',
  },
});
