import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PALETTE = [
  { bg: '#EEF2FF', text: '#4338CA' },
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#EDE9FE', text: '#5B21B6' },
  { bg: '#DBEAFE', text: '#1E40AF' },
  { bg: '#FEE2E2', text: '#991B1B' },
  { bg: '#ECFDF5', text: '#065F46' },
  { bg: '#FFF7ED', text: '#9A3412' },
  { bg: '#F0F9FF', text: '#075985' },
];

function colorForName(name) {
  if (!name) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function PlaceholderAvatar({ size = 64, initials, name }) {
  const displayInitials = initials || (name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U');
  const { bg, text } = colorForName(name || initials || '');

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38, color: text }]}>
        {displayInitials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '700' },
});
