/**
 * ClbPortalPage — Trang quản lý CLB dành cho Chủ nhiệm CLB
 * Accessible to: anyone with QUAN_LY_CLB or QUAN_LY_THANH_VIEN_CLB permission
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Activity, Lock, Unlock, UserPlus, UserMinus, Upload,
         ChevronLeft, Search, BookOpen, Edit2, Save, X,
         Banknote, CheckCircle2, AlertCircle, RefreshCw,
         Settings, ClipboardList, Download, CheckSquare, XSquare,
         Clock, BadgeCheck, Award, Star, Phone, Mail,
         TrendingUp, BarChart2, ShieldCheck, Calendar, Zap, LayoutGrid,
         QrCode, Copy, PlusCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import cauLacBoService from '../../services/cauLacBoService';
import { API_BASE_URL } from '../../services/api';
import api from '../../services/api';
import useAuthStore from '../../stores/authStore';
import { ROUTES, ROLES, PERMISSIONS } from '../../utils/constants';
import ClbBanHanhModal from '../../components/clb/ClbBanHanhModal';

// ── ManualPayModal ─────────────────────────────────────────────────────────────
const ManualPayModal = ({ fee, onClose, onPayOS }) => {
  const hasQr = !!fee.qrUrl;
  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Đã sao chép'); };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-5 border-b flex items-center justify-between bg-gray-50/50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-600" /> Chi tiết thanh toán
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center">
            <p className="font-semibold text-gray-800">{fee.tenSv}</p>
            <p className="text-xs text-gray-500">MSSV: {fee.maSv}</p>
          </div>

          {/* Nút PayOS — chỉ hiện nếu CLB đã cấu hình */}
          {fee.hasPayOS && (
            <>
              <button
                onClick={onPayOS}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-200 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 fill-current text-yellow-300" />
                  <span>THANH TOÁN QUA PAYOS</span>
                </div>
                <span className="text-[10px] font-medium opacity-80">Hỗ trợ: App Ngân hàng, Ví MoMo, Thẻ ATM nội địa</span>
              </button>
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-200" />
                <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest">Hoặc chuyển khoản thủ công</span>
                <div className="flex-grow border-t border-gray-200" />
              </div>
            </>
          )}

          {hasQr ? (
            <>
              <div className="bg-white p-2 border-2 border-dashed border-indigo-100 rounded-2xl flex justify-center">
                <img src={fee.qrUrl} alt="QR thanh toán" className="w-48 h-48 object-contain" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border cursor-pointer" onClick={() => copy(fee.soTien)}>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Số tiền</p>
                    <p className="font-black text-indigo-600">{Number(fee.soTien).toLocaleString('vi-VN')}đ</p>
                  </div>
                  <Copy className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border cursor-pointer" onClick={() => copy(fee.accountNumber)}>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Số tài khoản ({fee.bankCode})</p>
                    <p className="font-bold text-gray-800">{fee.accountNumber}</p>
                    <p className="text-[10px] text-gray-500">{fee.accountHolder}</p>
                  </div>
                  <Copy className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-xl border border-indigo-100 cursor-pointer" onClick={() => copy(fee.noiDungCk)}>
                  <div>
                    <p className="text-[9px] font-bold text-indigo-400 uppercase mb-0.5">Nội dung chuyển khoản</p>
                    <p className="font-bold text-indigo-700">{fee.noiDungCk}</p>
                  </div>
                  <Copy className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-center text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
              CLB chưa cấu hình tài khoản ngân hàng để hiện mã QR.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Helpers ─────────────────────────────────────────────────────────────────
const chucVuLabels = {
  CHU_NHIEM: 'Chủ nhiệm', PHO_CHU_NHIEM: 'Phó chủ nhiệm',
  BAN_QUAN_LY: 'Ban quản lý', CO_VAN: 'Cố vấn', THANH_VIEN: 'Thành viên',
};
const chucVuOptions = Object.entries(chucVuLabels).map(([v, l]) => ({ value: v, label: l }));

// ── AddMemberModal ───────────────────────────────────────────────────────────
function AddMemberModal({ maClb, onClose }) {
  const queryClient = useQueryClient();
  const [maSv, setMaSv] = useState('');
  const [maHocKy, setMaHocKy] = useState('');

  const { data: hocKyList = [] } = useQuery({
    queryKey: ['hocky-active'],
    queryFn: () => api.get('/api/hocky').then(r => Array.isArray(r.data) ? r.data : (r.data?.data || [])),
  });

  const addMutation = useMutation({
    mutationFn: (data) => cauLacBoService.addThanhVien(maClb, data),
    onSuccess: () => {
      toast.success('Thêm thành viên thành công');
      queryClient.invalidateQueries(['clb-members', maClb]);
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi thêm thành viên'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!maSv.trim()) return toast.warn('Vui lòng nhập mã sinh viên');
    addMutation.mutate({ maSv: maSv.trim().toUpperCase(), chucVu: 'THANH_VIEN', maHocKy: maHocKy || null });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold">Thêm thành viên</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã sinh viên *</label>
            <input value={maSv} onChange={e => setMaSv(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="VD: 2100001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Học kỳ</label>
            <select value={maHocKy} onChange={e => setMaHocKy(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">-- Không chọn học kỳ --</option>
              {hocKyList.map(hk => (
                <option key={hk.maHocKy} value={hk.maHocKy}>{hk.tenHocKy}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={addMutation.isPending}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {addMutation.isPending ? 'Đang lưu…' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── EditMemberModal ──────────────────────────────────────────────────────────
function EditMemberModal({ member, maClb, onClose }) {
  const queryClient = useQueryClient();
  const [ngayThamGia, setNgayThamGia] = useState(member.ngayThamGia ?? '');
  const [ngayRoiClb, setNgayRoiClb] = useState(member.ngayRoiClb ?? '');
  const [ghiChu, setGhiChu] = useState(member.ghiChu ?? '');

  const updateMutation = useMutation({
    mutationFn: (data) => cauLacBoService.updateThanhVien(maClb, member.id, data),
    onSuccess: () => {
      toast.success('Cập nhật thành viên thành công');
      queryClient.invalidateQueries(['clb-members', maClb]);
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi cập nhật'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ chucVu: 'THANH_VIEN', ngayThamGia: ngayThamGia || null, ngayRoiClb: ngayRoiClb || null, ghiChu: ghiChu || null });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold">Chỉnh sửa thành viên</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Read-only info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
            <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
              {member.hoTen?.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-sm">{member.hoTen}</p>
              <p className="text-xs text-gray-500">{member.maSv} · {member.tenLop || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tham gia</label>
              <input type="date" value={ngayThamGia} onChange={e => setNgayThamGia(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày rời CLB</label>
              <input type="date" value={ngayRoiClb} onChange={e => setNgayRoiClb(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea value={ghiChu} onChange={e => setGhiChu(e.target.value)} rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              placeholder="Ghi chú về thành viên..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={updateMutation.isPending}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── ImportExcelModal — Smart 3-step import ───────────────────────────────────
const STATUS_STYLE = {
  MATCHED_MSSV: { bg: 'bg-green-50',  border: 'border-green-200', badge: 'bg-green-100 text-green-700',  label: '✓ MSSV'   },
  MATCHED_NAME: { bg: 'bg-yellow-50', border: 'border-yellow-200',badge: 'bg-yellow-100 text-yellow-700',label: '~ Tên'    },
  AMBIGUOUS:    { bg: 'bg-orange-50', border: 'border-orange-200',badge: 'bg-orange-100 text-orange-700',label: '? Trùng'  },
  NOT_FOUND:    { bg: 'bg-red-50',    border: 'border-red-200',   badge: 'bg-red-100 text-red-700',      label: '✗ Không tìm thấy' },
};

function ImportExcelModal({ maClb, onClose }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);          // 1=Upload, 2=Preview, 3=Done
  const [maHocKy, setMaHocKy] = useState('');
  const [matchResults, setMatchResults] = useState([]);    // ClbImportMatchDTO[]
  const [selected, setSelected] = useState({});            // rowIndex → bool
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  const { data: hocKyList = [] } = useQuery({
    queryKey: ['hocky-active'],
    queryFn: () => api.get('/api/hocky').then(r => Array.isArray(r.data) ? r.data : (r.data?.data || [])),
  });

  // ── Tải file mẫu ──────────────────────────────────────────────
  const downloadTemplate = async () => {
    try {
      const xlsxModule = await import('xlsx');
      const XLSX = xlsxModule.default || xlsxModule;
      const data = [
        ['MSSV', 'Họ và Tên', 'Lớp'],
        ['2100001', 'Nguyễn Văn An', 'DHCTK17A'],
        ['', 'Tran Thi Binh', 'DHKTPM17A'],   // ví dụ không có MSSV, tên không dấu
        ['2100003', '', 'DHTH17B'],             // ví dụ chỉ có MSSV
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 14 }];
      // Style header row
      ['A1','B1','C1'].forEach(cell => {
        if (ws[cell]) ws[cell].s = { font: { bold: true }, fill: { fgColor: { rgb: 'DBEAFE' } } };
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Danh sách CLB');
      XLSX.writeFile(wb, 'mau-nhap-thanh-vien-clb.xlsx');
    } catch {
      toast.error('Không thể tạo file mẫu. Vui lòng cài đặt thư viện xlsx.');
    }
  };

  // ── Đọc Excel & gọi batch-match API ───────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const xlsxModule = await import('xlsx');
      const XLSX = xlsxModule.default || xlsxModule;
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      // Bỏ qua hàng tiêu đề (row 0), đọc từ row 1
      const rows = raw.slice(1)
        .map((r, i) => ({
          rowIndex: i,
          maSv:    String(r[0] ?? '').trim(),
          hoTen:   String(r[1] ?? '').trim(),
          tenLop:  String(r[2] ?? '').trim(),
        }))
        .filter(r => r.maSv || r.hoTen); // bỏ dòng trống

      if (rows.length === 0) {
        toast.warn('File không có dữ liệu. Vui lòng kiểm tra lại định dạng.');
        setLoading(false);
        return;
      }
      if (rows.length > 500) {
        toast.warn('Tối đa 500 dòng mỗi lần nhập.');
        setLoading(false);
        return;
      }

      // Gọi API batch-match
      const res = await api.post('/api/sinhvien/batch-match', rows);
      const results = res.data.data || [];
      setMatchResults(results);

      // Mặc định tick chọn những dòng đã match được
      const sel = {};
      results.forEach(r => {
        sel[r.rowIndex] = r.status === 'MATCHED_MSSV' || r.status === 'MATCHED_NAME';
      });
      setSelected(sel);
      setStep(2);
    } catch (err) {
      toast.error('Lỗi đọc file hoặc kết nối server: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // ── Nhập thực sự ──────────────────────────────────────────────
  const handleImport = async () => {
    const toImport = matchResults.filter(r =>
      selected[r.rowIndex] && (r.status === 'MATCHED_MSSV' || r.status === 'MATCHED_NAME')
    );
    if (toImport.length === 0) {
      toast.warn('Không có dòng nào được chọn để nhập.');
      return;
    }
    setImporting(true);
    let ok = 0, skip = 0, fail = 0;
    for (const r of toImport) {
      try {
        await cauLacBoService.addThanhVien(maClb, {
          maSv: r.maSv,
          chucVu: 'THANH_VIEN',
          maHocKy: maHocKy || null,
        });
        ok++;
      } catch (err) {
        const msg = err.response?.data?.message || '';
        if (msg.includes('đã là thành viên') || msg.includes('duplicate') || msg.toLowerCase().includes('exist')) {
          skip++;
        } else {
          fail++;
        }
      }
    }
    setImportSummary({ ok, skip, fail });
    queryClient.invalidateQueries(['clb-members', maClb]);
    setStep(3);
    setImporting(false);
  };

  // ── Thống kê match ────────────────────────────────────────────
  const stats = {
    total: matchResults.length,
    mssv:  matchResults.filter(r => r.status === 'MATCHED_MSSV').length,
    name:  matchResults.filter(r => r.status === 'MATCHED_NAME').length,
    ambig: matchResults.filter(r => r.status === 'AMBIGUOUS').length,
    nf:    matchResults.filter(r => r.status === 'NOT_FOUND').length,
  };
  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Upload className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="text-lg font-bold">Nhập danh sách từ Excel</h3>
              <p className="text-xs text-gray-500">
                {step === 1 ? 'Bước 1: Chọn file & cấu hình'
                  : step === 2 ? `Bước 2: Kiểm tra kết quả dò khớp (${stats.total} dòng)`
                  : 'Bước 3: Hoàn thành'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ─ Step 1: Upload ─────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4 max-w-lg mx-auto">
              {/* File mẫu */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
                <p className="font-semibold text-blue-800 mb-2">📋 Định dạng file Excel</p>
                <table className="w-full text-xs text-blue-700 mb-3">
                  <thead><tr className="border-b border-blue-200">
                    <th className="text-left py-1 pr-4">Cột A</th>
                    <th className="text-left py-1 pr-4">Cột B</th>
                    <th className="text-left py-1">Cột C</th>
                  </tr></thead>
                  <tbody><tr>
                    <td className="py-1 pr-4">MSSV <span className="text-blue-400">(có thể để trống)</span></td>
                    <td className="py-1 pr-4">Họ và Tên <span className="text-blue-400">(có/không dấu)</span></td>
                    <td className="py-1">Lớp <span className="text-blue-400">(tùy chọn)</span></td>
                  </tr></tbody>
                </table>
                <p className="text-xs text-blue-600 mb-3">Hệ thống tự dò: MSSV → Tên chuẩn hoá không dấu → Lọc theo lớp.</p>
                <button onClick={downloadTemplate}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                  <Upload className="w-3.5 h-3.5 rotate-180" /> Tải file mẫu (.xlsx)
                </button>
              </div>

              {/* Học kỳ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Học kỳ áp dụng</label>
                <select value={maHocKy} onChange={e => setMaHocKy(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">-- Không chọn --</option>
                  {hocKyList.map(hk => (
                    <option key={hk.maHocKy} value={hk.maHocKy}>{hk.tenHocKy}</option>
                  ))}
                </select>
              </div>

              {/* Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn file Excel *</label>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange}
                  disabled={loading}
                  className="w-full border rounded-lg px-3 py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
                {loading && <p className="text-xs text-blue-600 mt-2 animate-pulse">⏳ Đang đọc file và dò khớp…</p>}
              </div>
            </div>
          )}

          {/* ─ Step 2: Preview ────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-3">
              {/* Thống kê nhanh */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {[
                  { label: 'Khớp MSSV', count: stats.mssv, color: 'text-green-700 bg-green-50 border-green-200' },
                  { label: 'Khớp tên',  count: stats.name,  color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
                  { label: 'Trùng tên', count: stats.ambig, color: 'text-orange-700 bg-orange-50 border-orange-200' },
                  { label: 'Không tìm', count: stats.nf,    color: 'text-red-700 bg-red-50 border-red-200' },
                ].map(s => (
                  <div key={s.label} className={`p-2 rounded-xl border font-semibold ${s.color}`}>
                    <p className="text-xl">{s.count}</p>
                    <p className="font-normal">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Đã chọn <strong className="text-blue-700">{selectedCount}</strong> / {stats.total} dòng để nhập</span>
                <div className="flex gap-2">
                  <button onClick={() => {
                    const s = {};
                    matchResults.forEach(r => { if (r.status === 'MATCHED_MSSV' || r.status === 'MATCHED_NAME') s[r.rowIndex] = true; });
                    setSelected(s);
                  }} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Chọn đã khớp</button>
                  <button onClick={() => setSelected({})} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Bỏ chọn tất cả</button>
                </div>
              </div>

              {/* Bảng kết quả */}
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="w-8 px-3 py-2"></th>
                      <th className="px-3 py-2 text-left">Dữ liệu Excel</th>
                      <th className="px-3 py-2 text-left">Sinh viên tìm được</th>
                      <th className="px-3 py-2 text-center">Kết quả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {matchResults.map(r => {
                      const s = STATUS_STYLE[r.status] || STATUS_STYLE.NOT_FOUND;
                      const canSelect = r.status === 'MATCHED_MSSV' || r.status === 'MATCHED_NAME';
                      return (
                        <tr key={r.rowIndex} className={`${s.bg} ${selected[r.rowIndex] ? 'ring-1 ring-inset ring-blue-300' : ''}`}>
                          <td className="px-3 py-2 text-center">
                            <input type="checkbox" disabled={!canSelect}
                              checked={!!selected[r.rowIndex]}
                              onChange={e => setSelected(prev => ({ ...prev, [r.rowIndex]: e.target.checked }))}
                              className="rounded" />
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-mono text-xs text-gray-500">{r.inputMaSv || '—'}</p>
                            <p className="text-gray-800">{r.inputHoTen || '—'}</p>
                            {r.inputTenLop && <p className="text-xs text-gray-400">{r.inputTenLop}</p>}
                          </td>
                          <td className="px-3 py-2">
                            {r.maSv ? (
                              <>
                                <p className="font-mono text-xs text-gray-500">{r.maSv}</p>
                                <p className="text-gray-800 font-medium">{r.hoTen}</p>
                                <p className="text-xs text-gray-400">{r.tenLop || '—'}</p>
                              </>
                            ) : (
                              <p className="text-xs italic text-gray-400">
                                {r.status === 'AMBIGUOUS' ? `${r.candidateCount} sinh viên trùng tên` : 'Không tìm thấy'}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${s.badge}`}>{s.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {stats.ambig > 0 && (
                <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                  ⚠️ {stats.ambig} dòng có tên trùng nhiều sinh viên — không thể tự dò. Vui lòng bổ sung MSSV hoặc Lớp cho các dòng này và nhập lại.
                </p>
              )}
            </div>
          )}

          {/* ─ Step 3: Done ───────────────────────────────────── */}
          {step === 3 && importSummary && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-800">Nhập hoàn tất!</h4>
              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto text-center text-sm">
                <div className="p-3 bg-green-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-700">{importSummary.ok}</p>
                  <p className="text-xs text-green-600">Thành công</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-xl">
                  <p className="text-2xl font-bold text-yellow-700">{importSummary.skip}</p>
                  <p className="text-xs text-yellow-600">Đã có sẵn</p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl">
                  <p className="text-2xl font-bold text-red-700">{importSummary.fail}</p>
                  <p className="text-xs text-red-600">Thất bại</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-3 flex-shrink-0">
          {step === 1 && (
            <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">Đóng</button>
          )}
          {step === 2 && (
            <>
              <button onClick={() => { setStep(1); setMatchResults([]); }}
                className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">← Quay lại</button>
              <button onClick={handleImport} disabled={importing || selectedCount === 0}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {importing
                  ? <><span className="animate-spin">⏳</span> Đang nhập…</>
                  : <><Upload className="w-4 h-4" /> Nhập {selectedCount} thành viên</>}
              </button>
            </>
          )}
          {step === 3 && (
            <button onClick={onClose} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Xong</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ClbMemberManage ──────────────────────────────────────────────────────────
function ClbMemberManage({ clb }) {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission(PERMISSIONS.QUAN_LY_THANH_VIEN_CLB);

  const [maHocKy, setMaHocKy] = useState('');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const { data: hocKyList = [] } = useQuery({
    queryKey: ['hocky-active'],
    queryFn: () => api.get('/api/hocky').then(r => Array.isArray(r.data) ? r.data : (r.data?.data || [])),
  });

  const selectedHocKy = hocKyList.find(hk => hk.maHocKy === maHocKy);
  const isLocked = selectedHocKy?.isClbLocked === true;

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['clb-members', clb.maClb, maHocKy],
    queryFn: () => cauLacBoService.getThanhVien(clb.maClb, maHocKy || null),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => cauLacBoService.removeThanhVien(clb.maClb, id),
    onSuccess: () => {
      toast.success('Đã xóa thành viên');
      queryClient.invalidateQueries(['clb-members', clb.maClb]);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi xóa thành viên'),
  });

  const lockMutation = useMutation({
    mutationFn: (locked) => cauLacBoService.lockHocKy(maHocKy, locked),
    onSuccess: (_, locked) => {
      toast.success(locked ? 'Đã khóa danh sách học kỳ' : 'Đã mở khóa danh sách');
      queryClient.invalidateQueries(['hocky-active']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi thao tác khóa'),
  });

  const filtered = members.filter(m =>
    !search || m.hoTen?.toLowerCase().includes(search.toLowerCase()) ||
    m.maSv?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={maHocKy} onChange={e => setMaHocKy(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
          <option value="">Tất cả học kỳ</option>
          {hocKyList.map(hk => (
            <option key={hk.maHocKy} value={hk.maHocKy}>
              {hk.tenHocKy}{hk.isClbLocked ? ' 🔒' : ''}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, mã SV…"
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
        </div>

        {canManage && (
          <>
            {maHocKy && hasPermission(PERMISSIONS.QUAN_LY_CLB) && (
              <button
                onClick={() => lockMutation.mutate(!isLocked)}
                disabled={lockMutation.isPending}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isLocked
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isLocked ? <><Unlock className="w-4 h-4" /> Mở khóa</> : <><Lock className="w-4 h-4" /> Khóa danh sách</>}
              </button>
            )}
            {!isLocked && (
              <>
                <button
                  onClick={async () => {
                    try {
                      await cauLacBoService.exportMembers(clb.maClb, maHocKy || null);
                    } catch (err) {
                      toast.error('Xuất Excel thất bại: ' + (err?.response?.data?.message || err.message));
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                  <Download className="w-4 h-4" /> Xuất Excel
                </button>
                <button onClick={() => setShowImport(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                  <Upload className="w-4 h-4" /> Nhập Excel
                </button>
                <button onClick={() => setShowAdd(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  <UserPlus className="w-4 h-4" /> Thêm thành viên
                </button>
              </>
            )}
          </>
        )}
      </div>

      {isLocked && (
        <div className="mb-4 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3 text-sm text-yellow-800 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Danh sách học kỳ này đã bị khóa. Không thể thêm/xóa thành viên.
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Mã SV</th>
              <th className="px-4 py-3 text-left">Họ tên</th>
              <th className="px-4 py-3 text-left">Lớp</th>
              <th className="px-4 py-3 text-left">Chức vụ</th>
              <th className="px-4 py-3 text-left">Học kỳ</th>
              {canManage && <th className="px-4 py-3 text-center">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Đang tải…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Chưa có thành viên</td></tr>
            ) : filtered.map((m, i) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-mono text-xs">{m.maSv}</td>
                <td className="px-4 py-3 font-medium">{m.hoTen}</td>
                <td className="px-4 py-3 text-gray-500">{m.tenLop || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                    m.chucVu === 'CHU_NHIEM' ? 'bg-purple-100 text-purple-700' :
                    m.chucVu === 'PHO_CHU_NHIEM' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {chucVuLabels[m.chucVu] || m.chucVu}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{m.tenHocKy || '—'}</td>
                {canManage && (
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setEditingMember(m)}
                        className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                        title="Chỉnh sửa">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!isLocked && (
                        <button onClick={() => {
                          if (confirm(`Xóa ${m.hoTen} khỏi CLB?`)) removeMutation.mutate(m.id);
                        }} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        title="Xóa khỏi CLB">
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">Tổng: {filtered.length} thành viên</p>

      {showAdd && <AddMemberModal maClb={clb.maClb} onClose={() => setShowAdd(false)} />}
      {showImport && <ImportExcelModal maClb={clb.maClb} onClose={() => setShowImport(false)} />}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          maClb={clb.maClb}
          onClose={() => setEditingMember(null)}
        />
      )}
    </div>
  );
}

// ── ClbDongPhi ───────────────────────────────────────────────────────────────
function ClbDongPhi({ clb }) {
  const queryClient = useQueryClient();
  const [maHocKy, setMaHocKy] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [previewFee, setPreviewFee] = useState(null);
  const [loadingPayInfo, setLoadingPayInfo] = useState(null);

  const { data: hocKyList = [] } = useQuery({
    queryKey: ['hocky-all'],
    queryFn: () => api.get('/api/hocky').then(r => Array.isArray(r.data) ? r.data : (r.data?.data || [])),
  });

  const { data: cauHinh } = useQuery({
    queryKey: ['clb-cauhinh', clb.maClb],
    queryFn: () => cauLacBoService.getCauHinh(clb.maClb),
  });

  // Tự động chọn học kỳ hiện tại
  useEffect(() => {
    if (hocKyList.length > 0 && !maHocKy) {
      const current = hocKyList.find(hk => hk.isCurrent);
      if (current) setMaHocKy(current.maHocKy);
    }
  }, [hocKyList, maHocKy]);

  const { data: phiList = [], isLoading, refetch } = useQuery({
    queryKey: ['clb-phi', clb.maClb, maHocKy],
    queryFn: () => cauLacBoService.getPhi(clb.maClb, maHocKy || null),
    enabled: !!clb.maClb,
  });

  const { data: stats = {} } = useQuery({
    queryKey: ['clb-phi-stats', clb.maClb, maHocKy],
    queryFn: () => cauLacBoService.getPhiStats(clb.maClb, maHocKy || null),
    enabled: !!clb.maClb,
  });

  const payMutation = useMutation({
    mutationFn: ({ maClb, id }) => {
      const returnUrl = window.location.href + '&payment=success';
      const cancelUrl = window.location.href + '&payment=cancel';
      return cauLacBoService.createPayOSLink(maClb, id, returnUrl, cancelUrl);
    },
    onSuccess: (data) => { if (data.checkoutUrl) window.open(data.checkoutUrl, '_blank'); },
    onError: e => toast.error(e.response?.data?.message || 'Lỗi tạo link'),
  });

  const generateMutation = useMutation({
    mutationFn: () => {
      if (!maHocKy) throw new Error('Vui lòng chọn học kỳ');
      const soTien = cauHinh?.soTienPhiKy ?? 50000;
      return cauLacBoService.generatePhi(clb.maClb, maHocKy, Number(soTien));
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Đã sinh phí thành công');
      queryClient.invalidateQueries(['clb-phi', clb.maClb]);
      queryClient.invalidateQueries(['clb-phi-stats', clb.maClb]);
    },
    onError: e => toast.error(e.response?.data?.message || 'Lỗi khi sinh phí'),
  });

  const markDaDongMutation = useMutation({
    mutationFn: ({ id, hinhThuc }) => cauLacBoService.markDaDong(clb.maClb, id, hinhThuc),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái');
      queryClient.invalidateQueries(['clb-phi', clb.maClb]);
      queryClient.invalidateQueries(['clb-phi-stats', clb.maClb]);
    },
  });

  const mienGiamMutation = useMutation({
    mutationFn: (id) => cauLacBoService.markMienGiam(clb.maClb, id),
    onSuccess: () => {
      toast.success('Đã cập nhật miễn giảm');
      queryClient.invalidateQueries(['clb-phi', clb.maClb]);
      queryClient.invalidateQueries(['clb-phi-stats', clb.maClb]);
    },
  });

  const resetMutation = useMutation({
    mutationFn: (id) => cauLacBoService.resetPhi(clb.maClb, id),
    onSuccess: () => {
      toast.success('Đã đặt lại trạng thái');
      queryClient.invalidateQueries(['clb-phi', clb.maClb]);
      queryClient.invalidateQueries(['clb-phi-stats', clb.maClb]);
    },
  });

  const openPaymentModal = async (p) => {
    setLoadingPayInfo(p.id);
    try {
      const info = await cauLacBoService.getPaymentInfo(clb.maClb, p.id);
      setPreviewFee({ ...info, id: p.id, tenClb: clb.tenClb, maClb: clb.maClb });
    } catch {
      toast.error('Không lấy được thông tin thanh toán');
    } finally {
      setLoadingPayInfo(null);
    }
  };

  const STATUS = {
    CHUA_DONG: { label: 'Chưa đóng', cls: 'bg-red-100 text-red-700' },
    DA_DONG:   { label: 'Đã đóng',   cls: 'bg-green-100 text-green-700' },
    MIEN_GIAM: { label: 'Miễn giảm', cls: 'bg-blue-100 text-blue-700' },
    QUA_HAN:   { label: 'Quá hạn',   cls: 'bg-orange-100 text-orange-700' },
  };

  const filtered = filterStatus
    ? phiList.filter(p => p.trangThai === filterStatus)
    : phiList;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng bản ghi', value: stats.total, color: 'bg-gray-50 text-gray-600' },
          { label: 'Đã đóng', value: stats.daDong, color: 'bg-green-50 text-green-600' },
          { label: 'Miễn giảm', value: stats.mienGiam, color: 'bg-blue-50 text-blue-600' },
          { label: 'Chưa đóng', value: stats.chuaDong, color: 'bg-red-50 text-red-600' },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-2xl border border-white shadow-sm ${s.color}`}>
            <p className="text-[10px] font-black uppercase opacity-70 mb-1">{s.label}</p>
            <p className="text-xl font-black">{s.value ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Bộ lọc & Action */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border shadow-sm items-end">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Chọn Học kỳ</label>
            <select value={maHocKy} onChange={e => setMaHocKy(e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 bg-gray-50/50">
              <option value="">— Tất cả học kỳ —</option>
              {hocKyList.map(hk => {
                const yearPrefix = hk.tenNamHoc?.toLowerCase().startsWith('năm học') ? '-' : '- Năm học';
                return (
                  <option key={hk.maHocKy} value={hk.maHocKy}>
                    Học kỳ {hk.tenHocKy} {hk.tenNamHoc ? `${yearPrefix} ${hk.tenNamHoc}` : ''} {hk.isCurrent ? '(Hiện tại)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Lọc trạng thái</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 bg-gray-50/50">
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          {maHocKy && (
            <button
              onClick={() => {
                const soTien = cauHinh?.soTienPhiKy ?? 50000;
                if (confirm(`Sinh phí ${Number(soTien).toLocaleString('vi-VN')}đ cho tất cả thành viên trong học kỳ này?`))
                  generateMutation.mutate();
              }}
              disabled={generateMutation.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 shadow-md shadow-indigo-200 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Sinh phí kỳ ({Number(cauHinh?.soTienPhiKy ?? 50000).toLocaleString('vi-VN')}đ)
            </button>
          )}
          <button onClick={() => refetch()} className="p-2.5 border rounded-xl hover:bg-gray-50 text-gray-400 transition-colors">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Thông báo Webhook */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cauHinh?.bankAccountNo && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 shadow-sm">
            <Banknote className="w-6 h-6 flex-shrink-0 text-amber-600" />
            <div className="text-[10px] leading-relaxed">
              <p className="font-black uppercase tracking-widest mb-1">Tự động qua Ngân hàng</p>
              <p>Sinh viên chuyển khoản ghi: <strong className="text-amber-900 font-black">PHICLB {clb.maClb} [MSSV]</strong>.</p>
              <p className="mt-1 opacity-70">Hệ thống tự động duyệt qua {cauHinh.webhookProvider || 'Casso/SePay'} nếu nội dung khớp.</p>
            </div>
          </div>
        )}
        
        {cauHinh?.payosClientId && (
          <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-indigo-800 shadow-sm">
            <Zap className="w-6 h-6 flex-shrink-0 text-indigo-600" />
            <div className="text-[10px] leading-relaxed">
              <p className="font-black uppercase tracking-widest mb-1">Cổng thanh toán PayOS</p>
              <p>Hỗ trợ QR Code động & Thẻ. Duyệt <strong className="italic font-black">tức thì 100%</strong> ngay sau khi thanh toán thành công.</p>
            </div>
          </div>
        )}
      </div>

      {/* Bảng */}
      {isLoading ? (
        <div className="text-center py-20">
           <RefreshCw className="w-10 h-10 animate-spin mx-auto text-indigo-200" />
           <p className="text-sm text-gray-400 mt-4 font-medium">Đang tải danh sách lệ phí...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
             <Banknote className="w-10 h-10 text-gray-200" />
          </div>
          <p className="font-bold text-gray-400">Chưa có dữ liệu phí cho tiêu chí này</p>
          {maHocKy && <p className="text-xs text-gray-400 mt-1">Bấm "Sinh phí kỳ" để bắt đầu thu phí học kỳ này.</p>}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border shadow-xl shadow-gray-100/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-[0.15em] border-b">
                <tr>
                  <th className="px-6 py-5 text-left">Thành viên</th>
                  <th className="px-4 py-5 text-left">Học kỳ</th>
                  <th className="px-4 py-5 text-right">Số tiền</th>
                  <th className="px-4 py-5 text-center">Trạng thái</th>
                  <th className="px-4 py-5 text-left">Ghi chú / Nguồn</th>
                  <th className="px-6 py-5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => {
                  const s = STATUS[p.trangThai] || { label: p.trangThai, cls: 'bg-gray-100 text-gray-600' };
                  return (
                    <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-black text-gray-800 group-hover:text-indigo-600 transition-colors">{p.hoTen}</p>
                        <p className="text-[10px] text-gray-400 font-mono tracking-tighter">{p.maSv} · {p.tenLop || '—'}</p>
                      </td>
                      <td className="px-4 py-4">
                         <p className="text-xs font-bold text-gray-500">{p.tenHocKy || '—'}</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="font-black text-gray-900">{Number(p.soTien).toLocaleString('vi-VN')}đ</p>
                        {p.soTienCk && p.soTienCk !== p.soTien && (
                           <p className="text-[10px] text-green-600 font-bold">Thực nhận: {Number(p.soTienCk).toLocaleString()}đ</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${s.cls}`}>
                          {s.label}
                        </span>
                        {p.ngayDong && <p className="text-[9px] text-gray-400 mt-1 font-medium">{p.ngayDong}</p>}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-[10px] text-gray-500 max-w-[150px] truncate" title={p.ghiChu}>{p.ghiChu || '—'}</p>
                        {p.nguon && <p className="text-[9px] text-indigo-500 font-black mt-1 uppercase italic">via {p.nguon}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openPaymentModal(p)}
                            disabled={loadingPayInfo === p.id}
                            className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm shadow-indigo-100" title="Xem mã QR">
                            {loadingPayInfo === p.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                          </button>
                          
                          {p.trangThai === 'CHUA_DONG' && (
                            <>
                              <button onClick={() => markDaDongMutation.mutate({ id: p.id, hinhThuc: 'TIEN_MAT' })}
                                className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm shadow-green-100" title="Đã đóng (Tiền mặt)">
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => mienGiamMutation.mutate(p.id)}
                                className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm shadow-blue-100" title="Miễn giảm">
                                <BadgeCheck className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {(p.trangThai === 'DA_DONG' || p.trangThai === 'MIEN_GIAM') && (
                            <button onClick={() => {
                              if (confirm('Đặt lại thành chưa đóng?')) resetMutation.mutate(p.id);
                            }} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all" title="Đặt lại">
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50/50 px-6 py-4 border-t flex justify-between items-center">
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
               {filtered.length} bản ghi
             </p>
             <p className="text-xs font-black text-gray-700">
               TỔNG THU THỰC TẾ: <span className="text-green-600 text-lg ml-2">{(stats.tongThu ?? 0).toLocaleString('vi-VN')}đ</span>
             </p>
          </div>
        </div>
      )}

      {previewFee && (
        <ManualPayModal 
          fee={previewFee} 
          onClose={() => setPreviewFee(null)}
          onPayOS={() => payMutation.mutate({ maClb: clb.maClb, id: previewFee.id })}
        />
      )}
    </div>
  );
}

// ── ClbCauHinhTab ────────────────────────────────────────────────────────────
const CO_CHE_OPTIONS = [
  { value: 'TU_DO',             label: 'Tự do',               desc: 'Chỉ cần BCN thêm tên vào là thành viên, không yêu cầu gì thêm' },
  { value: 'YEU_CAU_HOAT_DONG', label: 'Yêu cầu tham gia HĐ', desc: 'Thành viên phải đạt số hoạt động tối thiểu' },
  // { value: 'YEU_CAU_DONG_PHI',  label: 'Yêu cầu đóng phí' },        // TẠM ẨN
  // { value: 'YEU_CAU_CA_HAI',    label: 'Yêu cầu phí + hoạt động' }, // TẠM ẨN
];

function ClbCauHinhTab({ clb }) {
  const queryClient = useQueryClient();
  const { data: cfg, isLoading } = useQuery({
    queryKey: ['clb-cauhinh', clb.maClb],
    queryFn: () => cauLacBoService.getCauHinh(clb.maClb),
  });

  const [form, setForm] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Sync khi data load xong
  if (cfg && form === null) {
    // Sẽ được set trong useEffect-like pattern khi render
  }
  const current = form ?? cfg ?? {};

  const saveMutation = useMutation({
    mutationFn: (data) => cauLacBoService.saveCauHinh(clb.maClb, data),
    onSuccess: () => {
      toast.success('Đã lưu cấu hình CLB');
      queryClient.invalidateQueries(['clb-cauhinh', clb.maClb]);
      setForm(null);
    },
    onError: e => toast.error(e.response?.data?.message || 'Lỗi lưu cấu hình'),
  });

  if (isLoading) return <div className="py-8 text-center text-gray-400">Đang tải…</div>;

  const isDirty = form !== null;
  const cocheThanHVien = current.cocheThanHVien || 'TU_DO';
  const needPhi    = cocheThanHVien === 'YEU_CAU_DONG_PHI'  || cocheThanHVien === 'YEU_CAU_CA_HAI';
  const needHoatDong = cocheThanHVien === 'YEU_CAU_HOAT_DONG' || cocheThanHVien === 'YEU_CAU_CA_HAI';

  const handleSave = () => saveMutation.mutate(current);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ── Cơ chế thành viên ── */}
      <section>
        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-blue-500" /> Cơ chế xét thành viên
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CO_CHE_OPTIONS.map(opt => (
            <label key={opt.value}
              className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                cocheThanHVien === opt.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200'
              }`}>
              <input type="radio" name="coche" value={opt.value}
                checked={cocheThanHVien === opt.value}
                onChange={() => set('cocheThanHVien', opt.value)}
                className="mt-0.5 accent-blue-600" />
              <div>
                <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {needHoatDong && (
          <div className="mt-4 flex items-center gap-3">
            <label className="text-sm text-gray-600 w-52">Số hoạt động tối thiểu / kỳ:</label>
            <input type="number" min={1} value={current.soHoatDongToiThieu ?? 3}
              onChange={e => set('soHoatDongToiThieu', parseInt(e.target.value) || 1)}
              className="w-24 border rounded-lg px-3 py-1.5 text-sm" />
          </div>
        )}
      </section>

      {/* ── Phí + Thanh toán — TẠM ẨN ── */}
      {false && <section className="border-t pt-5">
        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Banknote className="w-4 h-4 text-green-500" /> Cấu hình phí thành viên
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mức phí / chu kỳ (VNĐ)</label>
            <input type="number" min={0} value={current.soTienPhiKy ?? 50000}
              onChange={e => set('soTienPhiKy', parseInt(e.target.value) || 0)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Chu kỳ thu phí</label>
            <select value={current.donViPhi ?? 'KY'}
              onChange={e => set('donViPhi', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="KY">Theo học kỳ</option>
              <option value="NAM">Theo năm học</option>
              <option value="THANG">Theo tháng</option>
            </select>
          </div>
        </div>

      {/* ── Cấu hình thanh toán ── */}
      <section className="border-t pt-5">
        <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Banknote className="w-4 h-4 text-green-500" /> Cấu hình thanh toán phí
        </h4>
        
        {/* Tab Selector */}
        <div className="flex p-1 bg-gray-100 rounded-xl mb-4 w-fit">
          <button
            type="button"
            onClick={() => set('activePaymentTab', 'BANK')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              (current.activePaymentTab || 'BANK') === 'BANK' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Chuyển khoản (Casso/SePay)
          </button>
          <button
            type="button"
            onClick={() => set('activePaymentTab', 'PAYOS')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              (current.activePaymentTab || 'BANK') === 'PAYOS' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Cổng PayOS
          </button>
        </div>

        <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
          {(current.activePaymentTab || 'BANK') === 'BANK' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Số tài khoản</label>
                  <input value={current.bankAccountNo ?? ''}
                    onChange={e => set('bankAccountNo', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="0123456789" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngân hàng</label>
                  <input value={current.bankName ?? ''}
                    onChange={e => set('bankName', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="MB Bank, VCB..." />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tên chủ tài khoản</label>
                  <input value={current.accountName ?? ''}
                    onChange={e => set('accountName', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Prefix nội dung CK</label>
                  <input value={current.maXacThucCk ?? ''}
                    onChange={e => set('maXacThucCk', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white font-bold text-blue-700"
                    placeholder={`PHICLB ${clb.maClb}`} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Webhook Provider</label>
                <select value={current.webhookProvider ?? 'CASSO'}
                  onChange={e => set('webhookProvider', e.target.value)}
                  className="w-48 border rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="CASSO">Casso.vn</option>
                  <option value="SEPAY">SePay.vn</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">PayOS API Credentials</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Client ID</label>
                <input value={current.payosClientId ?? ''}
                  onChange={e => set('payosClientId', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="4489522b-..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">API Key</label>
                  <input type="password" value={current.payosApiKey ?? ''}
                    onChange={e => set('payosApiKey', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 bg-white"
                    placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Checksum Key</label>
                  <input type="password" value={current.payosChecksumKey ?? ''}
                    onChange={e => set('payosChecksumKey', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 bg-white"
                    placeholder="••••••••" />
                </div>
              </div>
              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-900 mb-2 flex items-center gap-1.5 uppercase">
                  <LayoutGrid className="w-3.5 h-3.5" /> Webhook URL
                </p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-white px-2 py-1.5 rounded border text-[10px] break-all font-mono text-indigo-600">
                    {window.location.origin}/api/clb/webhook/payos/{clb.maClb}
                  </code>
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/clb/webhook/payos/${clb.maClb}`);
                      toast.info('Đã copy Webhook URL');
                    }}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700"
                  >
                    COPY
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      </section>}

      {/* ── Đăng ký tự do ── */}
      <section className="border-t pt-5">
        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-orange-500" /> Cổng đăng ký sinh viên
        </h4>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox"
              checked={current.choPhepDangKyTuDo ?? true}
              onChange={e => set('choPhepDangKyTuDo', e.target.checked)}
              className="w-4 h-4 accent-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-700">Cho phép sinh viên tự đăng ký</p>
              <p className="text-xs text-gray-500">Sinh viên có thể nộp đơn qua cổng sinh viên</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox"
              checked={current.canDuyetDangKy ?? true}
              onChange={e => set('canDuyetDangKy', e.target.checked)}
              className="w-4 h-4 accent-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-700">Yêu cầu phê duyệt</p>
              <p className="text-xs text-gray-500">BCN phải duyệt thủ công; nếu tắt thì tự động vào ngay</p>
            </div>
          </label>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Số thành viên tối đa (để trống = không giới hạn)
          </label>
          <input type="number" min={1}
            value={current.soThanhVienToiDa ?? ''}
            onChange={e => set('soThanhVienToiDa', e.target.value ? parseInt(e.target.value) : null)}
            className="w-32 border rounded-lg px-3 py-2 text-sm"
            placeholder="∞" />
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Mô tả yêu cầu (hiển thị cho SV khi đăng ký)
          </label>
          <textarea value={current.moTaYeuCau ?? ''}
            onChange={e => set('moTaYeuCau', e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            placeholder="VD: Yêu cầu có GPA ≥ 2.5, tham gia đầy đủ các buổi sinh hoạt..." />
        </div>
      </section>

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 pt-2">
        {isDirty && (
          <button onClick={() => setForm(null)}
            className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Hủy thay đổi
          </button>
        )}
        <button onClick={handleSave} disabled={saveMutation.isPending}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Đang lưu…' : isDirty ? 'Lưu thay đổi' : 'Lưu cấu hình'}
        </button>
      </div>
    </div>
  );
}

// ── ClbDangKyTab — BCN duyệt đơn ────────────────────────────────────────────
const STATUS_COLOR = {
  CHO_DUYET: 'bg-yellow-100 text-yellow-700',
  DA_DUYET:  'bg-green-100 text-green-700',
  TU_CHOI:   'bg-red-100 text-red-700',
  HUY:       'bg-gray-100 text-gray-500',
};

function ClbDangKyTab({ clb }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('CHO_DUYET');
  const [rejectModal, setRejectModal] = useState(null); // { id }
  const [rejectReason, setRejectReason] = useState('');

  const { data: donList = [], isLoading } = useQuery({
    queryKey: ['clb-dangky', clb.maClb, filter],
    queryFn: () => cauLacBoService.getDonDangKy(clb.maClb, filter || null),
  });

  const duyetMutation = useMutation({
    mutationFn: (id) => cauLacBoService.duyetDon(clb.maClb, id),
    onSuccess: () => {
      toast.success('Đã duyệt đơn, thêm vào danh sách thành viên');
      queryClient.invalidateQueries(['clb-dangky', clb.maClb]);
      queryClient.invalidateQueries(['clb-members', clb.maClb]);
    },
    onError: e => toast.error(e.response?.data?.message || 'Lỗi duyệt đơn'),
  });

  const tuChoiMutation = useMutation({
    mutationFn: ({ id, lyDo }) => cauLacBoService.tuChoiDon(clb.maClb, id, lyDo),
    onSuccess: () => {
      toast.success('Đã từ chối đơn');
      queryClient.invalidateQueries(['clb-dangky', clb.maClb]);
      setRejectModal(null);
      setRejectReason('');
    },
    onError: e => toast.error(e.response?.data?.message || 'Lỗi từ chối đơn'),
  });

  const filterTabs = [
    { key: 'CHO_DUYET', label: 'Chờ duyệt', icon: Clock },
    { key: 'DA_DUYET',  label: 'Đã duyệt',  icon: CheckSquare },
    { key: 'TU_CHOI',   label: 'Từ chối',   icon: XSquare },
    { key: '',          label: 'Tất cả',     icon: ClipboardList },
  ];

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {filterTabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === t.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-gray-400">Đang tải…</div>
      ) : donList.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Không có đơn nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {donList.map(don => (
            <div key={don.id}
              className="flex items-start justify-between gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {don.hoTen?.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 text-sm">{don.hoTen}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[don.trangThai] || 'bg-gray-100'}`}>
                      {don.trangThaiLabel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{don.maSv} · {don.tenLop || '—'}</p>
                  {don.lyDoDangKy && (
                    <p className="text-xs text-gray-600 mt-1 italic">"{don.lyDoDangKy}"</p>
                  )}
                  {don.lyDoXuLy && (
                    <p className="text-xs text-gray-400 mt-0.5">Lý do xử lý: {don.lyDoXuLy}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    Nộp: {don.createdAt ? new Date(don.createdAt).toLocaleDateString('vi-VN') : '—'}
                    {don.nguoiXuLy && ` · Xử lý bởi: ${don.nguoiXuLy}`}
                  </p>
                </div>
              </div>
              {don.trangThai === 'CHO_DUYET' && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => duyetMutation.mutate(don.id)}
                    disabled={duyetMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                    <CheckSquare className="w-3.5 h-3.5" /> Duyệt
                  </button>
                  <button
                    onClick={() => { setRejectModal(don.id); setRejectReason(''); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50">
                    <XSquare className="w-3.5 h-3.5" /> Từ chối
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-4">Từ chối đơn đăng ký</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              rows={3} placeholder="Lý do từ chối (không bắt buộc)..."
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)}
                className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50">Hủy</button>
              <button
                onClick={() => tuChoiMutation.mutate({ id: rejectModal, lyDo: rejectReason })}
                disabled={tuChoiMutation.isPending}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {tuChoiMutation.isPending ? 'Đang xử lý…' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AddBcnModal ──────────────────────────────────────────────────────────────
const CHUC_VU_BCN_OPTIONS = [
  'Chủ nhiệm', 'Phó chủ nhiệm', 'Ủy viên', 'Kế toán', 'Thủ quỹ', 'Trưởng ban', 'Phó ban',
];
const LOAI_NGUOI_OPTIONS = [
  { value: 'SV', label: 'Sinh viên' },
  { value: 'GV', label: 'Giảng viên' },
  { value: 'CV', label: 'Chuyên viên' },
];

function AddBcnModal({ maClb, nhiemKy, onClose }) {
  const queryClient = useQueryClient();
  const [loai, setLoai] = useState('SV');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null); // { ma, ten, donVi, email }
  const [form, setForm] = useState({
    chucVu: 'Chủ nhiệm', nhiemKy: nhiemKy || '',
    emailLienHe: '', sdt: '', ngayBoNhiem: '', ghiChu: '',
  });
  const searchTimer = useRef(null);

  useEffect(() => {
    setSelected(null);
    setSearch('');
    setSearchResults([]);
  }, [loai]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!search.trim() || search.trim().length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await cauLacBoService.searchNguoiBCN(maClb, search.trim(), loai);
        setSearchResults(data);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 350);
  }, [search, loai, maClb]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data) => cauLacBoService.addBcn(maClb, data),
    onSuccess: () => {
      toast.success('Thêm BCN thành công');
      queryClient.invalidateQueries(['clb-bcn', maClb]);
      queryClient.invalidateQueries(['clb-bcn-nhiemky', maClb]);
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi thêm BCN'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selected) return toast.warn('Vui lòng chọn người từ kết quả tìm kiếm');
    if (!form.nhiemKy.trim()) return toast.warn('Vui lòng nhập nhiệm kỳ');
    const payload = {
      loaiNguoi: loai,
      chucVu: form.chucVu,
      nhiemKy: form.nhiemKy,
      emailLienHe: form.emailLienHe || selected.email || null,
      sdt: form.sdt || null,
      ngayBoNhiem: form.ngayBoNhiem || null,
      ghiChu: form.ghiChu || null,
    };
    if (loai === 'GV') payload.maGv = selected.ma;
    else if (loai === 'CV') payload.maCv = selected.ma;
    else payload.maSv = selected.ma;
    mutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-500" /> Thêm nhân sự BCN
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Loại người */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại nhân sự *</label>
            <div className="flex rounded-lg border overflow-hidden text-sm">
              {LOAI_NGUOI_OPTIONS.map(o => (
                <button key={o.value} type="button" onClick={() => setLoai(o.value)}
                  className={`flex-1 py-2 font-medium transition-colors ${
                    loai === o.value ? 'bg-purple-600 text-white' : 'hover:bg-gray-50 text-gray-600'
                  }`}>{o.label}</button>
              ))}
            </div>
          </div>

          {/* Tìm kiếm */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm {LOAI_NGUOI_OPTIONS.find(o => o.value === loai)?.label} *
            </label>
            <input value={search} onChange={e => { setSearch(e.target.value); setSelected(null); }}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
              placeholder="Nhập tên hoặc mã để tìm kiếm..." />
            {(searching || searchResults.length > 0) && (
              <div className="absolute z-20 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {searching && <p className="px-3 py-2 text-sm text-gray-400">Đang tìm…</p>}
                {!searching && searchResults.map(r => (
                  <button key={r.ma} type="button" onClick={() => { setSelected(r); setSearch(r.ten); setSearchResults([]); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 border-b last:border-0">
                    <span className="font-medium">{r.ten}</span>
                    <span className="text-gray-400 ml-2 font-mono text-xs">{r.ma}</span>
                    {r.donVi && <span className="text-gray-400 ml-2 text-xs">· {r.donVi}</span>}
                  </button>
                ))}
                {!searching && searchResults.length === 0 && search.length >= 2 && (
                  <p className="px-3 py-2 text-sm text-gray-400">Không tìm thấy kết quả</p>
                )}
              </div>
            )}
          </div>

          {/* Người đã chọn */}
          {selected && (
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg text-sm">
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                {selected.ten?.charAt(0) || '?'}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{selected.ten}</p>
                <p className="text-xs text-gray-500">{selected.ma} · {selected.donVi}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ *</label>
              <select value={form.chucVu} onChange={e => set('chucVu', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500">
                {CHUC_VU_BCN_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhiệm kỳ *</label>
              <input value={form.nhiemKy} onChange={e => set('nhiemKy', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                placeholder="VD: 2024-2025" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email liên hệ</label>
              <input type="email" value={form.emailLienHe} onChange={e => set('emailLienHe', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder={selected?.email || 'email@example.com'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input value={form.sdt} onChange={e => set('sdt', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0912 345 678" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bổ nhiệm</label>
            <input type="date" value={form.ngayBoNhiem} onChange={e => set('ngayBoNhiem', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea value={form.ghiChu} onChange={e => set('ghiChu', e.target.value)}
              rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              placeholder="Thông tin thêm về nhân sự..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={mutation.isPending || !selected}
              className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
              {mutation.isPending ? 'Đang lưu…' : 'Thêm BCN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── ClbBcnTab ────────────────────────────────────────────────────────────────
const TRANG_THAI_BCN = {
  DUONG_NHIEM: { label: 'Đương nhiệm', cls: 'bg-green-100 text-green-700' },
  THOI_CHUC:   { label: 'Thôi chức',   cls: 'bg-gray-100 text-gray-500' },
};

function ClbBcnTab({ clb }) {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission(PERMISSIONS.QUAN_LY_CLB) || hasPermission(PERMISSIONS.QUAN_LY_THANH_VIEN_CLB);

  const [nhiemKy, setNhiemKy] = useState('');
  const [filterTT, setFilterTT] = useState('DUONG_NHIEM');
  const [showAdd, setShowAdd] = useState(false);
  const importRef = useRef(null);

  const { data: nhiemKyList = [] } = useQuery({
    queryKey: ['clb-bcn-nhiemky', clb.maClb],
    queryFn: () => cauLacBoService.getBcnNhiemKy(clb.maClb),
  });

  const { data: bcnList = [], isLoading } = useQuery({
    queryKey: ['clb-bcn', clb.maClb, nhiemKy, filterTT],
    queryFn: () => cauLacBoService.getBcn(clb.maClb, {
      nhiemKy: nhiemKy || undefined,
      trangThai: filterTT || undefined,
    }),
  });

  const thoiChucMutation = useMutation({
    mutationFn: (id) => cauLacBoService.thoiChucBcn(clb.maClb, id),
    onSuccess: () => {
      toast.success('Đã đánh dấu thôi chức');
      queryClient.invalidateQueries(['clb-bcn', clb.maClb]);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi'),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => cauLacBoService.removeBcn(clb.maClb, id),
    onSuccess: () => {
      toast.success('Đã xóa khỏi BCN');
      queryClient.invalidateQueries(['clb-bcn', clb.maClb]);
      queryClient.invalidateQueries(['clb-bcn-nhiemky', clb.maClb]);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi'),
  });

  const importMutation = useMutation({
    mutationFn: ({ file, nk }) => cauLacBoService.importBcnExcel(clb.maClb, file, nk || new Date().getFullYear().toString()),
    onSuccess: (res) => {
      toast.success(`Import xong: ${res.success ?? 0} thành công${res.fail ? `, ${res.fail} lỗi` : ''}`);
      if (res.errors?.length) {
        res.errors.slice(0, 3).forEach(e => toast.warning(e, { autoClose: 6000 }));
      }
      queryClient.invalidateQueries(['clb-bcn', clb.maClb]);
      queryClient.invalidateQueries(['clb-bcn-nhiemky', clb.maClb]);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Import thất bại'),
  });

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const nk = nhiemKy || prompt('Nhập nhiệm kỳ (vd: 2024-2025):') || '';
    importMutation.mutate({ file, nk });
    e.target.value = '';
  };

  const chucVuOrder = ['Chủ nhiệm', 'Phó chủ nhiệm', 'Ủy viên'];
  const sorted = [...bcnList].sort((a, b) => {
    const ia = chucVuOrder.indexOf(a.chucVu);
    const ib = chucVuOrder.indexOf(b.chucVu);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <select value={nhiemKy} onChange={e => setNhiemKy(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500">
            <option value="">Tất cả nhiệm kỳ</option>
            {nhiemKyList.map(nk => <option key={nk} value={nk}>{nk}</option>)}
          </select>
          <div className="flex rounded-lg border overflow-hidden text-sm">
            {[
              { key: 'DUONG_NHIEM', label: 'Đương nhiệm' },
              { key: 'THOI_CHUC',   label: 'Thôi chức' },
              { key: '',            label: 'Tất cả' },
            ].map(t => (
              <button key={t.key} onClick={() => setFilterTT(t.key)}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  filterTT === t.key ? 'bg-purple-600 text-white' : 'hover:bg-gray-50 text-gray-600'
                }`}>{t.label}</button>
            ))}
          </div>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <input ref={importRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />
            <button onClick={() => importRef.current?.click()}
              disabled={importMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 border border-purple-300 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-50 disabled:opacity-50">
              <Upload className="w-4 h-4" />
              {importMutation.isPending ? 'Đang import…' : 'Import Excel'}
            </button>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
              <UserPlus className="w-4 h-4" /> Thêm nhân sự BCN
            </button>
          </div>
        )}
      </div>

      {/* BCN Cards */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Đang tải…</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Chưa có nhân sự BCN</p>
          <p className="text-xs mt-1">Thêm thành viên Ban Chủ Nhiệm để quản lý lãnh đạo CLB theo nhiệm kỳ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(b => {
            const tt = TRANG_THAI_BCN[b.trangThai] || { label: b.trangThai, cls: 'bg-gray-100 text-gray-600' };
            const isLeader = b.chucVu === 'Chủ nhiệm';
            return (
              <div key={b.id} className={`border rounded-xl p-4 relative ${
                isLeader ? 'border-purple-200 bg-purple-50/30' : 'bg-white'
              } ${b.trangThai === 'THOI_CHUC' ? 'opacity-60' : ''}`}>
                {isLeader && (
                  <Star className="absolute top-3 right-3 w-4 h-4 text-purple-400 fill-purple-200" />
                )}
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0 ${
                    isLeader ? 'bg-purple-500' : b.loaiNguoi === 'GV' ? 'bg-teal-500' : b.loaiNguoi === 'CV' ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    {(b.tenNguoi || b.tenSv)?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-gray-900 truncate">{b.tenNguoi || b.tenSv}</p>
                      {b.loaiNguoi && b.loaiNguoi !== 'SV' && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          b.loaiNguoi === 'GV' ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'
                        }`}>{b.loaiNguoi}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-mono">{b.maGv || b.maCv || b.maSv}</p>
                    {(b.donVi || b.lop) && <p className="text-xs text-gray-400">{b.donVi || b.lop}</p>}
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      isLeader ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-600'
                    }`}>{b.chucVu}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs ${tt.cls}`}>{tt.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Nhiệm kỳ: <strong>{b.nhiemKy}</strong>
                  </p>
                  {b.emailLienHe && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 flex-shrink-0" /> {b.emailLienHe}
                    </p>
                  )}
                  {b.sdt && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {b.sdt}
                    </p>
                  )}
                </div>

                {canManage && b.trangThai === 'DUONG_NHIEM' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <button onClick={() => {
                      if (confirm(`Đánh dấu ${b.tenNguoi || b.tenSv} thôi chức?`)) thoiChucMutation.mutate(b.id);
                    }} className="flex-1 py-1.5 text-xs border rounded-lg text-gray-600 hover:bg-gray-50">
                      Thôi chức
                    </button>
                    <button onClick={() => {
                      if (confirm(`Xóa ${b.tenNguoi || b.tenSv} khỏi danh sách BCN?`)) removeMutation.mutate(b.id);
                    }} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {nhiemKyList.length > 0 && (
        <p className="text-xs text-gray-400">
          Lịch sử nhiệm kỳ: {nhiemKyList.join(' · ')}
        </p>
      )}

      {showAdd && (
        <AddBcnModal
          maClb={clb.maClb}
          nhiemKy={nhiemKy}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

// ── ClbStatsCards ────────────────────────────────────────────────────────────
function ClbStatsCards({ maClb }) {
  const { data: stats = {} } = useQuery({
    queryKey: ['clb-stats', maClb],
    queryFn: () => cauLacBoService.getStats(maClb),
    refetchInterval: 60000,
  });

  const cards = [
    { label: 'Thành viên', value: stats.tongThanhVien ?? '—', icon: Users, color: 'text-blue-600 bg-blue-50', border: 'border-blue-100' },
    { label: 'Hoạt động',  value: stats.tongHoatDong ?? '—',  icon: Activity, color: 'text-green-600 bg-green-50', border: 'border-green-100' },
    { label: 'Đã hoàn thành', value: stats.hoatDongHoanThanh ?? '—', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Chờ duyệt',  value: stats.hoatDongChoDuyet ?? '—', icon: Clock, color: 'text-orange-600 bg-orange-50', border: 'border-orange-100' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {cards.map(c => (
        <div key={c.label} className={`border ${c.border} rounded-xl p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center flex-shrink-0`}>
            <c.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 leading-none">{c.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── ClbDetail ────────────────────────────────────────────────────────────────
function ClbDetail({ clb, onBack }) {
  const [tab, setTab] = useState('members');
  const [exporting, setExporting] = useState(false);
  const [showBanHanh, setShowBanHanh] = useState(false);

  // Badge số đơn chờ duyệt thành viên
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['clb-dangky-count', clb.maClb],
    queryFn: () => cauLacBoService.countCHO_DUYET(clb.maClb),
    refetchInterval: 30000,
  });

  // Badge số hoạt động chờ duyệt
  const { data: statsData = {} } = useQuery({
    queryKey: ['clb-stats', clb.maClb],
    queryFn: () => cauLacBoService.getStats(clb.maClb),
    refetchInterval: 60000,
  });
  const pendingActivities = statsData.hoatDongChoDuyet ?? 0;

  const handleExport = async () => {
    setExporting(true);
    try {
      await cauLacBoService.exportMembers(clb.maClb);
      toast.success('Đã xuất file Excel');
    } catch {
      toast.error('Lỗi xuất file');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 text-sm font-medium">
          <ChevronLeft className="w-4 h-4" /> Quay lại danh sách
        </button>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">{clb.loai}</span>
              {clb.tenKhoa && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{clb.tenKhoa}</span>}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{clb.tenClb}</h2>
            {clb.linhVuc && <p className="text-sm text-gray-500 mt-0.5">Lĩnh vực: {clb.linhVuc}</p>}
            {clb.moTa && <p className="text-sm text-gray-600 mt-2">{clb.moTa}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleExport} disabled={exporting}
              className="flex items-center gap-2 px-3 py-1.5 border border-green-300 text-green-700 rounded-lg text-xs font-medium hover:bg-green-50 disabled:opacity-50">
              <Download className="w-3.5 h-3.5" />
              {exporting ? 'Đang xuất…' : 'Xuất Excel'}
            </button>
            <button onClick={() => setShowBanHanh(true)}
              className="flex items-center gap-2 px-3 py-1.5 border border-blue-300 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-50">
              <ShieldCheck className="w-3.5 h-3.5" /> Ban hành DS
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <ClbStatsCards maClb={clb.maClb} />

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          {[
            { key: 'members',    label: 'Thành viên',    icon: Users },
            { key: 'bcn',        label: 'Ban Chủ Nhiệm', icon: Award },
            { key: 'activities', label: 'Hoạt động',     icon: Activity, badge: pendingActivities },
            // { key: 'phi',        label: 'Đóng phí',      icon: Banknote }, // TẠM ẨN
            { key: 'dangky',     label: 'Đơn đăng ký',   icon: ClipboardList, badge: pendingCount },
            { key: 'cauhinh',    label: 'Cấu hình',      icon: Settings },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
              {t.badge > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="p-6">
          {tab === 'members'    && <ClbMemberManage clb={clb} />}
          {tab === 'bcn'        && <ClbBcnTab clb={clb} />}
          {tab === 'activities' && <ClbActivities clb={clb} />}
          {/* tab phi tạm ẩn */}
          {tab === 'dangky'     && <ClbDangKyTab clb={clb} />}
          {tab === 'cauhinh'    && <ClbCauHinhTab clb={clb} />}
        </div>
      </div>

      {showBanHanh && (
        <ClbBanHanhModal
          clb={clb}
          onClose={() => setShowBanHanh(false)}
        />
      )}
    </div>
  );
}

// ── ClbActivities ────────────────────────────────────────────────────────────
function ClbActivities({ clb }) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['clb-activities', clb.maClb],
    queryFn: () => cauLacBoService.getHoatDong(clb.maClb),
  });

  const trangThaiColors = {
    CHO_DUYET: 'bg-orange-100 text-orange-700 border border-orange-300',
    SAP_DIEN_RA: 'bg-blue-100 text-blue-700',
    DANG_MO_DANG_KY: 'bg-green-100 text-green-700',
    DANG_DIEN_RA: 'bg-yellow-100 text-yellow-700',
    DA_KET_THUC: 'bg-gray-100 text-gray-600',
    DA_HOAN_THANH: 'bg-emerald-100 text-emerald-700',
    DA_HUY: 'bg-red-100 text-red-700',
  };
  const trangThaiLabels = {
    CHO_DUYET: '⏳ Chờ duyệt',
    SAP_DIEN_RA: 'Sắp diễn ra', DANG_MO_DANG_KY: 'Mở đăng ký',
    DANG_DIEN_RA: 'Đang diễn ra', DA_KET_THUC: 'Đã kết thúc',
    DA_HOAN_THANH: 'Đã hoàn thành', DA_HUY: 'Đã hủy',
  };

  const pendingApproval = activities.filter(a => a.trangThai === 'CHO_DUYET');

  if (isLoading) return <div className="text-center py-8 text-gray-400">Đang tải…</div>;
  if (activities.length === 0) return (
    <div className="text-center py-12 text-gray-400">
      <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p>CLB chưa có hoạt động nào</p>
      <p className="text-xs mt-1">Tạo hoạt động mới và hệ thống sẽ gửi chờ Đoàn trường phê duyệt</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {pendingApproval.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-800 flex items-start gap-2">
          <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Có {pendingApproval.length} hoạt động đang chờ Đoàn trường phê duyệt</p>
            <p className="text-xs mt-0.5">Hoạt động do CLB tạo sẽ ở trạng thái "Chờ duyệt" cho đến khi Admin/BCH xét duyệt</p>
          </div>
        </div>
      )}
      {activities.map(a => (
        <div key={a.maHoatDong} className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 ${
          a.trangThai === 'CHO_DUYET' ? 'bg-orange-50/30' : ''
        }`}>
          <div>
            <p className="font-medium text-gray-900">{a.tenHoatDong}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {a.ngayToChuc} {a.diaDiem ? `· ${a.diaDiem}` : ''} {a.diemRenLuyen ? `· ${a.diemRenLuyen} điểm` : ''}
            </p>
            {a.trangThai === 'DA_HUY' && a.lyDoTuChoi && (
              <p className="text-xs text-red-500 mt-0.5">Lý do từ chối: {a.lyDoTuChoi}</p>
            )}
          </div>
          <span className={`text-xs px-2 py-1 rounded font-medium ${trangThaiColors[a.trangThai] || 'bg-gray-100 text-gray-600'}`}>
            {trangThaiLabels[a.trangThai] || a.trangThai}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ClbPortalPage() {
  const { hasPermission, maClb, tenClb } = useAuthStore();
  const canManageAll = hasPermission(PERMISSIONS.QUAN_LY_CLB);
  // Tài khoản CLB-scoped: chỉ quản lý đúng 1 CLB được gán
  const isClbScoped = !!maClb;

  const [selectedClb, setSelectedClb] = useState(null);
  const [search, setSearch] = useState('');

  // Nếu CLB-scoped → fetch thẳng CLB đó, không cần chọn từ danh sách
  const { data: scopedClb, isLoading: scopedLoading } = useQuery({
    queryKey: ['clb-detail', maClb],
    queryFn: () => api.get(`/api/clb/${maClb}`).then(r => r.data.data || r.data),
    enabled: isClbScoped,
  });

  // Load CLBs: admins see all, CLB leaders see their own
  const { data: myClubs = [], isLoading } = useQuery({
    queryKey: ['my-clubs'],
    queryFn: canManageAll
      ? () => cauLacBoService.getAll({})
      : () => cauLacBoService.getMyClubs(),
    enabled: !isClbScoped, // không cần nếu đã scoped
  });

  // Nếu không phải admin và chỉ quản lý đúng 1 CLB → tự động vào luôn không cần chọn
  useEffect(() => {
    if (!isClbScoped && !canManageAll && !selectedClb && myClubs.length === 1) {
      setSelectedClb(myClubs[0]);
    }
  }, [isClbScoped, canManageAll, selectedClb, myClubs]);

  // CLB-scoped: auto-render detail view của CLB được gán
  if (isClbScoped) {
    if (scopedLoading) {
      return (
        <div className="p-6 text-center py-16 text-gray-400">Đang tải thông tin CLB…</div>
      );
    }
    if (!scopedClb) {
      return (
        <div className="p-6 text-center py-16 text-red-400">
          Không tìm thấy CLB được gán cho tài khoản này. Vui lòng liên hệ quản trị viên.
        </div>
      );
    }
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-4 flex items-center gap-3">
          <Users className="w-6 h-6 text-orange-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Cổng quản lý CLB</h1>
            <p className="text-sm text-orange-600 font-medium">{tenClb || scopedClb.tenClb}</p>
          </div>
        </div>
        <ClbDetail clb={scopedClb} onBack={null} />
      </div>
    );
  }

  const filtered = myClubs.filter(c =>
    !search || c.tenClb?.toLowerCase().includes(search.toLowerCase()) ||
    c.maClb?.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedClb) {
    return (
      <div className="p-6">
        <ClbDetail clb={selectedClb} onBack={() => setSelectedClb(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="w-7 h-7 text-orange-500" />
          Quản lý CLB / Đội / Nhóm
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {canManageAll ? 'Toàn bộ CLB trong hệ thống' : 'CLB mà bạn đang quản lý'}
        </p>
      </div>

      {/* Search */}
      <div className="mb-5 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm CLB…"
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Đang tải danh sách CLB…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500 font-medium">
            {search ? 'Không tìm thấy CLB phù hợp' : 'Bạn chưa quản lý CLB nào'}
          </p>
          <p className="text-gray-400 text-sm mt-1">Liên hệ BCH Đoàn để được gán quyền quản lý CLB</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(clb => (
            <div key={clb.maClb}
              onClick={() => setSelectedClb(clb)}
              className="bg-white rounded-xl border shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer p-5">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  clb.loai === 'CLB' ? 'bg-orange-100 text-orange-700' :
                  clb.loai === 'DOI' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>{clb.loai}</span>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600">{clb.soThanhVien}</div>
                  <div className="text-xs text-gray-400">thành viên</div>
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{clb.tenClb}</h3>
              {clb.linhVuc && <p className="text-xs text-gray-500">{clb.linhVuc}</p>}
              {clb.tenKhoa && (
                <p className="text-xs text-gray-400 mt-1">📍 {clb.tenKhoa}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
