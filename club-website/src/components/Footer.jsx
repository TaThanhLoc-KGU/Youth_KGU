const Footer = () => {
  return (
    <footer style={{ backgroundColor: 'var(--text-main)', color: 'var(--text-muted)', padding: '48px 0 24px', marginTop: 'auto' }}>
      <div className="container grid grid-cols-1 md:grid-cols-3 gap-8" style={{ paddingBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex flex-col gap-4">
          <h3 style={{ color: 'white', fontFamily: 'Outfit, sans-serif' }}>CLB Truyền Thông & Máy Tính</h3>
          <p>Câu lạc bộ chuyên về truyền thông số, nhiếp ảnh, quay phim và ứng dụng công nghệ thông tin tại Youth KGU.</p>
        </div>
        <div className="flex flex-col gap-4">
          <h4 style={{ color: 'white' }}>Liên kết</h4>
          <a href="/" style={{ color: 'var(--text-muted)' }}>Trang chủ</a>
          <a href="/members" style={{ color: 'var(--text-muted)' }}>Thành viên</a>
          <a href="/news" style={{ color: 'var(--text-muted)' }}>Tin tức</a>
        </div>
        <div className="flex flex-col gap-4">
          <h4 style={{ color: 'white' }}>Liên hệ</h4>
          <p>Email: media.it.club@student.kgu.edu.vn</p>
          <p>Fanpage: facebook.com/youth.kgu.media</p>
        </div>
      </div>
      <div className="container flex justify-center items-center" style={{ paddingTop: '24px' }}>
        <p>© 2026 CLB Truyền Thông & Máy Tính. Quản lý bởi Youth KGU.</p>
      </div>
    </footer>
  );
};

export default Footer;
