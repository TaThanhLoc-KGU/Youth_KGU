import { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { Upload, X, CheckCircle, AlertCircle, RefreshCw, FileSpreadsheet, Download } from 'lucide-react';
import bchService from '../../services/bchService';
import * as XLSX from 'xlsx';

function downloadTemplate() {
  const headers = [
    'Họ và Tên', 'Mã (GV/CV/SV)', 'Email', 'Loại (GV/CV/SV)',
    'Nhiệm kỳ', 'Ngày bắt đầu (yyyy-MM-dd)', 'Ngày kết thúc (yyyy-MM-dd)',
  ];
  const samples = [
    ['Nguyễn Văn A', 'GV001', 'nguyenvana@kgu.edu.vn', 'GV', '2024-2025', '2024-09-01', '2025-08-31'],
    ['Trần Thị B', '', 'tranthib@kgu.edu.vn', 'CV', '2024-2025', '2024-09-01', ''],
    ['Lê Văn C', 'SV2021001', '', 'SV', '2024-2025', '2024-09-01', '2025-08-31'],
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, ...samples]);

  // Style header row width
  ws['!cols'] = headers.map((h, i) => ({ wch: i === 0 ? 25 : i === 5 || i === 6 ? 28 : 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DanhSachBCH');
  XLSX.writeFile(wb, 'MauNhapBCH.xlsx');
}

const STATUS_LABEL = {
  FOUND: { label: 'Đã có trong hệ thống', cls: 'bg-green-100 text-green-700' },
  NOT_FOUND: { label: 'Chưa có — sẽ tạo mới', cls: 'bg-amber-100 text-amber-700' },
  ALREADY_BCH: { label: 'Đã là BCH', cls: 'bg-blue-100 text-blue-700' },
};

export default function BCHImportExcelModal({ isOpen, onClose, onImported }) {
  const [step, setStep] = useState(1); // 1=upload, 2=preview, 3=result
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);
  const [result, setResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef();

  if (!isOpen) return null;

  const reset = () => {
    setStep(1);
    setPreview([]);
    setResult(null);
    setSelectedFile(null);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setSelectedFile(f);
  };

  const handlePreview = async () => {
    if (!selectedFile) { toast.error('Vui lòng chọn file Excel'); return; }
    setLoading(true);
    try {
      const data = await bchService.importPreview(selectedFile);
      setPreview(data);
      setStep(2);
    } catch (err) {
      toast.error('Đọc file thất bại: ' + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const data = await bchService.importConfirm(preview);
      setResult(data);
      setStep(3);
      if (data.created > 0) onImported?.();
    } catch (err) {
      toast.error('Import thất bại: ' + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const counts = preview.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold">Nhập danh sách BCH từ Excel</h2>
          </div>
          <button onClick={() => { reset(); onClose(); }} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-5 pt-4 pb-2 text-sm">
          {['Chọn file', 'Xem trước', 'Kết quả'].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > i + 1 ? '✓' : i + 1}
              </span>
              <span className={step === i + 1 ? 'font-medium text-blue-600' : 'text-gray-400'}>{s}</span>
              {i < 2 && <div className="w-8 h-0.5 bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium mb-1">Định dạng file Excel (.xlsx)</p>
                    <p>Cột A: Họ và Tên (bắt buộc)</p>
                    <p>Cột B: Mã (GV/CV/SV) — để trống nếu không có</p>
                    <p>Cột C: Email — dùng để tìm kiếm chính xác hơn</p>
                    <p>Cột D: Loại (GV / CV / SV) — mặc định GV nếu để trống</p>
                    <p>Cột E: Nhiệm kỳ (VD: 2024-2025)</p>
                    <p>Cột F: Ngày bắt đầu (yyyy-MM-dd)</p>
                    <p>Cột G: Ngày kết thúc (yyyy-MM-dd)</p>
                    <p className="mt-2 text-xs">Hàng 1 là tiêu đề, dữ liệu bắt đầu từ hàng 2.</p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Tải file mẫu
                  </button>
                </div>
              </div>

              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="font-medium text-gray-700">
                  {selectedFile ? selectedFile.name : 'Nhấn để chọn file Excel'}
                </p>
                <p className="text-sm text-gray-400 mt-1">Hỗ trợ .xlsx, .xls</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                  {counts.FOUND || 0} đã có trong hệ thống
                </span>
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
                  {counts.NOT_FOUND || 0} chưa có — sẽ tạo mới
                </span>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                  {counts.ALREADY_BCH || 0} đã là BCH (bỏ qua)
                </span>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left w-8">#</th>
                      <th className="px-3 py-2 text-left">Họ tên trong file</th>
                      <th className="px-3 py-2 text-left">Khớp với</th>
                      <th className="px-3 py-2 text-left">Loại</th>
                      <th className="px-3 py-2 text-left">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.map((row, idx) => {
                      const st = STATUS_LABEL[row.status] || { label: row.status, cls: 'bg-gray-100 text-gray-600' };
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-400">{row.rowNum}</td>
                          <td className="px-3 py-2 font-medium">{row.hoTen}</td>
                          <td className="px-3 py-2 text-gray-600">
                            {row.matchedId
                              ? <span>{row.displayName} <span className="text-xs text-gray-400">({row.matchedId})</span></span>
                              : <span className="text-gray-400 italic">—</span>}
                          </td>
                          <td className="px-3 py-2 text-gray-500">{row.loaiThanhVien}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 3: Result */}
          {step === 3 && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">Import hoàn tất!</p>
                  <p className="text-sm text-green-700">
                    Thêm mới: {result.created} | Tạo thành viên mới: {result.autoCreated} | Bỏ qua: {result.skipped}
                  </p>
                </div>
              </div>

              {result.errors?.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-medium text-red-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Lỗi ({result.errors.length} hàng)
                  </p>
                  <ul className="text-sm text-red-600 space-y-1">
                    {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t">
          <button onClick={() => { reset(); onClose(); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">
            {step === 3 ? 'Đóng' : 'Hủy'}
          </button>
          <div className="flex gap-2">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                Quay lại
              </button>
            )}
            {step === 1 && (
              <button
                onClick={handlePreview}
                disabled={loading || !selectedFile}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                Xem trước
              </button>
            )}
            {step === 2 && (
              <button
                onClick={handleConfirm}
                disabled={loading || preview.filter(r => r.status !== 'ALREADY_BCH').length === 0}
                className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                Xác nhận import ({preview.filter(r => r.status !== 'ALREADY_BCH').length} người)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
