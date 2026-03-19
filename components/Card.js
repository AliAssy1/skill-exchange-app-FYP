import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppColors, Spacing, BorderRadius, Shadows } from '../constants/theme';

export default function Card({ children, style, onPress, variant = 'default' }) {
  const cardStyles = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    style,
  ];

  const cardComponent = (
    <View style={cardStyles}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        accessible
        activeOpacity={0.8}
        style={cardStyles}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return cardComponent;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  elevated: {
    ...Shadows.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: AppColors.neutral[200],
  },
});
