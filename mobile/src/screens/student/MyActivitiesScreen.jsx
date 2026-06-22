import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../utils/constants';
import { getMyActivities } from '../../services/activityService';
import LoadingView from '../../components/common/LoadingView';
import EmptyView from '../../components/common/EmptyView';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/formatDate';

const STATUS_MAP = {
  DA_DIEM_DANH: { label: 'Đã điểm danh', variant: 'success' },
  CHUA_DIEM_DANH: { label: 'Chưa điểm danh', variant: 'warning' },
  HUY: { label: 'Đã hủy', variant: 'danger' },
};

export default function MyActivitiesScreen({ navigation }) {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-activities-full'],
    queryFn: () => getMyActivities({ size: 100 }),
  });

  const items = data?.content ?? data ?? [];

  if (isLoading) return <LoadingView />;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Ionicons name="chevron-back" size={22} color={COLORS.text} onPress={() => navigation.goBack()} />
        <Text style={s.headerTitle}>Hoạt động của tôi</Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => {
          const a = item.hoatDong ?? item;
          const status = STATUS_MAP[item.trangThai] ?? { label: item.trangThai ?? '—', variant: 'gray' };
          return (
            <View style={s.card}>
              <View style={s.cardTop}>
                <Text style={s.cardTitle} numberOfLines={2}>{a.tenHoatDong}</Text>
                <Badge label={status.label} variant={status.variant} />
              </View>
              <View style={s.meta}>
                {(a.thoiGianBatDau ?? a.ngayToChuc) && (
                  <View style={s.metaRow}>
                    <Ionicons name="calendar-outline" size={13} color={COLORS.textLight} />
                    <Text style={s.metaText}>{formatDate(a.thoiGianBatDau ?? a.ngayToChuc)}</Text>
                  </View>
                )}
                {a.diaDiem && (
                  <View style={s.metaRow}>
                    <Ionicons name="location-outline" size={13} color={COLORS.textLight} />
                    <Text style={s.metaText} numberOfLines={1}>{a.diaDiem}</Text>
                  </View>
                )}
                {a.diemCong != null && (
                  <View style={s.metaRow}>
                    <Ionicons name="ribbon-outline" size={13} color={COLORS.textLight} />
                    <Text style={s.metaText}>+{a.diemCong} điểm rèn luyện</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<EmptyView icon="calendar-outline" title="Chưa tham gia hoạt động nào" subtitle="Đăng ký và tham gia hoạt động để tích lũy điểm rèn luyện" />}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.bg },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  list:        { padding: 16, gap: 12, paddingBottom: 32 },
  card:        { backgroundColor: '#fff', borderRadius: 14, padding: 14, ...SHADOWS.sm },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  cardTitle:   { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.text, lineHeight: 20 },
  meta:        { gap: 5 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText:    { fontSize: 12, color: COLORS.textMuted, flex: 1 },
});
