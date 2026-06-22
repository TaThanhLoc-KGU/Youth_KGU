import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ScrollView, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { getList, getFeatured, getCategories } from '../../services/newsService';
import NewsCard from '../../components/news/NewsCard';
import LoadingView from '../../components/common/LoadingView';
import EmptyView from '../../components/common/EmptyView';

export default function HomeScreen({ navigation }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [tab, setTab] = useState('new'); // 'new' | 'popular'

  const { data: categories } = useQuery({
    queryKey: ['news-categories'],
    queryFn: getCategories,
  });

  const { data: featured } = useQuery({
    queryKey: ['news-featured'],
    queryFn: getFeatured,
  });

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['news-list', activeCategory, tab],
    queryFn: () => getList({ categoryId: activeCategory, sortBy: tab === 'popular' ? 'views' : 'date', size: 30 }),
  });

  const items = data?.content ?? data ?? [];

  const goToArticle = useCallback((item) => {
    navigation.navigate('Article', { slug: item.slug, title: item.tieuDe });
  }, [navigation]);

  const renderHeader = () => (
    <View>
      {/* App bar */}
      <View style={s.appBar}>
        <View>
          <Text style={s.appTitle}>Youth KGU</Text>
          <Text style={s.appSub}>Đoàn Thanh niên – Hội Sinh viên</Text>
        </View>
        <View style={s.appBarActions}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
        </View>
      </View>

      {/* Featured */}
      {featured?.length > 0 && (
        <View style={s.featuredWrap}>
          <NewsCard item={featured[0]} onPress={() => goToArticle(featured[0])} />
        </View>
      )}

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.cats} contentContainerStyle={s.catsContent}>
        <Pressable
          style={[s.catChip, activeCategory == null && s.catChipActive]}
          onPress={() => setActiveCategory(null)}
        >
          <Text style={[s.catChipText, activeCategory == null && s.catChipTextActive]}>Tất cả</Text>
        </Pressable>
        {categories?.map(c => (
          <Pressable
            key={c.id}
            style={[s.catChip, activeCategory === c.id && s.catChipActive]}
            onPress={() => setActiveCategory(c.id)}
          >
            <Text style={[s.catChipText, activeCategory === c.id && s.catChipTextActive]}>{c.ten}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Tabs */}
      <View style={s.tabs}>
        {[['new', 'Mới nhất'], ['popular', 'Xem nhiều']].map(([key, label]) => (
          <Pressable key={key} style={[s.tab, tab === key && s.tabActive]} onPress={() => setTab(key)}>
            <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  if (isLoading) return <LoadingView />;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <FlatList
        data={items}
        keyExtractor={item => String(item.id ?? item.slug)}
        renderItem={({ item }) => <NewsCard item={item} onPress={() => goToArticle(item)} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<EmptyView icon="newspaper-outline" title="Không có bài viết nào" />}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#fff' },
  appBar:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  appTitle:        { fontSize: 18, fontWeight: '800', color: COLORS.navy },
  appSub:          { fontSize: 11, color: COLORS.textLight, marginTop: 1 },
  appBarActions:   { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  featuredWrap:    { paddingHorizontal: 16, paddingTop: 16 },
  cats:            { marginTop: 12 },
  catsContent:     { paddingHorizontal: 16, gap: 8 },
  catChip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f1f5f9' },
  catChipActive:   { backgroundColor: COLORS.primary },
  catChipText:     { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  catChipTextActive: { color: '#fff' },
  tabs:            { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginTop: 12 },
  tab:             { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabActive:       { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText:         { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive:   { color: COLORS.primary },
  list:            { paddingHorizontal: 16, paddingBottom: 24 },
});
