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
      style={({ hovered, pressed }) => [
        styles.base,
        styles[variant],
        hovered && !disabled && hoverStyles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <Text style={[styles.label, labelStyles[variant], disabled && styles.disabledLabel]}>
        {label}
      </Text>
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
    shadowColor: colors.navDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  primaryHover: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  secondary: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.borderStrong,
  },
  secondaryHover: {
    backgroundColor: '#E0E7FF',
    borderColor: colors.primaryAccent,
  },
  danger: {
    backgroundColor: colors.criticalRed,
    borderColor: colors.criticalRed,
  },
  dangerHover: {
    backgroundColor: '#B42318',
    borderColor: '#B42318',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  ghostHover: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryAccent,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledLabel: {
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }],
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

const hoverStyles = {
  primary: styles.primaryHover,
  secondary: styles.secondaryHover,
  ghost: styles.ghostHover,
  danger: styles.dangerHover,
};

const labelStyles = {
  primary: styles.primaryLabel,
  secondary: styles.secondaryLabel,
  ghost: styles.ghostLabel,
  danger: styles.dangerLabel,
};
