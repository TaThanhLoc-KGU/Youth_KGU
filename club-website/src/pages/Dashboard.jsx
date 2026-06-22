import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, FileText, Users, CheckCircle, Check, X } from 'lucide-react';
import { getAdminNews, getAdminMembers, getPendingRequests, reviewRequest } from '../services/api';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  const [news, setNews] = useState([]);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      if (activeTab === 'news' || activeTab === 'overview') {
        const n = await getAdminNews();
        setNews(Array.isArray(n) ? n : (n.content || []));
      }
      if (activeTab === 'members' || activeTab === 'overview') {
        const m = await getAdminMembers();
        setMembers(Array.isArray(m) ? m : (m.content || []));
      }
      if (activeTab === 'requests' || activeTab === 'overview') {
        const r = await getPendingRequests();
        setRequests(Array.isArray(r) ? r : (r.content || []));
      }
    } catch (err) {
      console.error("Fetch data error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) {
        setLoading(true);
        await fetchData();
      }
    };
    load();
    return () => { isMounted = false; };
  }, [fetchData]);

  const handleReview = async (id, isApproved) => {
    try {
      await reviewRequest(id, isApproved);
      alert(isApproved ? 'Đã duyệt thành công!' : 'Đã từ chối!');
      setLoading(true);
      await fetchData();
    } catch {
      alert('Có lỗi xảy ra khi xử lý yêu cầu.');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 24px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>

      
      {/* Sidebar Navigation */}
      <div className="glass-card" style={{ width: '100%', maxWidth: '280px', height: 'fit-content', padding: '16px' }}>
        <div style={{ marginBottom: '24px', padding: '0 16px' }}>
          <h2 style={{ fontSize: '1.25rem' }}>Quản Trị CLB</h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', background: activeTab === 'overview' ? '' : 'transparent', color: activeTab === 'overview' ? '' : 'var(--text-main)', border: 'none', boxShadow: 'none' }}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={20} /> Tổng quan
          </button>
          <button 
            className={`btn ${activeTab === 'news' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', background: activeTab === 'news' ? '' : 'transparent', color: activeTab === 'news' ? '' : 'var(--text-main)', border: 'none', boxShadow: 'none' }}
            onClick={() => setActiveTab('news')}
          >
            <FileText size={20} /> Quản lý Tin tức
          </button>
          <button 
            className={`btn ${activeTab === 'members' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', background: activeTab === 'members' ? '' : 'transparent', color: activeTab === 'members' ? '' : 'var(--text-main)', border: 'none', boxShadow: 'none' }}
            onClick={() => setActiveTab('members')}
          >
            <Users size={20} /> Danh sách Thành viên
          </button>
          <button 
            className={`btn ${activeTab === 'requests' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', background: activeTab === 'requests' ? '' : 'transparent', color: activeTab === 'requests' ? '' : 'var(--text-main)', border: 'none', boxShadow: 'none' }}
            onClick={() => setActiveTab('requests')}
          >
            <CheckCircle size={20} /> Duyệt đăng ký
            {requests.length > 0 && (
              <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', marginLeft: 'auto' }}>
                {requests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, minWidth: '300px' }}>
        
        {loading && (
           <div className="flex justify-center items-center" style={{ padding: '40px' }}>
             <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
           </div>
        )}

        {!loading && activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            <div className="glass-card text-center">
              <h3 style={{ fontSize: '2rem', color: 'var(--primary)' }}>{news.length}</h3>
              <p style={{ color: 'var(--text-muted)' }}>Bài viết đã đăng</p>
            </div>
            <div className="glass-card text-center">
              <h3 style={{ fontSize: '2rem', color: 'var(--primary)' }}>{members.length}</h3>
              <p style={{ color: 'var(--text-muted)' }}>Thành viên hiện tại</p>
            </div>
            <div className="glass-card text-center">
              <h3 style={{ fontSize: '2rem', color: '#ef4444' }}>{requests.length}</h3>
              <p style={{ color: 'var(--text-muted)' }}>Yêu cầu chờ duyệt</p>
            </div>
          </div>
        )}

        {!loading && activeTab === 'news' && (
          <div className="glass-card animate-fade-in">
            <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Danh sách Tin tức</h3>
              <button className="btn btn-primary" style={{ padding: '8px 16px' }}>+ Đăng bài mới</button>
            </div>
            {news.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Chưa có tin tức nào.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {news.map(item => (
                  <div key={item.id || item.maTinTuc} style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{item.tieuDe}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Đăng ngày: {new Date(item.ngayDang || item.ngayTao || '2026-01-01').toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'members' && (
          <div className="glass-card animate-fade-in">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>Thành viên Câu lạc bộ</h3>
            {members.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Chưa có thành viên.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '12px 8px' }}>Họ Tên</th>
                      <th style={{ padding: '12px 8px' }}>Mã SV / Username</th>
                      <th style={{ padding: '12px 8px' }}>Vai trò</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: '500' }}>{member.hoTen || member.fullName || 'N/A'}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{member.username || member.maSv || 'N/A'}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ background: 'var(--bg-color)', color: 'var(--primary-dark)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                            {member.vaiTro || member.role || 'Thành viên'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'requests' && (
          <div className="glass-card animate-fade-in">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>Duyệt Đăng ký Thành viên mới</h3>
            {requests.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Không có yêu cầu nào đang chờ xử lý.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {requests.map((req, idx) => (
                  <div key={req.id || idx} className="flex justify-between items-center" style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{req.hoTen || req.fullName || 'Người đăng ký'}</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Mã SV: {req.maSv || req.username} • Lý do tham gia: {req.lyDo || req.reason || 'Đam mê'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleReview(req.id, true)} className="btn" style={{ padding: '8px', background: '#10b981', color: 'white' }} title="Duyệt">
                        <Check size={20} />
                      </button>
                      <button onClick={() => handleReview(req.id, false)} className="btn" style={{ padding: '8px', background: '#ef4444', color: 'white' }} title="Từ chối">
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
