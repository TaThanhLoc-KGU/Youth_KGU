import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import newsService from '../../services/newsService';
import Breadcrumb from '../../components/news/public/Breadcrumb';
import PostCard from '../../components/news/public/PostCard';

const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://youth-kgu.edu.vn';
const PAGE_SIZE = 12;

const CategoryPage = ({ category, initialPosts }) => {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['news-category', category?.id, page],
    queryFn: () => newsService.getDanhSach({ chuyenMucId: category?.id, page, size: PAGE_SIZE }),
    initialData: page === 0 ? initialPosts : undefined,
    staleTime: 5 * 60 * 1000,
    enabled: !!category?.id,
  });

  const posts = data?.content || [];
  const totalPages = data?.totalPages || 0;

  return (
    <>
      <Helmet>
        <title>{category?.ten || 'Danh mục'} | Youth KGU</title>
        <meta name="description" content={category?.moTa || `Tin tức trong chuyên mục ${category?.ten}`} />
        {category?.fullPathSlug && (
          <link rel="canonical" href={`${BASE_URL}/${category.fullPathSlug}`} />
        )}
      </Helmet>

      {/* Breadcrumb */}
      {category?.breadcrumb?.length > 0 && (
        <div className="mb-4">
          <Breadcrumb items={category.breadcrumb.slice(0, -1)} currentTitle={category.ten} />
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{category?.ten}</h1>
        {category?.moTa && <p className="text-gray-500 mt-1">{category.moTa}</p>}
      </div>

      {/* Sub-categories */}
      {category?.children?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {category.children.map((sub) => (
            <a key={sub.id} href={`/${sub.fullPathSlug}`}
              className="text-sm bg-enews-50 text-enews-700 border border-enews-200 hover:bg-enews-100 px-3 py-1.5 rounded-full transition-colors">
              {sub.ten}
            </a>
          ))}
        </div>
      )}

      {/* Post grid */}
      {isLoading ? (
        <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-200 rounded-xl h-64" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>Chưa có bài viết nào trong chuyên mục này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                i === page ? 'bg-enews-600 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}>
              {i + 1}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};

export default CategoryPage;
