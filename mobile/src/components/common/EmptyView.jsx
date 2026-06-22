import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

export default function EmptyView({ icon = 'document-outline', title = 'Không có dữ liệu', subtitle }) {
  return (
    <View style={s.wrap}>
      <View style={s.iconWrap}>
        <Ionicons name={icon} size={32} color={COLORS.textLight} />
      </View>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:     { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  iconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title:    { fontSize: 15, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
  subtitle: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', marginTop: 4, lineHeight: 20 },
});
