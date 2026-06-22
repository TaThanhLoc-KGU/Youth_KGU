import { useState, useEffect } from 'react';
import { getClubNews } from '../services/api';
import { Calendar, User } from 'lucide-react';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy dữ liệu mock nếu API lỗi, vì hiện tại backend có thể chưa chạy hoặc chưa có data
    const fetchNews = async () => {
      setLoading(true);
      const data = await getClubNews();
      if (data && data.content && data.content.length > 0) {
        setNews(data.content);
      } else {
        // Mock data để demo giao diện
        setNews([
          {
            id: 1,
            tieuDe: 'Tuyển thành viên Gen 4 - Hành trình mới bắt đầu',
            tomTat: 'CLB Truyền thông và Máy tính chính thức mở đợt tuyển thành viên mới cho năm học này. Hãy cùng chúng tôi tạo nên những điều tuyệt vời.',
            ngayXuatBan: '2026-06-01',
            nguoiTao: 'Ban Truyền Thông',
            anhDaiDien: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800'
          },
          {
            id: 2,
            tieuDe: 'Workshop Kỹ năng Chụp ảnh Sự kiện',
            tomTat: 'Buổi training kỹ năng nhiếp ảnh do các anh chị cựu thành viên hướng dẫn dành riêng cho các bạn ban Hình Ảnh.',
            ngayXuatBan: '2026-05-20',
            nguoiTao: 'Ban Chuyên Môn',
            anhDaiDien: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800'
          },
          {
            id: 3,
            tieuDe: 'Hỗ trợ kỹ thuật Lễ Khai Giảng 2026',
            tomTat: 'Đội kỹ thuật IT của CLB đã xuất sắc hoàn thành nhiệm vụ livestream và hỗ trợ âm thanh ánh sáng cho Lễ Khai Giảng.',
            ngayXuatBan: '2026-05-15',
            nguoiTao: 'Ban IT',
            anhDaiDien: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800'
          }
        ]);
      }
      setLoading(false);
    };

    fetchNews();
  }, []);

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Tin tức & Hoạt động</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Cập nhật những thông tin, sự kiện và bài viết mới nhất từ Câu lạc bộ.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: '40px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item) => (
            <div key={item.id} className="glass-card flex flex-col delay-100" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '200px', overflow: 'hidden' }}>
                <img 
                  src={item.anhDaiDien || 'https://via.placeholder.com/400x200?text=No+Image'} 
                  alt={item.tieuDe}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'var(--transition)' }}
                  onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                />
              </div>
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>{item.tieuDe}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px', flex: 1 }}>{item.tomTat}</p>
                <div className="flex justify-between items-center" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{new Date(item.ngayXuatBan).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span>{item.nguoiTao}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default News;
