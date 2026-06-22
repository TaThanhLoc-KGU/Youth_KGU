import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MonitorPlay, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Thành viên', path: '/members' },
    { name: 'Tin tức', path: '/news' },
  ];

  return (
    <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="container flex justify-between items-center" style={{ height: '70px' }}>
        <Link to="/" className="flex items-center gap-2" style={{ color: 'var(--primary-dark)', fontWeight: 'bold', fontSize: '1.25rem' }}>
          <MonitorPlay size={28} />
          <span className="hidden-mobile">CLB Truyền Thông & Máy Tính</span>
          <span className="only-mobile">CLB TT&MT</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="flex items-center gap-6 desktop-only">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                fontWeight: 600,
                color: location.pathname === link.path ? 'var(--primary)' : 'var(--text-main)',
                borderBottom: location.pathname === link.path ? '2px solid var(--primary)' : 'none',
                paddingBottom: '4px'
              }}
            >
              {link.name}
            </Link>
          ))}
          
          {isLoggedIn ? (
            <div className="flex gap-3">
              <Link to="/admin" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                <LayoutDashboard size={18} /> Quản trị
              </Link>
              <button onClick={handleLogout} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem', background: '#ef4444' }}>
                <LogOut size={18} /> Thoát
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
              Đăng nhập BCN
            </Link>
          )}
        </nav>

        {/* Mobile Toggle */}
        <button 
          className="btn btn-secondary mobile-only" 
          style={{ padding: '8px' }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Nav */}
      {isMenuOpen && (
        <div className="glass-card animate-fade-in" style={{ position: 'absolute', top: '70px', left: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 40 }}>
           {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMenuOpen(false)}
              style={{ fontWeight: 600, color: location.pathname === link.path ? 'var(--primary)' : 'var(--text-main)' }}
            >
              {link.name}
            </Link>
          ))}
          {isLoggedIn ? (
            <>
              <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="btn btn-secondary">
                <LayoutDashboard size={18} /> Quản trị CLB
              </Link>
              <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="btn btn-primary" style={{ background: '#ef4444' }}>
                <LogOut size={18} /> Đăng xuất
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="btn btn-primary">
              Đăng nhập Ban Chủ Nhiệm
            </Link>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .hidden-mobile { display: none; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
          .only-mobile { display: none; }
          .desktop-only { display: flex !important; }
        }
      `}</style>
    </header>
  );
};

export default Header;
