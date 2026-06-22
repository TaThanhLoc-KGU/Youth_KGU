import { useState, useEffect } from 'react';
import { getClubMembers, getRegularMembers } from '../services/api';
import { Mail, Phone, Users, Star } from 'lucide-react';

const Members = () => {
  const [bcn, setBcn] = useState([]);
  const [thanhViens, setThanhViens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllMembers = async () => {
      setLoading(true);
      const [bcnData, tvData] = await Promise.all([
        getClubMembers(),
        getRegularMembers()
      ]);
      setBcn(bcnData || []);
      setThanhViens(tvData || []);
      setLoading(false);
    };

    fetchAllMembers();
  }, []);

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Thành viên Câu lạc bộ</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Gặp gỡ những gương mặt xuất sắc đứng sau các hoạt động của CLB Truyền Thông & Máy Tính.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: '40px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto flex flex-col gap-12">
          
          {/* BAN CHỦ NHIỆM */}
          <div>
            <div className="flex items-center gap-2 mb-6 border-b pb-2">
              <Star className="text-yellow-500" size={24} />
              <h2 className="text-2xl font-bold text-gray-800">Ban Chủ Nhiệm</h2>
            </div>
            {bcn.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Chưa có thông tin ban chủ nhiệm.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {bcn.map((member) => (
                  <div key={member.id || Math.random()} className="glass-card flex items-center p-4 rounded-xl hover:shadow-md transition-shadow">
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary-light)', flexShrink: 0 }} className="mr-6">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.tenNguoi || member.tenSv || 'Ẩn danh')}&background=0ea5e9&color=fff`} 
                        alt={member.tenNguoi || member.tenSv || 'Avatar'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    
                    <div className="flex-grow">
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '2px' }}>{member.tenNguoi || member.tenSv}</h3>
                      <p style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: '500' }}>{member.chucVu || 'Ban Chủ Nhiệm'}</p>
                      {member.donVi && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Đơn vị: {member.donVi}</p>}
                      {member.nhiemKy && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Nhiệm kỳ: {member.nhiemKy}</p>}
                    </div>

                    <div className="flex gap-4 items-center justify-end" style={{ minWidth: '100px' }}>
                      {member.emailLienHe && (
                        <a href={`mailto:${member.emailLienHe}`} style={{ color: 'var(--text-muted)' }} onMouseOver={(e) => e.target.style.color = 'var(--primary)'} onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'} title="Gửi email">
                          <Mail size={20} />
                        </a>
                      )}
                      {member.sdt && (
                        <a href={`tel:${member.sdt}`} style={{ color: 'var(--text-muted)' }} onMouseOver={(e) => e.target.style.color = 'var(--primary)'} onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'} title="Gọi điện">
                          <Phone size={20} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* THÀNH VIÊN */}
          <div>
            <div className="flex items-center gap-2 mb-6 border-b pb-2">
              <Users className="text-blue-500" size={24} />
              <h2 className="text-2xl font-bold text-gray-800">Thành viên Câu lạc bộ</h2>
            </div>
            {thanhViens.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Chưa có thông tin thành viên.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {thanhViens.map((member) => (
                  <div key={member.id || Math.random()} className="glass-card flex items-center p-4 rounded-xl hover:shadow-md transition-shadow">
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--border-color)', flexShrink: 0 }} className="mr-6">
                      <img 
                        src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.hoTen || 'Ẩn danh')}&background=f3f4f6&color=4b5563`} 
                        alt={member.hoTen || 'Avatar'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    
                    <div className="flex-grow">
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '2px' }}>{member.hoTen}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>{member.chucVuLabel || member.chucVu || 'Thành viên'}</p>
                      {member.tenLop && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Lớp: {member.tenLop}</p>}
                    </div>
                    
                    <div className="text-right text-sm" style={{ color: 'var(--text-muted)' }}>
                      {member.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Đang hoạt động</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Đã rời</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default Members;
