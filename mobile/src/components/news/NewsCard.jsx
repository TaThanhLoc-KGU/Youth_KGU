import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';

const FALLBACK = require('../../../assets/icon.png');

export default function NewsCard({ item, onPress, horizontal = false }) {
  if (horizontal) {
    return (
      <Pressable style={({ pressed }) => [s.hCard, pressed && s.pressed]} onPress={onPress}>
        <Image
          source={item.anhDaiDien ? { uri: item.anhDaiDien } : FALLBACK}
          style={s.hThumb}
          resizeMode="cover"
        />
        <View style={s.hBody}>
          {item.chuyenMuc?.ten && (
            <Text style={s.cat} numberOfLines={1}>{item.chuyenMuc.ten.toUpperCase()}</Text>
          )}
          <Text style={s.hTitle} numberOfLines={2}>{item.tieuDe}</Text>
          <Text style={s.date}>
            <Ionicons name="time-outline" size={11} color={COLORS.textLight} /> {formatDate(item.ngayXuatBan)}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable style={({ pressed }) => [s.card, pressed && s.pressed]} onPress={onPress}>
      <Image
        source={item.anhDaiDien ? { uri: item.anhDaiDien } : FALLBACK}
        style={s.thumb}
        resizeMode="cover"
      />
      {item.chuyenMuc?.ten && (
        <View style={s.catBadge}>
          <Text style={s.catBadgeText}>{item.chuyenMuc.ten.toUpperCase()}</Text>
        </View>
      )}
      <View style={s.body}>
        <Text style={s.title} numberOfLines={2}>{item.tieuDe}</Text>
        {item.tomTat && <Text style={s.excerpt} numberOfLines={2}>{item.tomTat}</Text>}
        <Text style={s.date}>
          <Ionicons name="time-outline" size={11} color={COLORS.textLight} /> {formatDate(item.ngayXuatBan)}
          {item.luotXem != null && (
            <>{'  '}<Ionicons name="eye-outline" size={11} color={COLORS.textLight} /> {item.luotXem}</>
          )}
        </Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card:    { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, ...SHADOWS.sm },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  thumb:   { width: '100%', height: 180, backgroundColor: '#e2e8f0' },
  catBadge:     { position: 'absolute', top: 12, left: 12, backgroundColor: '#dc2626', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  catBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  body:    { padding: 14 },
  cat:     { fontSize: 10, fontWeight: '700', color: '#dc2626', letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' },
  title:   { fontSize: 15, fontWeight: '700', color: COLORS.text, lineHeight: 22, marginBottom: 6 },
  hTitle:  { fontSize: 14, fontWeight: '600', color: COLORS.text, lineHeight: 20, flex: 1 },
  excerpt: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19, marginBottom: 8 },
  date:    { fontSize: 11, color: COLORS.textLight },
  // Horizontal
  hCard:   { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 10, ...SHADOWS.sm },
  hThumb:  { width: 90, height: 72, backgroundColor: '#e2e8f0' },
  hBody:   { flex: 1, padding: 10, justifyContent: 'space-between' },
});
