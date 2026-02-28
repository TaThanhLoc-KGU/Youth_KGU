import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import newsService from '../../services/newsService';
import PostCard from '../../components/news/public/PostCard';
import PostCardFeatured from '../../components/news/public/PostCardFeatured';
import HeroSlider from '../../components/news/public/HeroSlider';
import NewsTicker from '../../components/news/public/NewsTicker';

const NewsHomePage = () => {
  // Bài ghim (nổi bật) — dùng cho slider
  const { data: sliderData } = useQuery({
    queryKey: ['news-slider'],
    queryFn: () => newsService.getDanhSach({ page: 0, size: 6, isGhim: true }),
    staleTime: 5 * 60 * 1000,
  });

  // Bài nổi bật (top của trang, bên dưới slider)
  const { data: featuredData, isLoading: loadingFeatured } = useQuery({
    queryKey: ['news-featured'],
    queryFn: () => newsService.getDanhSach({ page: 0, size: 4 }),
    staleTime: 5 * 60 * 1000,
  });

  // Tin mới nhất
  const { data: latestData, isLoading: loadingLatest } = useQuery({
    queryKey: ['news-latest'],
    queryFn: () => newsService.getDanhSach({ page: 0, size: 8 }),
    staleTime: 5 * 60 * 1000,
  });

  // Cây danh mục
  const { data: tree = [] } = useQuery({
    queryKey: ['chuyen-muc-tree'],
    queryFn: () => newsService.getCayDanhMuc(),
    staleTime: 30 * 60 * 1000,
  });

  const sliderPosts = sliderData?.content || [];
  const featured    = featuredData?.content || [];
  const latest      = latestData?.content   || [];

  // Ticker — dùng các bài mới nhất làm dòng chạy chữ
  const tickerPosts = latest.slice(0, 10);

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
        <meta
          name="description"
          content="Tin tức, sự kiện và hoạt động của Đoàn Thanh niên – Hội Sinh viên Trường Đại học Kiên Giang"
        />
      </Helmet>

      {/* ── Hero Slider (hiện khi có bài ghim) ── */}
      {sliderPosts.length > 0 && (
        <section className="mb-4">
          <HeroSlider slides={sliderPosts} autoPlay interval={5000} />
        </section>
      )}

      {/* ── News Ticker / Chạy chữ ── */}
      {tickerPosts.length > 0 && (
        <NewsTicker posts={tickerPosts} label="Tin mới" speed={50} />
      )}

      {/* ── Bài nổi bật ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 border-l-4 border-enews-600 pl-3">Tin nổi bật</h2>
          <Link to="/news?sort=featured" className="flex items-center gap-1 text-sm text-enews-600 hover:text-enews-700">
            Xem thêm <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {loadingFeatured ? <Skeleton /> : (
          featured.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main featured — 2/3 width */}
              <div className="lg:col-span-2">
                <PostCardFeatured post={featured[0]} />
              </div>
              {/* Side featured — 2 small cards */}
              <div className="flex flex-col gap-4">
                {featured.slice(1, 3).map((post) => (
                  <article
                    key={post.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex h-28"
                  >
                    {post.anhDaiDien && (
                      <Link to={`/${post.fullUrlPath}`} className="flex-shrink-0">
                        <img
                          src={post.anhDaiDien}
                          alt={post.tieuDe}
                          className="w-32 h-full object-cover"
                        />
                      </Link>
                    )}
                    <div className="p-3 flex flex-col justify-center min-w-0">
                      {post.chuyenMuc && (
                        <span className="text-xs font-semibold text-enews-600 uppercase mb-0.5">
                          {post.chuyenMuc.ten}
                        </span>
                      )}
                      <Link to={`/${post.fullUrlPath}`}>
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-3 hover:text-enews-700 transition-colors">
                          {post.tieuDe}
                        </h3>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )
        )}
      </section>

      {/* ── Sections theo danh mục ── */}
      {tree.slice(0, 4).map((cat) => (
        <CategorySection key={cat.id} category={cat} />
      ))}

      {/* ── Tin mới nhất ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 border-l-4 border-enews-600 pl-3">Tin mới nhất</h2>
          <Link to="/news?sort=latest" className="flex items-center gap-1 text-sm text-enews-600 hover:text-enews-700">
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
        <h2 className="text-lg font-bold text-gray-900 border-l-4 border-enews-600 pl-3">
          {category.ten}
        </h2>
        <Link
          to={`/${category.fullPathSlug}`}
          className="flex items-center gap-1 text-sm text-enews-600 hover:text-enews-700"
        >
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
