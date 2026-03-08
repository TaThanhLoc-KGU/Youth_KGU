/**
 * DashboardWidgets.jsx
 * All widget components + a registry mapping type → component.
 */
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import {
  GraduationCap, Activity, CheckSquare, Users,
  TrendingUp, Building2, Newspaper, Calendar, FileText,
  ChevronRight,
} from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import newsService from '../../services/newsService';
import useAuthStore from '../../stores/authStore';

// ─── Shared UI ───────────────────────────────────────────────────────────────

const WidgetShell = ({ children, className = '' }) => (
  <div className={`h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const WidgetHeader = ({ title, icon: Icon, color = 'blue' }) => (
  <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
    {Icon && <Icon className={`w-4 h-4 text-${color}-500`} />}
    <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
  </div>
);

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// ─── 1. Welcome ───────────────────────────────────────────────────────────────

const WelcomeWidget = () => {
  const { user } = useAuthStore();
  return (
    <WidgetShell>
      <div className="flex items-center gap-6 px-8 py-6">
        <img
          src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
          alt="Logo Đoàn"
          className="w-16 h-16 object-contain flex-shrink-0"
        />
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Xin chào, {user?.hoTen || 'Quản trị viên'}!
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Chào mừng bạn quay lại hệ thống Youth KGU.
          </p>
        </div>
      </div>
    </WidgetShell>
  );
};

// ─── 2. Stat cards ────────────────────────────────────────────────────────────

const StatWidget = ({ label, icon: Icon, color, queryKey, queryFn, getValue }) => {
  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn,
    staleTime: 2 * 60 * 1000,
  });
  const value = data != null ? getValue(data) : null;

  const COLOR_MAP = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   icon: 'text-blue-400'   },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  icon: 'text-green-400'  },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  icon: 'text-amber-400'  },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-400' },
  };
  const c = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <WidgetShell>
      <div className="flex items-center gap-4 px-5 py-5">
        <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${c.icon}`} />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          {isLoading ? (
            <Skeleton className="h-7 w-16 mt-1" />
          ) : (
            <p className={`text-2xl font-bold ${c.text}`}>
              {value != null ? value.toLocaleString() : '—'}
            </p>
          )}
        </div>
      </div>
    </WidgetShell>
  );
};

const StatsSVWidget = () => (
  <StatWidget
    label="Sinh viên"
    icon={GraduationCap}
    color="blue"
    queryKey="dash-sv-count"
    queryFn={dashboardService.getStudentCount}
    getValue={(d) => d?.count ?? d?.tongSinhVien ?? 0}
  />
);

const StatsHDWidget = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dash-hd-stats'],
    queryFn: dashboardService.getDashboardStats,
    staleTime: 2 * 60 * 1000,
  });
  const val = data?.tongQuan?.tongHoatDong ?? data?.tongHoatDong ?? '—';
  return (
    <WidgetShell>
      <div className="flex items-center gap-4 px-5 py-5">
        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
          <Activity className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Hoạt động</p>
          {isLoading ? <Skeleton className="h-7 w-16 mt-1" /> : (
            <p className="text-2xl font-bold text-green-600">{typeof val === 'number' ? val.toLocaleString() : val}</p>
          )}
        </div>
      </div>
    </WidgetShell>
  );
};

const StatsDDWidget = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dash-dd-stats'],
    queryFn: dashboardService.getDashboardStats,
    staleTime: 2 * 60 * 1000,
  });
  const val = data?.tongQuan?.tongDiemDanh ?? data?.tongDiemDanh ?? '—';
  return (
    <WidgetShell>
      <div className="flex items-center gap-4 px-5 py-5">
        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
          <CheckSquare className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Lượt điểm danh</p>
          {isLoading ? <Skeleton className="h-7 w-16 mt-1" /> : (
            <p className="text-2xl font-bold text-amber-600">{typeof val === 'number' ? val.toLocaleString() : val}</p>
          )}
        </div>
      </div>
    </WidgetShell>
  );
};

const StatsBCHWidget = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dash-bch-overview'],
    queryFn: dashboardService.getBCHOverview,
    staleTime: 2 * 60 * 1000,
  });
  const val = data?.total ?? data?.tongThanhVien ?? '—';
  return (
    <WidgetShell>
      <div className="flex items-center gap-4 px-5 py-5">
        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
          <Users className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Thành viên BCH</p>
          {isLoading ? <Skeleton className="h-7 w-16 mt-1" /> : (
            <p className="text-2xl font-bold text-purple-600">{typeof val === 'number' ? val.toLocaleString() : val}</p>
          )}
        </div>
      </div>
    </WidgetShell>
  );
};

// ─── 3. Chart — Activity Trend ────────────────────────────────────────────────

const ChartTrendWidget = () => {
  const { data = [], isLoading } = useQuery({
    queryKey: ['dash-trends'],
    queryFn: dashboardService.getActivityTrends,
    staleTime: 5 * 60 * 1000,
  });
  return (
    <WidgetShell>
      <WidgetHeader title="Xu hướng hoạt động" icon={TrendingUp} />
      <div className="p-4" style={{ height: 220 }}>
        {isLoading ? <Skeleton className="w-full h-full" /> : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </WidgetShell>
  );
};

// ─── 4. Chart — By Faculty ────────────────────────────────────────────────────

const ChartFacultyWidget = () => {
  const { data = [], isLoading } = useQuery({
    queryKey: ['dash-faculty'],
    queryFn: dashboardService.getParticipationByFaculty,
    staleTime: 5 * 60 * 1000,
  });
  return (
    <WidgetShell>
      <WidgetHeader title="Phân bổ theo Khoa" icon={Building2} />
      <div className="p-4" style={{ height: 220 }}>
        {isLoading ? <Skeleton className="w-full h-full" /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 30, left: -20 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9 }}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="data" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </WidgetShell>
  );
};

// ─── 5. News Categories ───────────────────────────────────────────────────────

const NewsCategoriesWidget = () => {
  const { data: tree = [], isLoading } = useQuery({
    queryKey: ['news-chuyen-muc-tree'],
    queryFn: newsService.getCayDanhMuc,
    staleTime: 10 * 60 * 1000,
  });

  // Flatten tree to 2 levels
  const flat = [];
  tree.forEach((top) => {
    flat.push(top);
    (top.children || top.danhSachCon || []).forEach((c) => flat.push(c));
  });

  return (
    <WidgetShell>
      <WidgetHeader title="Chuyên mục Tin tức" icon={Newspaper} />
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : flat.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Chưa có chuyên mục nào.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {flat.map((cm) => (
              <a
                key={cm.id}
                href={`/${cm.fullPathSlug || cm.slug}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-lg transition-colors group"
              >
                <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700 truncate">
                  {cm.ten}
                </span>
                <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-400 flex-shrink-0 ml-1" />
              </a>
            ))}
          </div>
        )}
      </div>
    </WidgetShell>
  );
};

// ─── 6. Upcoming Activities ───────────────────────────────────────────────────

const UpcomingActivitiesWidget = () => {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['dash-upcoming'],
    queryFn: () => dashboardService.getUpcomingActivities(14),
    staleTime: 5 * 60 * 1000,
  });
  return (
    <WidgetShell>
      <WidgetHeader title="Hoạt động sắp tới" icon={Calendar} />
      <div className="divide-y divide-gray-50">
        {isLoading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1"><Skeleton className="h-4 w-3/4 mb-1" /><Skeleton className="h-3 w-1/2" /></div>
              </div>
            ))
          : items.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">Không có hoạt động sắp tới.</p>
            : items.slice(0, 6).map((hd) => (
                <div key={hd.maHoatDong || hd.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-lg">
                    🎯
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{hd.tenHoatDong || hd.ten}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {hd.ngayToChuc ? new Date(hd.ngayToChuc).toLocaleDateString('vi-VN') : '—'}
                    </p>
                  </div>
                </div>
              ))
        }
      </div>
    </WidgetShell>
  );
};

// ─── 7. Recent News ───────────────────────────────────────────────────────────

const NewsRecentWidget = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dash-news-recent'],
    queryFn: () => newsService.getDanhSach({ page: 0, size: 5 }),
    staleTime: 3 * 60 * 1000,
  });
  const posts = data?.content || [];
  return (
    <WidgetShell>
      <WidgetHeader title="Tin tức mới nhất" icon={FileText} />
      <div className="divide-y divide-gray-50">
        {isLoading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                <Skeleton className="w-14 h-10 rounded-lg" />
                <div className="flex-1"><Skeleton className="h-4 w-3/4 mb-1" /><Skeleton className="h-3 w-1/2" /></div>
              </div>
            ))
          : posts.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">Chưa có bài viết nào.</p>
            : posts.map((p) => (
                <div key={p.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                  {p.anhDaiDien
                    ? <img src={p.anhDaiDien} alt="" className="w-14 h-10 object-cover rounded-lg flex-shrink-0" />
                    : <div className="w-14 h-10 bg-gray-100 rounded-lg flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{p.tieuDe}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.chuyenMuc?.ten || '—'}
                      {p.ngayXuatBan && ` · ${new Date(p.ngayXuatBan).toLocaleDateString('vi-VN')}`}
                    </p>
                  </div>
                </div>
              ))
        }
      </div>
    </WidgetShell>
  );
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const WIDGET_REGISTRY = {
  WELCOME:             WelcomeWidget,
  STATS_SV:            StatsSVWidget,
  STATS_HD:            StatsHDWidget,
  STATS_DD:            StatsDDWidget,
  STATS_BCH:           StatsBCHWidget,
  CHART_TREND:         ChartTrendWidget,
  CHART_FACULTY:       ChartFacultyWidget,
  NEWS_CATEGORIES:     NewsCategoriesWidget,
  UPCOMING_ACTIVITIES: UpcomingActivitiesWidget,
  NEWS_RECENT:         NewsRecentWidget,
};

export default WIDGET_REGISTRY;
