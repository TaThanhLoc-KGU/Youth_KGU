import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../utils/constants';
import { getProfile } from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import LoadingView from '../components/common/LoadingView';

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={s.infoRow}>
      <View style={s.infoIcon}>
        <Ionicons name={icon} size={16} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoVal}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { state: authState, logout } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: getProfile,
    enabled: !!authState.userToken,
  });

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  if (!authState.userToken) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Hồ sơ</Text>
        </View>
        <View style={s.guestWrap}>
          <View style={s.guestIcon}>
            <Ionicons name="person-circle-outline" size={64} color={COLORS.textLight} />
          </View>
          <Text style={s.guestTitle}>Chưa đăng nhập</Text>
          <Text style={s.guestSub}>Đăng nhập để xem thông tin cá nhân và điểm rèn luyện</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) return <LoadingView />;

  const user = profile ?? authState.user;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Hồ sơ</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar card */}
        <View style={s.avatarCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(user?.hoTen ?? user?.username ?? 'S')[0].toUpperCase()}</Text>
          </View>
          <Text style={s.name}>{user?.hoTen ?? '—'}</Text>
          <Text style={s.mssv}>{user?.mssv ?? user?.username ?? ''}</Text>
          {user?.vaiTro && (
            <View style={s.roleBadge}>
              <Text style={s.roleText}>{user.vaiTro}</Text>
            </View>
          )}
        </View>

        {/* Info card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Thông tin cá nhân</Text>
          <InfoRow icon="school-outline" label="Mã số sinh viên" value={user?.mssv} />
          <InfoRow icon="mail-outline" label="Email" value={user?.email} />
          <InfoRow icon="call-outline" label="Số điện thoại" value={user?.soDienThoai} />
          <InfoRow icon="business-outline" label="Lớp" value={user?.lop?.tenLop ?? user?.tenLop} />
          <InfoRow icon="library-outline" label="Ngành" value={user?.nganh?.tenNganh ?? user?.tenNganh} />
          <InfoRow icon="albums-outline" label="Khoa" value={user?.khoa?.tenKhoa ?? user?.tenKhoa} />
          <InfoRow icon="calendar-outline" label="Khoá học" value={user?.khoaHoc} />
        </View>

        {/* Actions */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Tài khoản</Text>
          <Pressable style={s.actionRow} onPress={handleLogout}>
            <View style={[s.actionIcon, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
            </View>
            <Text style={[s.actionText, { color: COLORS.danger }]}>Đăng xuất</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.danger} style={{ opacity: 0.6 }} />
          </Pressable>
        </View>

        <Text style={s.version}>Youth KGU · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.bg },
  header:      { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  scroll:      { padding: 16, paddingBottom: 40 },
  guestWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  guestIcon:   { marginBottom: 8 },
  guestTitle:  { fontSize: 18, fontWeight: '700', color: COLORS.text },
  guestSub:    { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  avatarCard:  { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 14, ...SHADOWS.sm },
  avatar:      { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:  { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  name:        { fontSize: 20, fontWeight: '800', color: COLORS.text },
  mssv:        { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  roleBadge:   { marginTop: 8, backgroundColor: COLORS.primary + '15', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  roleText:    { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  card:        { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, ...SHADOWS.sm },
  cardTitle:   { fontSize: 13, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  infoIcon:    { width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.primary + '12', alignItems: 'center', justifyContent: 'center' },
  infoLabel:   { fontSize: 11, color: COLORS.textLight, fontWeight: '600', marginBottom: 2 },
  infoVal:     { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  actionRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  actionIcon:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionText:  { flex: 1, fontSize: 15, fontWeight: '600' },
  version:     { textAlign: 'center', fontSize: 12, color: COLORS.textLight, marginTop: 8 },
});
