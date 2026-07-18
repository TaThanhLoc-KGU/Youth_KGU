/**
 * ClbExportAccountsModal — Xuất danh sách tài khoản thành viên CLB ra Excel (XLSX).
 * Có option lọc theo chức vụ và loại tài khoản.
 */
import { useState, useMemo } from 'react';
import { X, Download, FileSpreadsheet, Loader2, CheckSquare, Square } from 'lucide-react';
import { toast } from 'react-toastify';

const CHUC_VU_OPTIONS = [
  { value: 'CHU_NHIEM',     label: 'Chủ nhiệm' },
  { value: 'PHO_CHU_NHIEM', label: 'Phó Chủ nhiệm' },
  { value: 'BAN_QUAN_LY',   label: 'Ban quản lý' },
  { value: 'CO_VAN',        label: 'Cố vấn' },
  { value: 'THANH_VIEN',    label: 'Thành viên' },
];

const LOAI_TK_OPTIONS = [
  { value: 'SINH_VIEN', label: 'Sinh viên' },
  { value: 'GIANG_VIEN', label: 'Giảng viên / Cố vấn' },
  { value: 'QUAN_LY', label: 'Quản lý' },
];

const CHUC_VU_LABEL = {
  CHU_NHIEM:     'Chủ nhiệm',
  PHO_CHU_NHIEM: 'Phó Chủ nhiệm',
  BAN_QUAN_LY:   'Ban quản lý',
  CO_VAN:        'Cố vấn',
  THANH_VIEN:    'Thành viên',
};

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition-colors relative ${checked ? 'bg-blue-500' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

export default function ClbExportAccountsModal({ clb, allMembers = [], onClose }) {
  const [selectedChucVu,  setSelectedChucVu]  = useState(CHUC_VU_OPTIONS.map(o => o.value));
  const [selectedLoaiTk,  setSelectedLoaiTk]  = useState([]);   // [] = không lọc theo loại
  const [onlyActive,      setOnlyActive]      = useState(true);
  const [exporting,       setExporting]       = useState(false);

  const toggleChucVu = (val) => setSelectedChucVu(p =>
    p.includes(val) ? p.filter(v => v !== val) : [...p, val]
  );
  const toggleLoaiTk = (val) => setSelectedLoaiTk(p =>
    p.includes(val) ? p.filter(v => v !== val) : [...p, val]
  );

  const filtered = useMemo(() => {
    return allMembers.filter(m => {
      if (selectedChucVu.length > 0 && !selectedChucVu.includes(m.chucVu)) return false;
      if (selectedLoaiTk.length > 0 && !selectedLoaiTk.includes(m.loaiTaiKhoan)) return false;
      if (onlyActive && m.trangThai === 'KHONG_HOAT_DONG') return false;
      return true;
    });
  }, [allMembers, selectedChucVu, selectedLoaiTk, onlyActive]);

  const handleExport = async () => {
    if (!filtered.length) { toast.warn('Không có dữ liệu để xuất'); return; }
    setExporting(true);
    try {
      // Dynamic import SheetJS to avoid bundle bloat when not used
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(
        filtered.map((m, idx) => ({
          'STT':          idx + 1,
          'Họ và Tên':    m.hoTen || m.tenSinhVien || '',
          'MSSV':         m.maSv  || m.maSinhVien  || '',
          'Lớp':          m.maLop || '',
          'Khoa':         m.tenKhoa || '',
          'Chức vụ CLB':  CHUC_VU_LABEL[m.chucVu] || m.chucVu || '',
          'Loại tài khoản': m.loaiTaiKhoan || '',
          'Email':        m.email || '',
          'Ngày tham gia': m.ngayThamGia ? new Date(m.ngayThamGia).toLocaleDateString('vi-VN') : '',
          'Trạng thái':   m.trangThai === 'HOAT_DONG' ? 'Hoạt động' : 'Không hoạt động',
        }))
      );

      // Set column widths
      ws['!cols'] = [
        { wch: 5 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 20 },
        { wch: 16 }, { wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 14 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Thành viên CLB');
      const tenFile = `thanh_vien_${clb.maClb || 'clb'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, tenFile);
      toast.success(`Đã xuất ${filtered.length} tài khoản`);
    } catch (e) {
      toast.error('Lỗi xuất Excel: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-emerald-50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-gray-800">Xuất danh sách tài khoản</h3>
              <p className="text-xs text-gray-500">{clb.tenClb}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Lọc theo chức vụ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600">Theo chức vụ</p>
              <button onClick={() =>
                setSelectedChucVu(selectedChucVu.length === CHUC_VU_OPTIONS.length ? [] : CHUC_VU_OPTIONS.map(o => o.value))
              } className="text-xs text-blue-600 hover:underline">
                {selectedChucVu.length === CHUC_VU_OPTIONS.length ? 'Bỏ chọn tất' : 'Chọn tất cả'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-3">
              {CHUC_VU_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox"
                    checked={selectedChucVu.includes(opt.value)}
                    onChange={() => toggleChucVu(opt.value)}
                    className="rounded accent-blue-600"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Lọc theo loại tài khoản */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600">Theo loại tài khoản</p>
              <span className="text-xs text-gray-400">(để trống = tất cả)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {LOAI_TK_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox"
                    checked={selectedLoaiTk.includes(opt.value)}
                    onChange={() => toggleLoaiTk(opt.value)}
                    className="rounded accent-blue-600"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Chỉ tài khoản đang hoạt động */}
          <Toggle
            checked={onlyActive}
            onChange={setOnlyActive}
            label="Chỉ tài khoản đang hoạt động"
          />

          {/* Preview count */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-center">
            <span className="text-2xl font-bold text-blue-600">{filtered.length}</span>
            <span className="text-sm text-gray-500 ml-2">tài khoản sẽ được xuất</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
            Hủy
          </button>
          <button onClick={handleExport} disabled={exporting || !filtered.length}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? 'Đang xuất…' : 'Xuất Excel'}
          </button>
        </div>
      </div>
    </div>
  );
}
