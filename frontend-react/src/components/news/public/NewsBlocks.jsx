/**
 * NewsBlocks.jsx
 * Self-contained block components for the public news homepage.
 * Used by both NewsHomePage (live) and the layout editor preview.
 * Each block fetches its own data via React Query.
 */
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronDown, ChevronUp, Search, X, Loader2, TrendingUp, Folder, FileText, Download } from 'lucide-react';
import newsService from '../../../services/newsService';
import sliderService from '../../../services/sliderService';
import tickerService from '../../../services/tickerService';
import adBannerService from '../../../services/adBannerService';
import bieuMauService from '../../../services/bieuMauService';
import { API_BASE_URL } from '../../../services/api';
import PostCard from './PostCard';
import PostCardFeatured from './PostCardFeatured';
import HeroSlider from './HeroSlider';
import NewsTicker from './NewsTicker';
import { BLOCK_TYPES } from '../../../stores/newsLayoutStore';

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
          className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-enews-500 focus:border-enews-500 text-sm"
        />
        {searchInput && (
          <button
            onClick={() => { setSearchInput(''); setKeyword(''); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {searching && (
          <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-enews-500 animate-spin" />
        )}
      </div>

      {keyword && (
        <section className="mt-4 mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-enews-600" />
            Kết quả cho <span className="text-enews-600">"{keyword}"</span>
            <span className="text-sm font-normal text-gray-400">({searchResults.length} bài)</span>
          </h2>
          {searching ? (
            <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-200 rounded-xl h-64" />)}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {searchResults.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
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
// Fetches from /api/public/slider (managed via SliderManagerPage)

export const HeroSliderBlock = () => {
  const { data: sliderItems = [] } = useQuery({
    queryKey: ['slider-public'],
    queryFn: sliderService.getActive,
    staleTime: 5 * 60 * 1000,
  });

  // Normalise slider items to the shape HeroSlider expects
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
// Fetches from /api/public/ticker (managed via TickerManagerPage)

export const NewsTickerBlock = () => {
  const { data: tickerItems = [] } = useQuery({
    queryKey: ['ticker-public'],
    queryFn: tickerService.getActive,
    staleTime: 5 * 60 * 1000,
  });

  // Normalise ticker items to the shape NewsTicker expects
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
  const size = config.size || 4;
  const { data, isLoading } = useQuery({
    queryKey: ['news-featured', size],
    queryFn: () => newsService.getDanhSach({ page: 0, size }),
    staleTime: 5 * 60 * 1000,
  });
  const featured = data?.content || [];

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 border-l-4 border-enews-600 pl-3">Tin nổi bật</h2>
      </div>
      {isLoading ? (
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="bg-gray-200 rounded-xl h-72" />)}
        </div>
      ) : featured.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <PostCardFeatured post={featured[0]} />
          </div>
          <div className="flex flex-col gap-4">
            {featured.slice(1, 3).map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex h-28"
              >
                {post.anhDaiDien && (
                  <Link to={`/${post.fullUrlPath}`} className="flex-shrink-0">
                    <img src={post.anhDaiDien} alt={post.tieuDe} className="w-32 h-full object-cover" />
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
      )}
    </section>
  );
};

// ─── ALL CATEGORIES BLOCK ─────────────────────────────────────────────────────
// Shows CategorySectionBlock for every root category automatically.

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 border-l-4 border-enews-600 pl-3">
          {categoryName || 'Chuyên mục'}
        </h2>
        {categorySlug && (
          <Link
            to={`/${categorySlug}`}
            className="flex items-center gap-1 text-sm text-enews-600 hover:text-enews-700"
          >
            Xem thêm <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {posts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 border-l-4 border-enews-600 pl-3">
          Tin mới nhất
        </h2>
      </div>
      {isLoading ? (
        <div className={`animate-pulse grid ${colClass} gap-4`}>
          {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-200 rounded-xl h-64" />)}
        </div>
      ) : (
        <div className={`grid ${colClass} gap-4`}>
          {latest.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </section>
  );
};

// ─── BANNER BLOCK (MAIN) ──────────────────────────────────────────────────────
// Displays all active MAIN banners from /api/public/ad-banners/loai/MAIN

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
          <div className="w-full rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
            {banner.hinhAnh
              ? <img src={banner.hinhAnh} alt={banner.tieuDe} className="w-full object-cover max-h-52" />
              : <div className="w-full h-28 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center px-4">
                  <span className="text-white font-semibold text-lg text-center">{banner.tieuDe}</span>
                </div>
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
// Displays all active SIDEBAR banners from /api/public/ad-banners/loai/SIDEBAR

export const AdWidgetBlock = () => {
  const { data: banners = [] } = useQuery({
    queryKey: ['ad-banners-sidebar-public'],
    queryFn: () => adBannerService.getActiveByLoai('SIDEBAR'),
    staleTime: 5 * 60 * 1000,
  });

  if (!banners.length) return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 h-32 flex items-center justify-center">
      <p className="text-xs text-gray-400 text-center px-3">Widget sidebar<br/><span className="text-gray-300">Chưa có banner nào active</span></p>
    </div>
  );

  return (
    <div className="space-y-3">
      {banners.map((banner) => {
        const inner = (
          <div className="w-full rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
            {banner.hinhAnh
              ? <img src={banner.hinhAnh} alt={banner.tieuDe} className="w-full object-contain" />
              : <div className="w-full h-32 bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center p-4">
                  <span className="text-white font-semibold text-sm text-center">{banner.tieuDe}</span>
                </div>
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
// Danh sách bài viết nổi bật dạng compact (dùng trong sidebar)

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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-enews-50">
        <TrendingUp className="w-4 h-4 text-enews-500" />
        <h3 className="font-semibold text-sm text-gray-800">Tin nổi bật</h3>
      </div>
      <ul className="divide-y divide-gray-50">
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              to={`/${post.fullUrlPath}`}
              className="flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              {post.anhDaiDien && (
                <img
                  src={post.anhDaiDien}
                  alt={post.tieuDe}
                  className="w-16 h-12 object-cover rounded-md flex-shrink-0"
                />
              )}
              <p className="text-sm text-gray-700 line-clamp-2 leading-snug">{post.tieuDe}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ─── SIDEBAR CATEGORIES BLOCK ─────────────────────────────────────────────────
// Cây danh mục có thể thu gọn (dùng trong sidebar)

export const SidebarCategoriesBlock = () => {
  const [open, setOpen] = useState(true);
  const { data: tree = [] } = useQuery({
    queryKey: ['chuyen-muc-tree'],
    queryFn: () => newsService.getCayDanhMuc(),
    staleTime: 30 * 60 * 1000,
  });
  if (!tree.length) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 bg-blue-50 hover:bg-blue-100/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <h3 className="font-semibold text-sm text-gray-800">Danh mục</h3>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-blue-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-blue-400 flex-shrink-0" />
        }
      </button>
      {open && (
        <ul className="divide-y divide-gray-50">
          {tree.map((cat) => (
            <li key={cat.id}>
              <Link
                to={`/${cat.fullPathSlug}`}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-700">{cat.ten}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              {cat.children?.length > 0 && (
                <ul>
                  {cat.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        to={`/${child.fullPathSlug}`}
                        className="flex items-center gap-2 pl-8 pr-4 py-2 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
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
      )}
    </div>
  );
};

// ─── BIEU MAU BLOCK (SIDEBAR) ─────────────────────────────────────────────────
// Danh sách biểu mẫu / form tải về từ /api/public/bieu-mau

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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 bg-orange-50 hover:bg-orange-100/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <h3 className="font-semibold text-sm text-gray-800">Biểu mẫu</h3>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-orange-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-orange-400 flex-shrink-0" />
        }
      </button>
      {open && (
        <ul className="divide-y divide-gray-50">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`${API_BASE_URL}${item.duongDan}`}
                target="_blank" rel="noreferrer"
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

// ─── BLOCK REGISTRY + RENDERER ────────────────────────────────────────────────

export const BLOCK_REGISTRY = {
  [BLOCK_TYPES.SEARCH_BAR]:       SearchBlock,
  [BLOCK_TYPES.HERO_SLIDER]:      HeroSliderBlock,
  [BLOCK_TYPES.NEWS_TICKER]:      NewsTickerBlock,
  [BLOCK_TYPES.FEATURED_GRID]:    FeaturedGridBlock,
  [BLOCK_TYPES.ALL_CATEGORIES]:   AllCategoriesBlock,
  [BLOCK_TYPES.CATEGORY_SECTION]: CategorySectionBlock,
  [BLOCK_TYPES.LATEST_NEWS]:      LatestNewsBlock,
  [BLOCK_TYPES.BANNER]:              BannerBlock,
  [BLOCK_TYPES.AD_WIDGET]:           AdWidgetBlock,
  [BLOCK_TYPES.SIDEBAR_FEATURED]:    SidebarFeaturedBlock,
  [BLOCK_TYPES.SIDEBAR_CATEGORIES]:  SidebarCategoriesBlock,
  [BLOCK_TYPES.BIEU_MAU]:            BieuMauBlock,
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
    {/* Transparent overlay to block interaction in preview mode */}
    {noInteract && (
      <div className="absolute inset-0 z-10" style={{ cursor: 'default' }} />
    )}
  </div>
);

export default BLOCK_REGISTRY;
