import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Spacing } from '@constants/design';

interface FilterPanelProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Responsive grid for FilterSelect dropdowns.
 * 2 columns on mobile, 4 on desktop (≥768px web).
 * Falsy children (conditional rendering) are safely skipped.
 */
export function FilterPanel({ children, style }: FilterPanelProps) {
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 768;

  return (
    <View style={[p.row, style]}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return null;
        return (
          <View style={[p.cell, isWide && p.cellWide]}>
            {child}
          </View>
        );
      })}
    </View>
  );
}

const p = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  cell: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '47%' as unknown as number,
    minWidth: 0,
  },
  cellWide: {
    flexBasis: '22%' as unknown as number,
  },
});
