import { Platform, useWindowDimensions } from 'react-native';

export const desktopBreakpoint = 1024;
export const wideDesktopBreakpoint = 1440;

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= desktopBreakpoint;
  const isWideDesktop = isWeb && width >= wideDesktopBreakpoint;

  return {
    width,
    isWeb,
    isDesktop,
    isWideDesktop,
  };
}

