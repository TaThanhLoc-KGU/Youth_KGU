import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import newsService from '../../services/newsService';
import PostCard from '../../components/news/public/PostCard';
import PostCardFeatured from '../../components/news/public/PostCardFeatured';

const NewsHomePage = () => {
  const { data: featuredData, isLoading: loadingFeatured } = useQuery({
    queryKey: ['news-featured'],
    queryFn: () => newsService.getDanhSach({ page: 0, size: 4 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: latestData, isLoading: loadingLatest } = useQuery({
    queryKey: ['news-latest'],
    queryFn: () => newsService.getDanhSach({ page: 0, size: 8 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: tree = [] } = useQuery({
    queryKey: ['chuyen-muc-tree'],
    queryFn: () => newsService.getCayDanhMuc(),
    staleTime: 30 * 60 * 1000,
  });

  const featured = featuredData?.content || [];
  const latest = latestData?.content || [];

  const Skeleton = () => (
    <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-xl h-72" />
      ))}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Tin tức Đoàn – Hội | Youth KGU</title>
        <meta name="description" content="Tin tức, sự kiện và hoạt động của Đoàn Thanh niên – Hội Sinh viên Trường Đại học Kiên Giang" />
      </Helmet>

      {/* Featured posts */}
      <section className="mb-8">
        {loadingFeatured ? <Skeleton /> : (
          featured.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-1">
                <PostCardFeatured post={featured[0]} />
              </div>
              <div className="grid grid-cols-1 gap-4">
                {featured.slice(1, 3).map((post) => (
                  <div key={post.id} className="h-32">
                    <article className="h-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex">
                      {post.anhDaiDien && (
                        <Link to={`/${post.fullUrlPath}`} className="flex-shrink-0">
                          <img src={post.anhDaiDien} alt={post.tieuDe} className="w-40 h-full object-cover" />
                        </Link>
                      )}
                      <div className="p-3 flex flex-col justify-center min-w-0">
                        {post.chuyenMuc && (
                          <span className="text-xs font-semibold text-red-600 uppercase">{post.chuyenMuc.ten}</span>
                        )}
                        <Link to={`/${post.fullUrlPath}`}>
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-red-700 transition-colors mt-0.5">
                            {post.tieuDe}
                          </h3>
                        </Link>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </section>

      {/* Category sections */}
      {tree.slice(0, 3).map((cat) => {
        return (
          <CategorySection key={cat.id} category={cat} />
        );
      })}

      {/* Latest news */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 border-l-4 border-red-600 pl-3">Tin mới nhất</h2>
          <Link to="/news?sort=latest" className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700">
            Xem thêm <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {loadingLatest ? (
          <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-200 rounded-xl h-64" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {latest.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </section>
    </>
  );
};

/** Section hiển thị bài viết theo một chuyên mục */
const CategorySection = ({ category }) => {
  const { data } = useQuery({
    queryKey: ['news-by-cat', category.id],
    queryFn: () => newsService.getDanhSach({ chuyenMucId: category.id, size: 4, page: 0 }),
    staleTime: 5 * 60 * 1000,
  });

  const posts = data?.content || [];
  if (!posts.length) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 border-l-4 border-red-600 pl-3">{category.ten}</h2>
        <Link to={`/${category.fullPathSlug}`} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700">
          Xem thêm <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {posts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
    </section>
  );
};

export default NewsHomePage;
