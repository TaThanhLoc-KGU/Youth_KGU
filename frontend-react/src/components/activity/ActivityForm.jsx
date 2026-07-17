import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  MapPin, Loader2, X, Info, CheckCircle2, PlayCircle, XCircle, Lock,
  FileText, Calendar, QrCode, Settings2, ArrowLeftRight, LogIn, LogOut, Zap,
  Clock, Users, RotateCcw, Smartphone, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import RenLuyenSelector from './RenLuyenSelector';
import activityService from '../../services/activityService';
import { formatDate, formatDateTime, addMinutesToTime } from '../../utils/dateFormat';
import {
  LOAI_HOAT_DONG_OPTIONS,
  CAP_DO_OPTIONS,
  TRANG_THAI_OPTIONS,
  TRANG_THAI_HOAT_DONG,
  HOC_KY_OPTIONS,
} from '../../constants/activityConstants';

// ── Leaflet loader ────────────────────────────────────────────────────────────
let _leafletReady = false;
let _leafletPromise = null;
function loadLeaflet() {
  if (_leafletReady) return Promise.resolve();
  if (_leafletPromise) return _leafletPromise;
  _leafletPromise = new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => { _leafletReady = true; resolve(); };
    document.head.appendChild(script);
  });
  return _leafletPromise;
}

const KGU_CENTER = [10.0167, 105.0656];

// ── Map picker modal ──────────────────────────────────────────────────────────
const MapPickerModal = ({ initialLat, initialLng, onConfirm, onClose }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [coords, setCoords] = useState(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadLeaflet().then(() => {
      if (!mounted || !containerRef.current || mapRef.current) return;
      const L = window.L;
      const center = initialLat && initialLng ? [initialLat, initialLng] : KGU_CENTER;
      const map = L.map(containerRef.current).setView(center, 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      }).addTo(map);
      mapRef.current = map;
      if (initialLat && initialLng) {
        markerRef.current = L.marker([initialLat, initialLng]).addTo(map);
      }
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) markerRef.current.remove();
        markerRef.current = L.marker([lat, lng]).addTo(map);
        if (mounted) setCoords({ lat, lng });
      });
    });
    return () => {
      mounted = false;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []); // eslint-disable-line

  const handleSearch = () => {
    if (!searchQ.trim() || !mapRef.current) return;
    setSearching(true);
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQ)}&format=json&limit=1&countrycodes=vn`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.length || !mapRef.current) return;
        const L = window.L;
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        mapRef.current.setView([lat, lng], 17);
        if (markerRef.current) markerRef.current.remove();
        markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
        setCoords({ lat, lng });
      })
      .catch(() => {})
      .finally(() => setSearching(false));
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl flex flex-col" style={{ height: '85vh', maxHeight: 560 }}>
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            Chọn vị trí trên bản đồ
          </h3>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2 px-4 py-2 border-b flex-shrink-0">
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Tìm địa điểm, sau đó click để chọn chính xác..."
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Tìm'}
          </button>
        </div>
        <div ref={containerRef} className="flex-1 min-h-0" />
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 rounded-b-xl flex-shrink-0">
          <p className="text-xs text-gray-500">
            {coords ? (
              <span className="text-green-600 font-medium">
                Đã chọn: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </span>
            ) : (
              'Click vào bản đồ để ghim vị trí'
            )}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100">
              Hủy
            </button>
            <button type="button" disabled={!coords} onClick={() => onConfirm(coords.lat, coords.lng)}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── LocationInput ─────────────────────────────────────────────────────────────
const LocationInput = ({ diaDiem, viDo, kinhDo, onChange }) => {
  const [showMap, setShowMap] = useState(false);
  const handleMapConfirm = (lat, lng) => { onChange({ diaDiem, viDo: lat, kinhDo: lng }); setShowMap(false); };

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tên địa điểm tổ chức</label>
        <input
          type="text"
          value={diaDiem || ''}
          onChange={(e) => onChange({ diaDiem: e.target.value, viDo, kinhDo })}
          placeholder="VD: Hội trường A, Nhà B..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {viDo && kinhDo ? (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>GPS: {parseFloat(viDo).toFixed(5)}, {parseFloat(kinhDo).toFixed(5)}</span>
            <button type="button" onClick={() => onChange({ diaDiem, viDo: null, kinhDo: null })}
              className="ml-0.5 text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
          </div>
        ) : (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Chưa có toạ độ GPS
          </span>
        )}
        <button type="button" onClick={() => setShowMap(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
          <MapPin className="w-3.5 h-3.5" />
          {viDo && kinhDo ? 'Đổi vị trí' : 'Chọn trên bản đồ'}
        </button>
      </div>
      {showMap && (
        <MapPickerModal initialLat={viDo} initialLng={kinhDo} onConfirm={handleMapConfirm} onClose={() => setShowMap(false)} />
      )}
    </div>
  );
};

// ── Status badge ───────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  SAP_DIEN_RA:      'bg-blue-50  text-blue-700  border-blue-200',
  DANG_MO_DANG_KY:  'bg-green-50 text-green-700 border-green-200',
  DANG_DIEN_RA:     'bg-amber-50 text-amber-700 border-amber-200',
  DA_HOAN_THANH:    'bg-gray-50  text-gray-600  border-gray-200',
  DA_KET_THUC:      'bg-gray-50  text-gray-500  border-gray-200',
  DA_HUY:           'bg-red-50   text-red-600   border-red-200',
};

const StatusBadge = ({ status }) => {
  const label = TRANG_THAI_HOAT_DONG[status]?.label || status;
  const cls = STATUS_STYLES[status] || 'bg-gray-50 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${cls}`}>
      {label}
    </span>
  );
};

// ── Status actions ─────────────────────────────────────────────────────────────
const StatusActions = ({ maHoatDong, currentStatus, onRefresh }) => {
  const [loading, setLoading] = useState(null);
  const doAction = async (action, label) => {
    if (!window.confirm(`Xác nhận: ${label}?`)) return;
    setLoading(action);
    try {
      await activityService[action](maHoatDong);
      toast.success(`${label} thành công!`);
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || `${label} thất bại!`);
    } finally { setLoading(null); }
  };

  const btns = [];
  if (currentStatus === 'SAP_DIEN_RA') {
    btns.push({ action: 'openRegistration', label: 'Mở đăng ký', icon: CheckCircle2, color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' });
    btns.push({ action: 'start',            label: 'Bắt đầu',    icon: PlayCircle,   color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' });
  }
  if (currentStatus === 'DANG_MO_DANG_KY') {
    btns.push({ action: 'closeRegistration', label: 'Đóng đăng ký', icon: Lock,       color: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100' });
    btns.push({ action: 'start',             label: 'Bắt đầu',      icon: PlayCircle, color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' });
  }
  if (currentStatus === 'DANG_DIEN_RA') {
    btns.push({ action: 'revertStart', label: 'Hoàn tác bắt đầu', icon: XCircle,       color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' });
    btns.push({ action: 'complete',    label: 'Hoàn thành',        icon: CheckCircle2, color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' });
  }
  if (!['DA_HOAN_THANH', 'DA_KET_THUC', 'DA_HUY'].includes(currentStatus)) {
    btns.push({ action: 'cancel', label: 'Hủy hoạt động', icon: XCircle, color: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' });
  }
  if (!btns.length) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <span className="text-xs text-gray-500 self-center">Chuyển trạng thái:</span>
      {btns.map((b) => (
        <button key={b.action} type="button" disabled={!!loading} onClick={() => doAction(b.action, b.label)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 border rounded-lg font-medium transition-colors disabled:opacity-50 ${b.color}`}>
          <b.icon className="w-3.5 h-3.5" />
          {loading === b.action ? 'Đang xử lý...' : b.label}
        </button>
      ))}
    </div>
  );
};

// ── Toggle switch ─────────────────────────────────────────────────────────────
const Toggle = ({ name, checked, label, hint, onToggle }) => (
  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 border border-gray-100">
    <div className="flex-1 pr-4">
      <p className="text-sm font-medium text-gray-800">{label}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(name, !checked); }}
      className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${
        checked ? 'bg-blue-500' : 'bg-gray-300'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
        checked ? 'translate-x-6' : 'translate-x-0'
      }`} />
    </button>
  </div>
);

// ── QR mode options ───────────────────────────────────────────────────────────
const QR_MODES = [
  { value: 'CHECKIN_CHECKOUT', icon: ArrowLeftRight, label: 'Check-in & Check-out', desc: 'Quét cả khi đến lẫn khi về',     color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-400'   },
  { value: 'CHECKIN_ONLY',     icon: LogIn,          label: 'Chỉ Check-in',          desc: 'Quét QR một lần khi đến',       color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-400'  },
  { value: 'CHECKOUT_ONLY',    icon: LogOut,         label: 'Chỉ Check-out',          desc: 'Tự check-in, quét QR khi về', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-400' },
  { value: 'AUTO_FULL',        icon: Zap,            label: 'Tự động hoàn toàn',      desc: 'BCH xác nhận, không quét QR', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-400' },
];

const QR_INFO = {
  CHECKIN_CHECKOUT: { icon: Smartphone, color: 'bg-blue-50 border-blue-200 text-blue-800',     iconCls: 'text-blue-500',   title: 'QR Tự phục vụ — Check-in & Check-out',  desc: 'Admin trình chiếu mã QR. Sinh viên quét khi đến và quét lại khi về.' },
  CHECKIN_ONLY:     { icon: Smartphone, color: 'bg-green-50 border-green-200 text-green-800',  iconCls: 'text-green-500',  title: 'QR Tự phục vụ — Chỉ Check-in',          desc: 'Admin trình chiếu mã QR. Sinh viên quét một lần khi đến.' },
  CHECKOUT_ONLY:    { icon: Smartphone, color: 'bg-orange-50 border-orange-200 text-orange-800', iconCls: 'text-orange-500', title: 'QR Tự phục vụ — Chỉ Check-out',         desc: 'Sinh viên tự check-in khi đến. Cuối buổi quét QR để xác nhận ra về.' },
  AUTO_FULL:        { icon: Zap,        color: 'bg-purple-50 border-purple-200 text-purple-800', iconCls: 'text-purple-500', title: 'Tự động hoàn toàn — Không cần QR',       desc: 'BCH/Admin xác nhận danh sách thủ công. Không cần sinh viên quét.' },
};

// ── STEPS config ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Thông tin',   icon: FileText,  color: 'text-violet-600', bg: 'bg-violet-100', ring: 'ring-violet-200' },
  { id: 2, label: 'Thời gian',   icon: Calendar,  color: 'text-blue-600',   bg: 'bg-blue-100',   ring: 'ring-blue-200'   },
  { id: 3, label: 'Điểm danh',   icon: QrCode,    color: 'text-emerald-600',bg: 'bg-emerald-100',ring: 'ring-emerald-200'},
  { id: 4, label: 'Cài đặt',     icon: Settings2, color: 'text-amber-600',  bg: 'bg-amber-100',  ring: 'ring-amber-200'  },
];

// ── ActivityForm ───────────────────────────────────────────────────────────────
const ActivityForm = ({
  initialData = null,
  mode = 'create',
  scope = 'admin',
  onSuccess = () => {},
  onCancel = () => {},
  khoas = [],
}) => {
  const isEdit = mode === 'edit';
  const isClb  = scope === 'clb';
  const isKhoa = scope === 'khoa';
  const initialized = useRef(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    maHoatDong: '', tenHoatDong: '', moTa: '',
    loaiHoatDong: 'KHAC',
    capDo: isClb ? 'BAN_DOI_CLB' : 'KHOA',
    ngayToChuc: '', ngayKetThuc: '', gioToChuc: '',
    thoiGianBatDau: '', thoiGianKetThuc: '',
    thoiGianTreToiDa: 15, thoiGianToiThieu: 120, choPhepCheckInSom: 30,
    yeuCauCheckOut: false,
    cheDoDiemDanh: 'CHECKIN_CHECKOUT',
    diaDiem: '', viDo: null, kinhDo: null, khoangCachToiDa: null,
    soLuongToiDa: '',
    diemRenLuyen: '', maDanhMucRenLuyen: '', maTieuChiRenLuyen: '', diemToiDaTieuChi: null,
    maKhoa: '', hanDangKy: '', hinhAnhPoster: '', ghiChu: '',
    yeuCauDiemDanh: true, choPhepDangKy: true, isKhongDangKy: false,
    trangThai: isClb ? 'CHO_DUYET' : 'SAP_DIEN_RA',
    soHocKy: '', maNamHoc: '', tenNamHoc: '',
  });

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [submitGuarded, setSubmitGuarded] = useState(false);

  const { data: academicInfo } = useQuery({
    queryKey: ['academic-info'],
    queryFn: () => activityService.getCurrentAcademicInfo(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isEdit && academicInfo) {
      setFormData((prev) => ({
        ...prev,
        soHocKy:  prev.soHocKy  || academicInfo.soHocKy,
        maNamHoc: prev.maNamHoc || academicInfo.maNamHoc,
        tenNamHoc:prev.tenNamHoc|| academicInfo.tenNamHoc,
      }));
    }
  }, [academicInfo, isEdit]);

  useEffect(() => {
    if (initialData && !initialized.current) {
      initialized.current = true;
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        thoiGianTreToiDa:  initialData.thoiGianTreToiDa  ?? prev.thoiGianTreToiDa,
        thoiGianToiThieu:  initialData.thoiGianToiThieu  ?? prev.thoiGianToiThieu,
        choPhepCheckInSom: initialData.choPhepCheckInSom ?? prev.choPhepCheckInSom,
        cheDoDiemDanh:     initialData.cheDoDiemDanh     ?? prev.cheDoDiemDanh,
      }));
    }
  }, [initialData]);

  const handleNgayToChucChange = (e) => {
    const ngay = e.target.value;
    setFormData((prev) => {
      const updated = { ...prev, ngayToChuc: ngay };
      if (ngay) {
        const [yearStr, monthStr, dayStr] = ngay.split('-');
        const year = parseInt(yearStr), month = parseInt(monthStr), day = parseInt(dayStr);
        let soHK;
        if (month >= 8 && month <= 11) soHK = 1;
        else if (month === 12 || month === 1 || month === 2 || (month === 3 && day < 15)) soHK = 2;
        else soHK = 3;
        const startYear = month >= 8 ? year : year - 1;
        const endYear = startYear + 1;
        updated.soHocKy = soHK;
        updated.maNamHoc = `NH${startYear}-${endYear}`;
        updated.tenNamHoc = `Năm học ${startYear}-${endYear}`;
      }
      return updated;
    });
  };

  const handleGioToChucChange = (e) => {
    const gio = e.target.value;
    setFormData((prev) => ({
      ...prev, gioToChuc: gio,
      thoiGianBatDau: (!prev.thoiGianBatDau || prev.thoiGianBatDau === prev.gioToChuc) ? gio : prev.thoiGianBatDau,
    }));
  };

  const createMutation = useMutation({
    mutationFn: (data) => activityService.create(data),
    onSuccess: () => { toast.success('Tạo hoạt động thành công!'); onSuccess(); },
    onError: (err) => { toast.error(err.response?.data?.message || 'Tạo hoạt động thất bại!'); },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => activityService.update(initialData.maHoatDong, data),
    onSuccess: () => { toast.success('Cập nhật hoạt động thành công!'); onSuccess(); },
    onError: (err) => { toast.error(err.response?.data?.message || 'Cập nhật hoạt động thất bại!'); },
  });

  const validate = () => {
    const errs = {};
    if (!formData.maHoatDong?.trim() && !isEdit) errs.maHoatDong = 'Mã hoạt động không được để trống';
    if (!formData.tenHoatDong?.trim()) errs.tenHoatDong = 'Tên hoạt động không được để trống';
    if (!formData.ngayToChuc) errs.ngayToChuc = 'Vui lòng chọn ngày bắt đầu';
    if (formData.ngayKetThuc && formData.ngayToChuc && formData.ngayKetThuc < formData.ngayToChuc)
      errs.ngayKetThuc = 'Ngày kết thúc phải từ ngày bắt đầu trở đi';
    if (formData.thoiGianBatDau && formData.thoiGianKetThuc && formData.thoiGianKetThuc <= formData.thoiGianBatDau)
      errs.thoiGianKetThuc = 'Giờ kết thúc phải sau giờ bắt đầu';
    if (formData.diemRenLuyen === '' || formData.diemRenLuyen === null)
      errs.diemRenLuyen = 'Vui lòng chọn tiêu chí và nhập điểm rèn luyện';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!formData.maHoatDong?.trim() && !isEdit) errs.maHoatDong = 'Vui lòng nhập mã hoạt động';
      if (!formData.tenHoatDong?.trim()) errs.tenHoatDong = 'Vui lòng nhập tên hoạt động';
    }
    if (step === 2) {
      if (!formData.ngayToChuc) errs.ngayToChuc = 'Vui lòng chọn ngày tổ chức';
      if (formData.ngayKetThuc && formData.ngayToChuc && formData.ngayKetThuc < formData.ngayToChuc)
        errs.ngayKetThuc = 'Ngày kết thúc phải từ ngày bắt đầu trở đi';
      if (formData.thoiGianBatDau && formData.thoiGianKetThuc && formData.thoiGianKetThuc <= formData.thoiGianBatDau)
        errs.thoiGianKetThuc = 'Giờ kết thúc phải sau giờ bắt đầu';
    }
    if (step === 4) {
      if (formData.diemRenLuyen === '' || formData.diemRenLuyen === null)
        errs.diemRenLuyen = 'Vui lòng nhập điểm rèn luyện';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (!validateStep(currentStep)) return;
    const next = Math.min(currentStep + 1, STEPS.length);
    setCurrentStep(next);
    // Ghost-tap guard: block submit button for 600ms after arriving at last step
    if (next === STEPS.length) {
      setSubmitGuarded(true);
      setTimeout(() => setSubmitGuarded(false), 600);
    }
  };
  const goBack = () => { setErrors({}); setCurrentStep((s) => Math.max(s - 1, 1)); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) { setCurrentStep(1); return; }
    const submitData = {
      ...formData,
      thoiGianTreToiDa:  formData.thoiGianTreToiDa  ? parseInt(formData.thoiGianTreToiDa)  : null,
      thoiGianToiThieu:  formData.thoiGianToiThieu  ? parseInt(formData.thoiGianToiThieu)  : null,
      choPhepCheckInSom: formData.choPhepCheckInSom ? parseInt(formData.choPhepCheckInSom) : 30,
      soLuongToiDa:      formData.soLuongToiDa      ? parseInt(formData.soLuongToiDa)      : null,
      khoangCachToiDa:   formData.khoangCachToiDa   ? parseInt(formData.khoangCachToiDa)   : null,
      diemRenLuyen: formData.diemRenLuyen !== '' && formData.diemRenLuyen !== null ? parseInt(formData.diemRenLuyen) : null,
      soHocKy: formData.soHocKy ? parseInt(formData.soHocKy) : null,
      maDanhMucRenLuyen: formData.maDanhMucRenLuyen || null,
      maTieuChiRenLuyen: formData.maTieuChiRenLuyen || null,
    };
    if (isEdit) updateMutation.mutate(submitData);
    else createMutation.mutate(submitData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'capDo' && (isClb || isKhoa)) return;
    if (name === 'trangThai' && isClb && !isEdit) return;
    let finalValue = type === 'checkbox' ? checked : value;
    if (name === 'maHoatDong' && typeof finalValue === 'string') {
      finalValue = finalValue.toUpperCase().replace(/[^A-Z0-9_\-]/g, '');
    }
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleToggle = (name, value) => setFormData((prev) => ({ ...prev, [name]: value }));

  const handleRenLuyenChange = ({ maDanhMucRenLuyen, maTieuChiRenLuyen, diemRenLuyen, diemToiDaTieuChi }) => {
    setFormData((prev) => ({
      ...prev,
      maDanhMucRenLuyen: maDanhMucRenLuyen || '',
      maTieuChiRenLuyen: maTieuChiRenLuyen || '',
      diemRenLuyen: diemRenLuyen ?? '',
      diemToiDaTieuChi: diemToiDaTieuChi ?? null,
    }));
  };

  const handleStatusRefresh = () => {
    if (initialData?.maHoatDong) {
      queryClient.invalidateQueries({ queryKey: ['hoat-dong-detail', initialData.maHoatDong] });
      queryClient.invalidateQueries({ queryKey: ['hoat-dong'] });
    }
    onSuccess();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const namHocList = academicInfo?.danhSachNamHoc || [];

  const requiredFilled = !!(
    formData.tenHoatDong?.trim() &&
    formData.ngayToChuc &&
    (isEdit || formData.maHoatDong?.trim()) &&
    (formData.diemRenLuyen !== '' && formData.diemRenLuyen !== null)
  );

  // Shared UI helpers
  const SectionHead = ({ icon: Icon, color, label }) => (
    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="font-bold text-gray-900">{label}</h3>
    </div>
  );

  // Timeline bar (shared between mobile/desktop)
  const TimelineBar = () => {
    const start  = formData.thoiGianBatDau;
    const end    = formData.thoiGianKetThuc;
    const ciSom  = Number(formData.choPhepCheckInSom) || 30;
    const coExtra = 30;
    const ciOpen  = start ? addMinutesToTime(start, -ciSom) : null;
    const coClose = end   ? addMinutesToTime(end, coExtra)  : null;
    const cheDo   = formData.cheDoDiemDanh;
    const showCI  = cheDo !== 'CHECKOUT_ONLY' && cheDo !== 'AUTO_FULL';
    const showCO  = cheDo === 'CHECKIN_CHECKOUT' || cheDo === 'CHECKOUT_ONLY';
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Khung giờ hoạt động</p>
        </div>
        <div className="flex h-7 rounded-lg overflow-hidden text-[10px] font-bold text-white shadow-sm">
          {showCI && ciOpen && (
            <div className="flex items-center justify-center bg-indigo-400 px-2 min-w-[52px]" style={{ flex: ciSom }}>{ciOpen}</div>
          )}
          <div className={`flex items-center justify-center px-2 min-w-[80px] ${cheDo === 'AUTO_FULL' ? 'bg-purple-500' : 'bg-emerald-500'}`} style={{ flex: 100 }}>
            {start && end ? `${start} → ${end}` : start ? `Từ ${start}` : 'Sự kiện'}
          </div>
          {showCO && end && (
            <div className="flex items-center justify-center bg-orange-400 px-2 min-w-[52px]" style={{ flex: coExtra }}>{coClose}</div>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-gray-400">
          {showCI  && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />Check-in sớm</span>}
          <span className="flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full inline-block ${cheDo === 'AUTO_FULL' ? 'bg-purple-500' : 'bg-emerald-500'}`} />{cheDo === 'AUTO_FULL' ? 'Tự động' : 'Đang diễn ra'}</span>
          {showCO  && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />Check-out (+{coExtra}p)</span>}
          {(!start || !end) && <span className="text-amber-500 font-medium">⚠ Điền giờ bắt đầu & kết thúc</span>}
        </div>
      </div>
    );
  };

  // Banners CLB/Khoa
  const Banners = () => (<>
    {isClb && (
      <div className="flex items-start gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-800 mb-4">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-orange-500" />
        <div>
          <p className="font-semibold">Hoạt động CLB — cần phê duyệt</p>
          <p className="text-xs mt-0.5 text-orange-700">Hoạt động sẽ ở trạng thái <strong>Chờ phê duyệt</strong> cho đến khi Admin xét duyệt.</p>
        </div>
      </div>
    )}
    {isKhoa && (
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 mb-4">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
        <div>
          <p className="font-semibold">Hoạt động Đoàn Khoa</p>
          <p className="text-xs mt-0.5 text-amber-700">Cấp độ <strong>Khoa</strong> được gán tự động. Hiển thị trong phạm vi khoa của bạn.</p>
        </div>
      </div>
    )}
  </>);

  // ── Content sections (shared JSX, responsive classes handle layout) ────────
  const S1 = () => (
    <div className="space-y-4">
      {!isEdit && (
        <div>
          <Input label="Mã hoạt động *" name="maHoatDong" value={formData.maHoatDong}
            onChange={handleChange} placeholder="HD2025_01" error={errors.maHoatDong} />
          <p className="text-xs text-gray-400 mt-1">Chỉ gồm A–Z, 0–9, _ và -</p>
        </div>
      )}
      <Input label="Tên hoạt động *" name="tenHoatDong" value={formData.tenHoatDong}
        onChange={handleChange} placeholder="VD: Hội thảo công nghệ 2025" error={errors.tenHoatDong} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Select label="Loại hoạt động" name="loaiHoatDong" value={formData.loaiHoatDong} onChange={handleChange}>
          {LOAI_HOAT_DONG_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </Select>
        {(isClb || isKhoa) ? (
          <div>
            <label className="form-label">Cấp độ</label>
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium ${isClb ? 'bg-orange-50 border-orange-300 text-orange-800' : 'bg-amber-50 border-amber-300 text-amber-800'}`}>
              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
              {isClb ? 'Ban - Đội - CLB' : 'Khoa'}
              <span className="ml-auto text-xs font-normal opacity-70">Tự động</span>
            </div>
          </div>
        ) : (
          <Select label="Cấp độ" name="capDo" value={formData.capDo} onChange={handleChange}>
            {CAP_DO_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </Select>
        )}
      </div>
      <Textarea label="Mô tả" name="moTa" value={formData.moTa || ''} onChange={handleChange}
        placeholder="Mô tả ngắn về hoạt động..." rows={3} />
    </div>
  );

  const S2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Ngày bắt đầu *</label>
          <div className="custom-date-input">
            <input type="date" name="ngayToChuc" value={formData.ngayToChuc || ''} onChange={handleNgayToChucChange}
              className={`form-input ${errors.ngayToChuc ? 'border-red-400' : ''}`} placeholder=" " />
            <div className="custom-date-display text-sm">
              {formData.ngayToChuc ? formatDate(formData.ngayToChuc) : <span className="text-gray-400">dd/mm/yyyy</span>}
            </div>
          </div>
          {errors.ngayToChuc && <p className="form-error">{errors.ngayToChuc}</p>}
        </div>
        <div>
          <label className="form-label">Ngày kết thúc <span className="text-gray-400 font-normal text-[10px]">(tùy chọn)</span></label>
          <div className="custom-date-input">
            <input type="date" name="ngayKetThuc" value={formData.ngayKetThuc || ''} min={formData.ngayToChuc || ''}
              onChange={handleChange} className={`form-input ${errors.ngayKetThuc ? 'border-red-400' : ''}`} placeholder=" " />
            <div className="custom-date-display text-sm">
              {formData.ngayKetThuc
                ? <span className="text-blue-600 font-medium">{formatDate(formData.ngayKetThuc)}</span>
                : <span className="text-gray-400">1 ngày</span>}
            </div>
          </div>
          {errors.ngayKetThuc && <p className="form-error">{errors.ngayKetThuc}</p>}
          {formData.ngayKetThuc && (
            <button type="button" onClick={() => setFormData(p => ({ ...p, ngayKetThuc: '' }))}
              className="mt-1 text-[11px] text-red-500 hover:text-red-700 flex items-center gap-0.5">
              <X className="w-3 h-3" /> Xoá ngày KT
            </button>
          )}
        </div>
        <Input label="Giờ bắt đầu" type="time" name="thoiGianBatDau" value={formData.thoiGianBatDau} onChange={handleChange} />
        <Input label="Giờ kết thúc" type="time" name="thoiGianKetThuc" value={formData.thoiGianKetThuc} onChange={handleChange} error={errors.thoiGianKetThuc} />
      </div>

      {formData.ngayKetThuc && formData.ngayToChuc && formData.ngayKetThuc > formData.ngayToChuc && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-800">
          <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <span>
            Hoạt động <strong>nhiều ngày</strong>: {formatDate(formData.ngayToChuc)} → {formatDate(formData.ngayKetThuc)}
            {' '}({Math.round((new Date(formData.ngayKetThuc) - new Date(formData.ngayToChuc)) / 86400000) + 1} ngày)
          </span>
        </div>
      )}

      {(formData.soHocKy || formData.tenNamHoc) && (
        <div className="px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
          {/* Row 1: icon + label */}
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span className="text-xs text-blue-700">
              Xếp vào <strong>{formData.soHocKy ? `HK${formData.soHocKy}` : ''}{formData.soHocKy && formData.tenNamHoc ? ' – ' : ''}{formData.tenNamHoc || ''}</strong>
            </span>
          </div>
          {/* Row 2: selects — full width trên mobile */}
          <div className="flex items-center gap-2">
            <select name="soHocKy" value={formData.soHocKy} onChange={handleChange}
              className="flex-1 min-w-0 text-xs border border-blue-200 rounded-lg px-2 py-1.5 bg-white text-blue-700 focus:outline-none">
              <option value="">Học kỳ?</option>
              {HOC_KY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {namHocList.length > 0 && (
              <select name="maNamHoc" value={formData.maNamHoc} onChange={handleChange}
                className="flex-1 min-w-0 text-xs border border-blue-200 rounded-lg px-2 py-1.5 bg-white text-blue-700 focus:outline-none">
                <option value="">Năm học?</option>
                {namHocList.map((nh) => <option key={nh.maNamHoc} value={nh.maNamHoc}>{nh.tenNamHoc}</option>)}
              </select>
            )}
          </div>
        </div>
      )}

      <LocationInput diaDiem={formData.diaDiem} viDo={formData.viDo} kinhDo={formData.kinhDo}
        onChange={({ diaDiem, viDo, kinhDo }) => setFormData((prev) => ({ ...prev, diaDiem, viDo, kinhDo }))} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Input label="Bán kính ĐD (m)" type="number" name="khoangCachToiDa"
            value={formData.khoangCachToiDa ?? ''} onChange={handleChange} min="0" placeholder="Không giới hạn" />
          <p className="text-xs text-gray-400 mt-1">Cần toạ độ GPS</p>
        </div>
        <Input label="Số lượng tối đa" type="number" name="soLuongToiDa"
          value={formData.soLuongToiDa} onChange={handleChange} min="0" placeholder="Không giới hạn" />
      </div>
    </div>
  );

  const S3 = () => {
    const info = QR_INFO[formData.cheDoDiemDanh] || QR_INFO.CHECKIN_CHECKOUT;
    const InfoIcon = info.icon;
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Chế độ quét QR</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {QR_MODES.map(({ value, icon: Icon, label, desc, color, bg, border }) => {
              const active = formData.cheDoDiemDanh === value;
              return (
                <label key={value}
                  className={`flex items-center gap-3 p-4 md:p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                    active ? `${border} ${bg}` : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input type="radio" name="cheDoDiemDanh" value={value} checked={active} onChange={handleChange} className="sr-only" />
                  <div className={`w-10 h-10 md:w-8 md:h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? bg : 'bg-gray-100'}`}>
                    <Icon className={`w-5 h-5 md:w-4 md:h-4 ${active ? color : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-tight ${active ? 'text-gray-900' : 'text-gray-700'}`}>{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">{desc}</p>
                  </div>
                  {active && <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${color}`} />}
                </label>
              );
            })}
          </div>
        </div>

        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${info.color}`}>
          <InfoIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${info.iconCls}`} />
          <div>
            <p className="text-sm font-semibold">{info.title}</p>
            <p className="text-xs mt-0.5 opacity-80">{info.desc}</p>
          </div>
        </div>

        {TimelineBar()}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Input label="Check-in sớm (phút)" type="number" name="choPhepCheckInSom"
              value={formData.choPhepCheckInSom} onChange={handleChange} min="0" />
            <p className="text-xs text-gray-400 mt-1">Trước giờ bắt đầu</p>
          </div>
          <div>
            <Input label="Trễ tối đa (phút)" type="number" name="thoiGianTreToiDa"
              value={formData.thoiGianTreToiDa} onChange={handleChange} min="0" />
            <p className="text-xs text-gray-400 mt-1">Quá mức = không tính</p>
          </div>
          {(formData.cheDoDiemDanh === 'CHECKIN_CHECKOUT' || formData.cheDoDiemDanh === 'CHECKOUT_ONLY') && (
            <div>
              <Input label="Tối thiểu (phút)" type="number" name="thoiGianToiThieu"
                value={formData.thoiGianToiThieu} onChange={handleChange} min="0" />
              <p className="text-xs text-gray-400 mt-1">Ít hơn = không đạt</p>
            </div>
          )}
        </div>

        {formData.cheDoDiemDanh === 'CHECKIN_CHECKOUT' && (
          <Toggle name="yeuCauCheckOut" checked={!!formData.yeuCauCheckOut}
            label="Bắt buộc check-out"
            hint="Sinh viên phải quét QR khi về mới tính hoàn thành"
            onToggle={handleToggle} />
        )}
      </div>
    );
  };

  const S4 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="form-label">Hạn đăng ký</label>
          <div className="custom-date-input">
            <input type="datetime-local" name="hanDangKy" value={formData.hanDangKy || ''}
              onChange={handleChange} className="form-input" placeholder=" " />
            <div className="custom-date-display text-sm">
              {formData.hanDangKy ? formatDateTime(formData.hanDangKy) : <span className="text-gray-400">dd/mm/yyyy HH:mm</span>}
            </div>
          </div>
        </div>

        {isEdit ? (
          <div>
            <label className="form-label">Trạng thái</label>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={formData.trangThai} />
            </div>
            {!isClb && (
              <StatusActions maHoatDong={initialData?.maHoatDong} currentStatus={formData.trangThai} onRefresh={handleStatusRefresh} />
            )}
          </div>
        ) : isClb ? (
          <div>
            <label className="form-label">Trạng thái ban đầu</label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-orange-50 border border-orange-300 rounded-xl text-sm text-orange-800">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-medium">Chờ phê duyệt</span>
              <span className="ml-auto text-xs opacity-70">Tự động</span>
            </div>
          </div>
        ) : (
          <Select label="Trạng thái ban đầu" name="trangThai" value={formData.trangThai} onChange={handleChange}>
            {TRANG_THAI_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </Select>
        )}
      </div>

      <Toggle name="isKhongDangKy" checked={!!formData.isKhongDangKy}
        label="Hoạt động không đăng ký (kêu gọi offline)"
        hint="Danh sách tham gia nhập thủ công hoặc import Excel sau khi tạo hoạt động"
        onToggle={handleToggle} />

      {!formData.isKhongDangKy && (
        <Toggle name="choPhepDangKy" checked={!!formData.choPhepDangKy}
          label="Cho phép sinh viên đăng ký"
          hint="Tắt để tạm ngưng nhận đăng ký mới"
          onToggle={handleToggle} />
      )}

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Điểm rèn luyện *</p>
        </div>
        <RenLuyenSelector
          maDanhMuc={formData.maDanhMucRenLuyen}
          maTieuChi={formData.maTieuChiRenLuyen}
          diemRenLuyen={formData.diemRenLuyen}
          onChange={handleRenLuyenChange}
        />
        {errors.diemRenLuyen && (
          <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.diemRenLuyen}</p>
        )}
      </div>

      <Textarea label="Ghi chú nội bộ" name="ghiChu" value={formData.ghiChu || ''}
        onChange={handleChange} placeholder="Ghi chú cho BCH, không hiển thị cho sinh viên..." rows={2} />
    </div>
  );

  // ── Shared card wrapper className ─────────────────────────────────────────
  const cardCls = 'bg-white rounded-2xl shadow-sm border border-gray-100';

  // ── Section visibility on mobile (step wizard) ────────────────────────────
  const vis = (step) => `${currentStep !== step ? 'hidden md:block' : ''}`;

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* ═══════════════════════════════════════════════════════════════════
          MOBILE WIZARD HEADER  (md:hidden)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden mb-4">
        {Banners()}

        {/* Step progress card */}
        <div className={`${cardCls} p-4`}>
          {/* Numbered steps with connectors */}
          <div className="flex items-center mb-4">
            {STEPS.map((s, i) => {
              const done    = s.id < currentStep;
              const active  = s.id === currentStep;
              const Icon    = s.icon;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => done && setCurrentStep(s.id)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all text-sm font-bold ${
                      done   ? `${s.bg} ${s.color} cursor-pointer`             :
                      active ? `bg-blue-600 text-white shadow-md ring-4 ${s.ring}` :
                               'bg-gray-100 text-gray-300 cursor-default'
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-1 rounded-full transition-colors ${done ? 'bg-blue-300' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Current step label */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Bước {currentStep} / {STEPS.length}</p>
              <p className="font-bold text-gray-900 text-base">{STEPS[currentStep - 1].label}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${STEPS[currentStep-1].bg}`}>
              {(() => { const Icon = STEPS[currentStep-1].icon; return <Icon className={`w-5 h-5 ${STEPS[currentStep-1].color}`} />; })()}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          DESKTOP BANNERS  (md:block, hidden on mobile since Banners() is
          already rendered inside mobile header above)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block mb-4">
        {Banners()}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: Thông tin cơ bản
      ════════════════════════════════════════════════════════════════════ */}
      <div className={`${vis(1)} md:mb-4`}>
        <div className={cardCls}>
          <div className="hidden md:block px-6 pt-5 pb-0">
            {SectionHead({ icon: FileText, color: 'bg-violet-100 text-violet-600', label: 'Thông tin cơ bản' })}
          </div>
          <div className="px-5 py-5 md:pt-2">
            {S1()}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: Thời gian & Địa điểm
      ════════════════════════════════════════════════════════════════════ */}
      <div className={`${vis(2)} md:mb-4`}>
        <div className={cardCls}>
          <div className="hidden md:block px-6 pt-5 pb-0">
            {SectionHead({ icon: Calendar, color: 'bg-blue-100 text-blue-600', label: 'Thời gian & Địa điểm' })}
          </div>
          <div className="px-5 py-5 md:pt-2">
            {S2()}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3: Cài đặt Điểm danh
      ════════════════════════════════════════════════════════════════════ */}
      <div className={`${vis(3)} md:mb-4`}>
        <div className={cardCls}>
          <div className="hidden md:block px-6 pt-5 pb-0">
            {SectionHead({ icon: QrCode, color: 'bg-emerald-100 text-emerald-600', label: 'Cài đặt Điểm danh' })}
          </div>
          <div className="px-5 py-5 md:pt-2">
            {S3()}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4: Đăng ký & Cài đặt
      ════════════════════════════════════════════════════════════════════ */}
      <div className={`${vis(4)} md:mb-4`}>
        <div className={cardCls}>
          <div className="hidden md:block px-6 pt-5 pb-0">
            {SectionHead({ icon: Settings2, color: 'bg-amber-100 text-amber-600', label: 'Đăng ký & Cài đặt' })}
          </div>
          <div className="px-5 py-5 md:pt-2">
            {S4()}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          DESKTOP SUBMIT BAR  (hidden on mobile)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex items-center justify-between pt-2">
        <p className="text-xs text-gray-400">
          {isEdit
            ? `Đang chỉnh sửa: ${initialData?.maHoatDong}`
            : !requiredFilled
              ? 'Vui lòng điền tên, mã, ngày tổ chức và điểm rèn luyện'
              : 'Điền đầy đủ thông tin bắt buộc (*)'}
        </p>
        <div className="flex gap-2.5">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>Hủy</Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading || !requiredFilled} icon={isEdit ? RotateCcw : undefined}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo hoạt động'}
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MOBILE INLINE NAV  (hidden on desktop)
          Đặt trong luồng DOM bình thường — tránh lỗi fixed bị block bởi
          CSS transform của admin sidebar
      ════════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden mt-4">
        {currentStep === STEPS.length && !requiredFilled && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3 text-center">
            {!formData.tenHoatDong?.trim() && !formData.ngayToChuc
              ? 'Vui lòng nhập tên hoạt động và chọn ngày tổ chức'
              : !formData.tenHoatDong?.trim()
                ? 'Vui lòng nhập tên hoạt động'
                : !formData.ngayToChuc
                  ? 'Vui lòng chọn ngày tổ chức'
                  : (!isEdit && !formData.maHoatDong?.trim())
                    ? 'Vui lòng nhập mã hoạt động'
                    : 'Vui lòng điền đầy đủ thông tin bắt buộc'}
          </p>
        )}
        <div className="flex gap-3">
          {currentStep === 1 ? (
            <button type="button" onClick={onCancel}
              className="flex items-center justify-center px-6 py-4 border-2 border-gray-200 rounded-2xl text-gray-600 font-semibold text-sm active:bg-gray-50 transition-colors bg-white">
              Hủy
            </button>
          ) : (
            <button type="button" onClick={goBack}
              className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 rounded-2xl text-gray-600 font-semibold text-sm active:bg-gray-50 transition-colors bg-white">
              <ChevronLeft className="w-4 h-4" /> Quay lại
            </button>
          )}

          {currentStep < STEPS.length ? (
            <button type="button" onClick={goNext}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm active:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              Tiếp theo <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="submit" disabled={isLoading || submitGuarded || !requiredFilled}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Lưu thay đổi' : 'Tạo hoạt động'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default ActivityForm;
