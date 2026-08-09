import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  MessageCircle, RotateCcw, MegaphoneIcon, Activity, Users, Inbox, Link2,
  RefreshCw, Pause, CheckCircle2, Unlink, Send, Lock,
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import SearchInput from '../../components/common/SearchInput';

const EVENT_BADGE = {
  follow:               { label: 'follow',               variant: 'success' },
  unfollow:              { label: 'unfollow',              variant: 'danger' },
  user_send_text:        { label: 'user_send_text',        variant: 'info' },
  REPLY_SENT:             { label: 'REPLY_SENT',             variant: 'purple' },
  TOKEN_AUTO_EXCHANGE:    { label: 'TOKEN_AUTO_EXCHANGE',    variant: 'primary' },
  RESEND_LIEN_KET:        { label: 'RESEND_LIEN_KET',        variant: 'success' },
  BROADCAST_LINKED_SENT:  { label: 'BROADCAST_LINKED_SENT',  variant: 'info' },
  BROADCAST_SENT:         { label: 'BROADCAST_SENT',         variant: 'info' },
  ERROR:                  { label: 'ERROR',                  variant: 'warning' },
  unknown:                { label: 'unknown',                variant: 'gray' },
};

const STAT_CARDS = [
  { key: 'tongSinhVien', label: 'Tổng SV',        color: 'text-slate-900' },
  { key: 'daLienKet',    label: 'Đã liên kết Zalo', color: 'text-emerald-600' },
  { key: 'chuaLienKet',  label: 'Chưa liên kết',   color: 'text-amber-600' },
  { key: 'tiLe',         label: 'Tỉ lệ',           color: 'text-blue-600' },
];

export default function ZaloDebugPage() {
  const { maKhoa, maClb } = useAuthStore();
  const canSend = !maKhoa && !maClb; // chỉ Đoàn trường (không giới hạn theo khoa/CLB) mới được gửi

  const [tab, setTab]           = useState('send');
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

  // Gửi lại thông báo "Liên kết thành công" cho SV đã liên kết (bù cho lần gửi lỗi do token hỏng)
  const [showResendConfirm, setShowResendConfirm] = useState(false);
  const [resendSending, setResendSending] = useState(false);

  // Soạn & gửi tin nhắn tùy chỉnh đến SV đã liên kết
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle]     = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);

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

  const unlinkUser = async (maSv) => {
    if (!window.confirm(`Hủy liên kết Zalo của sinh viên ${maSv}?`)) return;
    await api.delete(`/api/zalo/unlink/${maSv}`);
    fetchLinked(linkedPage, keyword);
    fetchEvents();
  };

  const resendLienKet = async () => {
    setResendSending(true);
    try {
      const res = await api.post('/api/zalo/resend-lien-ket');
      const { soCoZalo, soSinhVien } = res.data || {};
      toast.success(`Đang gửi lại xác nhận liên kết đến ${soCoZalo ?? '?'}/${soSinhVien ?? '?'} sinh viên`);
      setShowResendConfirm(false);
      fetchEvents();
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Gửi lại thất bại');
    } finally {
      setResendSending(false);
    }
  };

  const sendBroadcastToLinked = async () => {
    if (!broadcastMessage.trim()) return;
    setBroadcastSending(true);
    try {
      const res = await api.post('/api/zalo/broadcast-linked', {
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
      });
      const { soCoZalo, soSinhVien } = res.data || {};
      toast.success(`Đang gửi đến ${soCoZalo ?? '?'}/${soSinhVien ?? '?'} sinh viên đã liên kết Zalo`);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setShowComposeModal(false);
      fetchEvents();
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Gửi thông báo thất bại');
    } finally {
      setBroadcastSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Zalo OA</h1>
            <p className="text-slate-500 text-sm mt-0.5">Gửi tin nhắn và quản lý kết nối Zalo Official Account</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STAT_CARDS.map(s => (
            <Card key={s.key} className="p-4">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{stats[s.key]}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Gửi tin nhắn Zalo — tính năng chính */}
      <Card padding={false}>
        <Card.Header action={null}>
          <span className="font-semibold text-slate-800 text-sm">Gửi tin nhắn Zalo</span>
        </Card.Header>
        <Card.Body className="space-y-3">
          {!canSend && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-xs px-3 py-2">
              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
              Chỉ Đoàn trường mới được gửi thông báo Zalo hàng loạt. Tài khoản của bạn bị giới hạn theo {maKhoa ? 'khoa' : 'CLB'}.
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-xl border border-slate-100 p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" /> Gửi lại thông báo "Liên kết thành công"
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Gửi lại tin xác nhận liên kết (tên, MSSV, lớp, ngành, khoa riêng từng SV) cho toàn bộ {stats?.daLienKet ?? '...'} sinh viên đã liên kết — dùng khi trước đó gửi lỗi do access token hỏng.
              </p>
            </div>
            <Button
              variant="success" icon={RotateCcw}
              onClick={() => setShowResendConfirm(true)}
              disabled={!canSend}
              title={!canSend ? 'Chỉ Đoàn trường mới được gửi' : undefined}
              className="flex-shrink-0"
            >
              Gửi lại xác nhận
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-xl border border-slate-100 p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                <MegaphoneIcon className="w-3.5 h-3.5 text-primary" /> Soạn tin nhắn tùy chỉnh
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Soạn và gửi một tin nhắn bất kỳ đến toàn bộ {stats?.daLienKet ?? '...'} sinh viên đã liên kết Zalo — không gắn với hoạt động cụ thể.
              </p>
            </div>
            <Button
              variant="primary" icon={Send}
              onClick={() => setShowComposeModal(true)}
              disabled={!canSend}
              title={!canSend ? 'Chỉ Đoàn trường mới được gửi' : undefined}
              className="flex-shrink-0"
            >
              Soạn tin nhắn
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Tabs: Sự kiện / Đã liên kết */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { key: 'events', label: 'Sự kiện', icon: Activity },
          { key: 'linked', label: 'Đã liên kết', icon: Users },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
        <div className="w-px bg-slate-200 mx-1 my-1" />
        <button onClick={() => setTab('send')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'send' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'
          }`}>
          <MessageCircle className="w-3.5 h-3.5" /> Gửi tin nhắn
        </button>
      </div>

      {/* Tab: Sự kiện */}
      {tab === 'events' && (
        <>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3 text-sm">
            <span className="text-blue-600 font-medium whitespace-nowrap">Webhook URL:</span>
            <code className="text-blue-800 break-all text-xs">https://tuoitre.vnkgu.edu.vn/api/zalo/webhook</code>
            <Badge variant={events.length > 0 ? 'success' : 'warning'} className="ml-auto whitespace-nowrap">
              {events.length > 0 && <CheckCircle2 className="w-3 h-3 mr-1" />}
              {events.length > 0 ? 'Đang nhận sự kiện' : 'Chưa có sự kiện'}
            </Badge>
          </div>

          <div className="flex items-center justify-end gap-2 -mb-2">
            <Button
              size="sm" variant={autoRefresh ? 'success' : 'secondary'}
              icon={autoRefresh ? RefreshCw : Pause}
              onClick={() => setAuto(v => !v)}
            >
              {autoRefresh ? 'Auto (3s)' : 'Tạm dừng'}
            </Button>
            <Button size="sm" variant="outline" icon={RefreshCw} onClick={fetchEvents}>Làm mới</Button>
            <Button size="sm" variant="danger-ghost" onClick={clearEvents}>Xóa log</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card padding={false}>
              <Card.Header>
                <span className="font-semibold text-slate-700 text-sm">Sự kiện gần nhất ({events.length}/50)</span>
              </Card.Header>
              {events.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm">
                  <Inbox className="w-9 h-9 mx-auto mb-2 text-slate-300" />
                  Chưa có sự kiện nào.
                </div>
              ) : (
                <div className="divide-y divide-slate-50 max-h-[480px] overflow-y-auto">
                  {events.map((ev, i) => {
                    const badge = EVENT_BADGE[ev.event] || EVENT_BADGE.unknown;
                    return (
                      <button key={i} onClick={() => setSelected(ev)}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selected === ev ? 'bg-blue-50' : ''}`}>
                        <div className="flex items-center gap-2">
                          <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
                          <span className="text-xs text-slate-400 ml-auto">{ev.time}</span>
                        </div>
                        {ev.senderId && <p className="text-xs text-slate-500 mt-1 truncate">User: {ev.senderId}</p>}
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card padding={false}>
              <Card.Header>
                <span className="font-semibold text-slate-700 text-sm">Raw payload</span>
              </Card.Header>
              {selected ? (
                <pre className="p-4 text-xs text-slate-700 overflow-auto max-h-[480px] bg-slate-50 font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(selected.raw, null, 2)}
                </pre>
              ) : (
                <div className="py-16 text-center text-slate-400 text-sm">Chọn 1 sự kiện để xem chi tiết</div>
              )}
            </Card>
          </div>
        </>
      )}

      {/* Tab: Đã liên kết */}
      {tab === 'linked' && (
        <Card padding={false}>
          {/* Toolbar */}
          <Card.Header action={
            <Button size="sm" variant="outline" icon={RefreshCw} onClick={() => fetchLinked(linkedPage, keyword)}>
              Làm mới
            </Button>
          }>
            <div className="flex items-center gap-3">
              <SearchInput
                value={keyword}
                onChange={setKeyword}
                onSearch={(kw) => fetchLinked(0, kw)}
                placeholder="Tìm theo MSSV hoặc tên..."
              />
              <span className="text-sm text-slate-500 whitespace-nowrap">{linkedTotal} sinh viên</span>
            </div>
          </Card.Header>

          {/* Table */}
          {linkedLoading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Đang tải...</div>
          ) : linked.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              <Link2 className="w-9 h-9 mx-auto mb-2 text-slate-300" />
              Chưa có sinh viên nào liên kết Zalo
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <th className="text-left px-4 py-2.5 font-medium">MSSV</th>
                    <th className="text-left px-4 py-2.5 font-medium">Họ tên</th>
                    <th className="text-left px-4 py-2.5 font-medium">Lớp</th>
                    <th className="text-left px-4 py-2.5 font-medium">Khoa</th>
                    <th className="text-left px-4 py-2.5 font-medium">Zalo ID</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {linked.map(sv => (
                    <tr key={sv.maSv} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{sv.maSv}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{sv.hoTen}</td>
                      <td className="px-4 py-3 text-slate-600">{sv.lop || '—'}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{sv.khoa || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400 truncate max-w-[120px]">{sv.zaloUserId}</td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="danger-ghost" icon={Unlink} onClick={() => unlinkUser(sv.maSv)}>
                          Hủy liên kết
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {linkedTotal > 20 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
              <span>Trang {linkedPage + 1} / {Math.ceil(linkedTotal / 20)}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={linkedPage === 0} onClick={() => fetchLinked(linkedPage - 1, keyword)}>
                  ← Trước
                </Button>
                <Button size="sm" variant="outline" disabled={(linkedPage + 1) * 20 >= linkedTotal} onClick={() => fetchLinked(linkedPage + 1, keyword)}>
                  Sau →
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Confirm: gửi lại xác nhận liên kết */}
      <ConfirmDialog
        isOpen={showResendConfirm}
        onClose={() => setShowResendConfirm(false)}
        onConfirm={resendLienKet}
        title="Gửi lại thông báo liên kết"
        description={`Gửi lại tin xác nhận "Liên kết thành công" cho ${stats?.daLienKet ?? 'tất cả'} sinh viên đã liên kết Zalo. Dùng khi trước đó gửi lỗi do access token hỏng. Bạn có chắc chắn không?`}
        confirmLabel="Gửi lại"
        isLoading={resendSending}
      />

      {/* Modal: soạn tin nhắn tùy chỉnh */}
      <Modal
        isOpen={showComposeModal}
        onClose={() => { if (!broadcastSending) setShowComposeModal(false); }}
        title="Soạn tin nhắn Zalo"
        subtitle={`Gửi đến ${stats?.daLienKet ?? '...'} sinh viên đã liên kết Zalo`}
        icon={MessageCircle}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowComposeModal(false)} disabled={broadcastSending}>Hủy</Button>
            <Button
              variant="primary" icon={Send}
              onClick={sendBroadcastToLinked}
              isLoading={broadcastSending}
              disabled={!broadcastMessage.trim()}
            >
              Gửi đến {stats?.daLienKet ?? ''} SV
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Tiêu đề (tùy chọn)</label>
            <input
              value={broadcastTitle}
              onChange={e => setBroadcastTitle(e.target.value)}
              placeholder="VD: Thông báo từ Đoàn trường"
              className="form-input h-9 text-sm w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Nội dung</label>
            <textarea
              value={broadcastMessage}
              onChange={e => setBroadcastMessage(e.target.value)}
              placeholder="Nhập nội dung thông báo..."
              rows={5}
              className="form-input text-sm w-full resize-y"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
