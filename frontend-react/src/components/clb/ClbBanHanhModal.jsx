/**
 * ClbBanHanhModal — Ban hành danh sách thành viên CLB
 * Mô hình giống XuatDanhSachModal: preview PDF, kéo thả chữ ký,
 * click-to-edit, cấu hình cột, thể thức, lịch sử phiên bản.
 */
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../services/api';
import {
  X, Loader2, FileText, FileCheck, Pen, Stamp, Download, Eye,
  GripHorizontal, AlertCircle, CheckCircle2, Send, RefreshCw,
  RotateCcw, List, Settings, MoveHorizontal,
  ChevronUp, ChevronDown, Sliders, Clock, Lock, Layers,
} from 'lucide-react';
import kySoService from '../../services/kySoService';
import clbBanHanhService from '../../services/clbBanHanhService';

/* ─── helpers ──────────────────────────────────────────────────── */
const imgUrl = (d) => d ? `${API_BASE_URL}${d}` : null;

const LS_POS_KEY = (id) => `clb_ban_hanh_pos_${id}`;
const LS_COL_KEY = 'clb_ban_hanh_colConfig';

function savePosLS(id, p) { try { localStorage.setItem(LS_POS_KEY(id), JSON.stringify(p)); } catch {} }
function loadPosLS(id)    { try { const s = localStorage.getItem(LS_POS_KEY(id)); return s ? JSON.parse(s) : null; } catch { return null; } }
function saveColLS(c)     { try { localStorage.setItem(LS_COL_KEY, JSON.stringify(c)); } catch {} }
function loadColLS()      { try { const s = localStorage.getItem(LS_COL_KEY); return s ? JSON.parse(s) : null; } catch { return null; } }

const DEFAULT_COL_CONFIG = [
  { key: 'stt',    header: 'STT',       widthPt: 26,  visible: true },
  { key: 'hoTen',  header: 'Họ và Tên', widthPt: 148, visible: true },
  { key: 'maLop',  header: 'Lớp',       widthPt: 58,  visible: true },
  { key: 'maSv',   header: 'MSSV',      widthPt: 75,  visible: true },
  { key: 'chucVu', header: 'Chức vụ',   widthPt: 88,  visible: true },
];

const WIDTH_PRESETS = { xs: 26, sm: 58, md: 90, lg: 135, xl: 165 };
function ptToPreset(pt) {
  let best = 'md', bestDiff = Infinity;
  for (const [k, v] of Object.entries(WIDTH_PRESETS)) {
    const d = Math.abs(v - pt);
    if (d < bestDiff) { bestDiff = d; best = k; }
  }
  return best;
}

const CHUC_VU_LABEL = {
  CHU_NHIEM:     'Chủ nhiệm',
  PHO_CHU_NHIEM: 'Phó Chủ nhiệm',
  BAN_QUAN_LY:   'Ban quản lý',
  CO_VAN:        'Cố vấn',
  THANH_VIEN:    'Thành viên',
};
const ALL_CHUC_VU = Object.keys(CHUC_VU_LABEL);

function fmtDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ─── ZoneOverlay ────────────────────────────────────────────── */
function ZoneOverlay({ zone, naturalW, naturalH, imgW, imgH, onClick }) {
  if (!imgW || !imgH) return null;
  const left = zone.x * imgW / naturalW;
  const top  = (naturalH - zone.y - zone.h) * imgH / naturalH;
  const w    = zone.w * imgW / naturalW;
  const h    = zone.h * imgH / naturalH;
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(zone, e); }}
      className="absolute cursor-pointer rounded transition-all hover:bg-blue-400/20 hover:ring-2 hover:ring-blue-400/60 group"
      style={{ left, top, width: w, height: h, zIndex: 20 }}
      title={zone.type === 'title' ? 'Nhấn để sửa tiêu đề' : zone.type === 'date' ? 'Nhấn để sửa ngày' : 'Nhấn để sửa dòng'}>
      <span className="absolute top-0 right-0 text-[9px] bg-blue-500 text-white px-1 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity leading-tight pointer-events-none">
        {zone.type === 'title' ? 'Tiêu đề' : zone.type === 'date' ? 'Ngày' : `#${zone.rowIndex + 1}`}
      </span>
    </div>
  );
}

/* ─── FloatingZoneEditor ────────────────────────────────────── */
function FloatingZoneEditor({ zone, editRows, editTieuDe, editNgayStr,
                               vpX, vpY, onUpdateTitle, onUpdateDate, onUpdateRow, onClose }) {
  const ref = useRef(null);
  const [localVal, setLocalVal] = useState(() => {
    if (zone.type === 'title') return editTieuDe || '';
    if (zone.type === 'date')  return editNgayStr || '';
    return '';
  });
  const [rowData, setRowData] = useState(() => {
    if (zone.type !== 'row') return null;
    const r = editRows?.[zone.rowIndex];
    return r ? { hoTen: r.hoTen, maLop: r.maLop, maSv: r.maSv, chucVu: r.chucVu } : null;
  });
  const [pos, setPos] = useState({ left: vpX + 10, top: vpY + 10 });

  useEffect(() => {
    if (!ref.current) return;
    const { offsetWidth: w, offsetHeight: h } = ref.current;
    const vw = window.innerWidth, vh = window.innerHeight;
    setPos({ left: Math.min(vpX + 10, vw - w - 12), top: Math.min(vpY + 10, vh - h - 12) });
  }, []); // eslint-disable-line

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose]);

  const handleSave = () => {
    if (zone.type === 'title') onUpdateTitle(localVal);
    else if (zone.type === 'date') onUpdateDate(localVal);
    else if (zone.type === 'row' && rowData) onUpdateRow(zone.rowIndex, rowData);
    onClose();
  };

  return (
    <div ref={ref} className="fixed z-[200] bg-white border border-blue-300 rounded-xl shadow-2xl p-3 w-72"
      style={{ left: pos.left, top: pos.top }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-blue-700">
          {zone.type === 'title' ? 'Sửa tiêu đề' : zone.type === 'date' ? 'Sửa ngày' : `Sửa dòng #${zone.rowIndex + 1}`}
        </span>
        <button onClick={onClose} className="p-0.5 hover:bg-gray-100 rounded"><X className="w-3.5 h-3.5 text-gray-400" /></button>
      </div>

      {zone.type === 'title' && (
        <textarea rows={3} value={localVal} onChange={e => setLocalVal(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
      )}
      {zone.type === 'date' && (
        <input type="text" value={localVal} onChange={e => setLocalVal(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
      )}
      {zone.type === 'row' && rowData && (
        <div className="space-y-1.5">
          {[
            { field: 'hoTen',  label: 'Họ và tên' },
            { field: 'maLop',  label: 'Lớp' },
            { field: 'maSv',   label: 'MSSV' },
            { field: 'chucVu', label: 'Chức vụ' },
          ].map(({ field, label }) => (
            <div key={field} className="flex items-center gap-2">
              <label className="text-[10px] text-gray-500 w-16 shrink-0">{label}</label>
              <input type="text" value={rowData[field] || ''}
                onChange={e => setRowData(d => ({ ...d, [field]: e.target.value }))}
                className="flex-1 border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-2.5">
        <button onClick={onClose} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg">Hủy</button>
        <button onClick={handleSave} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">Lưu</button>
      </div>
    </div>
  );
}

/* ─── DraggableBox ────────────────────────────────────────────── */
function DraggableBox({ label, color, pos, onMove, containerRef,
                        imgNaturalW, imgNaturalH, imgDisplayW, imgDisplayH, imgSrc }) {
  const ref      = useRef(null);
  const dragging = useRef(false);
  const offset   = useRef({ dx: 0, dy: 0 });

  const toDisplay = (ptX, ptY) => ({
    x: ptX * imgDisplayW / imgNaturalW,
    y: ptY * imgDisplayH / imgNaturalH,
  });
  const toNatural = (px, py) => ({
    x: px * imgNaturalW / imgDisplayW,
    y: py * imgNaturalH / imgDisplayH,
  });

  const displayPos = toDisplay(pos.x, pos.y);
  const displayW   = (pos.width  ?? 90) * imgDisplayW / imgNaturalW;
  const displayH   = (pos.height ?? 52) * imgDisplayH / imgNaturalH;

  const onMouseMove = useCallback((e) => {
    if (!dragging.current || !containerRef.current) return;
    const cRect = containerRef.current.getBoundingClientRect();
    let newX = e.clientX - cRect.left - offset.current.dx;
    let newY = e.clientY - cRect.top  - offset.current.dy;
    newX = Math.max(0, Math.min(newX, imgDisplayW - displayW));
    newY = Math.max(0, Math.min(newY, imgDisplayH - displayH));
    onMove({ ...pos, x: toNatural(newX, 0).x, y: toNatural(0, newY).y });
  }, [imgDisplayW, imgDisplayH, displayW, displayH, pos]); // eslint-disable-line

  const onMouseUp = useCallback(() => {
    dragging.current = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  const onMouseDown = (e) => {
    e.preventDefault();
    dragging.current = true;
    const rect = ref.current.getBoundingClientRect();
    offset.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const borderColor = { blue: '#3b82f6', orange: '#f97316' }[color] ?? '#3b82f6';

  return (
    <div ref={ref} className="absolute cursor-move select-none"
      style={{
        left: displayPos.x, top: displayPos.y,
        width: displayW, height: displayH,
        zIndex: 10, border: `2px dashed ${borderColor}`, borderRadius: 4,
        boxShadow: '0 1px 6px rgba(0,0,0,0.18)',
        background: imgSrc ? 'transparent' : `${borderColor}22`,
      }}
      onMouseDown={onMouseDown}>
      {imgSrc ? (
        <img src={imgSrc} alt={label} draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full gap-0.5" style={{ color: borderColor }}>
          <GripHorizontal className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-[10px] font-semibold leading-tight text-center px-1">{label}</span>
        </div>
      )}
    </div>
  );
}

/* ─── SigImagePicker ──────────────────────────────────────────── */
function SigImagePicker({ label, value, onChange, options, color }) {
  const borderCls = color === 'blue'
    ? 'border-blue-200 focus:ring-blue-400'
    : 'border-orange-200 focus:ring-orange-400';
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select value={value ?? ''} onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
        className={`w-full border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 bg-white ${borderCls}`}>
        <option value="">— Không dùng ảnh —</option>
        {options.map(ck => (
          <option key={ck.id} value={ck.id}>
            {ck.tenNguoiKy}{ck.chucVu ? ` (${ck.chucVu})` : ''}{ck.laMacDinh ? ' ★' : ''}
          </option>
        ))}
      </select>
      {value && (
        <img src={imgUrl(options.find(c => c.id === value)?.duongDan)}
          alt="preview" className="mt-1.5 h-12 object-contain border rounded bg-gray-50" />
      )}
    </div>
  );
}

/* ─── HistoryTab ─────────────────────────────────────────────── */
function HistoryTab({ maClb }) {
  const qc = useQueryClient();
  const { data: list = [], isLoading } = useQuery({
    queryKey: ['clb-ban-hanh', maClb],
    queryFn:  () => clbBanHanhService.getDanhSach(maClb),
  });

  const huyMutation = useMutation({
    mutationFn: (id) => clbBanHanhService.huyBanHanh(maClb, id),
    onSuccess:  () => { qc.invalidateQueries(['clb-ban-hanh', maClb]); },
  });

  if (isLoading) return (
    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
  );
  if (!list.length) return (
    <div className="flex flex-col items-center gap-3 py-10 text-gray-400">
      <Clock className="w-10 h-10" />
      <p className="text-sm">Chưa có phiên bản ban hành nào.</p>
    </div>
  );

  return (
    <div className="p-4 space-y-2">
      {list.map(item => (
        <div key={item.id}
          className={`border rounded-xl p-3 transition-colors ${item.trangThai === 'DA_HUY' ? 'opacity-60 bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-blue-200'}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.trangThai === 'DA_HUY' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                  {item.trangThai === 'DA_HUY' ? 'Đã hủy' : 'Hiệu lực'}
                </span>
                <span className="text-[11px] text-gray-400">{fmtDate(item.createdAt)}</span>
              </div>
              <p className="text-xs text-gray-700 font-medium truncate">Ký: {item.tenNguoiKy}</p>
              <p className="text-[11px] text-gray-400">
                {item.tongSv} thành viên · bởi {item.nguoiBanHanh}
              </p>
            </div>
            {item.trangThai !== 'DA_HUY' && (
              <div className="flex items-center gap-1 shrink-0">
                <a href={item.downloadUrl} target="_blank" rel="noreferrer"
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500" title="Xem PDF">
                  <Eye className="w-4 h-4" />
                </a>
                <button
                  onClick={() => { if (window.confirm('Hủy bản ban hành này?')) huyMutation.mutate(item.id); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Hủy">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Modal ─────────────────────────────────────────────── */
export default function ClbBanHanhModal({ clb, onClose }) {
  const qc = useQueryClient();
  const maClb = clb.maClb;

  /* ── Tabs */
  const [activeTab, setActiveTab] = useState('ky');

  /* ── Form */
  const [form, setForm] = useState({
    coQuanChuQuan:   '',
    tenChuNhiem:     '',
    chuKyChuNhiemId: null,
    conDauId:        null,
    apDungGiapLai:   false,
    chuKyNhayId:     null,
    khoaFilePdf:     true, // ban hành chính thức — mặc định bật
  });

  /* ── Nội dung (tiêu đề / ngày có thể override) */
  const [editTieuDe,    setEditTieuDe]    = useState('');
  const [editNgayStr,   setEditNgayStr]   = useState('');
  const [editRows,      setEditRows]      = useState(null);
  const [contentEdited, setContentEdited] = useState(false);

  /* ── Column config */
  const [colConfig, setColConfig] = useState(() => loadColLS() || DEFAULT_COL_CONFIG);

  /* ── Format config */
  const [formatConfig, setFormatConfig] = useState({
    marginTopCm: null, marginBottomCm: null,
    marginLeftCm: null, marginRightCm: null,
    bodyFontSizePt: null, rowHeightPt: null, fontName: null,
  });
  const updateFmt = (key, val) => setFormatConfig(p => ({ ...p, [key]: val === '' ? null : val }));

  /* ── Zone editor */
  const [clickedZone,   setClickedZone]   = useState(null);
  const [zoneEditorPos, setZoneEditorPos] = useState({ x: 0, y: 0 });

  /* ── Preview */
  const [positions,    setPositions]    = useState(null);
  const [previewKey,   setPreviewKey]   = useState(0);
  const [imgSizes,     setImgSizes]     = useState({});
  const lastPageRef = useRef(null);

  /* ── Export state */
  const [exporting,     setExporting]     = useState(false);
  const [exportDone,    setExportDone]    = useState(false);
  const [exportError,   setExportError]   = useState(null);
  const [banHanhResult, setBanHanhResult] = useState(null);

  /* ── Queries */
  const { data: dsChuKyAll = [] } = useQuery({ queryKey: ['chu-ky'],  queryFn: () => kySoService.getAllChuKy() });
  const { data: dsConDau   = [] } = useQuery({ queryKey: ['con-dau'], queryFn: kySoService.getAllConDau });
  const dsChuKy     = dsChuKyAll.filter(ck => (ck.loaiChuKy || 'FULL') !== 'NHAY');
  const dsChuKyNhay = dsChuKyAll.filter(ck => ck.loaiChuKy === 'NHAY');

  /* ── Lưu colConfig */
  useEffect(() => { saveColLS(colConfig); }, [colConfig]);

  /* ── Preview cache key */
  const previewCacheKey = useMemo(() => {
    const colHash = colConfig.map(c => `${c.key}:${c.visible}:${c.widthPt}:${c.header}`).join('|');
    const fmtHash = JSON.stringify(formatConfig);
    return `clb_${previewKey}_${editTieuDe}_${editNgayStr}_${colHash}_${fmtHash}`;
  }, [previewKey, editTieuDe, editNgayStr, colConfig, formatConfig]);

  /* ── Preview query (members lấy tự động từ DB phía server) */
  const { data: preview, isLoading: previewLoading, isError: previewError } = useQuery({
    queryKey: ['clb-ban-hanh-preview', maClb, previewCacheKey],
    queryFn: () => clbBanHanhService.preview(maClb, {
      tenClb: clb.tenClb,
      coQuanChuQuan: form.coQuanChuQuan || null,
      tenChuNhiem:   form.tenChuNhiem   || null,
      chuKyChuNhiemId: form.chuKyChuNhiemId,
      conDauId:      form.conDauId,
      overrideTieuDe:  contentEdited ? editTieuDe  || null : null,
      overrideNgayStr: contentEdited ? editNgayStr || null : null,
      colConfig,
      formatConfig,
    }),
    staleTime: 0,
  });

  /* ── Init positions từ preview */
  useEffect(() => {
    if (!preview) return;
    const saved = loadPosLS(maClb);
    if (saved) { setPositions(saved); return; }
    const { sigBlockTopY, rightColCX, leftColCX } = preview;
    const sigImgTopY = (sigBlockTopY || 80) + 18;
    const sigW = 90, sigH = 52, stW = 95, stH = 60;
    setPositions({
      chuNhiem: { x: (rightColCX || 430) - sigW / 2, y: sigImgTopY, width: sigW, height: sigH },
      conDau:   { x: (leftColCX  || 150) - stW / 2 - 5, y: sigImgTopY - 4, width: stW, height: stH },
    });
  }, [preview]); // eslint-disable-line

  useEffect(() => {
    if (positions) savePosLS(maClb, positions);
  }, [positions, maClb]);

  /* ── img load */
  const onImgLoad = (pageIdx) => (e) =>
    setImgSizes(p => ({ ...p, [pageIdx]: { w: e.target.offsetWidth, h: e.target.offsetHeight } }));

  /* ── helpers */
  const setPos = (key) => (p) => setPositions(prev => ({ ...prev, [key]: p }));

  const handleRefreshPreview = () => {
    qc.removeQueries({ queryKey: ['clb-ban-hanh-preview', maClb] });
    setPreviewKey(k => k + 1);
  };

  const resetPositions = () => {
    localStorage.removeItem(LS_POS_KEY(maClb));
    setPositions(null);
    handleRefreshPreview();
  };

  /* ── Zone handlers */
  const handleZoneClick = (zone, e) => { setClickedZone(zone); setZoneEditorPos({ x: e.clientX, y: e.clientY }); };
  const handleZoneUpdateTitle = (val) => { setEditTieuDe(val);  setContentEdited(true); };
  const handleZoneUpdateDate  = (val) => { setEditNgayStr(val); setContentEdited(true); };
  const handleZoneUpdateRow   = (idx, rowData) => {
    setEditRows(prev => prev.map((r, i) => i === idx ? { ...r, ...rowData } : r));
    setContentEdited(true);
  };

  /* ── ColConfig */
  const updateColConfig = (idx, patch) => setColConfig(p => p.map((c, i) => i === idx ? { ...c, ...patch } : c));
  const moveColConfig   = (idx, dir) => {
    setColConfig(prev => {
      const arr = [...prev];
      const t = idx + dir;
      if (t < 0 || t >= arr.length) return arr;
      [arr[idx], arr[t]] = [arr[t], arr[idx]];
      return arr;
    });
  };

  /* ── Export */
  const handleBanHanh = async () => {
    if (!form.coQuanChuQuan.trim()) { alert('Vui lòng nhập cơ quan chủ quản'); return; }
    if (!form.tenChuNhiem.trim())   { alert('Vui lòng nhập tên chủ nhiệm CLB'); return; }
    if (!preview)                   { alert('Vui lòng chờ preview tải xong'); return; }
    setExporting(true); setExportError(null); setBanHanhResult(null);
    try {
      const result = await clbBanHanhService.banHanh(maClb, {
        tenClb:          clb.tenClb,
        coQuanChuQuan:   form.coQuanChuQuan,
        tenChuNhiem:     form.tenChuNhiem,
        chuKyChuNhiemId: form.chuKyChuNhiemId,
        conDauId:        form.conDauId,
        posChuNhiem:     positions?.chuNhiem ?? null,
        posConDau:       form.conDauId ? (positions?.conDau ?? null) : null,
        overrideTieuDe:  contentEdited ? editTieuDe  || null : null,
        overrideNgayStr: contentEdited ? editNgayStr || null : null,
        colConfig,
        formatConfig,
        apDungGiapLai:   form.apDungGiapLai,
        chuKyNhayId:     form.chuKyNhayId,
        khoaFilePdf:     form.khoaFilePdf,
      });
      setBanHanhResult(result);
      setExportDone(true);
      qc.invalidateQueries({ queryKey: ['clb-ban-hanh', maClb] });
    } catch (err) {
      setExportError(err?.response?.data?.message || err.message || 'Có lỗi xảy ra');
    } finally {
      setExporting(false);
    }
  };

  const naturalW  = preview?.pageWidth  ?? 595;
  const naturalH  = preview?.pageHeight ?? 842;
  const canExport = form.tenChuNhiem.trim() && form.coQuanChuQuan.trim() && preview && !previewLoading;

  /* ─── Tab: Ký ─────────────────────────────────────────────── */
  const renderKyTab = () => (
    <div className="space-y-4 p-4">
      {/* Cơ quan chủ quản */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2.5">
        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
          Cơ quan chủ quản
        </h4>
        <div>
          <input type="text" value={form.coQuanChuQuan}
            onChange={e => setForm(f => ({ ...f, coQuanChuQuan: e.target.value }))}
            placeholder="Hội sinh viên Trường ĐH Kiên Giang / CLB Tin học"
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <p className="text-[10px] text-gray-400 mt-0.5">Dùng dấu "/" để tách thành 2 dòng</p>
        </div>
      </div>

      {/* Chủ nhiệm */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2.5">
        <h4 className="text-xs font-bold text-blue-700 flex items-center gap-1.5 uppercase tracking-wide">
          <Pen className="w-3.5 h-3.5" /> Chủ nhiệm CLB
        </h4>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Họ tên *</label>
          <input type="text" placeholder="Nguyễn Văn A" value={form.tenChuNhiem}
            onChange={e => setForm(f => ({ ...f, tenChuNhiem: e.target.value }))}
            className="w-full border border-blue-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <SigImagePicker label="Chữ ký ảnh" value={form.chuKyChuNhiemId}
          onChange={v => setForm(f => ({ ...f, chuKyChuNhiemId: v }))}
          options={dsChuKy} color="blue" />
      </div>

      {/* Con dấu */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 space-y-2">
        <h4 className="text-xs font-bold text-orange-700 flex items-center gap-1.5 uppercase tracking-wide">
          <Stamp className="w-3.5 h-3.5" /> Con dấu (tuỳ chọn)
        </h4>
        <select value={form.conDauId ?? ''}
          onChange={e => setForm(f => ({ ...f, conDauId: e.target.value ? Number(e.target.value) : null }))}
          className="w-full border border-orange-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
          <option value="">— Không đóng dấu —</option>
          {dsConDau.map(cd => (
            <option key={cd.id} value={cd.id}>{cd.ten}{cd.laMacDinh ? ' ★' : ''}</option>
          ))}
        </select>
        {form.conDauId && (
          <img src={imgUrl(dsConDau.find(c => c.id === form.conDauId)?.duongDan)}
            alt="preview" className="h-14 object-contain border rounded bg-gray-50" />
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
        <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wide">
          <Lock className="w-3.5 h-3.5" /> Bảo mật &amp; chống giả mạo
        </h4>

        <label className={`flex items-start gap-2 ${!form.conDauId ? 'opacity-50' : ''}`}>
          <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 rounded accent-orange-600 cursor-pointer"
            checked={form.apDungGiapLai}
            disabled={!form.conDauId}
            onChange={e => setForm(f => ({ ...f, apDungGiapLai: e.target.checked }))} />
          <span className="text-xs text-gray-600">
            <span className="font-medium text-gray-700 flex items-center gap-1"><Layers className="w-3 h-3" /> Đóng dấu giáp lai</span>
            Đóng con dấu lên mọi trang (dùng ảnh con dấu đã chọn ở trên) để chống rút/thay trang.
          </span>
        </label>

        <SigImagePicker label="Ký nháy (mọi trang trừ trang cuối, tuỳ chọn)"
          value={form.chuKyNhayId}
          onChange={v => setForm(f => ({ ...f, chuKyNhayId: v }))}
          options={dsChuKyNhay} color="blue" />

        <label className="flex items-start gap-2">
          <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 rounded accent-orange-600 cursor-pointer"
            checked={form.khoaFilePdf}
            onChange={e => setForm(f => ({ ...f, khoaFilePdf: e.target.checked }))} />
          <span className="text-xs text-gray-600">
            <span className="font-medium text-gray-700">Khóa chỉnh sửa PDF</span> — ai cũng mở/xem/in được,
            nhưng không sửa nội dung hay copy text (không cần mật khẩu để mở).
          </span>
        </label>
      </div>

      {(!form.tenChuNhiem.trim() || !form.coQuanChuQuan.trim()) && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Cần nhập tên chủ nhiệm và cơ quan chủ quản
        </div>
      )}
    </div>
  );

  /* ─── Tab: Nội dung ──────────────────────────────────────────── */
  const renderNoiDungTab = () => (
    <div className="p-4 space-y-4">
      {/* Tiêu đề + Ngày */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tiêu đề</label>
          <textarea rows={2} value={editTieuDe}
            onChange={e => { setEditTieuDe(e.target.value); setContentEdited(true); }}
            placeholder={`DANH SÁCH THÀNH VIÊN\n${clb.tenClb?.toUpperCase() || 'TÊN CLB'}`}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ngày ký</label>
          <input type="text" value={editNgayStr}
            onChange={e => { setEditNgayStr(e.target.value); setContentEdited(true); }}
            placeholder="An Giang, ngày 01 tháng 01 năm 2026"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
      </div>

      {/* Thông báo cấu trúc 2 phần */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
        <p className="text-xs font-semibold text-blue-700">Cấu trúc PDF tự động (lấy dữ liệu từ hệ thống)</p>
        <div className="space-y-1.5">
          <div className="flex items-start gap-2 text-xs text-blue-800">
            <span className="font-bold shrink-0">I.</span>
            <span><strong>Thành viên Ban chủ nhiệm</strong> — tất cả BCN đang đương nhiệm (bao gồm giảng viên, chuyên viên)</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-blue-800">
            <span className="font-bold shrink-0">II.</span>
            <span><strong>Thành viên</strong> — danh sách sinh viên đang hoạt động trong CLB</span>
          </div>
        </div>
        <p className="text-[11px] text-blue-500">Quản lý BCN ở tab <em>Ban chủ nhiệm</em>; quản lý thành viên ở tab <em>Thành viên</em>.</p>
      </div>

      {contentEdited && (
        <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Nội dung đã chỉnh sửa — nhấn "Làm mới" để cập nhật preview
        </p>
      )}
    </div>
  );

  /* ─── Tab: Cấu hình cột ──────────────────────────────────────── */
  const renderCauHinhTab = () => (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cấu hình cột PDF</span>
        <button type="button" onClick={() => setColConfig(DEFAULT_COL_CONFIG)}
          className="flex items-center gap-1 text-xs px-2 py-1 text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg">
          <RotateCcw className="w-3 h-3" /> Mặc định
        </button>
      </div>
      <p className="text-[11px] text-gray-400">Bật/tắt cột, đổi tiêu đề, điều chỉnh độ rộng và thứ tự.</p>
      <div className="space-y-2">
        {colConfig.map((col, idx) => (
          <div key={col.key}
            className={`border rounded-xl p-2.5 transition-colors ${col.visible ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={col.visible}
                onChange={e => updateColConfig(idx, { visible: e.target.checked })}
                className="w-3.5 h-3.5 rounded accent-blue-600 cursor-pointer shrink-0" />
              <input type="text" value={col.header}
                onChange={e => updateColConfig(idx, { header: e.target.value })}
                disabled={!col.visible}
                className="flex-1 border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-transparent disabled:cursor-default min-w-0" />
              <select value={ptToPreset(col.widthPt)}
                onChange={e => updateColConfig(idx, { widthPt: WIDTH_PRESETS[e.target.value] })}
                disabled={!col.visible}
                className="border border-gray-200 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white disabled:opacity-50 disabled:cursor-default shrink-0">
                <option value="xs">XS</option><option value="sm">S</option>
                <option value="md">M</option><option value="lg">L</option><option value="xl">XL</option>
              </select>
              <div className="flex flex-col gap-0.5 shrink-0">
                <button type="button" onClick={() => moveColConfig(idx, -1)} disabled={idx === 0}
                  className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30">
                  <ChevronUp className="w-3 h-3 text-gray-500" />
                </button>
                <button type="button" onClick={() => moveColConfig(idx, 1)} disabled={idx === colConfig.length - 1}
                  className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30">
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 font-mono">{col.key}</span>
              <span className="text-[10px] text-gray-300">·</span>
              <span className="text-[10px] text-gray-400">{col.widthPt}pt</span>
            </div>
          </div>
        ))}
      </div>
      <div className="text-[11px] text-gray-400 bg-blue-50 border border-blue-100 rounded-lg p-2">
        Sau khi cấu hình, nhấn <strong>Làm mới</strong> trên preview để xem thay đổi.
      </div>
    </div>
  );

  /* ─── Tab: Thể thức ──────────────────────────────────────────── */
  const renderTheThuocTab = () => {
    const NInput = ({ label, stateKey, unit, min, max, step = 0.5, placeholder }) => (
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 w-28 shrink-0">{label}</label>
        <div className="relative flex-1">
          <input type="number" min={min} max={max} step={step}
            value={formatConfig[stateKey] ?? ''}
            onChange={e => updateFmt(stateKey, e.target.value === '' ? null : parseFloat(e.target.value))}
            placeholder={placeholder}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs pr-8 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          {unit && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">{unit}</span>}
        </div>
      </div>
    );
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Thể thức tài liệu</span>
          <button type="button"
            onClick={() => setFormatConfig({ marginTopCm: null, marginBottomCm: null, marginLeftCm: null, marginRightCm: null, bodyFontSizePt: null, rowHeightPt: null, fontName: null })}
            className="flex items-center gap-1 text-xs px-2 py-1 text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg">
            <RotateCcw className="w-3 h-3" /> Mặc định
          </button>
        </div>
        <div>
          <p className="text-[11px] font-medium text-gray-600 mb-1.5">Phông chữ</p>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-28 shrink-0">Kiểu chữ</label>
            <select value={formatConfig.fontName ?? ''}
              onChange={e => updateFmt('fontName', e.target.value || null)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
              <option value="">Times New Roman (mặc định)</option>
              <option value="arial">Arial</option>
              <option value="calibri">Calibri</option>
            </select>
          </div>
          <div className="mt-2">
            <NInput label="Cỡ chữ nội dung" stateKey="bodyFontSizePt" unit="pt" min={7} max={14} step={0.5} placeholder="10" />
          </div>
          <div className="mt-2">
            <NInput label="Chiều cao dòng" stateKey="rowHeightPt" unit="pt" min={14} max={36} step={1} placeholder="22" />
          </div>
        </div>
        <div>
          <p className="text-[11px] font-medium text-gray-600 mb-1.5">Lề trang (cm) — khổ giấy A4</p>
          <div className="space-y-2">
            <NInput label="Lề trên"  stateKey="marginTopCm"    unit="cm" min={0.5} max={4} step={0.1} placeholder="2.0" />
            <NInput label="Lề dưới"  stateKey="marginBottomCm" unit="cm" min={0.5} max={4} step={0.1} placeholder="2.0" />
            <NInput label="Lề trái"  stateKey="marginLeftCm"   unit="cm" min={0.5} max={4} step={0.1} placeholder="2.5" />
            <NInput label="Lề phải"  stateKey="marginRightCm"  unit="cm" min={0.5} max={4} step={0.1} placeholder="1.5" />
          </div>
        </div>
        <div className="text-[11px] text-gray-400 bg-amber-50 border border-amber-100 rounded-lg p-2">
          Để trống = dùng giá trị mặc định. Nhấn <strong>Làm mới</strong> để xem trước thay đổi.
        </div>
      </div>
    );
  };

  /* ─── Preview panel ──────────────────────────────────────────── */
  const renderPreviewPanel = () => {
    const lastPageIndex = (preview?.pages?.length ?? 1) - 1;
    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-gray-50 flex-shrink-0 flex-wrap">
          {preview && (
            <span className="text-xs text-gray-400">
              {preview.totalStudents ?? editRows?.length ?? 0} thành viên · {preview.pages.length} trang
            </span>
          )}
          <button onClick={handleRefreshPreview}
            className="ml-auto flex items-center gap-1 text-xs px-2.5 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600">
            <RefreshCw className={`w-3.5 h-3.5 ${previewLoading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
          {positions && (
            <button onClick={resetPositions}
              className="flex items-center gap-1 text-xs px-2.5 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600">
              <MoveHorizontal className="w-3.5 h-3.5" /> Đặt lại vị trí
            </button>
          )}
        </div>

        {/* Pages */}
        <div className="flex-1 overflow-auto bg-gray-300 flex flex-col items-center gap-6 p-6 min-h-0">
          {previewLoading && (
            <div className="flex flex-col items-center gap-3 mt-16 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">Đang tạo bản xem trước…</span>
            </div>
          )}
          {previewError && (
            <div className="flex flex-col items-center gap-3 mt-16 text-red-500">
              <AlertCircle className="w-8 h-8" />
              <span className="text-sm">Không thể tạo bản xem trước</span>
              <button onClick={handleRefreshPreview}
                className="text-xs px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg">Thử lại</button>
            </div>
          )}
          {!previewLoading && !previewError && !preview && (
            <div className="flex flex-col items-center gap-3 mt-16 text-gray-400">
              <Eye className="w-12 h-12" />
              <span className="text-sm">Nhấn "Làm mới" để tạo bản xem trước</span>
            </div>
          )}

          {preview && preview.pages.map((pageDataUrl, pageIdx) => {
            const isLastPage = pageIdx === lastPageIndex;
            const imgSz = imgSizes[pageIdx] || { w: 0, h: 0 };
            const pageZones = (preview.editZones || []).filter(z => z.pageIndex === pageIdx);
            return (
              <div key={pageIdx} className="flex flex-col items-center w-full">
                {preview.pages.length > 1 && (
                  <div className="mb-2 text-xs text-gray-500 font-medium bg-white px-3 py-1 rounded-full shadow-sm">
                    Trang {pageIdx + 1}
                  </div>
                )}
                <div ref={isLastPage ? lastPageRef : undefined}
                  className="relative shadow-2xl bg-white" style={{ display: 'inline-block' }}>
                  <img src={pageDataUrl} alt={`Trang ${pageIdx + 1}`}
                    className="block" style={{ maxWidth: '580px', width: '100%', height: 'auto' }}
                    onLoad={onImgLoad(pageIdx)} draggable={false} />

                  {/* Edit zones */}
                  {imgSz.w > 0 && pageZones.map((zone, zi) => (
                    <ZoneOverlay key={zi} zone={zone}
                      naturalW={naturalW} naturalH={naturalH}
                      imgW={imgSz.w} imgH={imgSz.h}
                      onClick={handleZoneClick} />
                  ))}

                  {/* Drag boxes — trang cuối */}
                  {isLastPage && positions && imgSz.w > 0 && (
                    <>
                      <DraggableBox
                        label="Chủ nhiệm" color="blue"
                        pos={positions.chuNhiem} onMove={setPos('chuNhiem')}
                        containerRef={lastPageRef}
                        imgNaturalW={naturalW} imgNaturalH={naturalH}
                        imgDisplayW={imgSz.w} imgDisplayH={imgSz.h}
                        imgSrc={imgUrl(dsChuKy.find(c => c.id === form.chuKyChuNhiemId)?.duongDan)} />
                      {form.conDauId && (
                        <DraggableBox
                          label="Con dấu" color="orange"
                          pos={positions.conDau} onMove={setPos('conDau')}
                          containerRef={lastPageRef}
                          imgNaturalW={naturalW} imgNaturalH={naturalH}
                          imgDisplayW={imgSz.w} imgDisplayH={imgSz.h}
                          imgSrc={imgUrl(dsConDau.find(c => c.id === form.conDauId)?.duongDan)} />
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hint */}
        {preview && positions && !exportDone && (
          <div className="px-4 py-2 bg-blue-50 border-t text-xs text-blue-600 flex items-center gap-2 flex-shrink-0">
            <GripHorizontal className="w-4 h-4 flex-shrink-0" />
            Kéo ô màu để điều chỉnh vị trí chữ ký. Nhấn vào vùng nội dung để sửa trực tiếp trên preview.
          </div>
        )}

        {/* Result */}
        {exportDone && (
          <div className="px-4 py-3 bg-green-50 border-t border-green-200 flex-shrink-0">
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              Ban hành thành công! Danh sách thành viên đã được lưu chính thức.
            </div>
            {banHanhResult && (
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <a href={banHanhResult.downloadUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                  <Download className="w-3.5 h-3.5" /> Tải PDF về máy
                </a>
                <span className="text-xs text-green-600">{banHanhResult.tenFile}</span>
              </div>
            )}
          </div>
        )}
        {exportError && (
          <div className="px-4 py-3 bg-red-50 border-t border-red-200 flex items-center gap-2 text-red-700 text-sm flex-shrink-0">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {exportError}
          </div>
        )}
      </div>
    );
  };

  /* ─── RENDER ─────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden"
        style={{ maxWidth: '1100px', height: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b text-white rounded-t-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <FileCheck className="w-5 h-5" />
            <h2 className="font-semibold text-base">Ban hành danh sách thành viên CLB</h2>
            {preview && (
              <span className="text-sm opacity-80">— {clb.tenClb}</span>
            )}
            {contentEdited && (
              <span className="text-xs bg-amber-400/30 border border-amber-300/50 text-amber-100 px-2 py-0.5 rounded-full">
                Đã chỉnh sửa
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* LEFT PANEL */}
          <div className="w-[22rem] border-r flex flex-col flex-shrink-0 bg-white overflow-hidden">
            <div className="flex border-b flex-shrink-0">
              {[
                { key: 'ky',       icon: Settings,   label: 'Ký' },
                { key: 'noidung',  icon: List,       label: 'Nội dung' },
                { key: 'cauhinh',  icon: Sliders,    label: 'Cột' },
                { key: 'thethuoc', icon: FileText,   label: 'Thể thức' },
                { key: 'lichsu',   icon: Clock,      label: 'Lịch sử' },
              ].map(({ key, icon: Icon, label }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                    activeTab === key
                      ? 'text-emerald-700 border-emerald-600'
                      : 'text-gray-400 border-transparent hover:text-gray-600'
                  }`}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{label}</span>
                  {key === 'noidung' && contentEdited && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeTab === 'ky'       && renderKyTab()}
              {activeTab === 'noidung'  && renderNoiDungTab()}
              {activeTab === 'cauhinh'  && renderCauHinhTab()}
              {activeTab === 'thethuoc' && renderTheThuocTab()}
              {activeTab === 'lichsu'   && <HistoryTab maClb={maClb} />}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            {activeTab === 'lichsu'
              ? (
                <div className="flex-1 flex items-center justify-center bg-gray-50 text-sm text-gray-400">
                  <div className="text-center">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Chọn tab Ký / Nội dung để xem preview PDF</p>
                  </div>
                </div>
              )
              : renderPreviewPanel()
            }
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50 rounded-b-2xl flex-shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors">
            Đóng
          </button>
          <button onClick={handleBanHanh} disabled={!canExport || exporting}
            className="flex items-center gap-2 px-6 py-2.5 text-white rounded-xl font-medium text-sm
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors
              bg-emerald-600 hover:bg-emerald-700">
            {exporting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang ban hành…</>
              : <><Send className="w-4 h-4" /> Ban hành chính thức</>
            }
          </button>
        </div>
      </div>

      {/* Floating zone editor */}
      {clickedZone && (
        <FloatingZoneEditor
          zone={clickedZone}
          editRows={editRows}
          editTieuDe={editTieuDe}
          editNgayStr={editNgayStr}
          vpX={zoneEditorPos.x}
          vpY={zoneEditorPos.y}
          onUpdateTitle={handleZoneUpdateTitle}
          onUpdateDate={handleZoneUpdateDate}
          onUpdateRow={handleZoneUpdateRow}
          onClose={() => setClickedZone(null)}
        />
      )}
    </div>
  );
}
