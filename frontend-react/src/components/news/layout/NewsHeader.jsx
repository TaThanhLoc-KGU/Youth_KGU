import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, User, LogIn, Menu, X, ChevronDown, ChevronRight, Zap, LayoutDashboard } from 'lucide-react';
import newsService from '../../../services/newsService';
import useAuthStore from '../../../stores/authStore';
import { PERMISSIONS } from '../../../utils/constants';

/* ── Mobile accordion nav list (bottom drawer) ── */
const MobileNavList = ({ navItems, onClose }) => {
  const [expanded, setExpanded] = useState({});

  const toggle = (label) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <nav>
      {/* Highlighted items */}
      <div className="px-4 pt-2 pb-3 flex flex-col gap-2 border-b border-gray-100">
        {navItems.filter(i => i.highlight).map(item => (
          <Link
            key={item.label}
            to={item.path}
            onClick={onClose}
            className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-gray-900 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 rounded-xl transition-colors shadow-sm"
          >
            <Zap className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </div>

      {/* Regular nav items */}
      <ul className="py-1 pb-8">
        {navItems.filter(i => !i.highlight).map((item) => {
          const hasChildren = item.cats?.length > 0;
          const isOpen = expanded[item.label];

          return (
            <li key={item.label} className="border-b border-gray-100 last:border-0">
              <div className="flex items-stretch">
                {item.path ? (
                  <Link
                    to={item.path}
                    onClick={!hasChildren ? onClose : undefined}
                    className="flex-1 flex items-center px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="flex-1 flex items-center px-5 py-3.5 text-sm font-semibold text-gray-500">
                    {item.label}
                  </span>
                )}
                {hasChildren && (
                  <button
                    onClick={() => toggle(item.label)}
                    className="px-4 text-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    aria-label={isOpen ? 'Thu gọn' : 'Mở rộng'}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                )}
              </div>

              {/* Sub-items (accordion) */}
              {hasChildren && isOpen && (
                <ul className="bg-gray-50">
                  {item.cats.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        to={`/${cat.fullPathSlug}`}
                        className="flex items-center pl-10 pr-5 py-3 text-sm text-gray-600 hover:bg-gray-100 hover:text-primary active:bg-gray-200 transition-colors border-t border-gray-100"
                        onClick={onClose}
                      >
                        <ChevronRight className="w-3 h-3 mr-2 opacity-40 shrink-0" />
                        {cat.ten}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

const NewsHeader = ({ onMenuToggle, menuOpen, onMenuClose }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, permissions } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const headerRef = useRef(null);

  // Quyền vào trang quản trị
  const canAdmin = isAuthenticated && permissions.some(p => [
    PERMISSIONS.DANG_TIN_TUC,
    PERMISSIONS.SUA_TIN_TUC,
    PERMISSIONS.DUYET_TIN_TUC,
    PERMISSIONS.QUAN_LY_VAN_BAN,
    PERMISSIONS.XEM_THONG_KE,
    PERMISSIONS.XEM_HOAT_DONG
  ].includes(p));

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
    { label: 'Biểu mẫu', path: '/bieu-mau', cats: [] },
    { label: 'Hoạt động', path: '/hoat-dong', cats: [], highlight: true },
    { label: 'Bình chọn', path: '/binh-chon', cats: [], highlight: true },
  ];

  const closeDrawer = onMenuClose || onMenuToggle;

  return (
    <header ref={headerRef} className="bg-white border-b border-gray-200 sticky top-0 z-50">

      {/* ── Mobile header (< lg) ── */}
      <div className="lg:hidden h-14 flex items-center px-3 gap-2">
        {/* Logo */}
        <Link to="/news" className="flex items-center gap-2 flex-shrink-0 mr-auto">
          <img
            src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
            alt="Logo"
            className="w-8 h-8 object-contain"
          />
          <div className="leading-tight">
            <div className="font-bold text-sm text-gray-900">Youth KGU</div>
            <div className="text-[10px] text-gray-400 -mt-0.5">Đoàn – Hội KGU</div>
          </div>
        </Link>

        {/* Search button */}
        <button
          onClick={() => setSearchOpen(v => !v)}
          className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Tìm kiếm"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Login / Avatar */}
        {isAuthenticated ? (
          <Link
            to="/profile"
            className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Tài khoản"
          >
            <User className="w-5 h-5" />
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-xs font-medium bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            Đăng nhập
          </Link>
        )}

        {/* Hamburger */}
        <button
          className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
          onClick={onMenuToggle}
          aria-label="Mở menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile search bar (expandable) */}
      {searchOpen && (
        <div className="lg:hidden px-3 pb-2">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tin tức..."
              className="w-full bg-gray-100 rounded-full pl-9 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-colors"
            />
          </form>
        </div>
      )}

      {/* ── Desktop header (lg+) ── */}
      {/* Row 1 */}
      <div className="hidden lg:flex max-w-7xl mx-auto px-6 h-16 items-center gap-4">
        {/* Logo */}
        <Link to="/news" className="flex items-center gap-2.5 flex-shrink-0">
          <img
            src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
            alt="Logo"
            className="w-9 h-9 object-contain"
          />
          <div className="leading-tight">
            <div className="font-bold text-base text-gray-900">Youth KGU</div>
            <div className="text-xs text-gray-400 -mt-0.5">Đoàn – Hội KGU</div>
          </div>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xs mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tin tức..."
            className="w-full bg-gray-100 rounded-full pl-9 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-colors"
          />
        </form>

        {/* Auth */}
        <div className="flex items-center gap-2 ml-auto">
          {isAuthenticated ? (
            <>
              {canAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-1.5 text-sm font-medium text-primary border border-primary/30 hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Quản trị
                </Link>
              )}
              <Link
                to="/profile"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
                  {(user?.hoTen || user?.username || 'U')[0].toUpperCase()}
                </div>
                <span className="truncate max-w-28">{user?.hoTen || user?.username}</span>
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-sm font-medium bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Đăng nhập
            </Link>
          )}
        </div>
      </div>

      {/* Row 2 – Nav bar */}
      <nav className="hidden lg:block bg-primary">
        <div className="max-w-7xl mx-auto px-6">
          <ul className="flex items-center h-10">
            {navItems.map((item) => (
              <li
                key={item.label}
                className="relative h-full flex items-center"
                onMouseEnter={() => item.cats?.length && setOpenMenu(item.label)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                {item.highlight ? (
                  item.path ? (
                    <Link
                      to={item.path}
                      className="flex items-center gap-1.5 px-3 py-1 mx-1 text-sm font-bold text-gray-900 bg-yellow-400 hover:bg-yellow-300 rounded-full transition-colors whitespace-nowrap"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {item.label}
                    </Link>
                  ) : (
                    <button className="flex items-center gap-1.5 px-3 py-1 mx-1 text-sm font-bold text-gray-900 bg-yellow-400 hover:bg-yellow-300 rounded-full transition-colors whitespace-nowrap">
                      <Zap className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  )
                ) : (
                  item.path ? (
                    <Link
                      to={item.path}
                      className="flex items-center gap-1 h-full px-4 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                    >
                      {item.label}
                      {item.cats?.length > 0 && <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
                    </Link>
                  ) : (
                    <button className="flex items-center gap-1 h-full px-4 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap">
                      {item.label}
                      {item.cats?.length > 0 && <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
                    </button>
                  )
                )}

                {/* Dropdown */}
                {item.cats?.length > 0 && openMenu === item.label && (
                  <div className="absolute top-full left-0 bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[200px] z-50">
                    {item.cats.map((cat) => (
                      <div key={cat.id} className="group/sub relative">
                        <Link
                          to={`/${cat.fullPathSlug}`}
                          className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                          onClick={() => setOpenMenu(null)}
                        >
                          <span>{cat.ten}</span>
                          {cat.children?.length > 0 && (
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          )}
                        </Link>

                        {/* Level-3 flyout */}
                        {cat.children?.length > 0 && (
                          <div className="hidden group-hover/sub:block absolute left-full top-0 bg-white shadow-xl rounded-xl border border-gray-100 min-w-[190px] z-50 py-2">
                            {cat.children.map((sub) => (
                              <Link
                                key={sub.id}
                                to={`/${sub.fullPathSlug}`}
                                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
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

      {/* ── Mobile bottom drawer ── */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={closeDrawer}
          />
          {/* Bottom sheet */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto animate-slide-up">
            {/* Drag handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />
            {/* Header row */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Menu</span>
              <button
                onClick={closeDrawer}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Đóng menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <MobileNavList navItems={navItems} onClose={closeDrawer} />
          </div>
        </>
      )}
    </header>
  );
};

export default NewsHeader;
