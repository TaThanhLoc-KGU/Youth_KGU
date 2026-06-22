import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../utils/constants';
import { getProfile, getTrainingPoints } from '../../services/studentService';
import { getMyActivities } from '../../services/activityService';
import LoadingView from '../../components/common/LoadingView';
import { formatDate } from '../../utils/formatDate';

function StatCard({ icon, label, value, color = COLORS.primary, onPress }) {
  return (
    <Pressable style={[s.statCard, onPress && { cursor: 'pointer' }]} onPress={onPress}>
      <View style={[s.statIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </Pressable>
  );
}

export default function DashboardScreen({ navigation }) {
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['student-profile'],
    queryFn: getProfile,
  });

  const { data: points } = useQuery({
    queryKey: ['training-points'],
    queryFn: getTrainingPoints,
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['my-activities'],
    queryFn: () => getMyActivities({ size: 3 }),
  });

  const latestPoints = points?.[0];
  const recentActivities = activitiesData?.content ?? activitiesData?.slice?.(0, 3) ?? [];

  if (loadingProfile) return <LoadingView />;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Welcome */}
        <View style={s.welcome}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(profile?.hoTen ?? 'S')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.welcomeText}>Xin chào,</Text>
            <Text style={s.welcomeName} numberOfLines={1}>{profile?.hoTen ?? '—'}</Text>
            <Text style={s.welcomeMssv}>{profile?.mssv ?? ''}</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <StatCard
            icon="ribbon"
            label="Điểm RL kỳ này"
            value={latestPoints?.tongDiem ?? '—'}
            color={COLORS.primary}
            onPress={() => navigation.navigate('TrainingPoints')}
          />
          <StatCard
            icon="calendar-check"
            label="Hoạt động tham gia"
            value={activitiesData?.totalElements ?? recentActivities.length ?? 0}
            color="#10b981"
            onPress={() => navigation.navigate('Activities')}
          />
        </View>

        {/* Recent activities */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Hoạt động gần đây</Text>
            <Pressable onPress={() => navigation.navigate('MyActivities')}>
              <Text style={s.sectionLink}>Xem tất cả</Text>
            </Pressable>
          </View>
          {recentActivities.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>Chưa tham gia hoạt động nào</Text>
            </View>
          ) : (
            recentActivities.map(a => (
              <View key={a.id} style={s.actItem}>
                <View style={s.actDot} />
                <View style={{ flex: 1 }}>
                  <Text style={s.actName} numberOfLines={1}>{a.hoatDong?.tenHoatDong ?? a.tenHoatDong}</Text>
                  <Text style={s.actDate}>{formatDate(a.thoiGianBatDau ?? a.ngayToChuc)}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Quick actions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Tác vụ nhanh</Text>
          <View style={s.quickGrid}>
            {[
              { icon: 'qr-code', label: 'Quét QR\nĐiểm danh', screen: 'QRScan', color: COLORS.primary },
              { icon: 'calendar', label: 'Đăng ký\nHoạt động', screen: 'Activities', color: '#10b981' },
              { icon: 'ribbon', label: 'Điểm\nRèn luyện', screen: 'TrainingPoints', color: '#f59e0b' },
              { icon: 'person', label: 'Hồ sơ\ncá nhân', screen: 'Profile', color: '#8b5cf6' },
            ].map(q => (
              <Pressable
                key={q.screen}
                style={({ pressed }) => [s.quickCard, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                onPress={() => navigation.navigate(q.screen)}
              >
                <View style={[s.quickIcon, { backgroundColor: q.color + '18' }]}>
                  <Ionicons name={q.icon} size={24} color={q.color} />
                </View>
                <Text style={s.quickLabel}>{q.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: COLORS.bg },
  scroll:        { padding: 16, paddingBottom: 32 },
  welcome:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, ...SHADOWS.sm },
  avatar:        { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary + '20', alignItems: 'center', justifyContent: 'center' },
  avatarText:    { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  welcomeText:   { fontSize: 12, color: COLORS.textLight },
  welcomeName:   { fontSize: 17, fontWeight: '700', color: COLORS.text },
  welcomeMssv:   { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statsRow:      { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard:      { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', gap: 6, ...SHADOWS.sm },
  statIcon:      { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue:     { fontSize: 22, fontWeight: '800', color: COLORS.text },
  statLabel:     { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', fontWeight: '600' },
  section:       { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, ...SHADOWS.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: COLORS.text },
  sectionLink:   { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  emptyBox:      { alignItems: 'center', paddingVertical: 20 },
  emptyText:     { fontSize: 13, color: COLORS.textLight },
  actItem:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  actDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 5 },
  actName:       { fontSize: 14, fontWeight: '600', color: COLORS.text },
  actDate:       { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  quickGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  quickCard:     { width: '47%', backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, alignItems: 'center', gap: 8 },
  quickIcon:     { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quickLabel:    { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center', lineHeight: 17 },
});
