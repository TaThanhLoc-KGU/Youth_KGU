import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Mailbox, Send, LogIn, ShieldCheck, Loader2, MessageSquareReply } from 'lucide-react';
import gopYService from '../../services/gopYService';
import useAuthStore from '../../stores/authStore';
import usePublicSettings from '../../hooks/usePublicSettings';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import { ROUTES } from '../../utils/constants';

const LOAI_OPTIONS = [
  { value: 'GOP_Y', label: 'Góp ý' },
  { value: 'PHAN_ANH', label: 'Phản ánh' },
  { value: 'KHAC', label: 'Khác' },
];

const LOAI_LABEL = { GOP_Y: 'Góp ý', PHAN_ANH: 'Phản ánh', KHAC: 'Khác' };

const TRANG_THAI_BADGE = {
  MOI:         { label: 'Mới gửi',      className: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' },
  DANG_XU_LY:  { label: 'Đang xử lý',   className: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' },
  DA_XU_LY:    { label: 'Đã xử lý',     className: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' },
  TU_CHOI:     { label: 'Từ chối',      className: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' },
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

/**
 * Thùng thư góp ý — sinh viên phản ánh/góp ý về hoạt động Đoàn-Hội.
 * Yêu cầu đăng nhập để gửi. Danh tính người gửi được ẩn khi BCH/Admin xem
 * (đảm bảo tính minh bạch/dân chủ) — chỉ chủ tài khoản xem được lịch sử của mình.
 */
const GopYPage = () => {
  const { isAuthenticated } = useAuthStore();
  const { isOn } = usePublicSettings();
  const gopYBat = isOn('gopy.bat');
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('gui');
  const [form, setForm] = useState({ tieuDe: '', noiDung: '', loai: 'GOP_Y' });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['gop-y-cua-toi'],
    queryFn: () => gopYService.getMySubmissions({ page: 0, size: 20 }),
    enabled: isAuthenticated && tab === 'lich-su',
  });

  const submitMutation = useMutation({
    mutationFn: () => gopYService.submit(form),
    onSuccess: () => {
      toast.success('Đã gửi góp ý — cảm ơn bạn đã đóng góp ý kiến!');
      setForm({ tieuDe: '', noiDung: '', loai: 'GOP_Y' });
      queryClient.invalidateQueries({ queryKey: ['gop-y-cua-toi'] });
      setTab('lich-su');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gửi góp ý thất bại, thử lại sau.'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.tieuDe.trim() || !form.noiDung.trim()) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung.');
      return;
    }
    submitMutation.mutate();
  };

  const submissions = history?.content || [];

  return (
    <div className="max-w-3xl mx-auto py-4 px-3 sm:px-0 space-y-5">
      <Helmet><title>Thùng thư góp ý | Youth KGU</title></Helmet>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Mailbox className="w-6 h-6 text-primary" /> Thùng thư góp ý
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Phản ánh, góp ý về các hoạt động Đoàn – Hội. Danh tính người gửi được ẩn khi hiển thị cho
          Ban chấp hành nhằm đảm bảo tính minh bạch, dân chủ.
        </p>
      </div>

      {!gopYBat ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
          <Mailbox className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="font-semibold text-amber-800">Thùng thư góp ý đang tạm đóng</p>
          <p className="text-sm text-amber-600 mt-1">Vui lòng quay lại sau.</p>
        </div>
      ) : !isAuthenticated ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <ShieldCheck className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="font-semibold text-blue-800">Vui lòng đăng nhập để gửi góp ý</p>
          <p className="text-sm text-blue-600 mt-1 mb-4">
            Đăng nhập giúp bạn theo dõi phản hồi của mình — nội dung góp ý vẫn được ẩn danh với BCH.
          </p>
          <Link to={ROUTES.LOGIN}>
            <Button icon={LogIn}>Đăng nhập</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            <button
              onClick={() => setTab('gui')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'gui' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Gửi góp ý mới
            </button>
            <button
              onClick={() => setTab('lich-su')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'lich-su' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Lịch sử của tôi
            </button>
          </div>

          {tab === 'gui' && (
            <form onSubmit={handleSubmit} className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                <Select
                  value={form.loai}
                  onChange={(e) => setForm((f) => ({ ...f, loai: e.target.value }))}
                  options={LOAI_OPTIONS}
                  placeholder={null}
                  className="w-full sm:w-56"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                <input
                  value={form.tieuDe}
                  onChange={(e) => setForm((f) => ({ ...f, tieuDe: e.target.value }))}
                  placeholder="Tóm tắt ngắn gọn nội dung góp ý"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                <textarea
                  value={form.noiDung}
                  onChange={(e) => setForm((f) => ({ ...f, noiDung: e.target.value }))}
                  rows={6}
                  placeholder="Mô tả chi tiết nội dung phản ánh/góp ý..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" icon={submitMutation.isPending ? Loader2 : Send} isLoading={submitMutation.isPending}>
                  Gửi góp ý
                </Button>
              </div>
            </form>
          )}

          {tab === 'lich-su' && (
            <div className="space-y-3">
              {loadingHistory ? (
                <p className="text-sm text-gray-400">Đang tải...</p>
              ) : submissions.length === 0 ? (
                <p className="text-sm text-gray-400 bg-white border border-gray-100 rounded-xl p-6 text-center">
                  Bạn chưa gửi góp ý nào.
                </p>
              ) : (
                submissions.map((s) => {
                  const badge = TRANG_THAI_BADGE[s.trangThai] || { label: s.trangThai, className: 'bg-gray-100 text-gray-600' };
                  return (
                    <div key={s.id} className="bg-white border border-gray-100 shadow-sm rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{s.tieuDe}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {LOAI_LABEL[s.loai] || s.loai} · {fmtDate(s.createdAt)}
                          </p>
                        </div>
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap break-words">{s.noiDung}</p>
                      {s.phanHoi && (
                        <div className="mt-3 bg-primary/5 border border-primary/10 rounded-lg p-3">
                          <p className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-1">
                            <MessageSquareReply className="w-3.5 h-3.5" /> Phản hồi từ Ban chấp hành
                          </p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{s.phanHoi}</p>
                          {s.ngayPhanHoi && <p className="text-xs text-gray-400 mt-1">{fmtDate(s.ngayPhanHoi)}</p>}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GopYPage;
