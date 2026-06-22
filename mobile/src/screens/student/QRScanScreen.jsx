import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { selfScan } from '../../services/activityService';
import { COLORS } from '../../utils/constants';

export default function QRScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const cooldown = useRef(false);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: selfScan,
    onSuccess: (data) => {
      Vibration.vibrate([0, 80, 60, 80]);
      Alert.alert(
        'Điểm danh thành công',
        `Đã ghi nhận tham gia hoạt động${data?.tenHoatDong ? `:\n${data.tenHoatDong}` : ''}`,
        [{ text: 'OK', onPress: () => setScanned(false) }],
      );
      qc.invalidateQueries({ queryKey: ['my-activities'] });
      qc.invalidateQueries({ queryKey: ['training-points'] });
    },
    onError: (e) => {
      Vibration.vibrate(200);
      Alert.alert('Thất bại', e.response?.data?.message ?? 'QR không hợp lệ hoặc đã điểm danh', [
        { text: 'Thử lại', onPress: () => setScanned(false) },
      ]);
    },
  });

  const handleScan = ({ data }) => {
    if (scanned || cooldown.current) return;
    cooldown.current = true;
    setScanned(true);
    Vibration.vibrate(60);
    mutation.mutate(data);
    setTimeout(() => { cooldown.current = false; }, 2000);
  };

  if (!permission) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.permWrap} edges={['top']}>
        <View style={s.permCard}>
          <View style={s.permIcon}>
            <Ionicons name="camera" size={36} color={COLORS.primary} />
          </View>
          <Text style={s.permTitle}>Cần quyền Camera</Text>
          <Text style={s.permDesc}>Ứng dụng cần quyền truy cập camera để quét mã QR điểm danh hoạt động</Text>
          <Pressable style={s.permBtn} onPress={requestPermission}>
            <Text style={s.permBtnText}>Cấp quyền Camera</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={s.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Overlay */}
      <View style={s.overlay}>
        {/* Top bar */}
        <SafeAreaView edges={['top']} style={s.topBar}>
          <Text style={s.topTitle}>Quét QR Điểm danh</Text>
          <Pressable onPress={() => setTorch(v => !v)} style={s.torchBtn}>
            <Ionicons name={torch ? 'flash' : 'flash-outline'} size={22} color={torch ? '#fde047' : '#fff'} />
          </Pressable>
        </SafeAreaView>

        {/* Scan frame */}
        <View style={s.frameArea}>
          <View style={s.frame}>
            {/* Corners */}
            <View style={[s.corner, s.cornerTL]} />
            <View style={[s.corner, s.cornerTR]} />
            <View style={[s.corner, s.cornerBL]} />
            <View style={[s.corner, s.cornerBR]} />
          </View>
          {mutation.isPending && (
            <View style={s.scanFeedback}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={s.scanFeedbackText}>Đang xử lý...</Text>
            </View>
          )}
        </View>

        {/* Bottom hint */}
        <View style={s.bottomHint}>
          <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.7)" />
          <Text style={s.hintText}>Đưa mã QR hoạt động vào khung để điểm danh tự động</Text>
        </View>
      </View>
    </View>
  );
}

const FRAME = 240;
const CORNER = 28;
const THICKNESS = 3;

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#000' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  permWrap:    { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  permCard:    { backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', gap: 12, width: '100%' },
  permIcon:    { width: 72, height: 72, borderRadius: 20, backgroundColor: COLORS.primary + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  permTitle:   { fontSize: 20, fontWeight: '700', color: COLORS.text },
  permDesc:    { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  permBtn:     { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13, marginTop: 4 },
  permBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  overlay:     { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.5)' },
  topTitle:    { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#fff' },
  torchBtn:    { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  frameArea:   { alignItems: 'center', justifyContent: 'center', flex: 1, backgroundColor: 'transparent' },
  frame:       { width: FRAME, height: FRAME, position: 'relative' },
  corner:      { position: 'absolute', width: CORNER, height: CORNER },
  cornerTL:    { top: 0, left: 0, borderTopWidth: THICKNESS, borderLeftWidth: THICKNESS, borderColor: '#fff', borderTopLeftRadius: 8 },
  cornerTR:    { top: 0, right: 0, borderTopWidth: THICKNESS, borderRightWidth: THICKNESS, borderColor: '#fff', borderTopRightRadius: 8 },
  cornerBL:    { bottom: 0, left: 0, borderBottomWidth: THICKNESS, borderLeftWidth: THICKNESS, borderColor: '#fff', borderBottomLeftRadius: 8 },
  cornerBR:    { bottom: 0, right: 0, borderBottomWidth: THICKNESS, borderRightWidth: THICKNESS, borderColor: '#fff', borderBottomRightRadius: 8 },
  scanFeedback:     { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 8, bottom: -48, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  scanFeedbackText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  bottomHint:  { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 24, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  hintText:    { fontSize: 13, color: 'rgba(255,255,255,0.7)', flex: 1 },
});
