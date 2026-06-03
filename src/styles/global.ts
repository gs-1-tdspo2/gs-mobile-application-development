import { StyleSheet } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

export const screenStyles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    gap: spacing.lg,
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  desktopScrollContent: {
    alignSelf: 'center',
    maxWidth: 1280,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    width: '100%',
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    color: colors.neutralText,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 15,
    lineHeight: 22,
  },
});
