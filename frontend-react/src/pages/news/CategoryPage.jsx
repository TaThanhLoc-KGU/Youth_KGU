import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import newsService from '../../services/newsService';
import Breadcrumb from '../../components/news/public/Breadcrumb';
import PostCard from '../../components/news/public/PostCard';

const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://youth-kgu.edu.vn';
const PAGE_SIZE = 12;

// Fallback thumbnail gradient
const FallbackThumb = () => (
  <div
    className="w-full h-full flex items-center justify-center"
    style={{ background: 'linear-gradient(135deg, #1c6681 0%, #00b0f0 100%)' }}
  >
    <img
      src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
      alt=""
      className="w-10 h-10 opacity-30 object-contain"
    />
  </div>
);

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

const CategoryPage = ({ category }) => {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['news-category', category?.id, page],
    queryFn: () => newsService.getDanhSach({ chuyenMucId: category?.id, page, size: PAGE_SIZE }),
    staleTime: 5 * 60 * 1000,
    enabled: !!category?.id,
  });

  const posts = data?.content || [];
  const totalPages = data?.totalPages || 0;

  // Build page number list (show max 7 pages around current)
  const pageNumbers = (() => {
    if (totalPages <= 7) return [...Array(totalPages)].map((_, i) => i);
    const start = Math.max(0, Math.min(page - 3, totalPages - 7));
    return [...Array(7)].map((_, i) => start + i);
  })();

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

      {/* Category header with left accent bar */}
      <div className="mb-6 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          <span className="w-1 h-7 bg-primary rounded-full flex-shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{category?.ten}</h1>
        </div>
        {category?.moTa && (
          <p className="text-gray-500 text-sm mt-1 ml-4">{category.moTa}</p>
        )}
        {category?.children?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 ml-4">
            {category.children.map((sub) => (
              <a
                key={sub.id}
                href={`/${sub.fullPathSlug}`}
                className="text-xs font-medium bg-primary/5 text-primary border border-primary/20 hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors"
              >
                {sub.ten}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="animate-pulse space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-2/5 aspect-[16/9] sm:aspect-auto sm:h-48 bg-gray-200 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-3 py-2">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
              <div className="h-3 bg-gray-100 rounded w-1/3 mt-4" />
            </div>
          </div>
          <div className="border-t border-gray-100" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-200 rounded-2xl h-56" />)}
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-base">Chưa có bài viết nào trong chuyên mục này.</p>
        </div>
      ) : (
        <>
          {/* First post: large horizontal featured */}
          <Link
            to={`/${posts[0].fullUrlPath}`}
            className="flex flex-col sm:flex-row gap-4 mb-6 group"
          >
            <div className="relative w-full sm:w-2/5 aspect-[16/9] sm:aspect-auto sm:h-48 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
              {posts[0].anhDaiDien ? (
                <img
                  src={posts[0].anhDaiDien}
                  alt={posts[0].tieuDe}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <FallbackThumb />
              )}
            </div>
            <div className="flex flex-col justify-center sm:w-3/5">
              {posts[0].chuyenMuc && (
                <span className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                  {posts[0].chuyenMuc.ten}
                </span>
              )}
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors mb-2">
                {posts[0].tieuDe}
              </h2>
              {posts[0].tomTat && (
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-3 hidden sm:block">
                  {posts[0].tomTat}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  {fmtDate(posts[0].ngayXuatBan)}
                </span>
                {posts[0].luotXem != null && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                    {posts[0].luotXem} lượt xem
                  </span>
                )}
              </div>
            </div>
          </Link>

          <div className="border-t border-gray-100 mb-6" />

          {/* Rest of posts in 3-col grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.slice(1).map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-10">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pageNumbers[0] > 0 && (
            <>
              <button
                onClick={() => setPage(0)}
                className="w-9 h-9 rounded-full text-sm font-medium border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors"
              >
                1
              </button>
              {pageNumbers[0] > 1 && (
                <span className="text-gray-400 px-1">…</span>
              )}
            </>
          )}

          {pageNumbers.map((i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                i === page
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-gray-200 hover:bg-gray-100 text-gray-700'
              }`}
            >
              {i + 1}
            </button>
          ))}

          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 2 && (
                <span className="text-gray-400 px-1">…</span>
              )}
              <button
                onClick={() => setPage(totalPages - 1)}
                className="w-9 h-9 rounded-full text-sm font-medium border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};

export default CategoryPage;
