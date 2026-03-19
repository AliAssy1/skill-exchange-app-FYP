import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const COLORS = {
  border: '#D1D5DB',
  secondary: '#6B7280',
};

export default function PlaceholderAvatar({ size = 64, initials = 'U' }) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            fontSize: size * 0.4,
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
});
