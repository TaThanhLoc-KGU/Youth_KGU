import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  MapPin, Loader2, X, Info, CheckCircle2, PlayCircle, XCircle, Lock,
  FileText, Calendar, QrCode, Settings2, ArrowLeftRight, LogIn, LogOut, Zap,
  Clock, Users, RotateCcw,
} from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import Card from '../common/Card';
import ImageUpload from '../common/ImageUpload';
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

// ── Leaflet loader (OpenStreetMap, miễn phí, không cần API key) ───────────────
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

// Tọa độ mặc định: KGU - Rạch Giá, Kiên Giang
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ height: 560 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            Chọn vị trí trên bản đồ
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="flex gap-2 px-4 py-2 border-b flex-shrink-0">
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Tìm nhanh để di chuyển bản đồ, sau đó click để chọn vị trí chính xác..."
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Tìm'}
          </button>
        </div>

        {/* Map */}
        <div ref={containerRef} className="flex-1 min-h-0" />

        {/* Footer */}
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
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!coords}
              onClick={() => onConfirm(coords.lat, coords.lng)}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Xác nhận vị trí
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── LocationInput ─────────────────────────────────────────────────────────────
const LocationInput = ({ diaDiem, viDo, kinhDo, onChange }) => {
  const [showMap, setShowMap] = useState(false);

  const handleMapConfirm = (lat, lng) => {
    onChange({ diaDiem, viDo: lat, kinhDo: lng });
    setShowMap(false);
  };

  return (
    <div className="space-y-2">
      {/* Tên hiển thị — người dùng tự nhập */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tên địa điểm tổ chức
        </label>
        <input
          type="text"
          value={diaDiem || ''}
          onChange={(e) => onChange({ diaDiem: e.target.value, viDo, kinhDo })}
          placeholder="VD: Hội trường A, Nhà B — tên hiển thị cho sinh viên"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* GPS row */}
      <div className="flex items-center gap-3 flex-wrap">
        {viDo && kinhDo ? (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>GPS: {parseFloat(viDo).toFixed(5)}, {parseFloat(kinhDo).toFixed(5)}</span>
            <button
              type="button"
              onClick={() => onChange({ diaDiem, viDo: null, kinhDo: null })}
              className="ml-0.5 text-gray-400 hover:text-red-500"
              title="Xóa toạ độ"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Chưa có toạ độ GPS — cần để kiểm tra vị trí điểm danh</span>
        )}
        <button
          type="button"
          onClick={() => setShowMap(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <MapPin className="w-3.5 h-3.5" />
          {viDo && kinhDo ? 'Đổi vị trí trên bản đồ' : 'Chọn vị trí trên bản đồ'}
        </button>
      </div>

      {showMap && (
        <MapPickerModal
          initialLat={viDo}
          initialLng={kinhDo}
          onConfirm={handleMapConfirm}
          onClose={() => setShowMap(false)}
        />
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

// ── Status action buttons ─────────────────────────────────────────────────────
const StatusActions = ({ maHoatDong, currentStatus, onRefresh }) => {
  const [loading, setLoading] = useState(null);

  const doAction = async (action, label, extraParams = {}) => {
    if (!window.confirm(`Xác nhận: ${label}?`)) return;
    setLoading(action);
    try {
      await activityService[action](maHoatDong, extraParams);
      toast.success(`${label} thành công!`);
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || `${label} thất bại!`);
    } finally {
      setLoading(null);
    }
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
  const canCancel = !['DA_HOAN_THANH', 'DA_KET_THUC', 'DA_HUY'].includes(currentStatus);
  if (canCancel) {
    btns.push({ action: 'cancel', label: 'Hủy hoạt động', icon: XCircle, color: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' });
  }

  if (!btns.length) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <span className="text-xs text-gray-500 self-center">Chuyển trạng thái:</span>
      {btns.map((b) => (
        <button
          key={b.action}
          type="button"
          disabled={!!loading}
          onClick={() => doAction(b.action, b.label)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 border rounded-lg font-medium transition-colors disabled:opacity-50 ${b.color}`}
        >
          <b.icon className="w-3.5 h-3.5" />
          {loading === b.action ? 'Đang xử lý...' : b.label}
        </button>
      ))}
    </div>
  );
};

// ── Toggle switch (định nghĩa NGOÀI ActivityForm để tránh React remount mỗi render) ──
const Toggle = ({ name, checked, label, hint, onChange }) => (
  <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50 border border-gray-100">
    <div>
      <p className="text-sm font-medium text-gray-800">{label}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange({ target: { name, value: !checked, type: 'checkbox', checked: !checked } })}
      className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
        checked ? 'bg-primary' : 'bg-gray-300'
      }`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
        checked ? 'translate-x-[22px]' : 'translate-x-1'
      }`} />
    </button>
  </div>
);

// ── ActivityForm ───────────────────────────────────────────────────────────────
const ActivityForm = ({
  initialData = null,
  mode = 'create',
  onSuccess = () => {},
  onCancel = () => {},
  khoas = [],
}) => {
  const isEdit = mode === 'edit';
  const initialized = useRef(false);       // prevent re-init on re-render
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    maHoatDong: '',
    tenHoatDong: '',
    moTa: '',
    loaiHoatDong: 'KHAC',                  // valid backend default
    capDo: 'KHOA',
    ngayToChuc: '',
    ngayKetThuc: '',     // Ngày kết thúc — để trống = 1 ngày
    gioToChuc: '',
    thoiGianBatDau: '',                     // auto-populated from gioToChuc
    thoiGianKetThuc: '',
    thoiGianTreToiDa: 15,
    thoiGianToiThieu: 120,
    choPhepCheckInSom: 30,
    yeuCauCheckOut: false,
    cheDoDiemDanh: 'CHECKIN_CHECKOUT',
    diaDiem: '',
    viDo: null,
    kinhDo: null,
    khoangCachToiDa: null,
    soLuongToiDa: '',
    diemRenLuyen: '',
    maDanhMucRenLuyen: '',
    maTieuChiRenLuyen: '',
    diemToiDaTieuChi: null,
    maKhoa: '',
    hanDangKy: '',
    hinhAnhPoster: '',
    ghiChu: '',
    yeuCauDiemDanh: true,
    choPhepDangKy: true,
    trangThai: 'SAP_DIEN_RA',
    soHocKy: '',
    maNamHoc: '',
    tenNamHoc: '',
  });

  const [errors, setErrors] = useState({});

  // Lấy thông tin học kỳ / năm học hiện tại từ server
  const { data: academicInfo } = useQuery({
    queryKey: ['academic-info'],
    queryFn: () => activityService.getCurrentAcademicInfo(),
    staleTime: 5 * 60 * 1000,
  });

  // Khi load trang tạo mới, tự động điền học kỳ và năm học hiện tại
  useEffect(() => {
    if (!isEdit && academicInfo) {
      setFormData((prev) => ({
        ...prev,
        soHocKy: prev.soHocKy || academicInfo.soHocKy,
        maNamHoc: prev.maNamHoc || academicInfo.maNamHoc,
        tenNamHoc: prev.tenNamHoc || academicInfo.tenNamHoc,
      }));
    }
  }, [academicInfo, isEdit]);

  // INIT từ initialData — chỉ chạy MỘT LẦN khi data load xong
  // Dùng ref để tránh bug: user thay đổi field → re-render → effect chạy lại → reset về initialData
  useEffect(() => {
    if (initialData && !initialized.current) {
      initialized.current = true;
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        // Đảm bảo số nguyên nếu backend trả chuỗi
        thoiGianTreToiDa:  initialData.thoiGianTreToiDa  ?? prev.thoiGianTreToiDa,
        thoiGianToiThieu:  initialData.thoiGianToiThieu  ?? prev.thoiGianToiThieu,
        choPhepCheckInSom: initialData.choPhepCheckInSom ?? prev.choPhepCheckInSom,
        cheDoDiemDanh:     initialData.cheDoDiemDanh     ?? prev.cheDoDiemDanh,
      }));
    }
  }, [initialData]);

  // Khi người dùng thay đổi ngày tổ chức → cập nhật học kỳ và năm học tương ứng
  const handleNgayToChucChange = (e) => {
    const ngay = e.target.value; // YYYY-MM-DD
    setFormData((prev) => {
      const updated = { ...prev, ngayToChuc: ngay };
      if (ngay) {
        const [yearStr, monthStr, dayStr] = ngay.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        const day = parseInt(dayStr);
        
        let soHK;
        if (month >= 8 && month <= 11) soHK = 1;
        else if (month === 12 || month === 1 || month === 2 || (month === 3 && day < 15)) soHK = 2;
        else soHK = 3;
        
        const startYear = (month >= 8) ? year : year - 1;
        const endYear = startYear + 1;
        
        updated.soHocKy  = soHK;
        updated.maNamHoc = `NH${startYear}-${endYear}`;
        updated.tenNamHoc = `Năm học ${startYear}-${endYear}`;
      }
      return updated;
    });
  };

  // Khi thay đổi gioToChuc → tự điền thoiGianBatDau nếu chưa được set thủ công
  const handleGioToChucChange = (e) => {
    const gio = e.target.value;
    setFormData((prev) => ({
      ...prev,
      gioToChuc: gio,
      // Chỉ tự điền nếu thoiGianBatDau chưa có hoặc trùng với gioToChuc cũ
      thoiGianBatDau: (!prev.thoiGianBatDau || prev.thoiGianBatDau === prev.gioToChuc)
        ? gio
        : prev.thoiGianBatDau,
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
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const submitData = {
      ...formData,
      thoiGianTreToiDa:  formData.thoiGianTreToiDa  ? parseInt(formData.thoiGianTreToiDa)  : null,
      thoiGianToiThieu:  formData.thoiGianToiThieu  ? parseInt(formData.thoiGianToiThieu)  : null,
      choPhepCheckInSom: formData.choPhepCheckInSom ? parseInt(formData.choPhepCheckInSom) : 30,
      soLuongToiDa:      formData.soLuongToiDa      ? parseInt(formData.soLuongToiDa)      : null,
      khoangCachToiDa:   formData.khoangCachToiDa   ? parseInt(formData.khoangCachToiDa)   : null,
      diemRenLuyen: formData.diemRenLuyen !== '' && formData.diemRenLuyen !== null
        ? parseInt(formData.diemRenLuyen) : null,
      soHocKy: formData.soHocKy ? parseInt(formData.soHocKy) : null,
      maDanhMucRenLuyen: formData.maDanhMucRenLuyen || null,
      maTieuChiRenLuyen: formData.maTieuChiRenLuyen || null,
    };
    if (isEdit) updateMutation.mutate(submitData);
    else createMutation.mutate(submitData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;
    // Mã hoạt động: chỉ cho phép A-Z, 0-9, _, - ; tự động xóa ký tự không hợp lệ
    if (name === 'maHoatDong' && typeof finalValue === 'string') {
      finalValue = finalValue.toUpperCase().replace(/[^A-Z0-9_\-]/g, '');
    }
    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleRenLuyenChange = ({ maDanhMucRenLuyen, maTieuChiRenLuyen, diemRenLuyen, diemToiDaTieuChi }) => {
    setFormData((prev) => ({
      ...prev,
      maDanhMucRenLuyen: maDanhMucRenLuyen || '',
      maTieuChiRenLuyen: maTieuChiRenLuyen || '',
      diemRenLuyen: diemRenLuyen ?? '',
      diemToiDaTieuChi: diemToiDaTieuChi ?? null,
    }));
  };

  // Refresh after status action
  const handleStatusRefresh = () => {
    if (initialData?.maHoatDong) {
      queryClient.invalidateQueries({ queryKey: ['hoat-dong-detail', initialData.maHoatDong] });
      queryClient.invalidateQueries({ queryKey: ['hoat-dong'] });
    }
    onSuccess();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const namHocList = academicInfo?.danhSachNamHoc || [];

  // ── Section header component (inline) ────────────────────────────────────────
  const SectionHead = ({ icon: Icon, color, label }) => (
    <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <h3 className="font-semibold text-gray-900 text-sm">{label}</h3>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">

      {/* ── Card 1: Thông tin cơ bản ─────────────────────────────────── */}
      <Card>
        <div className="p-5">
          <SectionHead icon={FileText} color="bg-violet-100 text-violet-600" label="Thông tin cơ bản" />

          <div className="space-y-3">
            {/* Mã + Tên */}
            <div className={`grid gap-3 ${!isEdit ? 'grid-cols-3' : 'grid-cols-1'}`}>
              {!isEdit && (
                <div>
                  <Input
                    label="Mã hoạt động *"
                    name="maHoatDong"
                    value={formData.maHoatDong}
                    onChange={handleChange}
                    placeholder="HD2025_01"
                    error={errors.maHoatDong}
                  />
                  <p className="text-xs text-gray-400 mt-1">A–Z, 0–9, _ và - (tự xóa ký tự lạ)</p>
                </div>
              )}
              <div className={!isEdit ? 'col-span-2' : ''}>
                <Input
                  label="Tên hoạt động *"
                  name="tenHoatDong"
                  value={formData.tenHoatDong}
                  onChange={handleChange}
                  placeholder="VD: Hội thảo công nghệ 2025"
                  error={errors.tenHoatDong}
                />
              </div>
            </div>

            {/* Loại + Cấp độ */}
            <div className="grid grid-cols-2 gap-3">
              <Select label="Loại hoạt động" name="loaiHoatDong" value={formData.loaiHoatDong} onChange={handleChange}>
                {LOAI_HOAT_DONG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
              <Select label="Cấp độ" name="capDo" value={formData.capDo} onChange={handleChange}>
                {CAP_DO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>

            <Textarea
              label="Mô tả"
              name="moTa"
              value={formData.moTa || ''}
              onChange={handleChange}
              placeholder="Mô tả ngắn về hoạt động..."
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* ── Card 2: Thời gian & Địa điểm ────────────────────────────── */}
      <Card>
        <div className="p-5">
          <SectionHead icon={Calendar} color="bg-blue-100 text-blue-600" label="Thời gian & Địa điểm" />

          <div className="space-y-3">
            {/* Ngày bắt đầu + Ngày kết thúc (multi-day) + Giờ bắt đầu + Giờ kết thúc */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Ngày tổ chức (bắt đầu) */}
              <div>
                <label className="form-label">Ngày bắt đầu *</label>
                <div className="custom-date-input">
                  <input
                    type="date"
                    name="ngayToChuc"
                    value={formData.ngayToChuc || ''}
                    onChange={handleNgayToChucChange}
                    className={`form-input ${errors.ngayToChuc ? 'border-red-400' : ''}`}
                    placeholder=" "
                  />
                  <div className="custom-date-display text-sm">
                    {formData.ngayToChuc ? formatDate(formData.ngayToChuc) : <span className="text-gray-400">dd/mm/yyyy</span>}
                  </div>
                </div>
                {errors.ngayToChuc && <p className="form-error">{errors.ngayToChuc}</p>}
              </div>

              {/* Ngày kết thúc (tùy chọn — multi-day) */}
              <div>
                <label className="form-label flex items-center gap-1.5">
                  Ngày kết thúc
                  <span className="text-[10px] font-normal text-gray-400">(để trống nếu 1 ngày)</span>
                </label>
                <div className="custom-date-input">
                  <input
                    type="date"
                    name="ngayKetThuc"
                    value={formData.ngayKetThuc || ''}
                    min={formData.ngayToChuc || ''}
                    onChange={handleChange}
                    className={`form-input ${errors.ngayKetThuc ? 'border-red-400' : ''}`}
                    placeholder=" "
                  />
                  <div className="custom-date-display text-sm">
                    {formData.ngayKetThuc
                      ? <span className="text-blue-600 font-medium">{formatDate(formData.ngayKetThuc)}</span>
                      : <span className="text-gray-400">Không chọn</span>}
                  </div>
                </div>
                {errors.ngayKetThuc && <p className="form-error">{errors.ngayKetThuc}</p>}
                {/* Nút xoá ngày kết thúc */}
                {formData.ngayKetThuc && (
                  <button type="button"
                    onClick={() => setFormData(p => ({ ...p, ngayKetThuc: '' }))}
                    className="mt-1 text-[11px] text-red-500 hover:text-red-700 flex items-center gap-0.5">
                    <X className="w-3 h-3" /> Xoá ngày kết thúc
                  </button>
                )}
              </div>

              <Input label="Giờ bắt đầu" type="time" name="thoiGianBatDau" value={formData.thoiGianBatDau} onChange={handleChange} />
              <Input label="Giờ kết thúc" type="time" name="thoiGianKetThuc" value={formData.thoiGianKetThuc} onChange={handleChange} error={errors.thoiGianKetThuc} />
            </div>

            {/* Multi-day banner */}
            {formData.ngayKetThuc && formData.ngayToChuc && formData.ngayKetThuc > formData.ngayToChuc && (
              <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800">
                <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span>
                  Hoạt động <strong>nhiều ngày</strong>:{' '}
                  {formatDate(formData.ngayToChuc)} → {formatDate(formData.ngayKetThuc)}
                  {' '}({Math.round((new Date(formData.ngayKetThuc) - new Date(formData.ngayToChuc)) / 86400000) + 1} ngày)
                </span>
              </div>
            )}

            {/* Học kỳ auto-badge */}
            {(formData.soHocKy || formData.tenNamHoc) && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="text-xs text-blue-700 flex-1">
                  Xếp vào <strong>{formData.soHocKy ? `Học kỳ ${formData.soHocKy}` : ''}{formData.soHocKy && formData.tenNamHoc ? ' – ' : ''}{formData.tenNamHoc || ''}</strong>
                </span>
                <div className="flex items-center gap-1.5">
                  <select name="soHocKy" value={formData.soHocKy} onChange={handleChange}
                    className="text-xs border border-blue-200 rounded px-1.5 py-0.5 bg-white text-blue-700">
                    <option value="">HK?</option>
                    {HOC_KY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  {namHocList.length > 0 && (
                    <select name="maNamHoc" value={formData.maNamHoc} onChange={handleChange}
                      className="text-xs border border-blue-200 rounded px-1.5 py-0.5 bg-white text-blue-700">
                      <option value="">NH?</option>
                      {namHocList.map((nh) => <option key={nh.maNamHoc} value={nh.maNamHoc}>{nh.tenNamHoc}</option>)}
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* Địa điểm */}
            <LocationInput
              diaDiem={formData.diaDiem}
              viDo={formData.viDo}
              kinhDo={formData.kinhDo}
              onChange={({ diaDiem, viDo, kinhDo }) => setFormData((prev) => ({ ...prev, diaDiem, viDo, kinhDo }))}
            />

            {/* Bán kính + Số lượng */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input label="Bán kính điểm danh (m)" type="number" name="khoangCachToiDa"
                  value={formData.khoangCachToiDa ?? ''} onChange={handleChange} min="0" placeholder="Không giới hạn" />
                <p className="text-xs text-gray-400 mt-1">Cần toạ độ GPS</p>
              </div>
              <div>
                <Input label="Số lượng tối đa" type="number" name="soLuongToiDa"
                  value={formData.soLuongToiDa} onChange={handleChange} min="0" placeholder="Không giới hạn" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Card 3: Điểm danh ────────────────────────────────────────── */}
      <Card>
        <div className="p-5">
          <SectionHead icon={QrCode} color="bg-emerald-100 text-emerald-600" label="Cài đặt Điểm danh" />

          <div className="space-y-4">
            {/* Chế độ — 4 pill cards với icon */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Chế độ quét QR</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'CHECKIN_CHECKOUT', icon: ArrowLeftRight, label: 'Check-in & Check-out',
                    desc: 'Quét cả khi đến lẫn khi về',   color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-400' },
                  { value: 'CHECKIN_ONLY',     icon: LogIn,          label: 'Chỉ Check-in',
                    desc: 'Quét QR một lần khi đến',       color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-400' },
                  { value: 'CHECKOUT_ONLY',    icon: LogOut,         label: 'Chỉ Check-out',
                    desc: 'Tự check-in, quét QR khi về',   color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-400' },
                  { value: 'AUTO_FULL',        icon: Zap,            label: 'Tự động hoàn toàn',
                    desc: 'BCH xác nhận, không quét QR',   color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-400' },
                ].map(({ value, icon: Icon, label, desc, color, bg, border }) => {
                  const active = formData.cheDoDiemDanh === value;
                  return (
                    <label key={value}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        active ? `${border} ${bg}` : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input type="radio" name="cheDoDiemDanh" value={value}
                        checked={active} onChange={handleChange} className="sr-only" />
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? bg : 'bg-gray-100'}`}>
                        <Icon className={`w-4 h-4 ${active ? color : 'text-gray-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold leading-tight ${active ? 'text-gray-900' : 'text-gray-700'}`}>{label}</p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-tight">{desc}</p>
                      </div>
                      {active && (
                        <div className={`ml-auto w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${color.replace('text-', 'bg-').replace('600', '500')}`}>
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Timeline bar */}
            {(() => {
              const start   = formData.thoiGianBatDau;
              const end     = formData.thoiGianKetThuc;
              const ciSom   = Number(formData.choPhepCheckInSom) || 30;
              const coExtra = 30;
              const ciOpen  = start ? addMinutesToTime(start, -ciSom) : null;
              const coClose = end   ? addMinutesToTime(end, coExtra)   : null;
              const mode    = formData.cheDoDiemDanh;
              const showCI  = mode !== 'CHECKOUT_ONLY' && mode !== 'AUTO_FULL';
              const showCO  = mode === 'CHECKIN_CHECKOUT' || mode === 'CHECKOUT_ONLY';
              return (
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3.5">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Khung giờ hoạt động</p>
                  </div>
                  <div className="flex h-6 rounded-lg overflow-hidden text-[10px] font-bold text-white shadow-sm">
                    {showCI && ciOpen && (
                      <div className="flex items-center justify-center bg-indigo-400 px-1.5 min-w-[48px]" style={{ flex: ciSom }}>
                        {ciOpen}
                      </div>
                    )}
                    <div className={`flex items-center justify-center px-2 min-w-[80px] ${mode === 'AUTO_FULL' ? 'bg-purple-500' : 'bg-emerald-500'}`} style={{ flex: 100 }}>
                      {start && end ? `${start} → ${end}` : start ? `Từ ${start}` : 'Sự kiện'}
                    </div>
                    {showCO && end && (
                      <div className="flex items-center justify-center bg-orange-400 px-1.5 min-w-[48px]" style={{ flex: coExtra }}>
                        {coClose}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-[10px] text-gray-400">
                    {showCI  && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />Check-in sớm</span>}
                    <span className="flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full inline-block ${mode === 'AUTO_FULL' ? 'bg-purple-500' : 'bg-emerald-500'}`} />{mode === 'AUTO_FULL' ? 'Tự động' : 'Đang diễn ra'}</span>
                    {showCO  && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />Check-out (+{coExtra}p)</span>}
                    {(!start || !end) && <span className="text-amber-500 font-medium">⚠ Điền giờ bắt đầu &amp; kết thúc</span>}
                  </div>
                </div>
              );
            })()}

            {/* Tham số thời gian */}
            <div className="grid grid-cols-3 gap-3">
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

            {/* Toggle yêu cầu check-out */}
            {formData.cheDoDiemDanh === 'CHECKIN_CHECKOUT' && (
              <Toggle
                name="yeuCauCheckOut"
                checked={formData.yeuCauCheckOut}
                label="Bắt buộc check-out"
                hint="Sinh viên phải quét QR khi về mới tính hoàn thành"
                onChange={handleChange}
              />
            )}
          </div>
        </div>
      </Card>

      {/* ── Card 4: Đăng ký & Cài đặt ───────────────────────────────── */}
      <Card>
        <div className="p-5">
          <SectionHead icon={Settings2} color="bg-amber-100 text-amber-600" label="Đăng ký & Cài đặt" />

          <div className="space-y-3">
            {/* Hạn đăng ký + Trạng thái */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Hạn đăng ký</label>
                <div className="custom-date-input">
                  <input type="datetime-local" name="hanDangKy"
                    value={formData.hanDangKy || ''} onChange={handleChange}
                    className="form-input" placeholder=" " />
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
                  <StatusActions
                    maHoatDong={initialData?.maHoatDong}
                    currentStatus={formData.trangThai}
                    onRefresh={handleStatusRefresh}
                  />
                </div>
              ) : (
                <Select label="Trạng thái ban đầu" name="trangThai" value={formData.trangThai} onChange={handleChange}>
                  {TRANG_THAI_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              )}
            </div>

            {/* Toggle cho phép đăng ký */}
            <Toggle
              name="choPhepDangKy"
              checked={formData.choPhepDangKy}
              label="Cho phép sinh viên đăng ký"
              hint="Tắt để tạm ngưng nhận đăng ký mới"
              onChange={handleChange}
            />

            {/* Điểm rèn luyện */}
            <div className="pt-1">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Điểm rèn luyện</p>
              </div>
              <RenLuyenSelector
                maDanhMuc={formData.maDanhMucRenLuyen}
                maTieuChi={formData.maTieuChiRenLuyen}
                diemRenLuyen={formData.diemRenLuyen}
                onChange={handleRenLuyenChange}
              />
            </div>

            {/* Ghi chú */}
            <div className="pt-1">
              <Textarea
                label="Ghi chú nội bộ"
                name="ghiChu"
                value={formData.ghiChu || ''}
                onChange={handleChange}
                placeholder="Ghi chú cho BCH, không hiển thị cho sinh viên..."
                rows={2}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-gray-400">
          {isEdit ? `Đang chỉnh sửa: ${initialData?.maHoatDong}` : 'Điền đầy đủ thông tin bắt buộc (*)'}
        </p>
        <div className="flex gap-2.5">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            Hủy
          </Button>
          <Button type="submit" isLoading={isLoading} icon={isEdit ? RotateCcw : undefined}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo hoạt động'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ActivityForm;
