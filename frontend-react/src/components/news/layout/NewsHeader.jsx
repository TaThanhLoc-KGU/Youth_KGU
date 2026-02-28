import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, User, LogIn, Menu, X, ChevronDown } from 'lucide-react';
import newsService from '../../../services/newsService';
import useAuthStore from '../../../stores/authStore';

const NewsHeader = ({ onMenuToggle, menuOpen }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
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
  const doanCats = tree.filter((c) => c.toChuc === 'DOAN');
  const hoiCats  = tree.filter((c) => c.toChuc === 'HOI');
  const banCats  = tree.filter((c) => c.toChuc === 'BAN_DOI_CLB');
  const chungCats = tree.filter((c) => c.toChuc === 'CHUNG' || !c.toChuc);

  const navItems = [
    { label: 'Trang chủ', path: '/news', cats: [] },
    { label: 'Đoàn Thanh niên', cats: doanCats },
    { label: 'Hội Sinh viên', cats: hoiCats },
    { label: 'Ban – Đội – CLB', cats: banCats },
    ...(chungCats.length ? [{ label: 'Chung', cats: chungCats }] : []),
    { label: 'Văn bản', path: '/news/van-ban', cats: [] },
  ];

  return (
    <header ref={headerRef} className="bg-enews-700 text-white shadow-md sticky top-0 z-50">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 hover:bg-enews-600 rounded-lg transition-colors"
          onClick={onMenuToggle}
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
            <div className="text-xs text-enews-200">Trường Đại học Kiên Giang</div>
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
            <button onClick={() => setSearchOpen(true)} className="p-2 hover:bg-enews-600 rounded-lg transition-colors">
              <Search className="w-5 h-5" />
            </button>
          )}

          {isAuthenticated ? (
            <Link to="/profile" className="flex items-center gap-1.5 text-sm hover:bg-enews-600 px-3 py-1.5 rounded-lg transition-colors">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline truncate max-w-24">{user?.hoTen || user?.username}</span>
            </Link>
          ) : (
            <Link to="/login" className="flex items-center gap-1.5 text-sm bg-white text-enews-700 hover:bg-enews-50 px-3 py-1.5 rounded-lg font-medium transition-colors">
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>

      {/* Navigation bar */}
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
                {item.path ? (
                  <Link
                    to={item.path}
                    className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-enews-100 hover:text-white hover:bg-enews-700 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-enews-100 hover:text-white hover:bg-enews-700 transition-colors">
                    {item.label}
                    {item.cats?.length > 0 && <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}

                {/* Dropdown */}
                {item.cats?.length > 0 && openMenu === item.label && (
                  <div className="absolute top-full left-0 bg-white shadow-xl rounded-b-xl border border-gray-100 min-w-52 z-50">
                    {item.cats.map((cat) => (
                      <div key={cat.id} className="group relative">
                        <Link
                          to={`/${cat.fullPathSlug}`}
                          className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-enews-50 hover:text-enews-700 transition-colors"
                        >
                          {cat.ten}
                          {cat.children?.length > 0 && <ChevronDown className="w-3 h-3 -rotate-90" />}
                        </Link>
                        {/* Level 3 flyout */}
                        {cat.children?.length > 0 && (
                          <div className="hidden group-hover:block absolute left-full top-0 bg-white shadow-xl rounded-r-xl border border-gray-100 min-w-48 z-50">
                            {cat.children.map((sub) => (
                              <Link
                                key={sub.id}
                                to={`/${sub.fullPathSlug}`}
                                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-enews-50 hover:text-enews-700 transition-colors"
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
    </header>
  );
};

export default NewsHeader;
