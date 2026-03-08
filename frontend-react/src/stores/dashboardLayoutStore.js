import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Widget types available in the dashboard.
 * Each widget has a colSpan (in 12-col grid), min 3, max 12.
 */
export const WIDGET_TYPES = {
  WELCOME:             'WELCOME',
  STATS_SV:            'STATS_SV',
  STATS_HD:            'STATS_HD',
  STATS_DD:            'STATS_DD',
  STATS_BCH:           'STATS_BCH',
  CHART_TREND:         'CHART_TREND',
  CHART_FACULTY:       'CHART_FACULTY',
  NEWS_CATEGORIES:     'NEWS_CATEGORIES',
  UPCOMING_ACTIVITIES: 'UPCOMING_ACTIVITIES',
  NEWS_RECENT:         'NEWS_RECENT',
};

export const WIDGET_META = {
  [WIDGET_TYPES.WELCOME]: {
    label: 'Chào mừng',
    description: 'Card chào mừng quản trị viên',
    defaultColSpan: 12,
    minColSpan: 6,
    icon: '👋',
  },
  [WIDGET_TYPES.STATS_SV]: {
    label: 'Sinh viên',
    description: 'Tổng số sinh viên trong hệ thống',
    defaultColSpan: 3,
    minColSpan: 3,
    icon: '🎓',
  },
  [WIDGET_TYPES.STATS_HD]: {
    label: 'Hoạt động',
    description: 'Tổng số hoạt động Đoàn - Hội',
    defaultColSpan: 3,
    minColSpan: 3,
    icon: '🎯',
  },
  [WIDGET_TYPES.STATS_DD]: {
    label: 'Điểm danh',
    description: 'Tổng lượt điểm danh toàn hệ thống',
    defaultColSpan: 3,
    minColSpan: 3,
    icon: '✅',
  },
  [WIDGET_TYPES.STATS_BCH]: {
    label: 'BCH',
    description: 'Số thành viên Ban Chấp Hành',
    defaultColSpan: 3,
    minColSpan: 3,
    icon: '👥',
  },
  [WIDGET_TYPES.CHART_TREND]: {
    label: 'Xu hướng hoạt động',
    description: 'Biểu đồ hoạt động theo tháng',
    defaultColSpan: 8,
    minColSpan: 6,
    icon: '📈',
  },
  [WIDGET_TYPES.CHART_FACULTY]: {
    label: 'Phân bổ theo Khoa',
    description: 'Biểu đồ sinh viên theo khoa/ngành',
    defaultColSpan: 4,
    minColSpan: 4,
    icon: '🏫',
  },
  [WIDGET_TYPES.NEWS_CATEGORIES]: {
    label: 'Chuyên mục tin tức',
    description: 'Hiển thị tất cả chuyên mục hiện có',
    defaultColSpan: 12,
    minColSpan: 6,
    icon: '📰',
  },
  [WIDGET_TYPES.UPCOMING_ACTIVITIES]: {
    label: 'Hoạt động sắp tới',
    description: 'Danh sách hoạt động chưa kết thúc',
    defaultColSpan: 6,
    minColSpan: 4,
    icon: '📅',
  },
  [WIDGET_TYPES.NEWS_RECENT]: {
    label: 'Tin tức mới nhất',
    description: 'Các bài viết được đăng gần đây',
    defaultColSpan: 6,
    minColSpan: 4,
    icon: '📄',
  },
};

const COLSPAN_STEPS = [3, 4, 6, 8, 12];

/** Default layout — shown on first load or after reset */
const DEFAULT_LAYOUT = [
  { id: 'w-welcome',     type: WIDGET_TYPES.WELCOME,             colSpan: 12 },
  { id: 'w-stats-sv',   type: WIDGET_TYPES.STATS_SV,             colSpan: 3 },
  { id: 'w-stats-hd',   type: WIDGET_TYPES.STATS_HD,             colSpan: 3 },
  { id: 'w-stats-dd',   type: WIDGET_TYPES.STATS_DD,             colSpan: 3 },
  { id: 'w-stats-bch',  type: WIDGET_TYPES.STATS_BCH,            colSpan: 3 },
  { id: 'w-chart',      type: WIDGET_TYPES.CHART_TREND,          colSpan: 8 },
  { id: 'w-faculty',    type: WIDGET_TYPES.CHART_FACULTY,        colSpan: 4 },
  { id: 'w-categories', type: WIDGET_TYPES.NEWS_CATEGORIES,      colSpan: 12 },
  { id: 'w-upcoming',   type: WIDGET_TYPES.UPCOMING_ACTIVITIES,  colSpan: 6 },
  { id: 'w-news',       type: WIDGET_TYPES.NEWS_RECENT,          colSpan: 6 },
];

let _counter = 100;
const uid = () => `w-${++_counter}-${Date.now()}`;

const useDashboardLayoutStore = create(
  persist(
    (set, get) => ({
      items: DEFAULT_LAYOUT,

      addWidget: (type) => {
        const meta = WIDGET_META[type];
        if (!meta) return;
        set((s) => ({
          items: [
            ...s.items,
            { id: uid(), type, colSpan: meta.defaultColSpan },
          ],
        }));
      },

      removeWidget: (id) =>
        set((s) => ({ items: s.items.filter((w) => w.id !== id) })),

      moveWidget: (fromIndex, toIndex) =>
        set((s) => {
          const items = [...s.items];
          const [moved] = items.splice(fromIndex, 1);
          items.splice(toIndex, 0, moved);
          return { items };
        }),

      /**
       * Cycle colSpan to next available step (wraps around).
       * Steps: 3 → 4 → 6 → 8 → 12 → 3 ...
       * Respects minColSpan from WIDGET_META.
       */
      cycleColSpan: (id) =>
        set((s) => ({
          items: s.items.map((w) => {
            if (w.id !== id) return w;
            const meta = WIDGET_META[w.type] || {};
            const min = meta.minColSpan || 3;
            const allowed = COLSPAN_STEPS.filter((c) => c >= min);
            const curIdx = allowed.indexOf(w.colSpan);
            const nextIdx = (curIdx + 1) % allowed.length;
            return { ...w, colSpan: allowed[nextIdx] };
          }),
        })),

      setColSpan: (id, colSpan) =>
        set((s) => ({
          items: s.items.map((w) => (w.id === id ? { ...w, colSpan } : w)),
        })),

      resetToDefault: () => set({ items: DEFAULT_LAYOUT }),

      /** Replace entire layout (used by editor on Save) */
      setLayout: (items) => set({ items }),
    }),
    {
      name: 'dashboard-layout-v1',
    }
  )
);

export { COLSPAN_STEPS };
export default useDashboardLayoutStore;
