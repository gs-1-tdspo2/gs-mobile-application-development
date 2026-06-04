import { Href, Link } from 'expo-router';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';

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
        pressed && !disabled && pressedStyles[variant],
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
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    boxShadow:
      '0px 2px 1px -1px rgba(0,0,0,.2), 0px 1px 1px 0px rgba(0,0,0,.14), 0px 1px 3px 0px rgba(0,0,0,.12)',
    elevation: 1,
  },
  primaryHover: {
    backgroundColor: colors.primary600,
    borderColor: colors.primary600,
  },
  secondary: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary100,
  },
  secondaryHover: {
    backgroundColor: colors.primary100,
    borderColor: colors.primary200,
  },
  danger: {
    backgroundColor: colors.criticalRed,
    borderColor: colors.criticalRed,
  },
  dangerHover: {
    backgroundColor: '#B71C1C',
    borderColor: '#B71C1C',
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
    opacity: 0.92,
    transform: [{ translateY: 1 }],
  },
  primaryPressed: {
    backgroundColor: colors.primary700,
    borderColor: colors.primary700,
  },
  secondaryPressed: {
    backgroundColor: colors.primary100,
    borderColor: colors.primary300,
  },
  ghostPressed: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary200,
  },
  dangerPressed: {
    backgroundColor: '#B71C1C',
    borderColor: '#B71C1C',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
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

const pressedStyles = {
  primary: styles.primaryPressed,
  secondary: styles.secondaryPressed,
  ghost: styles.ghostPressed,
  danger: styles.dangerPressed,
};

const labelStyles = {
  primary: styles.primaryLabel,
  secondary: styles.secondaryLabel,
  ghost: styles.ghostLabel,
  danger: styles.dangerLabel,
};
