/**
 * NewsBlocks.jsx
 * Self-contained block components for the public news homepage.
 * Used by both NewsHomePage (live) and the layout editor preview.
 * Each block fetches its own data via React Query.
 */
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight, ChevronDown, ChevronUp, Search, X, Loader2,
  TrendingUp, Folder, FileText, Download, Calendar, Eye, Clock, MapPin, Zap,
} from 'lucide-react';
import newsService from '../../../services/newsService';
import sliderService from '../../../services/sliderService';
import tickerService from '../../../services/tickerService';
import adBannerService from '../../../services/adBannerService';
import bieuMauService from '../../../services/bieuMauService';
import activityService from '../../../services/activityService';
import { API_BASE_URL } from '../../../services/api';
import PostCard from './PostCard';
import PostCardFeatured from './PostCardFeatured';
import HeroSlider from './HeroSlider';
import NewsTicker from './NewsTicker';
import { BLOCK_TYPES } from '../../../stores/newsLayoutStore';
import { formatDate } from '../../../utils/dateFormat';

// ─── SHARED: FALLBACK THUMB ────────────────────────────────────────────────────

const FallbackThumb = () => (
  <div
    className="w-full h-full flex items-center justify-center"
    style={{ background: 'linear-gradient(135deg, #c0001a 0%, #7f0000 100%)' }}
  >
    <img
      src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
      alt=""
      className="w-8 h-8 opacity-30 object-contain"
    />
  </div>
);

// ─── SHARED: SECTION HEADER ────────────────────────────────────────────────────

const NAV_COLOR = '#1a3868';

const SectionHeader = ({ title, href, hrefLabel = 'Xem thêm' }) => (
  <div className="flex items-center justify-between mb-3" style={{ backgroundColor: NAV_COLOR }}>
    <h2 className="text-sm font-bold text-white uppercase tracking-wide px-3 py-2.5">
      {title}
    </h2>
    {href && (
      <Link
        to={href}
        className="text-xs text-white/75 hover:text-white flex items-center gap-0.5 px-3 whitespace-nowrap transition-colors"
      >
        {hrefLabel} <ChevronRight className="w-3 h-3" />
      </Link>
    )}
  </div>
);

// ─── SEARCH BAR BLOCK ─────────────────────────────────────────────────────────

export const SearchBlock = () => {
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setKeyword(searchInput.trim()), 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const { data: searchData, isFetching: searching } = useQuery({
    queryKey: ['news-search', keyword],
    queryFn: () => newsService.getDanhSach({ keyword, page: 0, size: 20 }),
    enabled: keyword.length > 0,
    staleTime: 30 * 1000,
  });

  const searchResults = searchData?.content || [];

  return (
    <div className="mb-5">
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm kiếm tin tức, sự kiện..."
          className="w-full pl-12 pr-12 py-3 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-primary text-sm transition-shadow"
        />
        {searchInput && (
          <button
            onClick={() => { setSearchInput(''); setKeyword(''); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {searching && (
          <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600 animate-spin" />
        )}
      </div>

      {keyword && (
        <section className="mt-4 mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-red-600" />
            Kết quả cho <span className="text-red-600">"{keyword}"</span>
            <span className="text-sm font-normal text-gray-400">({searchResults.length} bài)</span>
          </h2>
          {searching ? (
            <div className="animate-pulse flex flex-col divide-y divide-gray-100">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 py-3">
                  <div className="w-20 h-16 bg-gray-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.length < 4 ? (
              <div className="flex flex-col divide-y divide-gray-100">
                {searchResults.map((p) => <PostCard key={p.id} post={p} horizontal />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {searchResults.map((p) => <PostCard key={p.id} post={p} />)}
              </div>
            )
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-base">Không tìm thấy bài viết nào phù hợp.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

// ─── HERO SLIDER BLOCK ────────────────────────────────────────────────────────

export const HeroSliderBlock = () => {
  const { data: sliderItems = [] } = useQuery({
    queryKey: ['slider-public'],
    queryFn: sliderService.getActive,
    staleTime: 5 * 60 * 1000,
  });

  const slides = sliderItems.map((item) => ({
    id:          item.id,
    tieuDe:      item.tieuDe,
    tomTat:      item.moTa,
    anhDaiDien:  item.hinhAnh,
    fullUrlPath: item.duongDan || '#',
  }));

  if (!slides.length) return null;
  return (
    <section className="mb-4">
      <HeroSlider slides={slides} autoPlay interval={5000} />
    </section>
  );
};

// ─── NEWS TICKER BLOCK ────────────────────────────────────────────────────────

export const NewsTickerBlock = () => {
  const { data: tickerItems = [] } = useQuery({
    queryKey: ['ticker-public'],
    queryFn: tickerService.getActive,
    staleTime: 5 * 60 * 1000,
  });

  const posts = tickerItems.map((item) => ({
    id:          item.id,
    tieuDe:      item.noiDung,
    fullUrlPath: item.duongDan || '#',
  }));

  if (!posts.length) return null;
  return <NewsTicker posts={posts} label="Tin mới" speed={50} />;
};

// ─── FEATURED GRID BLOCK ──────────────────────────────────────────────────────

export const FeaturedGridBlock = ({ config = {} }) => {
  const size = config.size || 8;
  const [activeTab, setActiveTab] = useState('moi');

  const { data, isLoading } = useQuery({
    queryKey: ['news-featured', size],
    queryFn: () => newsService.getDanhSach({ page: 0, size }),
    staleTime: 5 * 60 * 1000,
  });
  const { data: popularData } = useQuery({
    queryKey: ['news-popular', 5],
    queryFn: () => newsService.getDanhSach({ page: 0, size: 5, sort: 'luotXem,desc' }),
    staleTime: 5 * 60 * 1000,
  });

  const featured = data?.content || [];
  const popularPosts = popularData?.content || [];
  const sidebarPosts = activeTab === 'moi' ? featured.slice(1, 5) : (popularPosts.length ? popularPosts : featured.slice(1, 5));

  return (
    <section className="mb-6">
      {isLoading ? (
        <div className="animate-pulse grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="bg-gray-200 aspect-[16/10]" />
          </div>
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-20 h-14 bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : featured.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2/3: editorial featured */}
          <div className="lg:col-span-2">
            <PostCardFeatured post={featured[0]} />
          </div>

          {/* Right 1/3: tab sidebar */}
          <div className="flex flex-col">
            {/* Tabs */}
            <div className="flex border-b-2 border-gray-200 mb-3">
              <button
                onClick={() => setActiveTab('moi')}
                className={`px-4 py-2 text-sm font-bold border-b-2 -mb-0.5 transition-colors ${
                  activeTab === 'moi'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Tin mới
              </button>
              <button
                onClick={() => setActiveTab('nhieu')}
                className={`px-4 py-2 text-sm font-bold border-b-2 -mb-0.5 transition-colors ${
                  activeTab === 'nhieu'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Tin xem nhiều
              </button>
            </div>

            {/* Article list */}
            <div className="flex flex-col">
              {sidebarPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/${post.fullUrlPath}`}
                  className="flex gap-3 py-3 group border-b border-gray-100 last:border-0"
                >
                  <div className="relative w-20 h-14 flex-shrink-0 overflow-hidden bg-gray-100">
                    {post.anhDaiDien ? (
                      <img
                        src={post.anhDaiDien}
                        alt={post.tieuDe}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <FallbackThumb />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-3 leading-snug group-hover:text-blue-800 transition-colors">
                      {post.tieuDe}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">{formatDate(post.ngayXuatBan)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// ─── ALL CATEGORIES BLOCK ─────────────────────────────────────────────────────

export const AllCategoriesBlock = () => {
  const { data: tree = [] } = useQuery({
    queryKey: ['chuyen-muc-tree'],
    queryFn: () => newsService.getCayDanhMuc(),
    staleTime: 30 * 60 * 1000,
  });
  return (
    <>
      {tree.map((cat) => (
        <CategorySectionBlock
          key={cat.id}
          config={{
            categoryId: cat.id,
            categoryName: cat.ten,
            categorySlug: cat.fullPathSlug,
            size: 4,
          }}
        />
      ))}
    </>
  );
};

// ─── CATEGORY SECTION BLOCK ───────────────────────────────────────────────────

export const CategorySectionBlock = ({ config = {} }) => {
  const { categoryId, categoryName, categorySlug, size = 4 } = config;

  const { data } = useQuery({
    queryKey: ['news-by-cat', categoryId, size],
    queryFn: () => newsService.getDanhSach({ chuyenMucId: categoryId, size, page: 0 }),
    staleTime: 5 * 60 * 1000,
    enabled: !!categoryId,
  });
  const posts = data?.content || [];
  if (!posts.length) return null;

  return (
    <section className="mb-8">
      <SectionHeader
        title={categoryName || 'Chuyên mục'}
        href={categorySlug ? `/${categorySlug}` : undefined}
      />

      {posts.length >= 3 ? (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-0 sm:gap-5">
          {/* Big editorial post left (3/5) */}
          <Link
            to={`/${posts[0].fullUrlPath}`}
            className="group sm:col-span-3 border-b sm:border-b-0 sm:border-r border-gray-100 pb-4 sm:pb-0 sm:pr-5 mb-4 sm:mb-0"
          >
            <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100 mb-2.5">
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
            <h3 className="text-base font-bold text-gray-900 line-clamp-3 leading-snug group-hover:text-blue-800 transition-colors">
              {posts[0].tieuDe}
            </h3>
            {posts[0].tomTat && (
              <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mt-1 hidden sm:block">
                {posts[0].tomTat}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(posts[0].ngayXuatBan)}
            </p>
          </Link>

          {/* Small posts right (2/5) */}
          <div className="sm:col-span-2 flex flex-col">
            {posts.slice(1, 4).map((post) => (
              <Link
                key={post.id}
                to={`/${post.fullUrlPath}`}
                className="flex gap-2.5 border-b border-gray-100 last:border-0 py-3 group first:pt-0"
              >
                <div className="relative w-20 h-14 flex-shrink-0 overflow-hidden bg-gray-100">
                  {post.anhDaiDien ? (
                    <img
                      src={post.anhDaiDien}
                      alt={post.tieuDe}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <FallbackThumb />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-blue-800 transition-colors">
                    {post.tieuDe}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">{formatDate(post.ngayXuatBan)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </section>
  );
};

// ─── LATEST NEWS BLOCK ────────────────────────────────────────────────────────

export const LatestNewsBlock = ({ config = {} }) => {
  const size = config.size || 8;
  const columns = config.columns || 4;

  const { data, isLoading } = useQuery({
    queryKey: ['news-latest', size],
    queryFn: () => newsService.getDanhSach({ page: 0, size }),
    staleTime: 5 * 60 * 1000,
  });
  const latest = data?.content || [];

  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <section className="mb-8">
      <SectionHeader title="Tin mới nhất" />
      {isLoading ? (
        <div className={`animate-pulse grid ${colClass} gap-5`}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-2xl h-56" />
          ))}
        </div>
      ) : (
        <div className={`grid ${colClass} gap-5`}>
          {latest.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </section>
  );
};

// ─── BANNER BLOCK (MAIN) ──────────────────────────────────────────────────────

export const BannerBlock = () => {
  const { data: banners = [] } = useQuery({
    queryKey: ['ad-banners-main-public'],
    queryFn: () => adBannerService.getActiveByLoai('MAIN'),
    staleTime: 5 * 60 * 1000,
  });

  if (!banners.length) return null;

  return (
    <div className="mb-4 space-y-3">
      {banners.map((banner) => {
        const inner = (
          <div className="w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
            {banner.hinhAnh
              ? <img src={banner.hinhAnh} alt={banner.tieuDe} className="w-full object-cover max-h-52" />
              : (
                <div className="w-full h-28 bg-gradient-to-r from-red-700 to-red-500 flex items-center justify-center px-4">
                  <span className="text-white font-semibold text-lg text-center">{banner.tieuDe}</span>
                </div>
              )
            }
          </div>
        );
        return banner.duongDan ? (
          <a key={banner.id} href={banner.duongDan} target="_blank" rel="noreferrer" className="block">{inner}</a>
        ) : (
          <div key={banner.id}>{inner}</div>
        );
      })}
    </div>
  );
};

// ─── AD WIDGET BLOCK (SIDEBAR) ────────────────────────────────────────────────

export const AdWidgetBlock = () => {
  const { data: banners = [] } = useQuery({
    queryKey: ['ad-banners-sidebar-public'],
    queryFn: () => adBannerService.getActiveByLoai('SIDEBAR'),
    staleTime: 5 * 60 * 1000,
  });

  if (!banners.length) return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 h-32 flex items-center justify-center">
      <p className="text-xs text-gray-400 text-center px-3">
        Widget sidebar<br />
        <span className="text-gray-300">Chưa có banner nào active</span>
      </p>
    </div>
  );

  return (
    <div className="space-y-3">
      {banners.map((banner) => {
        const inner = (
          <div className="w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
            {banner.hinhAnh
              ? <img src={banner.hinhAnh} alt={banner.tieuDe} className="w-full object-contain" />
              : (
                <div className="w-full h-32 bg-gradient-to-br from-red-700 to-red-500 flex items-center justify-center p-4">
                  <span className="text-white font-semibold text-sm text-center">{banner.tieuDe}</span>
                </div>
              )
            }
          </div>
        );
        return banner.duongDan ? (
          <a key={banner.id} href={banner.duongDan} target="_blank" rel="noreferrer" className="block">{inner}</a>
        ) : (
          <div key={banner.id}>{inner}</div>
        );
      })}
    </div>
  );
};

// ─── SIDEBAR FEATURED BLOCK ───────────────────────────────────────────────────

export const SidebarFeaturedBlock = ({ config = {} }) => {
  const size = config.size || 5;
  const { data } = useQuery({
    queryKey: ['sidebar-featured', size],
    queryFn: () => newsService.getDanhSach({ size, page: 0 }),
    staleTime: 5 * 60 * 1000,
  });
  const posts = data?.content || [];
  if (!posts.length) return null;

  return (
    <div className="bg-white border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ backgroundColor: NAV_COLOR }}>
        <TrendingUp className="w-4 h-4 text-white flex-shrink-0" />
        <h3 className="font-bold text-sm text-white uppercase tracking-wide">Tin nổi bật</h3>
      </div>
      <ul className="divide-y divide-gray-100">
        {posts.map((post, idx) => (
          <li key={post.id}>
            <Link
              to={`/${post.fullUrlPath}`}
              className="flex gap-3 items-start py-3 px-3 group hover:bg-gray-50 transition-colors"
            >
              <span className="flex-shrink-0 w-5 h-5 text-white text-[10px] font-bold flex items-center justify-center mt-0.5" style={{ backgroundColor: '#1a3868' }}>
                {idx + 1}
              </span>
              <div className="relative w-16 h-12 flex-shrink-0 overflow-hidden bg-gray-100">
                {post.anhDaiDien ? (
                  <img
                    src={post.anhDaiDien}
                    alt={post.tieuDe}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <FallbackThumb />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-blue-800 transition-colors">
                  {post.tieuDe}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(post.ngayXuatBan)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ─── SIDEBAR CATEGORIES BLOCK ─────────────────────────────────────────────────

export const SidebarCategoriesBlock = () => {
  const { data: tree = [] } = useQuery({
    queryKey: ['chuyen-muc-tree'],
    queryFn: () => newsService.getCayDanhMuc(),
    staleTime: 30 * 60 * 1000,
  });
  if (!tree.length) return null;

  return (
    <div className="bg-white border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ backgroundColor: NAV_COLOR }}>
        <Folder className="w-4 h-4 text-white flex-shrink-0" />
        <h3 className="font-bold text-sm text-white uppercase tracking-wide">Danh mục</h3>
      </div>
      <ul className="divide-y divide-gray-100">
        {tree.map((cat) => (
          <li key={cat.id}>
            <Link
              to={`/${cat.fullPathSlug}`}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors group"
            >
              <span className="text-sm text-gray-700 group-hover:text-blue-800 transition-colors font-medium">{cat.ten}</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-800 transition-colors flex-shrink-0" />
            </Link>
            {cat.children?.length > 0 && (
              <ul className="border-t border-gray-50">
                {cat.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      to={`/${child.fullPathSlug}`}
                      className="flex items-center gap-2 pl-8 pr-4 py-2 text-xs text-gray-500 hover:bg-gray-50 hover:text-blue-800 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <span className="w-1 h-1 bg-gray-300 rounded-full flex-shrink-0" />
                      {child.ten}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ─── BIEU MAU BLOCK (SIDEBAR) ─────────────────────────────────────────────────

export const BieuMauBlock = () => {
  const [open, setOpen] = useState(true);
  const { data: items = [] } = useQuery({
    queryKey: ['bieu-mau-public'],
    queryFn: bieuMauService.getActive,
    staleTime: 5 * 60 * 1000,
  });
  if (!items.length) return null;

  const EXT_COLOR = {
    pdf:  'text-red-500', docx: 'text-blue-500', doc: 'text-blue-500',
    xlsx: 'text-green-500', xls: 'text-green-500',
    pptx: 'text-orange-500', ppt: 'text-orange-500',
  };

  return (
    <div className="bg-white border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 transition-colors"
        style={{ backgroundColor: NAV_COLOR }}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-white flex-shrink-0" />
          <h3 className="font-bold text-sm text-white uppercase tracking-wide">Biểu mẫu</h3>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-white/70 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-white/70 flex-shrink-0" />
        }
      </button>
      {open && (
        <ul className="divide-y divide-gray-50">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`${API_BASE_URL}${item.duongDan}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group"
              >
                <FileText className={`w-4 h-4 flex-shrink-0 ${EXT_COLOR[item.loaiFile?.toLowerCase()] || 'text-gray-400'}`} />
                <span className="text-sm text-gray-700 flex-1 line-clamp-2 leading-snug">{item.ten}</span>
                <Download className="w-3.5 h-3.5 text-gray-300 group-hover:text-orange-500 flex-shrink-0 transition-colors" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ─── HOAT DONG MO DANG KY BLOCK ──────────────────────────────────────────────

const OpenActivityRow = ({ activity }) => (
  <Link
    to="/hoat-dong"
    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-gray-100 hover:border-amber-300 hover:bg-amber-50 transition-all group"
  >
    {/* thanh màu chớp 2 màu */}
    <div className="w-1.5 self-stretch rounded-full flex-shrink-0 animate-blink2-bar" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-amber-800 transition-colors">
        {activity.tenHoatDong}
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0 mt-0.5 text-xs text-gray-500">
        {activity.ngayToChuc && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(activity.ngayToChuc)}
          </span>
        )}
        {activity.diaDiem && (
          <span className="flex items-center gap-1 truncate max-w-[160px]">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {activity.diaDiem}
          </span>
        )}
        {activity.hanDangKy && (
          <span className="flex items-center gap-1 text-red-500 font-medium">
            <Clock className="w-3 h-3" />
            Hạn ĐK: {formatDate(activity.hanDangKy)}
          </span>
        )}
        {activity.diemRenLuyen != null && (
          <span className="font-semibold text-enews-600">+{activity.diemRenLuyen} RL</span>
        )}
      </div>
    </div>
    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 flex-shrink-0 transition-colors" />
  </Link>
);

export const HoatDongMoDangKyBlock = () => {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['public-hoat-dong'],
    queryFn: activityService.getPublic,
    staleTime: 3 * 60 * 1000,
  });

  const open = activities
    .filter(a => a.trangThai === 'DANG_MO_DANG_KY')
    .sort((a, b) => {
      // hạn đăng ký gần nhất lên đầu, không có hạn xuống dưới
      if (a.hanDangKy && b.hanDangKy) return new Date(a.hanDangKy) - new Date(b.hanDangKy);
      if (a.hanDangKy) return -1;
      if (b.hanDangKy) return 1;
      return 0;
    });

  if (!isLoading && open.length === 0) return null;

  return (
    <div className="mb-2 rounded-xl overflow-hidden animate-blink2-border">
      {/* Header chớp 2 màu */}
      <div className="animate-blink2-bg flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-white flex-shrink-0" />
          <h2 className="font-bold text-white text-sm sm:text-base uppercase tracking-wide">
            Hoạt động đang mở đăng ký
          </h2>
          {open.length > 0 && (
            <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-white/30">
              {open.length}
            </span>
          )}
        </div>
        <Link
          to="/hoat-dong"
          className="text-white/80 text-xs flex items-center gap-0.5 hover:text-white transition-colors whitespace-nowrap"
        >
          Xem tất cả <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Danh sách */}
      <div className="bg-gray-50 p-3 space-y-2">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-white rounded-lg animate-pulse border border-gray-100" />
          ))
        ) : (
          open.slice(0, 6).map(act => (
            <OpenActivityRow key={act.maHoatDong} activity={act} />
          ))
        )}
      </div>
    </div>
  );
};

// ─── BLOCK REGISTRY + RENDERER ────────────────────────────────────────────────

export const BLOCK_REGISTRY = {
  [BLOCK_TYPES.SEARCH_BAR]:            SearchBlock,
  [BLOCK_TYPES.HERO_SLIDER]:           HeroSliderBlock,
  [BLOCK_TYPES.NEWS_TICKER]:           NewsTickerBlock,
  [BLOCK_TYPES.HOAT_DONG_MO_DANG_KY]: HoatDongMoDangKyBlock,
  [BLOCK_TYPES.FEATURED_GRID]:         FeaturedGridBlock,
  [BLOCK_TYPES.ALL_CATEGORIES]:        AllCategoriesBlock,
  [BLOCK_TYPES.CATEGORY_SECTION]:      CategorySectionBlock,
  [BLOCK_TYPES.LATEST_NEWS]:           LatestNewsBlock,
  [BLOCK_TYPES.BANNER]:                BannerBlock,
  [BLOCK_TYPES.AD_WIDGET]:             AdWidgetBlock,
  [BLOCK_TYPES.SIDEBAR_FEATURED]:      SidebarFeaturedBlock,
  [BLOCK_TYPES.SIDEBAR_CATEGORIES]:    SidebarCategoriesBlock,
  [BLOCK_TYPES.BIEU_MAU]:              BieuMauBlock,
};

/**
 * Renders an ordered list of blocks.
 * @param {Array}   blocks    - Array of { id, type, config }
 * @param {boolean} noInteract - Overlay to disable clicks (for preview mode)
 */
export const BlockRenderer = ({ blocks, noInteract = false }) => (
  <div className="relative">
    {blocks.map((block) => {
      const Component = BLOCK_REGISTRY[block.type];
      if (!Component) return null;
      return <Component key={block.id} config={block.config || {}} />;
    })}
    {noInteract && (
      <div className="absolute inset-0 z-10" style={{ cursor: 'default' }} />
    )}
  </div>
);

export default BLOCK_REGISTRY;
