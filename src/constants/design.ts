import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  title: 30,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

// Platform-aware shadows.
// Web: CSS boxShadow (avoids React Native Web deprecation warnings for native shadow props).
// Native (iOS / Android): standard RN shadow props + elevation.
function pShadow(boxShadow: string, native: ViewStyle): ViewStyle {
  return (Platform.OS === 'web' ? { boxShadow } : native) as unknown as ViewStyle;
}

export const Shadow = {
  sm: pShadow('0 1px 3px rgba(0,0,0,0.10)', {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  }),
  md: pShadow('0 2px 6px rgba(0,0,0,0.14)', {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  }),
};
