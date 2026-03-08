import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, User, LogIn, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import newsService from '../../../services/newsService';
import useAuthStore from '../../../stores/authStore';
import { PERMISSIONS } from '../../../utils/constants';

const NewsHeader = ({ onMenuToggle, menuOpen }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, permissions } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);

  // Quyền vào trang quản trị
  const canAdmin = isAuthenticated && permissions.some(p => [
    PERMISSIONS.DANG_TIN_TUC,
    PERMISSIONS.SUA_TIN_TUC,
    PERMISSIONS.DUYET_TIN_TUC,
    PERMISSIONS.QUAN_LY_VAN_BAN,
    PERMISSIONS.XEM_THONG_KE,
    PERMISSIONS.XEM_HOAT_DONG
  ].includes(p));
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const headerRef = useRef(null);

  const { data: tree = [] } = useQuery({
    queryKey: ['chuyen-muc-tree'],
    queryFn: () => newsService.getCayDanhMuc(),
    staleTime: 30 * 60 * 1000,
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/news?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Group top-level categories by toChuc
  const doanCats  = tree.filter((c) => c.toChuc === 'DOAN');
  const hoiCats   = tree.filter((c) => c.toChuc === 'HOI');
  const banCats   = tree.filter((c) => c.toChuc === 'BAN_DOI_CLB');
  const chungCats = tree.filter((c) => c.toChuc === 'CHUNG' || !c.toChuc);

  /**
   * Flatten level-1 cats into their level-2 children for the dropdown.
   * If a level-1 cat has no children, include the cat itself.
   */
  const flattenChildren = (cats) =>
    cats.flatMap((c) => (c.children?.length ? c.children : [c]));

  const navItems = [
    { label: 'Trang chủ', path: '/news', cats: [] },
    {
      label: 'Đoàn Thanh niên',
      path: doanCats[0] ? `/${doanCats[0].fullPathSlug}` : null,
      cats: flattenChildren(doanCats),
    },
    {
      label: 'Hội Sinh viên',
      path: hoiCats[0] ? `/${hoiCats[0].fullPathSlug}` : null,
      cats: flattenChildren(hoiCats),
    },
    {
      label: 'Ban – Đội – CLB',
      path: banCats[0] ? `/${banCats[0].fullPathSlug}` : null,
      cats: flattenChildren(banCats),
    },
    ...(chungCats.length
      ? [{
          label: 'Tin chung',
          path: chungCats[0] ? `/${chungCats[0].fullPathSlug}` : null,
          cats: flattenChildren(chungCats),
        }]
      : []),
    { label: 'Văn bản', path: '/van-ban', cats: [] },
  ];

  const navLinkCls =
    'flex items-center gap-1 px-4 py-3 text-sm font-medium text-enews-100 hover:text-white hover:bg-enews-700 transition-colors whitespace-nowrap';

  return (
    <header ref={headerRef} className="bg-enews-700 text-white shadow-md sticky top-0 z-50">
      {/* ── Top bar ── */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 hover:bg-enews-600 rounded-lg transition-colors"
          onClick={onMenuToggle}
          aria-label="Mở menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Logo */}
        <Link to="/news" className="flex items-center gap-2 flex-shrink-0">
          <img
            src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
            alt="Logo"
            className="w-9 h-9 object-contain"
          />
          <div className="hidden sm:block leading-tight">
            <div className="font-bold text-sm">ĐOÀN THANH NIÊN – HỘI SINH VIÊN</div>
            <div className="font-bold text-sm">TRƯỜNG ĐẠI HỌC KIÊN GIANG</div>
          </div>
        </Link>

        {/* Search + Auth */}
        <div className="flex items-center gap-2 ml-auto">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm..."
                className="bg-enews-600 text-white placeholder-enews-300 border border-enews-500 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-enews-300"
              />
              <button type="submit" className="p-1.5 hover:bg-enews-600 rounded-lg transition-colors">
                <Search className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setSearchOpen(false)} className="p-1.5 hover:bg-enews-600 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="p-2 hover:bg-enews-600 rounded-lg transition-colors" aria-label="Tìm kiếm">
              <Search className="w-5 h-5" />
            </button>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {canAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-1.5 text-xs bg-enews-600 hover:bg-enews-500 border border-enews-400 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  <span className="hidden sm:inline">Quản trị</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
              <Link to="/profile" className="flex items-center gap-1.5 text-sm hover:bg-enews-600 px-3 py-1.5 rounded-lg transition-colors">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline truncate max-w-24">{user?.hoTen || user?.username}</span>
              </Link>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-sm bg-white text-enews-700 hover:bg-enews-50 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Navigation bar (desktop only) ── */}
      <nav className="hidden lg:block bg-enews-800">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center">
            {navItems.map((item) => (
              <li
                key={item.label}
                className="relative"
                onMouseEnter={() => item.cats?.length && setOpenMenu(item.label)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                {/* Always render as Link if path exists, button otherwise */}
                {item.path ? (
                  <Link to={item.path} className={navLinkCls}>
                    {item.label}
                    {item.cats?.length > 0 && <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
                  </Link>
                ) : (
                  <button className={navLinkCls}>
                    {item.label}
                    {item.cats?.length > 0 && <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
                  </button>
                )}

                {/* ── Dropdown (level-2 subcategories shown directly) ── */}
                {item.cats?.length > 0 && openMenu === item.label && (
                  <div className="absolute top-full left-0 bg-white shadow-xl rounded-b-xl border border-gray-100 min-w-56 z-50 py-1">
                    {item.cats.map((cat) => (
                      <div key={cat.id} className="group relative">
                        <Link
                          to={`/${cat.fullPathSlug}`}
                          className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-enews-50 hover:text-enews-700 transition-colors"
                          onClick={() => setOpenMenu(null)}
                        >
                          <span>{cat.ten}</span>
                          {cat.children?.length > 0 && (
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          )}
                        </Link>

                        {/* Level-3 flyout */}
                        {cat.children?.length > 0 && (
                          <div className="hidden group-hover:block absolute left-full top-0 bg-white shadow-xl rounded-r-xl border border-gray-100 min-w-48 z-50 py-1">
                            {cat.children.map((sub) => (
                              <Link
                                key={sub.id}
                                to={`/${sub.fullPathSlug}`}
                                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-enews-50 hover:text-enews-700 transition-colors"
                                onClick={() => setOpenMenu(null)}
                              >
                                {sub.ten}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* ── Mobile nav drawer ── */}
      {menuOpen && (
        <div className="lg:hidden bg-enews-800 border-t border-enews-700 max-h-[calc(100vh-64px)] overflow-y-auto shadow-inner">
          <ul className="py-2">
            {navItems.map((item) => (
              <li key={item.label}>
                {item.path ? (
                  <Link
                    to={item.path}
                    className="block px-5 py-3 text-sm text-enews-100 hover:bg-enews-700 hover:text-white transition-colors"
                    onClick={onMenuToggle}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="block px-5 py-3 text-sm text-enews-200 font-semibold">
                    {item.label}
                  </span>
                )}
                {/* Sub-items on mobile */}
                {item.cats?.length > 0 && (
                  <ul className="bg-enews-900">
                    {item.cats.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          to={`/${cat.fullPathSlug}`}
                          className="block pl-10 pr-5 py-2.5 text-sm text-enews-200 hover:bg-enews-700 hover:text-white transition-colors"
                          onClick={onMenuToggle}
                        >
                          {cat.ten}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
};

export default NewsHeader;
