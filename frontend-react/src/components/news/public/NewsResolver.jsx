import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import newsService from '../../../services/newsService';
import PostDetailPage from '../../../pages/news/PostDetailPage';
import CategoryPage from '../../../pages/news/CategoryPage';
import NotFoundPage from '../../../pages/news/NotFoundPage';

/** Skeleton loader trong khi resolve */
const NewsPageSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 rounded w-3/4" />
    <div className="h-4 bg-gray-200 rounded w-1/2" />
    <div className="h-64 bg-gray-200 rounded-xl" />
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${80 + Math.random() * 20}%` }} />
      ))}
    </div>
  </div>
);

/**
 * Trung tâm điều phối URL cho eNews public.
 * - Lấy path từ URL wildcard
 * - Gọi GET /api/public/resolve?path={path}
 * - Render component tương ứng
 */
const NewsResolver = () => {
  const { '*': path } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['resolve', path],
    queryFn: () => newsService.resolve(path || ''),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) return <NewsPageSkeleton />;
  if (isError) return <NotFoundPage />;
  if (!data || data.type === 'NOT_FOUND') return <NotFoundPage />;

  if (data.type === 'REDIRECT') {
    return <Navigate to={`/${data.redirectTo}`} replace />;
  }

  if (data.type === 'POST') {
    return <PostDetailPage post={data.post} />;
  }

  if (data.type === 'CATEGORY') {
    return <CategoryPage category={data.category} initialPosts={data.posts} />;
  }

  return <NotFoundPage />;
};

export default NewsResolver;
