import { View, StyleSheet, ActivityIndicator, Share, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getBySlug } from '../../services/newsService';
import { COLORS } from '../../utils/constants';
import LoadingView from '../../components/common/LoadingView';

const HTML_WRAP = (content, title) => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 16px; line-height: 1.7; color: #1e293b; padding: 20px; background: #fff; }
    h1 { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.3; margin-bottom: 16px; }
    h2 { font-size: 18px; font-weight: 700; margin: 20px 0 8px; }
    h3 { font-size: 16px; font-weight: 700; margin: 16px 0 6px; }
    p  { margin-bottom: 12px; }
    img { max-width: 100%; height: auto; border-radius: 10px; margin: 10px 0; }
    a  { color: #1c6681; }
    ul, ol { padding-left: 20px; margin-bottom: 12px; }
    li { margin-bottom: 4px; }
    blockquote { border-left: 3px solid #1c6681; padding-left: 14px; color: #475569; font-style: italic; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 14px; }
    td, th { border: 1px solid #e2e8f0; padding: 8px 10px; }
    th { background: #f8fafc; font-weight: 700; }
  </style>
</head>
<body>
  <h1>${title ?? ''}</h1>
  ${content ?? ''}
</body>
</html>
`;

export default function ArticleScreen({ route, navigation }) {
  const { slug, title } = route.params;

  const { data: article, isLoading } = useQuery({
    queryKey: ['news-article', slug],
    queryFn: () => getBySlug(slug),
  });

  const handleShare = async () => {
    if (!article) return;
    await Share.share({ message: article.tieuDe ?? title });
  };

  // Set share button in header
  navigation.setOptions({
    headerRight: () => (
      <Pressable onPress={handleShare} hitSlop={8} style={{ marginRight: 4 }}>
        <Ionicons name="share-outline" size={22} color={COLORS.primary} />
      </Pressable>
    ),
  });

  if (isLoading) return <LoadingView />;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <WebView
        source={{ html: HTML_WRAP(article?.noiDung, article?.tieuDe ?? title) }}
        style={s.web}
        startInLoadingState
        renderLoading={() => (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#fff' },
  web:        { flex: 1, backgroundColor: '#fff' },
  loadingWrap:{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
