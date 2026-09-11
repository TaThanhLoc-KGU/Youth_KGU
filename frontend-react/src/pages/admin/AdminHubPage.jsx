import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, LogOut, Newspaper, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useVisibleAdminGroups } from '../../config/adminNav';
import useAuthStore from '../../stores/authStore';
import { ROUTES } from '../../utils/constants';

const TONE = {
  dashboard:   'bg-slate-100 text-slate-600',
  users:       'bg-blue-50 text-blue-600',
  org:         'bg-violet-50 text-violet-600',
  activities:  'bg-emerald-50 text-emerald-600',
  news:        'bg-amber-50 text-amber-600',
  accounts:    'bg-cyan-50 text-cyan-600',
  permissions: 'bg-rose-50 text-rose-600',
  system:      'bg-slate-100 text-slate-600',
};

/** Trang "Menu chức năng" — hiển thị sau khi đăng nhập, không có sidebar. */
export default function AdminHubPage() {
  const { groupKey } = useParams();
  const navigate = useNavigate();
  const groups = useVisibleAdminGroups();
  const { user, logout } = useAuthStore();
  const [kw, setKw] = useState('');

  const activeGroup = groupKey ? groups.find((g) => g.key === groupKey) : null;

  // tìm nhanh xuyên cụm
  const ketQuaTim = useMemo(() => {
    const q = kw.trim().toLowerCase();
    if (!q) return null;
    const out = [];
    groups.forEach((g) => g.items.forEach((it) => {
      if (it.label.toLowerCase().includes(q)) out.push({ ...it, groupLabel: g.label });
    }));
    return out;
  }, [kw, groups]);

  const doLogout = async () => { try { await logout(); } catch {} window.location.href = ROUTES.LOGIN; };
  const openItem = (path) => navigate(path);
  const openGroup = (g) => {
    if (g.key === 'dashboard' || g.items.length === 1) openItem(g.items[0].path);
    else navigate(`/admin/hub/${g.key}`);
  };

  const gio = new Date().getHours();
  const chao = gio < 11 ? 'Chào buổi sáng' : gio < 14 ? 'Chào buổi trưa' : gio < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <img src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png" alt="" className="w-5 h-5 object-contain" />
            </div>
            <span className="font-bold text-slate-800 truncate">Youth KGU</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Link to="/news" className="text-sm text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg hover:bg-slate-100 inline-flex items-center gap-1.5">
              <Newspaper className="w-4 h-4" /><span className="hidden sm:inline">Trang tin tức</span>
            </Link>
            <Link to={ROUTES.PROFILE} className="text-sm text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg hover:bg-slate-100 hidden sm:block">
              Hồ sơ
            </Link>
            <button onClick={doLogout} className="text-sm text-rose-500 hover:bg-rose-50 px-2 py-1.5 rounded-lg inline-flex items-center gap-1.5">
              <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {activeGroup ? (
          /* ---- Trong 1 phân hệ: chọn chức năng con ---- */
          <>
            <button onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4">
              <ArrowLeft className="w-4 h-4" /> Menu chức năng
            </button>
            <div className="flex items-center gap-3 mb-6">
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${TONE[activeGroup.key] || TONE.system}`}>
                <activeGroup.icon className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{activeGroup.label}</h1>
                <p className="text-sm text-slate-500">{activeGroup.desc}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeGroup.items.map((it) => (
                <button key={it.path} onClick={() => openItem(it.path)}
                  className="group text-left rounded-xl bg-white ring-1 ring-slate-200 p-4 hover:ring-primary hover:shadow-md transition-all">
                  <span className={`inline-flex w-10 h-10 rounded-lg items-center justify-center mb-3 ${TONE[activeGroup.key] || TONE.system}`}>
                    <it.icon className="w-5 h-5" />
                  </span>
                  <p className="font-semibold text-slate-800 group-hover:text-primary">{it.label}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* ---- Menu gốc: chọn phân hệ ---- */
          <>
            <div className="mb-6">
              <p className="text-sm text-slate-500">{chao},</p>
              <h1 className="text-2xl font-bold text-slate-900">{user?.hoTen || user?.username}</h1>
              <p className="text-sm text-slate-500 mt-1">Chọn phân hệ chức năng để bắt đầu</p>
            </div>

            <div className="relative mb-6 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="Tìm nhanh chức năng…"
                className="w-full h-10 pl-9 pr-3 rounded-lg ring-1 ring-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary/30 outline-none" />
            </div>

            {ketQuaTim ? (
              <div className="rounded-xl bg-white ring-1 ring-slate-200 divide-y divide-slate-100">
                {ketQuaTim.length === 0 && <p className="p-4 text-sm text-slate-400">Không tìm thấy chức năng phù hợp</p>}
                {ketQuaTim.map((it) => (
                  <button key={it.path} onClick={() => openItem(it.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
                    <it.icon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{it.label}</span>
                    <span className="text-xs text-slate-400 ml-auto">{it.groupLabel}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {groups.map((g) => (
                  <button key={g.key} onClick={() => openGroup(g)}
                    className="group text-left rounded-2xl bg-white ring-1 ring-slate-200 p-5 hover:ring-primary hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between">
                      <span className={`w-12 h-12 rounded-xl flex items-center justify-center ${TONE[g.key] || TONE.system}`}>
                        <g.icon className="w-6 h-6" />
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="font-bold text-slate-800 mt-4 group-hover:text-primary">{g.label}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{g.desc}</p>
                    {g.key !== 'dashboard' && (
                      <p className="text-[11px] text-slate-400 mt-2">{g.items.length} chức năng</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
