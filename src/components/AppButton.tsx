import { Href, Link } from 'expo-router';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type AppButtonProps = {
  label: string;
  href?: Href;
  onPress?: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({
  label,
  href,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: AppButtonProps) {
  const button = (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
    </Pressable>
  );

  if (href && !disabled) {
    return (
      <Link href={href} asChild>
        {button}
      </Link>
    );
  }

  return button;
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.borderStrong,
  },
  danger: {
    backgroundColor: colors.criticalRed,
    borderColor: colors.criticalRed,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.82,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  primaryLabel: {
    color: colors.offWhite,
  },
  secondaryLabel: {
    color: colors.primaryBase,
  },
  ghostLabel: {
    color: colors.primaryBase,
  },
  dangerLabel: {
    color: colors.offWhite,
  },
});
