import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/constants';

const VARIANTS = {
  primary: { bg: '#e0f0f5', text: COLORS.primary },
  success: { bg: '#d1fae5', text: '#065f46' },
  warning: { bg: '#fef3c7', text: '#92400e' },
  danger:  { bg: '#fee2e2', text: '#991b1b' },
  info:    { bg: '#dbeafe', text: '#1e40af' },
  gray:    { bg: '#f1f5f9', text: COLORS.textMuted },
};

export default function Badge({ label, variant = 'gray', style }) {
  const v = VARIANTS[variant] ?? VARIANTS.gray;
  return (
    <View style={[s.badge, { backgroundColor: v.bg }, style]}>
      <Text style={[s.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  text:  { fontSize: 11, fontWeight: '700' },
});
