import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const EVENT_COLORS = {
  follow:         'bg-green-100 text-green-700 border-green-200',
  unfollow:       'bg-red-100 text-red-700 border-red-200',
  user_send_text: 'bg-blue-100 text-blue-700 border-blue-200',
  REPLY_SENT:     'bg-purple-100 text-purple-700 border-purple-200',
  TOKEN_AUTO_EXCHANGE: 'bg-teal-100 text-teal-700 border-teal-200',
  ERROR:          'bg-orange-100 text-orange-700 border-orange-200',
  unknown:        'bg-gray-100 text-gray-600 border-gray-200',
};

export default function ZaloDebugPage() {
  const [tab, setTab]           = useState('events');
  const [events, setEvents]     = useState([]);
  const [autoRefresh, setAuto]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [stats, setStats]       = useState(null);

  // Tab liên kết
  const [linked, setLinked]     = useState([]);
  const [linkedTotal, setLinkedTotal] = useState(0);
  const [linkedPage, setLinkedPage]   = useState(0);
  const [linkedLoading, setLinkedLoading] = useState(false);
  const [keyword, setKeyword]   = useState('');

  const fetchEvents = useCallback(async () => {
    try {
      const [evRes, stRes] = await Promise.all([
        api.get('/api/zalo/events'),
        api.get('/api/zalo/stats'),
      ]);
      setEvents(evRes.data || []);
      setStats(stRes.data || null);
    } catch {}
  }, []);

  const fetchLinked = useCallback(async (page = 0, kw = '') => {
    setLinkedLoading(true);
    try {
      const res = await api.get('/api/zalo/linked-users', { params: { page, size: 20, keyword: kw } });
      setLinked(res.data.content || []);
      setLinkedTotal(res.data.totalElements || 0);
      setLinkedPage(page);
    } catch {}
    finally { setLinkedLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchEvents, 3000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchEvents]);

  useEffect(() => {
    if (tab === 'linked') fetchLinked(0, keyword);
  }, [tab]);

  const clearEvents = async () => {
    await api.delete('/api/zalo/events');
    setEvents([]);
    setSelected(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLinked(0, keyword);
  };

  const unlinkUser = async (maSv) => {
    if (!window.confirm(`Hủy liên kết Zalo của sinh viên ${maSv}?`)) return;
    await api.delete(`/api/zalo/unlink/${maSv}`);
    fetchLinked(linkedPage, keyword);
    fetchEvents();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">📱</span> Zalo OA
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý kết nối Zalo Official Account</p>
        </div>
        {tab === 'events' && (
          <div className="flex items-center gap-2">
            <button onClick={() => setAuto(v => !v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                autoRefresh ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}>
              {autoRefresh ? '⟳ Auto (3s)' : '⏸ Paused'}
            </button>
            <button onClick={fetchEvents}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50">
              Refresh
            </button>
            <button onClick={clearEvents}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50">
              Xóa log
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Tổng SV', value: stats.tongSinhVien, color: 'text-gray-800' },
            { label: 'Đã liên kết Zalo', value: stats.daLienKet, color: 'text-green-600' },
            { label: 'Chưa liên kết', value: stats.chuaLienKet, color: 'text-orange-500' },
            { label: 'Tỉ lệ', value: stats.tiLe, color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'events', label: '🔍 Sự kiện' },
          { key: 'linked', label: '👥 Đã liên kết' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Sự kiện */}
      {tab === 'events' && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3 text-sm">
            <span className="text-blue-500 font-medium whitespace-nowrap">Webhook URL:</span>
            <code className="text-blue-800 break-all">https://tuoitre.vnkgu.edu.vn/api/zalo/webhook</code>
            <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
              events.length > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {events.length > 0 ? '✓ Đang nhận sự kiện' : 'Chưa có sự kiện'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-gray-700 text-sm">Sự kiện gần nhất ({events.length}/50)</span>
                {autoRefresh && <span className="text-xs text-green-500 animate-pulse">● Live</span>}
              </div>
              {events.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-sm">
                  <div className="text-4xl mb-2">📭</div>
                  Chưa có sự kiện nào.
                </div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
                  {events.map((ev, i) => (
                    <button key={i} onClick={() => setSelected(ev)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selected === ev ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${EVENT_COLORS[ev.event] || EVENT_COLORS.unknown}`}>
                          {ev.event}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto">{ev.time}</span>
                      </div>
                      {ev.senderId && <p className="text-xs text-gray-500 mt-1 truncate">User: {ev.senderId}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-700 text-sm">Raw payload</span>
              </div>
              {selected ? (
                <pre className="p-4 text-xs text-gray-700 overflow-auto max-h-[480px] bg-gray-50 font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(selected.raw, null, 2)}
                </pre>
              ) : (
                <div className="py-16 text-center text-gray-400 text-sm">Chọn 1 sự kiện để xem chi tiết</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Tab: Đã liên kết */}
      {tab === 'linked' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="Tìm theo MSSV hoặc tên..."
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1 outline-none focus:border-blue-400"
              />
              <button type="submit"
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Tìm
              </button>
            </form>
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {linkedTotal} sinh viên
            </span>
            <button onClick={() => fetchLinked(linkedPage, keyword)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50">
              ↻ Làm mới
            </button>
          </div>

          {/* Table */}
          {linkedLoading ? (
            <div className="py-16 text-center text-gray-400">Đang tải...</div>
          ) : linked.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              <div className="text-4xl mb-2">🔗</div>
              Chưa có sinh viên nào liên kết Zalo
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <th className="text-left px-4 py-2.5 font-medium">MSSV</th>
                    <th className="text-left px-4 py-2.5 font-medium">Họ tên</th>
                    <th className="text-left px-4 py-2.5 font-medium">Lớp</th>
                    <th className="text-left px-4 py-2.5 font-medium">Khoa</th>
                    <th className="text-left px-4 py-2.5 font-medium">Zalo ID</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {linked.map(sv => (
                    <tr key={sv.maSv} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{sv.maSv}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{sv.hoTen}</td>
                      <td className="px-4 py-3 text-gray-600">{sv.lop || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{sv.khoa || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400 truncate max-w-[120px]">{sv.zaloUserId}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => unlinkUser(sv.maSv)}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline">
                          Hủy liên kết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {linkedTotal > 20 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
              <span>Trang {linkedPage + 1} / {Math.ceil(linkedTotal / 20)}</span>
              <div className="flex gap-2">
                <button disabled={linkedPage === 0}
                  onClick={() => fetchLinked(linkedPage - 1, keyword)}
                  className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">
                  ← Trước
                </button>
                <button disabled={(linkedPage + 1) * 20 >= linkedTotal}
                  onClick={() => fetchLinked(linkedPage + 1, keyword)}
                  className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
