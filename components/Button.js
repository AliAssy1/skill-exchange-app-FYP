import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AppColors, Spacing, BorderRadius, Shadows, Typography } from '../constants/theme';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
}) {
  const getButtonStyle = () => {
    const base = styles.base;
    const sizeStyle = size === 'large' ? styles.large : size === 'small' ? styles.small : styles.medium;
    
    let variantStyle = styles.primary;
    if (variant === 'secondary') variantStyle = styles.secondary;
    else if (variant === 'outline') variantStyle = styles.outline;
    else if (variant === 'ghost') variantStyle = styles.ghost;
    
    return [base, sizeStyle, variantStyle, disabled && styles.disabled, style];
  };

  const getTextStyle = () => {
    let textStyle = styles.primaryText;
    if (variant === 'secondary') textStyle = styles.secondaryText;
    else if (variant === 'outline') textStyle = styles.outlineText;
    else if (variant === 'ghost') textStyle = styles.ghostText;
    
    return textStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      accessible
      accessibilityLabel={accessibilityLabel || title}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? AppColors.white : AppColors.primary[600]} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
  },
  small: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    minHeight: 36,
  },
  medium: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 48,
  },
  large: {
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    minHeight: 56,
  },
  primary: {
    backgroundColor: AppColors.primary[600],
    ...Shadows.sm,
  },
  secondary: {
    backgroundColor: AppColors.accent[500],
    ...Shadows.sm,
  },
  outline: {
    backgroundColor: AppColors.transparent,
    borderWidth: 2,
    borderColor: AppColors.primary[600],
  },
  ghost: {
    backgroundColor: AppColors.transparent,
  },
  disabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: AppColors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },
  secondaryText: {
    color: AppColors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },
  outlineText: {
    color: AppColors.primary[600],
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },
  ghostText: {
    color: AppColors.primary[600],
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
});
