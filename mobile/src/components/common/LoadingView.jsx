import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/constants';

export default function LoadingView({ text = 'Đang tải...' }) {
  return (
    <View style={s.wrap}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      {text ? <Text style={s.text}>{text}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: COLORS.bg },
  text: { fontSize: 14, color: COLORS.textMuted },
});
