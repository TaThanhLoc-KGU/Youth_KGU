import { ArrowRight, Users, Camera, Laptop } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center text-center" style={{ minHeight: '80vh', padding: '60px 24px' }}>
        <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
          <div className="glass" style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', color: 'var(--primary-dark)', fontWeight: '600', fontSize: '0.9rem', marginBottom: '16px' }}>
            ✨ Chào mừng đến với ngôi nhà chung
          </div>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '16px' }}>
            Nơi Đam Mê Gặp Gỡ <br />
            <span className="text-gradient">Công Nghệ & Nghệ Thuật</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '32px' }}>
            Câu lạc bộ Truyền thông và Máy tính - Nơi chúng tôi biến những ý tưởng sáng tạo thành hiện thực qua lăng kính và dòng code.
          </p>
          <div className="flex gap-4">
            <Link to="/members" className="btn btn-primary">
              Khám phá Thành viên <ArrowRight size={20} />
            </Link>
            <Link to="/news" className="btn btn-secondary">
              Xem Tin tức CLB
            </Link>
          </div>
        </div>
      </section>

      {/* Features / Activities */}
      <section className="container" style={{ padding: '80px 24px' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card flex flex-col items-center text-center gap-4">
            <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '50%', color: 'var(--primary)' }}>
              <Camera size={32} />
            </div>
            <h3>Truyền thông</h3>
            <p style={{ color: 'var(--text-muted)' }}>Ghi lại những khoảnh khắc đẹp nhất của thanh xuân qua những khung hình và thước phim chuyên nghiệp.</p>
          </div>
          
          <div className="glass-card flex flex-col items-center text-center gap-4">
            <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '50%', color: 'var(--primary)' }}>
              <Laptop size={32} />
            </div>
            <h3>Máy tính & IT</h3>
            <p style={{ color: 'var(--text-muted)' }}>Cùng nhau học hỏi, phát triển ứng dụng và hỗ trợ kỹ thuật cho các hoạt động của trường.</p>
          </div>

          <div className="glass-card flex flex-col items-center text-center gap-4">
            <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '50%', color: 'var(--primary)' }}>
              <Users size={32} />
            </div>
            <h3>Kết nối & Đam mê</h3>
            <p style={{ color: 'var(--text-muted)' }}>Xây dựng một tập thể gắn kết, năng động và cùng nhau chia sẻ đam mê.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
