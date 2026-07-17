import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Play, StopCircle, Award, Users, BarChart2, Loader2, X, ExternalLink, Download, List, CheckSquare, ChevronLeft, ChevronRight, Trophy, Camera, Check, AlertCircle } from 'lucide-react';
import cuocThiService from '../../services/cuocThiService';
import activityService from '../../services/activityService';
import SearchableSelect from '../../components/common/SearchableSelect';
import ImageUploadField from '../../components/common/ImageUploadField';

// Các options tĩnh dạng { value, label } cho react-select
const LOAI_OPTIONS = [
  { value: 'CUOC_THI_HAT', label: 'Cuộc thi hát' },
  { value: 'ANH_DEP',      label: 'Ảnh đẹp' },
  { value: 'ANH_VIDEO',    label: '📷 Ảnh / Video (Sinh viên tự nộp)' },
  { value: 'Y_TUONG',      label: 'Ý tưởng sáng tạo' },
  { value: 'TRANG_PHUC',   label: 'Trang phục' },
  { value: 'BAI_VIET',     label: 'Bài viết' },
  { value: 'NHAT_KY',      label: '📔 Nhật ký (đi học, tình nguyện...)' },
  { value: 'TONG_HOP',     label: 'Tổng hợp' },
];
const HIEN_THI_OPTIONS = [
  { value: 'REALTIME',    label: 'Realtime – hiện ngay' },
  { value: 'AN_DEN_CUOI', label: 'Ẩn đến cuối' },
];
const DIEU_KIEN_OPTIONS = [
  { value: 'MO_HOANTOAN', label: 'Mở hoàn toàn (ai cũng vote được)' },
  { value: 'DANG_NHAP',   label: 'Cần đăng nhập' },
  { value: 'CHECK_IN',    label: 'Cần check-in hoạt động' },
];
const QUY_TAC_OPTIONS = [
  { value: 'MOT_LAN',  label: '1 lần / tài khoản' },
  { value: 'MOI_NGAY', label: 'Mỗi ngày 1 lần' },
  { value: 'N_LUOT',   label: 'N lượt tùy chọn' },
];

// Dùng LOAI_OPTIONS để tra label trong bảng
const LOAI_LABEL_MAP = Object.fromEntries(LOAI_OPTIONS.map(o => [o.value, o.label]));

const TRANG_THAI_COLORS = {
  CHUAN_BI: 'bg-gray-100 text-gray-700',
  DANG_MO: 'bg-green-100 text-green-700',
  DONG_BINH_CHON: 'bg-orange-100 text-orange-700',
  DA_CONG_BO: 'bg-purple-100 text-purple-700',
  DA_HUY: 'bg-red-100 text-red-700',
};

const TRANG_THAI_LABELS = {
  CHUAN_BI: 'Chuẩn bị',
  DANG_MO: 'Đang mở',
  DONG_BINH_CHON: 'Đã đóng',
  DA_CONG_BO: 'Đã công bố',
  DA_HUY: 'Đã hủy',
};

// === Create/Edit Modal ===
const CuocThiModal = ({ isOpen, onClose, editItem, onSave }) => {
  const { data: hoatDongList = [] } = useQuery({
    queryKey: ['hoat-dong-all'],
    queryFn: () => activityService.getAllNoPagination(),
    enabled: isOpen,
  });

  const [form, setForm] = useState(editItem || {
    tieuDe: '', moTa: '', anhBia: '', slug: '',
    loaiCuocThi: 'TONG_HOP', maHoatDong: '',
    hienThiKetQua: 'REALTIME', dieuKienVote: 'DANG_NHAP',
    quyTacVote: 'MOT_LAN', soLuotToiDa: 3,
    thoiGianMoVote: '', thoiGianDongVote: '',
    choPhepNopBai: false, hanNop: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = { ...form };
      if (!data.soLuotToiDa) delete data.soLuotToiDa;
      if (!data.thoiGianMoVote) delete data.thoiGianMoVote;
      if (!data.thoiGianDongVote) delete data.thoiGianDongVote;
      if (!data.maHoatDong) delete data.maHoatDong;
      if (!data.slug) delete data.slug;
      await onSave(data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">{editItem ? 'Sửa cuộc thi' : 'Tạo cuộc thi mới'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Tiêu đề *</label>
            <input required value={form.tieuDe} onChange={e => setForm({...form, tieuDe: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="VD: Cuộc thi hát tài năng 2024" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Mô tả</label>
            <textarea rows={3} value={form.moTa || ''} onChange={e => setForm({...form, moTa: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="Mô tả cuộc thi..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SearchableSelect
              label="Loại cuộc thi"
              options={LOAI_OPTIONS}
              value={form.loaiCuocThi}
              onChange={v => setForm({...form, loaiCuocThi: v || 'TONG_HOP'})}
              isClearable={false}
              placeholder="Chọn loại..."
            />
            <SearchableSelect
              label="Gắn với hoạt động (nếu có)"
              options={hoatDongList.map(hd => ({
                value: hd.maHoatDong,
                label: `${hd.tenHoatDong} (${hd.maHoatDong})`,
              }))}
              value={form.maHoatDong || null}
              onChange={v => setForm({...form, maHoatDong: v || ''})}
              isLoading={!hoatDongList.length}
              placeholder="Tìm hoạt động..."
              isClearable={true}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <SearchableSelect
              label="Hiển thị kết quả"
              options={HIEN_THI_OPTIONS}
              value={form.hienThiKetQua}
              onChange={v => setForm({...form, hienThiKetQua: v || 'REALTIME'})}
              isClearable={false}
              placeholder="Chọn..."
            />
            <SearchableSelect
              label="Điều kiện vote"
              options={DIEU_KIEN_OPTIONS}
              value={form.dieuKienVote}
              onChange={v => setForm({...form, dieuKienVote: v || 'DANG_NHAP'})}
              isClearable={false}
              placeholder="Chọn..."
            />
            <SearchableSelect
              label="Quy tắc vote"
              options={QUY_TAC_OPTIONS}
              value={form.quyTacVote}
              onChange={v => setForm({...form, quyTacVote: v || 'MOT_LAN'})}
              isClearable={false}
              placeholder="Chọn..."
            />
          </div>
          {form.quyTacVote === 'N_LUOT' && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Số lượt tối đa</label>
              <input type="number" min={1} value={form.soLuotToiDa || 3} onChange={e => setForm({...form, soLuotToiDa: parseInt(e.target.value)})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Thời gian mở vote</label>
              <input type="datetime-local" value={form.thoiGianMoVote ? form.thoiGianMoVote.slice(0,16) : ''}
                onChange={e => setForm({...form, thoiGianMoVote: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Thời gian đóng vote</label>
              <input type="datetime-local" value={form.thoiGianDongVote ? form.thoiGianDongVote.slice(0,16) : ''}
                onChange={e => setForm({...form, thoiGianDongVote: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
          </div>
          <ImageUploadField
            label="Ảnh bìa cuộc thi"
            value={form.anhBia || ''}
            onChange={url => setForm({...form, anhBia: url})}
            aspectRatio={16/9}
            cropTitle="Cắt ảnh bìa (16:9)"
            previewClass="h-40 w-full object-cover"
          />

          {/* Nộp bài */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.choPhepNopBai}
                onChange={e => setForm({...form, choPhepNopBai: e.target.checked, hanNop: e.target.checked ? form.hanNop : ''})}
                className="w-4 h-4 accent-orange-500"
              />
              <span className="text-sm font-medium text-orange-800">
                📷 Cho phép sinh viên tự đăng ký nộp bài (ảnh/video)
              </span>
            </label>
            {form.choPhepNopBai && (
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Hạn nộp bài (để trống = không giới hạn)</label>
                <input
                  type="datetime-local"
                  value={form.hanNop ? form.hanNop.slice(0, 16) : ''}
                  onChange={e => setForm({...form, hanNop: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editItem ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// === ThiSinh Manager ===
const TRANG_THAI_DUYET_LABEL = {
  DA_DUYET:  { label: 'Đã duyệt',   cls: 'bg-green-100 text-green-700' },
  CHO_DUYET: { label: 'Chờ duyệt',  cls: 'bg-amber-100 text-amber-700' },
  TU_CHOI:   { label: 'Từ chối',    cls: 'bg-red-100 text-red-600' },
};

const LOAI_NOI_BAI_LABEL = {
  ANH_DON:   '🖼 Ảnh đơn',
  NHOM_ANH:  '🖼🖼 Nhóm ảnh',
  VIDEO:     '🎥 Video',
};

const ThiSinhManager = ({ cuocThi, onClose }) => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('danh-sach');
  const [form, setForm] = useState({ ten: '', moTa: '', anhDaiDien: '', urlMedia: '' });
  const [saving, setSaving] = useState(false);

  const { data: detail } = useQuery({
    queryKey: ['cuoc-thi-admin', cuocThi.id],
    queryFn: () => cuocThiService.admin.getById(cuocThi.id),
  });

  const { data: choDuyetList = [], refetch: refetchChoDuyet } = useQuery({
    queryKey: ['cuoc-thi-cho-duyet', cuocThi.id],
    queryFn: () => cuocThiService.admin.getDanhSachChoDuyet(cuocThi.id),
    enabled: tab === 'cho-duyet',
  });

  const thiSinhs = detail?.danhSachThiSinh || [];

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.ten.trim()) return;
    setSaving(true);
    try {
      await cuocThiService.admin.addThiSinh(cuocThi.id, { ...form, soThuTu: thiSinhs.length + 1 });
      queryClient.invalidateQueries(['cuoc-thi-admin', cuocThi.id]);
      setForm({ ten: '', moTa: '', anhDaiDien: '', urlMedia: '' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tsId) => {
    if (!window.confirm('Xóa thí sinh này?')) return;
    await cuocThiService.admin.deleteThiSinh(cuocThi.id, tsId);
    queryClient.invalidateQueries(['cuoc-thi-admin', cuocThi.id]);
  };

  const handleDuyet = async (tsId) => {
    await cuocThiService.admin.duyetThiSinh(cuocThi.id, tsId);
    queryClient.invalidateQueries(['cuoc-thi-admin', cuocThi.id]);
    refetchChoDuyet();
  };

  const handleTuChoi = async (tsId) => {
    if (!window.confirm('Từ chối bài nộp này?')) return;
    await cuocThiService.admin.tuChoiThiSinh(cuocThi.id, tsId);
    refetchChoDuyet();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 className="text-xl font-bold">Quản lý thí sinh — {cuocThi.tieuDe}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6 flex-shrink-0">
          {[
            { key: 'danh-sach', label: 'Danh sách thi sinh' },
            { key: 'cho-duyet', label: `Xét duyệt bài nộp${choDuyetList.length ? ` (${choDuyetList.length})` : ''}` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">

        {tab === 'danh-sach' && (<>
          {/* Add form */}
          <form onSubmit={handleAdd} className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
            <h3 className="font-medium text-gray-700">Thêm thí sinh mới</h3>
            <input required value={form.ten} onChange={e => setForm({...form, ten: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Tên thí sinh *" />
            <input value={form.moTa || ''} onChange={e => setForm({...form, moTa: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Mô tả" />
            <div className="space-y-2">
              <ImageUploadField
                label="Ảnh đại diện thí sinh"
                value={form.anhDaiDien || ''}
                onChange={url => setForm({...form, anhDaiDien: url})}
                aspectRatio={1}
                cropTitle="Cắt ảnh đại diện (1:1)"
                previewClass="h-24 w-full object-cover"
              />
              <input value={form.urlMedia || ''} onChange={e => setForm({...form, urlMedia: e.target.value})}
                className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="Link video/nội dung (tuỳ chọn)" />
            </div>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Thêm thí sinh
            </button>
          </form>

          {/* List */}
          <div className="space-y-2">
            {thiSinhs.length === 0 && <p className="text-center text-gray-400 py-4">Chưa có thí sinh nào</p>}
            {thiSinhs.map((ts, i) => (
              <div key={ts.id} className="flex items-center gap-3 p-3 border rounded-xl">
                {ts.anhDaiDien ? (
                  <img src={ts.anhDaiDien} alt={ts.ten} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {i + 1}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{ts.ten}</p>
                  {ts.moTa && <p className="text-xs text-gray-500 truncate">{ts.moTa}</p>}
                </div>
                <div className="flex items-center gap-1 text-sm text-red-500">
                  ❤️ {ts.soVote || 0}
                </div>
                {ts.urlMedia && (
                  <a href={ts.urlMedia} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button onClick={() => handleDelete(ts.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </>)}

        {tab === 'cho-duyet' && (
          <div className="space-y-3">
            {choDuyetList.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <Camera className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Không có bài nộp nào đang chờ duyệt</p>
              </div>
            )}
            {choDuyetList.map((ts) => {
              const loaiLabel = LOAI_NOI_BAI_LABEL[ts.loaiNopBai] || ts.loaiNopBai;
              let dsAnh = [];
              try { dsAnh = ts.dsHinhAnh ? JSON.parse(ts.dsHinhAnh) : []; } catch {}
              return (
                <div key={ts.id} className="border rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {ts.anhDaiDien
                      ? <img src={ts.anhDaiDien} alt={ts.ten} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                      : <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Camera className="w-6 h-6 text-gray-400" /></div>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{ts.ten}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Chờ duyệt</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{loaiLabel}</span>
                      </div>
                      {ts.maSv && <p className="text-xs text-gray-500 mt-0.5">MSSV: {ts.maSv}</p>}
                      {ts.moTa && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ts.moTa}</p>}
                      {ts.urlMedia && (
                        <a href={ts.urlMedia} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                          <ExternalLink className="w-3 h-3" /> Xem media
                        </a>
                      )}
                    </div>
                  </div>
                  {dsAnh.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {dsAnh.slice(0, 5).map((url, i) => (
                        <img key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleDuyet(ts.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                      <Check className="w-3.5 h-3.5" /> Duyệt
                    </button>
                    <button onClick={() => handleTuChoi(ts.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100">
                      <AlertCircle className="w-3.5 h-3.5" /> Từ chối
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        </div>
      </div>
    </div>
  );
};

// === Vote Detail Modal (3 tabs) ===
const VoteDetailModal = ({ cuocThi, onClose }) => {
  const [tab, setTab] = useState('tien-trinh');
  const [votePage, setVotePage] = useState(0);
  const [selectedWinners, setSelectedWinners] = useState([]);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const { data: thongKe, isLoading: loadingTK } = useQuery({
    queryKey: ['cuoc-thi-thong-ke', cuocThi.id],
    queryFn: () => cuocThiService.admin.getThongKe(cuocThi.id),
    refetchInterval: tab === 'tien-trinh' ? 10000 : false,
  });

  const { data: voteList, isLoading: loadingVote } = useQuery({
    queryKey: ['cuoc-thi-vote-list', cuocThi.id, votePage],
    queryFn: () => cuocThiService.admin.getDanhSachVote(cuocThi.id, votePage, 20),
    enabled: tab === 'danh-sach' || tab === 'checkout',
  });

  // Export Excel dùng dữ liệu từ thống kê + vote list đầy đủ
  const handleExport = async () => {
    try {
      // Sheet 1: Kết quả tổng hợp
      const ketQuaData = (thongKe?.ketQua || []).map((item, i) => ({
        'STT': i + 1,
        'Thí sinh': item.ten,
        'Số vote': item.soVote,
        'Tỉ lệ': `${Number(item.phanTram).toFixed(1)}%`,
      }));

      // Sheet 2: Trend theo ngày
      const trendData = (thongKe?.trendData || []).map(d => ({
        'Ngày': d.ngay,
        'Số vote': d.soVote,
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ketQuaData), 'Kết quả');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trendData), 'Theo ngày');
      XLSX.writeFile(wb, `ketqua_${cuocThi.slug || cuocThi.id}.xlsx`);
    } catch (e) {
      alert('Lỗi xuất file: ' + e.message);
    }
  };

  // Export chi tiết vote (gọi API backend trả về blob)
  const handleExportDetail = async () => {
    try {
      const res = await cuocThiService.admin.exportVote(cuocThi.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `vote_${cuocThi.slug || cuocThi.id}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Lỗi xuất file chi tiết');
    }
  };

  const handleCheckout = async () => {
    const tongVoter = thongKe?.tongVote || 0;
    if (!window.confirm(`Xác nhận checkout ${tongVoter} người đã vote?\n\nHệ thống sẽ cập nhật trạng thái "Đã tham gia" cho tất cả tài khoản đã bình chọn trong cuộc thi này.`)) return;
    setCheckingOut(true);
    try {
      const result = await cuocThiService.admin.checkoutVoters(cuocThi.id);
      setCheckoutResult(result);
    } catch (e) {
      alert('Lỗi: ' + (e?.response?.data?.message || e.message));
    } finally {
      setCheckingOut(false);
    }
  };

  const toggleWinner = (id) => {
    setSelectedWinners(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const ketQua = thongKe?.ketQua || [];
  const tongVote = thongKe?.tongVote || 0;

  const TABS = [
    { key: 'tien-trinh', label: 'Tiến trình', icon: <BarChart2 className="w-4 h-4" /> },
    { key: 'danh-sach',  label: 'Danh sách vote', icon: <List className="w-4 h-4" /> },
    { key: 'checkout',   label: 'Checkout kết quả', icon: <CheckSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{cuocThi.tieuDe}</h2>
            <p className="text-sm text-gray-500">Tổng: <span className="font-semibold text-yellow-600">{tongVote.toLocaleString()}</span> lượt bình chọn</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100">
              <Download className="w-3.5 h-3.5" /> Xuất kết quả
            </button>
            <button onClick={handleExportDetail} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100">
              <Download className="w-3.5 h-3.5" /> Xuất chi tiết
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-5 shrink-0">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* TAB 1: Tiến trình */}
          {tab === 'tien-trinh' && (
            <div className="space-y-3">
              {loadingTK && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-yellow-500" /></div>}
              {!loadingTK && ketQua.length === 0 && (
                <div className="text-center py-12 text-gray-400">Chưa có lượt bình chọn nào</div>
              )}
              {ketQua.map((item, i) => (
                <div key={item.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-yellow-400 text-white' :
                      i === 1 ? 'bg-gray-300 text-gray-700' :
                      i === 2 ? 'bg-orange-300 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </div>
                    {item.anhDaiDien && <img src={item.anhDaiDien} alt={item.ten} className="w-8 h-8 rounded-full object-cover" />}
                    <span className="font-medium text-gray-900 flex-1">{item.ten}</span>
                    <span className="text-sm font-bold text-yellow-600">❤️ {Number(item.soVote).toLocaleString()}</span>
                    <span className="text-xs text-gray-400 w-12 text-right">{Number(item.phanTram).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-500 ${
                      i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : 'bg-blue-400'
                    }`} style={{ width: `${Math.min(100, Number(item.phanTram))}%` }} />
                  </div>
                </div>
              ))}
              {/* Trend by day */}
              {thongKe?.trendData?.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                  <p className="text-xs font-medium text-blue-700 mb-3">Vote theo ngày</p>
                  <div className="space-y-1.5">
                    {thongKe.trendData.map(d => {
                      const maxVote = Math.max(...thongKe.trendData.map(x => x.soVote));
                      return (
                        <div key={d.ngay} className="flex items-center gap-2 text-xs">
                          <span className="w-24 text-gray-500 shrink-0">{d.ngay}</span>
                          <div className="flex-1 bg-blue-100 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(d.soVote / maxVote) * 100}%` }} />
                          </div>
                          <span className="w-8 text-right font-medium text-blue-700">{d.soVote}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Danh sách vote */}
          {tab === 'danh-sach' && (
            <div>
              {loadingVote && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-yellow-500" /></div>}
              {!loadingVote && voteList && (
                <>
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3 text-xs font-medium text-gray-500">#</th>
                          <th className="text-left p-3 text-xs font-medium text-gray-500">Người vote</th>
                          <th className="text-left p-3 text-xs font-medium text-gray-500">Bình chọn cho</th>
                          <th className="text-left p-3 text-xs font-medium text-gray-500">IP</th>
                          <th className="text-left p-3 text-xs font-medium text-gray-500">Thời gian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {voteList.content?.map((v, i) => (
                          <tr key={v.id} className="hover:bg-gray-50">
                            <td className="p-3 text-gray-400 text-xs">{votePage * 20 + i + 1}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                v.nguoiVoteMa === 'Ẩn danh' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700 font-medium'
                              }`}>{v.nguoiVoteMa}</span>
                            </td>
                            <td className="p-3 font-medium text-gray-800">{v.tenThiSinh}</td>
                            <td className="p-3 text-gray-400 text-xs font-mono">{v.nguoiVoteIp || '—'}</td>
                            <td className="p-3 text-gray-500 text-xs">{v.createdAt?.replace('T', ' ')?.slice(0, 16)}</td>
                          </tr>
                        ))}
                        {voteList.content?.length === 0 && (
                          <tr><td colSpan={5} className="text-center py-8 text-gray-400">Chưa có lượt vote</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  {voteList.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">Tổng {voteList.totalElements} lượt · Trang {votePage + 1}/{voteList.totalPages}</span>
                      <div className="flex gap-1">
                        <button disabled={votePage === 0} onClick={() => setVotePage(p => p - 1)}
                          className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-40">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button disabled={votePage >= voteList.totalPages - 1} onClick={() => setVotePage(p => p + 1)}
                          className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-40">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 3: Checkout bằng danh sách người đã vote */}
          {tab === 'checkout' && (
            <div className="space-y-4">

              {/* Giải thích cơ chế */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">📋 Checkout theo danh sách người đã vote</p>
                <p>Hệ thống sẽ lấy tất cả tài khoản đã tham gia bình chọn và cập nhật trạng thái <strong>"Đã tham gia"</strong> cho đăng ký hoạt động tương ứng.</p>
              </div>

              {/* Cảnh báo nếu không có hoạt động liên kết */}
              {!cuocThi.maHoatDong && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                  ⚠️ Cuộc thi này chưa gắn với hoạt động nào. Checkout sẽ không cập nhật được điểm danh — hãy liên kết hoạt động trước.
                </div>
              )}

              {/* Thống kê nhanh */}
              {loadingTK ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-yellow-500" /></div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white border rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-gray-800">{thongKe?.tongVote?.toLocaleString() || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Tổng lượt vote</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-700">{thongKe?.tongNguoiVote?.toLocaleString() || '—'}</p>
                    <p className="text-xs text-gray-500 mt-1">Người đã vote (đăng nhập)</p>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-700">
                      {cuocThi.maHoatDong ? '✓' : '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {cuocThi.maHoatDong ? cuocThi.maHoatDong : 'Chưa có hoạt động'}
                    </p>
                  </div>
                </div>
              )}

              {/* Xem trước danh sách vote gần đây */}
              {voteList?.content?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Mẫu danh sách người đã vote</p>
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs text-gray-500">Tài khoản</th>
                          <th className="px-3 py-2 text-left text-xs text-gray-500">Bình chọn cho</th>
                          <th className="px-3 py-2 text-left text-xs text-gray-500">Thời gian</th>
                        </tr>
                      </thead>
                      <tbody>
                        {voteList.content.slice(0, 8).map((v, i) => (
                          <tr key={i} className="border-t hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium">
                              {v.nguoiVoteMa && v.nguoiVoteMa !== 'Ẩn danh'
                                ? <span className="text-blue-700">{v.nguoiVoteMa}</span>
                                : <span className="text-gray-400 italic">Ẩn danh</span>
                              }
                            </td>
                            <td className="px-3 py-2 text-gray-600">{v.tenThiSinh}</td>
                            <td className="px-3 py-2 text-gray-400 text-xs">{v.ngayVote}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {voteList.totalElements > 8 && (
                      <p className="text-center text-xs text-gray-400 py-2 border-t">
                        ... và {voteList.totalElements - 8} lượt khác
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Kết quả checkout */}
              {checkoutResult && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm space-y-2">
                  <p className="font-semibold text-green-700 text-base">
                    ✅ Checkout thành công {checkoutResult.tongCheckout}/{checkoutResult.tongVoter} người
                  </p>
                  {checkoutResult.voAnDanh > 0 && (
                    <p className="text-gray-500">🕵️ {checkoutResult.voAnDanh} lượt vote ẩn danh (không thể checkout)</p>
                  )}
                  {checkoutResult.daCheckout?.length > 0 && (
                    <details className="cursor-pointer">
                      <summary className="text-green-600 font-medium">✓ Đã cập nhật: {checkoutResult.daCheckout.length} người</summary>
                      <p className="text-green-600 mt-1 pl-4 text-xs">{checkoutResult.daCheckout.join(' · ')}</p>
                    </details>
                  )}
                  {checkoutResult.khongDangKy?.length > 0 && (
                    <details className="cursor-pointer">
                      <summary className="text-amber-600 font-medium">⚠️ Chưa đăng ký hoạt động: {checkoutResult.khongDangKy.length} người</summary>
                      <p className="text-amber-600 mt-1 pl-4 text-xs">{checkoutResult.khongDangKy.join(' · ')}</p>
                    </details>
                  )}
                </div>
              )}

              <button
                disabled={checkingOut || !thongKe?.tongVote}
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-base">
                {checkingOut
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</>
                  : <><CheckSquare className="w-5 h-5" /> Checkout tất cả {thongKe?.tongVote ? `${thongKe.tongVote} người đã vote` : ''}</>
                }
              </button>

              <p className="text-xs text-gray-400 text-center">
                Chỉ những người đã đăng nhập và đăng ký hoạt động mới được cập nhật. Vote ẩn danh sẽ bị bỏ qua.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// === Main Page ===
export default function CuocThiManagePage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [managingThiSinh, setManagingThiSinh] = useState(null);
  const [viewingVote, setViewingVote] = useState(null);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['cuoc-thi-admin-list'],
    queryFn: cuocThiService.admin.getAll,
  });

  const createMut = useMutation({
    mutationFn: (data) => cuocThiService.admin.create(data),
    onSuccess: () => queryClient.invalidateQueries(['cuoc-thi-admin-list']),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => cuocThiService.admin.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['cuoc-thi-admin-list']),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => cuocThiService.admin.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['cuoc-thi-admin-list']),
  });

  const moVoteMut = useMutation({
    mutationFn: (id) => cuocThiService.admin.moVote(id),
    onSuccess: () => queryClient.invalidateQueries(['cuoc-thi-admin-list']),
  });

  const dongVoteMut = useMutation({
    mutationFn: (id) => cuocThiService.admin.dongVote(id),
    onSuccess: () => queryClient.invalidateQueries(['cuoc-thi-admin-list']),
  });

  const congBoMut = useMutation({
    mutationFn: (id) => cuocThiService.admin.congBo(id),
    onSuccess: () => queryClient.invalidateQueries(['cuoc-thi-admin-list']),
  });

  const handleSave = async (data) => {
    if (editItem) {
      await updateMut.mutateAsync({ id: editItem.id, data });
    } else {
      await createMut.mutateAsync(data);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm('Xóa cuộc thi này?')) return;
    deleteMut.mutate(id);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Cuộc thi & Bình chọn</h1>
          <p className="text-gray-500 text-sm mt-1">Tạo và quản lý các cuộc thi bình chọn</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-xl font-medium hover:bg-yellow-600"
        >
          <Plus className="w-4 h-4" /> Tạo cuộc thi mới
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Tên cuộc thi</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Loại</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Trạng thái</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Thí sinh</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Votes</th>
                <th className="text-right p-4 text-sm font-medium text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Chưa có cuộc thi nào</td></tr>
              )}
              {list.map(ct => (
                <tr key={ct.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{ct.tieuDe}</div>
                    <div className="text-xs text-gray-400">{ct.slug}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{LOAI_LABEL_MAP[ct.loaiCuocThi]}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${TRANG_THAI_COLORS[ct.trangThai]}`}>
                      {TRANG_THAI_LABELS[ct.trangThai]}
                    </span>
                  </td>
                  <td className="p-4">
                    <button onClick={() => setManagingThiSinh(ct)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                      <Users className="w-4 h-4" />
                      Quản lý
                    </button>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{ct.tongSoVote?.toLocaleString() || 0}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 justify-end">
                      {/* View public */}
                      <a href={`/binh-chon/${ct.slug}`} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Xem trang công khai">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      {/* Actions based on status */}
                      {ct.trangThai === 'CHUAN_BI' && (
                        <button onClick={() => moVoteMut.mutate(ct.id)} className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg" title="Mở bình chọn">
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {ct.trangThai === 'DANG_MO' && (
                        <button onClick={() => dongVoteMut.mutate(ct.id)} className="p-1.5 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg" title="Đóng bình chọn">
                          <StopCircle className="w-4 h-4" />
                        </button>
                      )}
                      {ct.trangThai === 'DONG_BINH_CHON' && (
                        <button onClick={() => congBoMut.mutate(ct.id)} className="p-1.5 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg" title="Công bố kết quả">
                          <Award className="w-4 h-4" />
                        </button>
                      )}
                      {/* Vote detail */}
                      <button onClick={() => setViewingVote(ct)}
                        className="p-1.5 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title="Xem danh sách vote & checkout">
                        <BarChart2 className="w-4 h-4" />
                      </button>
                      {/* Edit */}
                      <button onClick={() => { setEditItem(ct); setShowModal(true); }}
                        className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Chỉnh sửa">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {/* Delete */}
                      <button onClick={() => handleDelete(ct.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <CuocThiModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          editItem={editItem}
          onSave={handleSave}
        />
      )}

      {managingThiSinh && (
        <ThiSinhManager
          cuocThi={managingThiSinh}
          onClose={() => setManagingThiSinh(null)}
        />
      )}

      {viewingVote && (
        <VoteDetailModal
          cuocThi={viewingVote}
          onClose={() => setViewingVote(null)}
        />
      )}
    </div>
  );
}
