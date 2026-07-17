import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const BLOCK_TYPES = {
  // ── Main content blocks ────────────────────────────────────────────────────
  SEARCH_BAR:             'SEARCH_BAR',
  HERO_SLIDER:            'HERO_SLIDER',
  NEWS_TICKER:            'NEWS_TICKER',
  HOAT_DONG_MO_DANG_KY:  'HOAT_DONG_MO_DANG_KY',  // Hoạt động đang mở đăng ký
  FEATURED_GRID:          'FEATURED_GRID',
  ALL_CATEGORIES:         'ALL_CATEGORIES',
  CATEGORY_SECTION:       'CATEGORY_SECTION',
  LATEST_NEWS:            'LATEST_NEWS',
  BANNER:                 'BANNER',
  // ── Sidebar blocks ─────────────────────────────────────────────────────────
  SIDEBAR_FEATURED:    'SIDEBAR_FEATURED',    // Tin nổi bật (sidebar)
  SIDEBAR_CATEGORIES:  'SIDEBAR_CATEGORIES',  // Cây danh mục
  AD_WIDGET:           'AD_WIDGET',           // Widget quảng cáo
  BIEU_MAU:            'BIEU_MAU',            // Danh sách biểu mẫu tải về
};

/** Block types that belong in the SIDEBAR column (not main content). */
export const SIDEBAR_BLOCK_TYPES = new Set([
  BLOCK_TYPES.SIDEBAR_FEATURED,
  BLOCK_TYPES.SIDEBAR_CATEGORIES,
  BLOCK_TYPES.AD_WIDGET,
  BLOCK_TYPES.BIEU_MAU,
]);

export const BLOCK_META = {
  // ── Main blocks ────────────────────────────────────────────────────────────
  [BLOCK_TYPES.SEARCH_BAR]: {
    label: 'Thanh tìm kiếm',
    icon: '🔍',
    description: 'Ô tìm kiếm bài viết theo từ khóa',
    unique: true,
    configurable: false,
    sidebar: false,
  },
  [BLOCK_TYPES.HERO_SLIDER]: {
    label: 'Hero Slider',
    icon: '🎠',
    description: 'Slider tự động từ Quản lý Slider',
    unique: true,
    configurable: false,
    sidebar: false,
  },
  [BLOCK_TYPES.HOAT_DONG_MO_DANG_KY]: {
    label: 'Hoạt động mở đăng ký',
    icon: '📋',
    description: 'Danh sách hoạt động đang mở đăng ký (nổi bật, chớp 2 màu)',
    unique: true,
    configurable: false,
    sidebar: false,
  },
  [BLOCK_TYPES.NEWS_TICKER]: {
    label: 'Tin chạy chữ',
    icon: '📢',
    description: 'Ticker chạy tiêu đề từ Quản lý Ticker',
    unique: true,
    configurable: false,
    sidebar: false,
  },
  [BLOCK_TYPES.FEATURED_GRID]: {
    label: 'Tin nổi bật',
    icon: '⭐',
    description: 'Lưới bài viết nổi bật lớn đầu trang',
    unique: true,
    configurable: true,
    sidebar: false,
  },
  [BLOCK_TYPES.ALL_CATEGORIES]: {
    label: 'Tất cả chuyên mục',
    icon: '📰',
    description: 'Tự động hiển thị tất cả chuyên mục',
    unique: true,
    configurable: false,
    sidebar: false,
  },
  [BLOCK_TYPES.CATEGORY_SECTION]: {
    label: 'Chuyên mục cụ thể',
    icon: '📂',
    description: 'Bài viết của một chuyên mục tuỳ chọn',
    unique: false,
    configurable: true,
    sidebar: false,
  },
  [BLOCK_TYPES.LATEST_NEWS]: {
    label: 'Tin mới nhất',
    icon: '🕐',
    description: 'Lưới tất cả bài viết mới nhất',
    unique: true,
    configurable: true,
    sidebar: false,
  },
  [BLOCK_TYPES.BANNER]: {
    label: 'Banner quảng cáo',
    icon: '🖼️',
    description: 'Banner ngang đặt giữa nội dung chính',
    unique: false,
    configurable: false,
    sidebar: false,
  },
  // ── Sidebar blocks ─────────────────────────────────────────────────────────
  [BLOCK_TYPES.SIDEBAR_FEATURED]: {
    label: 'Tin nổi bật',
    icon: '🔥',
    description: 'Danh sách bài viết nổi bật (sidebar)',
    unique: true,
    configurable: true,
    sidebar: true,
  },
  [BLOCK_TYPES.SIDEBAR_CATEGORIES]: {
    label: 'Cây danh mục',
    icon: '📋',
    description: 'Danh sách chuyên mục có thể thu gọn',
    unique: true,
    configurable: false,
    sidebar: true,
  },
  [BLOCK_TYPES.AD_WIDGET]: {
    label: 'Widget quảng cáo',
    icon: '📦',
    description: 'Banner từ Ad Manager (loại SIDEBAR)',
    unique: true,
    configurable: false,
    sidebar: true,
  },
  [BLOCK_TYPES.BIEU_MAU]: {
    label: 'Biểu mẫu tải về',
    icon: '📄',
    description: 'Danh sách biểu mẫu / form mẫu có thể tải xuống',
    unique: true,
    configurable: false,
    sidebar: true,
  },
};

/** colSpan presets for main blocks within the 12-column grid */
export const COL_SPAN_OPTIONS = [
  { value: 12, label: 'Toàn bộ' },
  { value: 8,  label: '2/3'     },
  { value: 6,  label: '1/2'     },
  { value: 4,  label: '1/3'     },
];

export const DEFAULT_MAIN_BLOCKS = [
  { id: 'b-slider',      type: BLOCK_TYPES.HERO_SLIDER,            config: {},                      colSpan: 12 },
  { id: 'b-ticker',      type: BLOCK_TYPES.NEWS_TICKER,            config: {},                      colSpan: 12 },
  { id: 'b-mo-dang-ky',  type: BLOCK_TYPES.HOAT_DONG_MO_DANG_KY,  config: {},                      colSpan: 12 },
  { id: 'b-featured',    type: BLOCK_TYPES.FEATURED_GRID,          config: { size: 4 },             colSpan: 12 },
  { id: 'b-cats',        type: BLOCK_TYPES.ALL_CATEGORIES,         config: {},                      colSpan: 12 },
  { id: 'b-latest',      type: BLOCK_TYPES.LATEST_NEWS,            config: { size: 8, columns: 4 }, colSpan: 12 },
];

export const DEFAULT_SIDEBAR_BLOCKS = [
  { id: 'sb-featured',  type: BLOCK_TYPES.SIDEBAR_FEATURED,   config: { size: 5 } },
  { id: 'sb-cats',      type: BLOCK_TYPES.SIDEBAR_CATEGORIES, config: {}           },
  { id: 'sb-widget',    type: BLOCK_TYPES.AD_WIDGET,          config: {}           },
];

// Backward-compat alias
export const DEFAULT_LAYOUT = DEFAULT_MAIN_BLOCKS;

let _ctr = 100;
const uid = (type) => `${type.toLowerCase().replace(/_/g, '-')}-${++_ctr}`;

const useNewsLayoutStore = create(
  persist(
    (set) => ({
      mainBlocks:    DEFAULT_MAIN_BLOCKS,
      sidebarBlocks: DEFAULT_SIDEBAR_BLOCKS,

      addMainBlock: (type, config = {}, colSpan = 12) => {
        const meta = BLOCK_META[type];
        if (!meta) return;
        set((s) => {
          if (meta.unique && s.mainBlocks.some((b) => b.type === type)) return s;
          return { mainBlocks: [...s.mainBlocks, { id: uid(type), type, config, colSpan }] };
        });
      },

      addSidebarBlock: (type, config = {}) => {
        const meta = BLOCK_META[type];
        if (!meta) return;
        set((s) => {
          if (meta.unique && s.sidebarBlocks.some((b) => b.type === type)) return s;
          return { sidebarBlocks: [...s.sidebarBlocks, { id: uid(type), type, config }] };
        });
      },

      removeBlock: (id) => set((s) => ({
        mainBlocks:    s.mainBlocks.filter((b)    => b.id !== id),
        sidebarBlocks: s.sidebarBlocks.filter((b) => b.id !== id),
      })),

      moveMainBlock: (fromIndex, toIndex) => set((s) => {
        const arr = [...s.mainBlocks];
        const [moved] = arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, moved);
        return { mainBlocks: arr };
      }),

      moveSidebarBlock: (fromIndex, toIndex) => set((s) => {
        const arr = [...s.sidebarBlocks];
        const [moved] = arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, moved);
        return { sidebarBlocks: arr };
      }),

      updateBlockConfig: (id, patch) => set((s) => ({
        mainBlocks:    s.mainBlocks.map((b)    => b.id === id ? { ...b, config: { ...b.config, ...patch } } : b),
        sidebarBlocks: s.sidebarBlocks.map((b) => b.id === id ? { ...b, config: { ...b.config, ...patch } } : b),
      })),

      updateMainBlockColSpan: (id, colSpan) => set((s) => ({
        mainBlocks: s.mainBlocks.map((b) => b.id === id ? { ...b, colSpan } : b),
      })),

      setLayout: ({ mainBlocks, sidebarBlocks }) => set({ mainBlocks, sidebarBlocks }),

      resetToDefault: () => set({
        mainBlocks:    DEFAULT_MAIN_BLOCKS,
        sidebarBlocks: DEFAULT_SIDEBAR_BLOCKS,
      }),
    }),
    { name: 'news-layout-v5' }  // bumped from v4 → add HOAT_DONG_MO_DANG_KY block
  )
);

export default useNewsLayoutStore;
