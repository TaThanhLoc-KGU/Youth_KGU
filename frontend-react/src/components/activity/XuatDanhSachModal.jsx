import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api, { API_BASE_URL } from '../../services/api';
import {
  X, ChevronLeft, ChevronRight, Loader2,
  FileText, FileCheck, Pen, Stamp, Download, Eye,
  GripHorizontal, AlertCircle, CheckCircle2, Send,
} from 'lucide-react';
import kySoService from '../../services/kySoService';
import banHanhService from '../../services/banHanhService';

/* ─── helpers ─────────────────────────────────────────────────── */
/** Chuyển đường dẫn tương đối thành URL ảnh đầy đủ */
const imgUrl = (duongDan) => duongDan ? `${API_BASE_URL}${duongDan}` : null;

const LOAI_KY = [
  { value: 'BÍ THƯ',    label: 'Bí Thư' },
  { value: 'PHÓ BÍ THƯ', label: 'Phó Bí Thư' },
];

/* Một ô kéo thả đặt lên ảnh preview — hiện ảnh thực nếu có */
function DraggableBox({
  label, color, pos, onMove,
  containerRef, imgNaturalW, imgNaturalH, imgDisplayW, imgDisplayH,
  imgSrc,   // URL ảnh chữ ký / con dấu (nếu có)
}) {
  const ref = useRef(null);
  const dragging = useRef(false);
  const offset   = useRef({ dx: 0, dy: 0 });

  // pt → display pixels
  const toDisplay = (ptX, ptY) => ({
    x: ptX * imgDisplayW / imgNaturalW,
    y: ptY * imgDisplayH / imgNaturalH,
  });

  // display pixels → pt
  const toNatural = (px, py) => ({
    x: px * imgNaturalW / imgDisplayW,
    y: py * imgNaturalH / imgDisplayH,
  });

  const displayPos = toDisplay(pos.x, pos.y);
  // Kích thước hiển thị tương ứng với kích thước pt của phần tử
  const displayW = (pos.width  ?? 90) * imgDisplayW / imgNaturalW;
  const displayH = (pos.height ?? 52) * imgDisplayH / imgNaturalH;

  const onMouseDown = (e) => {
    e.preventDefault();
    dragging.current = true;
    const rect = ref.current.getBoundingClientRect();
    offset.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = useCallback((e) => {
    if (!dragging.current || !containerRef.current) return;
    const cRect = containerRef.current.getBoundingClientRect();
    const boxW  = ref.current?.offsetWidth  || displayW;
    const boxH  = ref.current?.offsetHeight || displayH;
    let newX = e.clientX - cRect.left - offset.current.dx;
    let newY = e.clientY - cRect.top  - offset.current.dy;
    newX = Math.max(0, Math.min(newX, imgDisplayW - boxW));
    newY = Math.max(0, Math.min(newY, imgDisplayH - boxH));
    const nat = toNatural(newX, newY);
    onMove({ ...pos, x: nat.x, y: nat.y });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgDisplayW, imgDisplayH, displayW, displayH, pos]);

  const onMouseUp = useCallback(() => {
    dragging.current = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  const borderColor = { blue: '#3b82f6', green: '#22c55e', orange: '#f97316' }[color] || '#3b82f6';

  return (
    <div
      ref={ref}
      className="absolute cursor-move select-none"
      style={{
        left: displayPos.x,
        top:  displayPos.y,
        width:  displayW,
        height: displayH,
        zIndex: 10,
        border: `2px dashed ${borderColor}`,
        borderRadius: 4,
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        background: imgSrc ? 'transparent' : `${borderColor}18`,
      }}
      onMouseDown={onMouseDown}
    >
      {imgSrc ? (
        /* Hiện ảnh thực — người dùng thấy chính xác vị trí chữ ký / con dấu */
        <img
          src={imgSrc}
          alt={label}
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
      ) : (
        /* Placeholder khi chưa chọn ảnh */
        <div className="flex items-center justify-center w-full h-full gap-1 text-xs font-medium"
          style={{ color: borderColor }}>
          <GripHorizontal className="w-3 h-3 flex-shrink-0" />
          {label}
        </div>
      )}
    </div>
  );
}

/* ─── main modal ─────────────────────────────────────────────── */
export default function XuatDanhSachModal({ maHoatDong, onClose, mode = 'XUAT_PDF' }) {
  const isBanHanh = mode === 'BAN_HANH';
  // step: 1=form ký, 2=editor nội dung, 3=preview+drag
  const [step, setStep] = useState(1);

  /* step 1 form state */
  const [form, setForm] = useState({
    loaiKy:          'BÍ THƯ',
    chuKyBiThuId:    null,
    tenNguoiKy:      '',
    chuKyNguoiLapId: null,
    tenNguoiLap:     '',
    chucVuNguoiLap:  'Thư ký BCH',
    conDauId:        null,
  });

  /* step 3 state (preview + drag) */
  const [currentPage, setCurrentPage] = useState(0);
  const [positions, setPositions]     = useState(null);
  const [exporting, setExporting]     = useState(false);
  const [exportDone, setExportDone]   = useState(false);
  const [exportError, setExportError] = useState(null);
  const [banHanhResult, setBanHanhResult] = useState(null);

  /* step 2: editor nội dung trực tiếp */
  const [editRows, setEditRows]         = useState(null); // null = chưa load
  const [editTieuDe, setEditTieuDe]     = useState('');
  const [editNgayStr, setEditNgayStr]   = useState('');
  const [contentEdited, setContentEdited] = useState(false); // đã chỉnh sửa?

  const imgContainerRef = useRef(null);
  const [imgSize, setImgSize]         = useState({ w: 0, h: 0 }); // displayed size

  /* queries */
  const { data: dsChuKy = [] }  = useQuery({ queryKey: ['chu-ky'],  queryFn: kySoService.getAllChuKy });
  const { data: dsConDau = [] } = useQuery({ queryKey: ['con-dau'], queryFn: kySoService.getAllConDau });
  const { data: dsChucVu = [] } = useQuery({
    queryKey: ['chuc-vu'],
    queryFn: () => api.get('/api/chuc-vu').then(r => r.data.data || []),
  });

  // Danh sách sinh viên đã điểm danh — dùng làm dữ liệu gốc cho editor
  const { data: dsSinhVien = [] } = useQuery({
    queryKey: ['ky-so-ds-sv', maHoatDong],
    queryFn: () => api.get(`/api/diem-danh/activity/${encodeURIComponent(maHoatDong)}/checked-in`)
                      .then(r => (r.data.data || []).filter(sv => sv.trangThai !== 'VANG_MAT')),
    staleTime: 30_000,
  });

  // Khi dsSinhVien load xong + chưa vào editor lần nào → khởi tạo editRows
  useEffect(() => {
    if (dsSinhVien.length > 0 && editRows === null) {
      setEditRows(dsSinhVien.map((sv, i) => ({
        _id:     i,
        hoTen:   sv.hoTenSinhVien || sv.hoTen || '',
        maLop:   sv.maLop || sv.lop || '',
        maSv:    sv.maSv || '',
        tenKhoa: sv.tenKhoa || '',
      })));
      // Ngày mặc định
      const today = new Date();
      setEditNgayStr(`An Giang, ngày ${String(today.getDate()).padStart(2,'0')} tháng ${String(today.getMonth()+1).padStart(2,'0')} năm ${today.getFullYear()}`);
    }
  }, [dsSinhVien]); // eslint-disable-line

  // Tính hash nhẹ để làm queryKey — đủ để phân biệt khi content thay đổi
  const previewCacheKey = contentEdited
    ? JSON.stringify({ rows: editRows, tieuDe: editTieuDe, ngay: editNgayStr })
    : 'default';

  const {
    data: preview,
    isLoading: previewLoading,
    isError: previewError,
  } = useQuery({
    queryKey: ['ky-so-preview', maHoatDong, previewCacheKey],
    queryFn:  () => {
      if (contentEdited) {
        // Gửi override data để preview đúng nội dung đã chỉnh
        return kySoService.getPreview(maHoatDong, {
          overrideRows:   editRows?.map(r => ({
            hoTen:   r.hoTen,
            maLop:   r.maLop,
            maSv:    r.maSv,
            tenKhoa: r.tenKhoa,
          })) ?? null,
          overrideTieuDe:  editTieuDe  || null,
          overrideNgayStr: editNgayStr || null,
        });
      }
      return kySoService.getPreview(maHoatDong);
    },
    enabled:  step === 3,
    staleTime: 60_000,
  });

  /* Khi preview load xong, đặt vị trí mặc định từ server (sigBlockTopY, leftColCX, rightColCX) */
  useEffect(() => {
    if (!preview) return;
    const { pageWidthPt: pw, sigBlockTopY, leftColCX, rightColCX } = preview;

    // sigBlockTopY, leftColCX, rightColCX là tọa độ PDF (pt, gốc trên-trái).
    // Ảnh chữ ký nằm sau 2 dòng text (14pt + 14pt = 28pt)
    const sigImgTopY = sigBlockTopY + 28;
    const sigW = 90, sigH = 52, stW = 95, stH = 60;

    setPositions({
      biThu:    { x: leftColCX  - sigW / 2, y: sigImgTopY,      width: sigW, height: sigH },
      nguoiLap: { x: rightColCX - sigW / 2, y: sigImgTopY,      width: sigW, height: sigH },
      conDau:   { x: leftColCX  - stW / 2 - 5, y: sigImgTopY - 4, width: stW, height: stH },
    });
  }, [preview]);

  /* Theo dõi kích thước thực của ảnh khi hiển thị */
  const onImgLoad = (e) => {
    setImgSize({ w: e.target.offsetWidth, h: e.target.offsetHeight });
  };

  useEffect(() => {
    if (!imgContainerRef.current) return;
    const ro = new ResizeObserver(() => {
      const el = imgContainerRef.current?.querySelector('img');
      if (el) setImgSize({ w: el.offsetWidth, h: el.offsetHeight });
    });
    ro.observe(imgContainerRef.current);
    return () => ro.disconnect();
  }, [step, currentPage]);

  /* Go to last page when entering step 3 */
  useEffect(() => {
    if (step === 3 && preview) {
      setCurrentPage(preview.pages.length - 1);
    }
  }, [step, preview]);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    setBanHanhResult(null);
    try {
      // Nếu admin đã chỉnh sửa nội dung → gửi overrideRows + tiêu đề + ngày
      const overrideRows  = contentEdited && editRows  ? editRows.map(r => ({
        hoTen:   r.hoTen,
        maLop:   r.maLop,
        maSv:    r.maSv,
        tenKhoa: r.tenKhoa,
      })) : null;
      const overrideTieuDe  = contentEdited && editTieuDe  ? editTieuDe  : null;
      const overrideNgayStr = contentEdited && editNgayStr ? editNgayStr : null;

      const payload = {
        ...form,
        posBiThu:       positions?.biThu,
        posNguoiLap:    positions?.nguoiLap,
        posConDau:      form.conDauId ? positions?.conDau : null,
        overrideRows,
        overrideTieuDe,
        overrideNgayStr,
      };

      if (isBanHanh) {
        // Ban hành: gọi API lưu file server, trả về metadata
        const result = await banHanhService.banHanh(maHoatDong, payload);
        setBanHanhResult(result); // { id, downloadUrl, tenFile, ... }
        setExportDone(true);
      } else {
        // Xuất PDF thường: download về máy
        await kySoService.xuatPDF(maHoatDong, payload);
        setExportDone(true);
      }
    } catch (err) {
      setExportError(err?.response?.data?.message || err.message || 'Có lỗi xảy ra');
    } finally {
      setExporting(false);
    }
  };

  /* natural dimensions of the image = page dimensions in pt (rendered at 96 DPI ≈ 1px/pt) */
  const naturalW = preview?.pageWidthPt  ?? 595;
  const naturalH = preview?.pageHeightPt ?? 842;

  const lastPageIndex = (preview?.pages?.length ?? 1) - 1;
  const isLastPage    = currentPage === lastPageIndex;

  /* ── render ── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b text-white rounded-t-2xl bg-gradient-to-r ${
          isBanHanh ? 'from-emerald-600 to-emerald-700' : 'from-blue-600 to-blue-700'
        }`}>
          <div className="flex items-center gap-2">
            {isBanHanh ? <FileCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            <h2 className="font-semibold text-lg">
              {isBanHanh ? 'Ban hành danh sách chính thức' : 'Xuất danh sách tham gia'}
            </h2>
            {preview && (
              <span className={`text-sm ${isBanHanh ? 'text-emerald-200' : 'text-blue-200'}`}>
                — {preview.totalStudents} sinh viên
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Steps indicator */}
            <div className="flex items-center gap-1.5 text-sm">
              {[
                { n: 1, label: 'Thông tin ký' },
                { n: 2, label: 'Chỉnh sửa nội dung' },
                { n: 3, label: isBanHanh ? 'Xem trước & Ban hành' : 'Xem trước & Ký' },
              ].map(({ n, label }, i) => (
                <React.Fragment key={n}>
                  {i > 0 && <ChevronRight className={`w-3 h-3 flex-shrink-0 ${isBanHanh ? 'text-emerald-300' : 'text-blue-300'}`} />}
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors text-xs whitespace-nowrap ${
                    step === n
                      ? `bg-white ${isBanHanh ? 'text-emerald-700' : 'text-blue-700'} font-semibold`
                      : isBanHanh ? 'text-emerald-200' : 'text-blue-200'
                  }`}>
                    <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center font-bold border-current" style={{fontSize:10}}>{n}</span>
                    {label}
                    {n === 2 && contentEdited && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Đã chỉnh sửa" />}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <button onClick={onClose} className={`p-1 rounded-lg transition-colors ${isBanHanh ? 'hover:bg-emerald-500' : 'hover:bg-blue-500'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ═══ STEP 1: FORM ═══ */}
          {step === 1 && (
            <div className="p-6 space-y-6 max-w-2xl mx-auto">

              {/* Loại ký */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Loại ký</h3>
                <div className="flex gap-3">
                  {LOAI_KY.map(o => (
                    <label key={o.value}
                      className={`flex-1 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        form.loaiKy === o.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <input type="radio" className="sr-only" value={o.value}
                        checked={form.loaiKy === o.value}
                        onChange={() => setForm(f => ({ ...f, loaiKy: o.value }))} />
                      <div className="text-center">
                        <div className={`text-sm font-semibold ${
                          form.loaiKy === o.value ? 'text-blue-700' : 'text-gray-700'
                        }`}>{o.label}</div>
                        <div className="text-xs text-gray-400 mt-1">TM. Ban Thường Vụ</div>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              {/* Bên phải: Người ký (Bí thư / Phó bí thư) */}
              <section className="bg-blue-50 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                  <Pen className="w-4 h-4" />
                  {form.loaiKy === 'BÍ THƯ' ? 'Bí Thư' : 'Phó Bí Thư'} (góc phải trang cuối)
                </h3>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Họ tên *</label>
                  <input
                    type="text" placeholder="Nguyễn Văn A"
                    value={form.tenNguoiKy}
                    onChange={e => setForm(f => ({ ...f, tenNguoiKy: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Chữ ký hình ảnh (tuỳ chọn)
                  </label>
                  <select
                    value={form.chuKyBiThuId ?? ''}
                    onChange={e => setForm(f => ({ ...f, chuKyBiThuId: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="">— Không dùng chữ ký ảnh —</option>
                    {dsChuKy.map(ck => (
                      <option key={ck.id} value={ck.id}>
                        {ck.tenNguoiKy}{ck.chucVu ? ` (${ck.chucVu})` : ''}{ck.laMacDinh ? ' ★' : ''}
                      </option>
                    ))}
                  </select>
                  {form.chuKyBiThuId && (
                    <img
                      src={imgUrl(dsChuKy.find(c => c.id === form.chuKyBiThuId)?.duongDan)}
                      alt="preview chữ ký"
                      className="mt-2 h-16 object-contain border rounded bg-gray-50"
                    />
                  )}
                </div>
              </section>

              {/* Bên trái: Người lập danh sách */}
              <section className="bg-green-50 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-green-700 flex items-center gap-2">
                  <Pen className="w-4 h-4" />
                  Người lập danh sách (góc trái trang cuối)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Họ tên *</label>
                    <input
                      type="text" placeholder="Trần Thị B"
                      value={form.tenNguoiLap}
                      onChange={e => setForm(f => ({ ...f, tenNguoiLap: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Chức vụ</label>
                    <select
                      value={form.chucVuNguoiLap}
                      onChange={e => setForm(f => ({ ...f, chucVuNguoiLap: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                    >
                      <option value="">— Chọn chức vụ —</option>
                      {dsChucVu.filter(cv => cv.isActive !== false).map(cv => (
                        <option key={cv.maChucVu} value={cv.tenChucVu}>{cv.tenChucVu}</option>
                      ))}
                      <option value="Thư ký BCH">Thư ký BCH</option>
                      <option value="Phó Bí thư">Phó Bí thư</option>
                      <option value="Ủy viên BCH">Ủy viên BCH</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Chữ ký hình ảnh (tuỳ chọn)
                  </label>
                  <select
                    value={form.chuKyNguoiLapId ?? ''}
                    onChange={e => setForm(f => ({ ...f, chuKyNguoiLapId: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                  >
                    <option value="">— Không dùng chữ ký ảnh —</option>
                    {dsChuKy.map(ck => (
                      <option key={ck.id} value={ck.id}>
                        {ck.tenNguoiKy}{ck.chucVu ? ` (${ck.chucVu})` : ''}{ck.laMacDinh ? ' ★' : ''}
                      </option>
                    ))}
                  </select>
                  {form.chuKyNguoiLapId && (
                    <img
                      src={imgUrl(dsChuKy.find(c => c.id === form.chuKyNguoiLapId)?.duongDan)}
                      alt="preview chữ ký"
                      className="mt-2 h-16 object-contain border rounded bg-gray-50"
                    />
                  )}
                </div>
              </section>

              {/* Con dấu */}
              <section className="bg-orange-50 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                  <Stamp className="w-4 h-4" />
                  Con dấu (tuỳ chọn)
                </h3>
                <select
                  value={form.conDauId ?? ''}
                  onChange={e => setForm(f => ({ ...f, conDauId: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                >
                  <option value="">— Không đóng dấu —</option>
                  {dsConDau.map(cd => (
                    <option key={cd.id} value={cd.id}>
                      {cd.ten}{cd.laMacDinh ? ' ★' : ''}
                    </option>
                  ))}
                </select>
                {form.conDauId && (
                  <img
                    src={imgUrl(dsConDau.find(c => c.id === form.conDauId)?.duongDan)}
                    alt="preview con dấu"
                    className="mt-2 h-20 object-contain border rounded bg-gray-50"
                  />
                )}
              </section>

              {/* Ghi chú về bước tiếp theo */}
              <section className="border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileCheck className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>
                    Sau bước này bạn có thể <strong>chỉnh sửa trực tiếp nội dung PDF</strong> (tiêu đề, ngày, tên SV, lớp, khoa…)
                    trước khi xem trước và xuất file.
                  </span>
                </div>
                {dsSinhVien.length > 0 && (
                  <p className="mt-1.5 text-xs text-blue-600 font-medium">
                    Danh sách hiện tại: {dsSinhVien.length} sinh viên đã điểm danh
                  </p>
                )}
              </section>
            </div>
          )}

          {/* ═══ STEP 2: EDITOR NỘI DUNG TRỰC TIẾP ═══ */}
          {step === 2 && (
            <div className="p-5 space-y-4">
              {/* Ghi chú */}
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <span>Chỉnh sửa trực tiếp nội dung sẽ xuất hiện trong PDF. Click vào ô bất kỳ để sửa. Thay đổi chỉ ảnh hưởng đến file PDF này, không thay đổi dữ liệu trong hệ thống.</span>
              </div>

              {/* Tiêu đề + Ngày */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tiêu đề văn bản</label>
                  <textarea
                    rows={2}
                    value={editTieuDe}
                    onChange={e => { setEditTieuDe(e.target.value); setContentEdited(true); }}
                    placeholder="DANH SÁCH SINH VIÊN THAM GIA&#10;TÊN HOẠT ĐỘNG"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-center focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">Dùng Enter để xuống dòng</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ngày ký (góc phải)</label>
                  <input
                    type="text"
                    value={editNgayStr}
                    onChange={e => { setEditNgayStr(e.target.value); setContentEdited(true); }}
                    placeholder="An Giang, ngày 01 tháng 01 năm 2026"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Bảng sinh viên */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Danh sách sinh viên — {editRows?.length ?? 0} dòng
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditRows(prev => [...(prev || []), { _id: Date.now(), hoTen: '', maLop: '', maSv: '', tenKhoa: '' }]);
                      setContentEdited(true);
                    }}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-medium transition-colors"
                  >
                    + Thêm dòng
                  </button>
                </div>

                {/* Table editor */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-y-auto" style={{ maxHeight: '50vh' }}>
                    <table className="w-full text-sm border-collapse">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                          <th className="px-2 py-2 text-center w-10 text-gray-600 font-semibold text-xs">STT</th>
                          <th className="px-2 py-2 text-left text-gray-600 font-semibold text-xs">Họ và Tên</th>
                          <th className="px-2 py-2 text-left text-gray-600 font-semibold text-xs w-28">Lớp</th>
                          <th className="px-2 py-2 text-left text-gray-600 font-semibold text-xs w-32">MSSV</th>
                          <th className="px-2 py-2 text-left text-gray-600 font-semibold text-xs">Khoa</th>
                          <th className="px-2 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(editRows || []).map((row, idx) => (
                          <tr key={row._id} className="hover:bg-blue-50/40 group">
                            <td className="px-2 py-1 text-center text-xs text-gray-400 font-mono">{idx + 1}</td>
                            <td className="px-1 py-1">
                              <input
                                type="text"
                                value={row.hoTen}
                                onChange={e => {
                                  setEditRows(prev => prev.map((r, i) => i === idx ? { ...r, hoTen: e.target.value } : r));
                                  setContentEdited(true);
                                }}
                                className="w-full px-2 py-1 border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none rounded text-sm bg-transparent"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                type="text"
                                value={row.maLop}
                                onChange={e => {
                                  setEditRows(prev => prev.map((r, i) => i === idx ? { ...r, maLop: e.target.value } : r));
                                  setContentEdited(true);
                                }}
                                className="w-full px-2 py-1 border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none rounded text-sm bg-transparent"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                type="text"
                                value={row.maSv}
                                onChange={e => {
                                  setEditRows(prev => prev.map((r, i) => i === idx ? { ...r, maSv: e.target.value } : r));
                                  setContentEdited(true);
                                }}
                                className="w-full px-2 py-1 border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none rounded text-sm font-mono bg-transparent"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                type="text"
                                value={row.tenKhoa}
                                onChange={e => {
                                  setEditRows(prev => prev.map((r, i) => i === idx ? { ...r, tenKhoa: e.target.value } : r));
                                  setContentEdited(true);
                                }}
                                className="w-full px-2 py-1 border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none rounded text-sm bg-transparent"
                              />
                            </td>
                            <td className="px-1 py-1 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditRows(prev => prev.filter((_, i) => i !== idx));
                                  setContentEdited(true);
                                }}
                                className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded"
                                title="Xóa dòng này"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {contentEdited && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Nội dung đã được chỉnh sửa — PDF sẽ dùng dữ liệu này
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditRows(dsSinhVien.map((sv, i) => ({
                          _id: i, hoTen: sv.hoTenSinhVien || sv.hoTen || '',
                          maLop: sv.maLop || sv.lop || '', maSv: sv.maSv || '', tenKhoa: sv.tenKhoa || '',
                        })));
                        setEditTieuDe(''); setEditNgayStr(''); setContentEdited(false);
                      }}
                      className="text-xs text-gray-400 hover:text-gray-700 underline"
                    >Khôi phục về dữ liệu gốc</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ STEP 3: PREVIEW + DRAG ═══ */}
          {step === 3 && (
            <div className="flex flex-col" style={{ minHeight: 0 }}>
              {/* toolbar */}
              <div className="px-4 py-2 border-b bg-gray-50 flex items-center gap-3 text-sm flex-shrink-0">
                {preview && (
                  <>
                    <span className="text-gray-500">{preview.pages.length} trang</span>
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40"
                      ><ChevronLeft className="w-4 h-4" /></button>
                      <span className="px-2 text-gray-700 font-medium">
                        Trang {currentPage + 1} / {preview.pages.length}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(preview.pages.length - 1, p + 1))}
                        disabled={currentPage === preview.pages.length - 1}
                        className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40"
                      ><ChevronRight className="w-4 h-4" /></button>
                    </div>
                    {isLastPage && (
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                        isBanHanh ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isBanHanh ? 'Trang ban hành — kéo thả để định vị' : 'Trang ký — kéo thả để định vị'}
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* page area */}
              <div className="overflow-auto bg-gray-200 flex items-start justify-center p-6" style={{ maxHeight: '55vh' }}>
                {previewLoading && (
                  <div className="flex flex-col items-center gap-3 mt-20 text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span>Đang tạo bản xem trước…</span>
                  </div>
                )}
                {previewError && (
                  <div className="flex flex-col items-center gap-3 mt-20 text-red-500">
                    <AlertCircle className="w-8 h-8" />
                    <span>Không thể tạo bản xem trước</span>
                  </div>
                )}
                {preview && positions && (
                  <div
                    ref={imgContainerRef}
                    className="relative shadow-2xl bg-white"
                    style={{ display: 'inline-block' }}
                  >
                    <img
                      src={preview.pages[currentPage]}
                      alt={`Trang ${currentPage + 1}`}
                      className="block"
                      style={{ maxWidth: '680px', width: '100%', height: 'auto' }}
                      onLoad={onImgLoad}
                      draggable={false}
                    />

                    {/* Overlay drag boxes — chỉ hiện ở trang cuối */}
                    {isLastPage && imgSize.w > 0 && positions && (
                      <>
                        <DraggableBox
                          label={form.loaiKy === 'BÍ THƯ' ? 'Bí Thư' : 'Phó Bí Thư'}
                          color="blue"
                          pos={positions.biThu}
                          onMove={p => setPositions(prev => ({ ...prev, biThu: p }))}
                          containerRef={imgContainerRef}
                          imgNaturalW={naturalW}
                          imgNaturalH={naturalH}
                          imgDisplayW={imgSize.w}
                          imgDisplayH={imgSize.h}
                          imgSrc={imgUrl(dsChuKy.find(c => c.id === form.chuKyBiThuId)?.duongDan)}
                        />
                        <DraggableBox
                          label="Người lập"
                          color="green"
                          pos={positions.nguoiLap}
                          onMove={p => setPositions(prev => ({ ...prev, nguoiLap: p }))}
                          containerRef={imgContainerRef}
                          imgNaturalW={naturalW}
                          imgNaturalH={naturalH}
                          imgDisplayW={imgSize.w}
                          imgDisplayH={imgSize.h}
                          imgSrc={imgUrl(dsChuKy.find(c => c.id === form.chuKyNguoiLapId)?.duongDan)}
                        />
                        {form.conDauId && (
                          <DraggableBox
                            label="Con dấu"
                            color="orange"
                            pos={positions.conDau}
                            onMove={p => setPositions(prev => ({ ...prev, conDau: p }))}
                            containerRef={imgContainerRef}
                            imgNaturalW={naturalW}
                            imgNaturalH={naturalH}
                            imgDisplayW={imgSize.w}
                            imgDisplayH={imgSize.h}
                            imgSrc={imgUrl(dsConDau.find(c => c.id === form.conDauId)?.duongDan)}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* hint */}
              {isLastPage && positions && (
                <div className="px-4 py-2 bg-blue-50 border-t text-xs text-blue-600 flex items-center gap-2 flex-shrink-0">
                  <GripHorizontal className="w-4 h-4" />
                  Kéo các ô màu để điều chỉnh vị trí chữ ký / con dấu. Các trang khác không thay đổi.
                </div>
              )}

              {/* export result */}
              {exportDone && (
                <div className="px-4 py-3 bg-green-50 border-t border-green-200 flex-shrink-0">
                  <div className="flex items-center gap-2 text-green-700 text-sm">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    {isBanHanh
                      ? 'Ban hành thành công! Danh sách đã được lưu chính thức.'
                      : 'Xuất PDF thành công! File đã được tải về máy.'
                    }
                  </div>
                  {isBanHanh && banHanhResult && (
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <a
                        href={banHanhResult.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Tải PDF về máy
                      </a>
                      <span className="text-xs text-green-600">
                        File: {banHanhResult.tenFile}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {exportError && (
                <div className="px-4 py-3 bg-red-50 border-t border-red-200 flex items-center gap-2 text-red-700 text-sm flex-shrink-0">
                  <AlertCircle className="w-5 h-5" />
                  {exportError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex-shrink-0">
          {step === 1 && (
            <>
              <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">
                Huỷ
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!form.tenNguoiKy.trim() || !form.tenNguoiLap.trim()}
                className={`flex items-center gap-2 px-6 py-2 text-white rounded-xl font-medium
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                  ${isBanHanh ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                Tiếp theo: Chỉnh sửa nội dung
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </button>
              <button
                onClick={() => setStep(3)}
                className={`flex items-center gap-2 px-6 py-2 text-white rounded-xl font-medium transition-colors
                  ${isBanHanh ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                <Eye className="w-4 h-4" />
                Xem trước &amp; Chọn vị trí ký
              </button>
            </>
          )}
          {step === 3 && (
            <>
              <button
                onClick={() => { setStep(2); setExportDone(false); setExportError(null); }}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Quay lại
              </button>
              <button
                onClick={handleExport}
                disabled={exporting || previewLoading || !preview}
                className={`flex items-center gap-2 px-6 py-2 text-white rounded-xl font-medium
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                  ${isBanHanh ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {exporting
                  ? <><Loader2 className="w-4 h-4 animate-spin" />{isBanHanh ? 'Đang ban hành…' : 'Đang xuất…'}</>
                  : isBanHanh
                    ? <><Send className="w-4 h-4" />Ban hành chính thức</>
                    : <><Download className="w-4 h-4" />Xuất PDF có ký số</>
                }
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
