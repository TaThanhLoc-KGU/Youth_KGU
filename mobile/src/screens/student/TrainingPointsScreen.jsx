import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../utils/constants';
import { getTrainingPoints, getAcademicYears } from '../../services/studentService';
import LoadingView from '../../components/common/LoadingView';
import EmptyView from '../../components/common/EmptyView';

const GRADE_COLORS = {
  'Xuất sắc':  { bg: '#d1fae5', text: '#065f46' },
  'Giỏi':      { bg: '#dbeafe', text: '#1e40af' },
  'Khá':       { bg: '#fef3c7', text: '#92400e' },
  'Trung bình':{ bg: '#f3f4f6', text: '#374151' },
  'Yếu':       { bg: '#fee2e2', text: '#991b1b' },
};

function ScoreGauge({ score, max = 100 }) {
  const pct = Math.min(100, ((score ?? 0) / max) * 100);
  const getColor = () => {
    if (pct >= 90) return '#10b981';
    if (pct >= 75) return COLORS.primary;
    if (pct >= 60) return '#f59e0b';
    return '#ef4444';
  };
  return (
    <View style={g.gaugeWrap}>
      <View style={g.gaugeTrack}>
        <View style={[g.gaugeFill, { width: `${pct}%`, backgroundColor: getColor() }]} />
      </View>
    </View>
  );
}

export default function TrainingPointsScreen() {
  const [selectedYear, setSelectedYear] = useState(null);

  const { data: years } = useQuery({
    queryKey: ['academic-years'],
    queryFn: getAcademicYears,
  });

  const { data: points, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['training-points', selectedYear],
    queryFn: () => getTrainingPoints(selectedYear),
  });

  const list = Array.isArray(points) ? points : (points ? [points] : []);

  if (isLoading) return <LoadingView />;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Điểm Rèn luyện</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        contentContainerStyle={s.scroll}
      >
        {/* Year filter */}
        {years?.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.yearRow} contentContainerStyle={{ gap: 8 }}>
            <Pressable style={[s.yearChip, !selectedYear && s.yearChipActive]} onPress={() => setSelectedYear(null)}>
              <Text style={[s.yearChipText, !selectedYear && s.yearChipTextActive]}>Tất cả</Text>
            </Pressable>
            {years.map(y => (
              <Pressable
                key={y.id ?? y}
                style={[s.yearChip, selectedYear === (y.id ?? y) && s.yearChipActive]}
                onPress={() => setSelectedYear(y.id ?? y)}
              >
                <Text style={[s.yearChipText, selectedYear === (y.id ?? y) && s.yearChipTextActive]}>
                  {y.tenNamHoc ?? y}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {list.length === 0 ? (
          <EmptyView icon="ribbon-outline" title="Chưa có điểm rèn luyện" subtitle="Tham gia hoạt động để được tích điểm" />
        ) : (
          list.map((item, idx) => {
            const gradeStyle = GRADE_COLORS[item.xepLoai] ?? GRADE_COLORS['Trung bình'];
            return (
              <View key={item.id ?? idx} style={s.card}>
                <View style={s.cardHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.semText}>{item.hocKy ? `Học kỳ ${item.hocKy}` : '—'} · {item.namHoc ?? ''}</Text>
                    <View style={s.scoreRow}>
                      <Text style={s.scoreVal}>{item.tongDiem ?? 0}</Text>
                      <Text style={s.scoreMax}>/100</Text>
                    </View>
                  </View>
                  <View style={[s.gradeBadge, { backgroundColor: gradeStyle.bg }]}>
                    <Text style={[s.gradeText, { color: gradeStyle.text }]}>{item.xepLoai ?? '—'}</Text>
                  </View>
                </View>

                <ScoreGauge score={item.tongDiem} />

                {/* Breakdown */}
                {item.chiTiet && (
                  <View style={s.breakdown}>
                    {Object.entries(item.chiTiet).map(([key, val]) => (
                      <View key={key} style={s.bRow}>
                        <Text style={s.bKey}>{key}</Text>
                        <Text style={s.bVal}>{val}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: COLORS.bg },
  header:           { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle:      { fontSize: 20, fontWeight: '800', color: COLORS.text },
  yearRow:          { paddingHorizontal: 16, marginVertical: 12 },
  yearChip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f1f5f9' },
  yearChipActive:   { backgroundColor: COLORS.primary },
  yearChipText:     { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  yearChipTextActive:{ color: '#fff' },
  scroll:           { padding: 16, paddingBottom: 32 },
  card:             { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, ...SHADOWS.sm },
  cardHead:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  semText:          { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: 4 },
  scoreRow:         { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  scoreVal:         { fontSize: 36, fontWeight: '800', color: COLORS.text },
  scoreMax:         { fontSize: 16, color: COLORS.textLight },
  gradeBadge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  gradeText:        { fontSize: 13, fontWeight: '700' },
  breakdown:        { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12, gap: 6 },
  bRow:             { flexDirection: 'row', justifyContent: 'space-between' },
  bKey:             { fontSize: 13, color: COLORS.textMuted },
  bVal:             { fontSize: 13, fontWeight: '700', color: COLORS.text },
});

const g = StyleSheet.create({
  gaugeWrap:  { height: 6, borderRadius: 3, overflow: 'hidden' },
  gaugeTrack: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  gaugeFill:  { height: '100%', borderRadius: 3 },
});
