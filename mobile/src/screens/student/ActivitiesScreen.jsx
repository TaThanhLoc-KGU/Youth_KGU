import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../utils/constants';
import { getPublic, register, unregister } from '../../services/activityService';
import { useAuth } from '../../context/AuthContext';
import LoadingView from '../../components/common/LoadingView';
import EmptyView from '../../components/common/EmptyView';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/formatDate';

function ActivityCard({ item, onRegister, onUnregister, registering }) {
  const isRegistered = item.daDangKy;
  const isFull = item.soLuongDaDangKy >= item.soLuongToiDa && item.soLuongToiDa > 0;

  const getStatusVariant = () => {
    if (isRegistered) return 'success';
    if (isFull) return 'danger';
    return 'primary';
  };

  const getStatusLabel = () => {
    if (isRegistered) return 'Đã đăng ký';
    if (isFull) return 'Đã đầy';
    return 'Mở đăng ký';
  };

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle} numberOfLines={2}>{item.tenHoatDong}</Text>
        <Badge label={getStatusLabel()} variant={getStatusVariant()} />
      </View>

      <View style={s.meta}>
        <View style={s.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textLight} />
          <Text style={s.metaText}>{formatDate(item.thoiGianBatDau)}</Text>
        </View>
        {item.diaDiem && (
          <View style={s.metaRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.textLight} />
            <Text style={s.metaText} numberOfLines={1}>{item.diaDiem}</Text>
          </View>
        )}
        {item.diemCong != null && (
          <View style={s.metaRow}>
            <Ionicons name="ribbon-outline" size={14} color={COLORS.textLight} />
            <Text style={s.metaText}>+{item.diemCong} điểm</Text>
          </View>
        )}
        {item.soLuongToiDa > 0 && (
          <View style={s.metaRow}>
            <Ionicons name="people-outline" size={14} color={COLORS.textLight} />
            <Text style={s.metaText}>{item.soLuongDaDangKy}/{item.soLuongToiDa} chỗ</Text>
          </View>
        )}
      </View>

      {item.moTa ? <Text style={s.desc} numberOfLines={2}>{item.moTa}</Text> : null}

      <View style={s.cardFooter}>
        {isRegistered ? (
          <Pressable
            style={[s.btn, s.btnOutline]}
            onPress={() => onUnregister(item.id)}
            disabled={registering}
          >
            <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
            <Text style={[s.btnText, { color: COLORS.danger }]}>Hủy đăng ký</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[s.btn, s.btnPrimary, (isFull || registering) && s.btnDisabled]}
            onPress={() => onRegister(item.id)}
            disabled={isFull || registering}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
            <Text style={[s.btnText, { color: '#fff' }]}>Đăng ký</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function ActivitiesScreen({ navigation }) {
  const { state: authState } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['activities-public'],
    queryFn: () => getPublic({ size: 50 }),
  });

  const registerMut = useMutation({
    mutationFn: register,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities-public'] });
      qc.invalidateQueries({ queryKey: ['my-activities'] });
      Alert.alert('Thành công', 'Đăng ký hoạt động thành công!');
    },
    onError: (e) => Alert.alert('Lỗi', e.response?.data?.message ?? 'Không thể đăng ký'),
  });

  const unregisterMut = useMutation({
    mutationFn: unregister,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities-public'] });
      Alert.alert('Thành công', 'Đã hủy đăng ký hoạt động');
    },
    onError: (e) => Alert.alert('Lỗi', e.response?.data?.message ?? 'Không thể hủy đăng ký'),
  });

  const handleRegister = useCallback((id) => {
    if (!authState.userToken) {
      Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập để đăng ký hoạt động');
      return;
    }
    Alert.alert('Xác nhận', 'Bạn muốn đăng ký tham gia hoạt động này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng ký', onPress: () => registerMut.mutate(id) },
    ]);
  }, [authState.userToken, registerMut]);

  const handleUnregister = useCallback((id) => {
    Alert.alert('Xác nhận', 'Bạn muốn hủy đăng ký hoạt động này?', [
      { text: 'Không', style: 'cancel' },
      { text: 'Hủy đăng ký', style: 'destructive', onPress: () => unregisterMut.mutate(id) },
    ]);
  }, [unregisterMut]);

  const items = data?.content ?? data ?? [];

  if (isLoading) return <LoadingView />;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Hoạt động</Text>
        <Pressable onPress={() => navigation.navigate('MyActivities')} style={s.myActBtn}>
          <Text style={s.myActText}>Của tôi</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <ActivityCard
            item={item}
            onRegister={handleRegister}
            onUnregister={handleUnregister}
            registering={registerMut.isPending || unregisterMut.isPending}
          />
        )}
        ListEmptyComponent={<EmptyView icon="calendar-outline" title="Chưa có hoạt động nào" subtitle="Các hoạt động sắp tới sẽ hiển thị ở đây" />}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  myActBtn:    { flexDirection: 'row', alignItems: 'center', gap: 2 },
  myActText:   { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  list:        { padding: 16, gap: 12, paddingBottom: 32 },
  card:        { backgroundColor: '#fff', borderRadius: 16, padding: 16, ...SHADOWS.sm },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  cardTitle:   { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.text, lineHeight: 22 },
  meta:        { gap: 6, marginBottom: 10 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText:    { fontSize: 13, color: COLORS.textMuted, flex: 1 },
  desc:        { fontSize: 13, color: COLORS.textMuted, lineHeight: 19, marginBottom: 12 },
  cardFooter:  { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12, marginTop: 4 },
  btn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10, paddingHorizontal: 16 },
  btnPrimary:  { backgroundColor: COLORS.primary },
  btnOutline:  { borderWidth: 1, borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  btnDisabled: { opacity: 0.5 },
  btnText:     { fontSize: 14, fontWeight: '700' },
});
