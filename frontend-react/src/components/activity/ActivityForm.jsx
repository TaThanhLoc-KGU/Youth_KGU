import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { MapPin, Loader2, X, Info, CheckCircle2, PlayCircle, XCircle, Lock } from 'lucide-react';
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
    btns.push({ action: 'complete', label: 'Hoàn thành', icon: CheckCircle2, color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' });
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
    if (!formData.ngayToChuc) errs.ngayToChuc = 'Vui lòng chọn ngày tổ chức';
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
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isEdit ? 'Chỉnh sửa hoạt động' : 'Tạo hoạt động mới'}
        </h2>
        <p className="text-gray-600 text-sm">
          {isEdit ? 'Cập nhật thông tin hoạt động' : 'Nhập thông tin hoạt động'}
        </p>
      </div>

      {/* Basic Information */}
      <Card>
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-900">Thông tin cơ bản</h3>

          <div className="grid grid-cols-2 gap-4">
            {!isEdit && (
              <Input
                label="Mã hoạt động *"
                name="maHoatDong"
                value={formData.maHoatDong}
                onChange={handleChange}
                placeholder="VD: HD001"
                error={errors.maHoatDong}
              />
            )}
            <Input
              label="Tên hoạt động *"
              name="tenHoatDong"
              value={formData.tenHoatDong}
              onChange={handleChange}
              placeholder="VD: Hội thảo công nghệ"
              error={errors.tenHoatDong}
              className={!isEdit ? '' : 'col-span-2'}
            />
          </div>

          <Textarea
            label="Mô tả"
            name="moTa"
            value={formData.moTa || ''}
            onChange={handleChange}
            placeholder="Mô tả chi tiết về hoạt động..."
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Loại hoạt động *"
              name="loaiHoatDong"
              value={formData.loaiHoatDong}
              onChange={handleChange}
            >
              {LOAI_HOAT_DONG_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <Select
              label="Cấp độ *"
              name="capDo"
              value={formData.capDo}
              onChange={handleChange}
            >
              {CAP_DO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Date & Time */}
      <Card>
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-900">Thời gian &amp; Địa điểm</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="form-label">Ngày tổ chức *</label>
              <div className="custom-date-input">
                <input
                  type="date"
                  name="ngayToChuc"
                  value={formData.ngayToChuc || ""}
                  onChange={handleNgayToChucChange}
                  className={`form-input ${errors.ngayToChuc ? 'border-red-500' : ''}`}
                  placeholder=" " 
                />
                <div className="custom-date-display">
                  {formData.ngayToChuc ? formatDate(formData.ngayToChuc) : <span className="text-gray-400">dd/mm/yyyy</span>}
                </div>
              </div>
              {errors.ngayToChuc && <p className="form-error">{errors.ngayToChuc}</p>}
            </div>
            <div>
              <Input
                label="Giờ khai mạc"
                type="time"
                name="gioToChuc"
                value={formData.gioToChuc}
                onChange={handleGioToChucChange}
              />
              <p className="text-xs text-gray-400 mt-1">
                Giờ chương trình chính thức bắt đầu
              </p>
            </div>
          </div>

          <LocationInput
            diaDiem={formData.diaDiem}
            viDo={formData.viDo}
            kinhDo={formData.kinhDo}
            onChange={({ diaDiem, viDo, kinhDo }) =>
              setFormData((prev) => ({ ...prev, diaDiem, viDo, kinhDo }))
            }
          />

          {/* Distance geofence */}
          <div>
            <Input
              label="Bán kính điểm danh (mét)"
              type="number"
              name="khoangCachToiDa"
              value={formData.khoangCachToiDa ?? ''}
              onChange={handleChange}
              min="0"
              placeholder="Bỏ trống = không giới hạn khoảng cách"
            />
            <p className="text-xs text-gray-400 mt-1">
              Nếu nhập, sinh viên chỉ được điểm danh khi đang ở trong bán kính này (yêu cầu toạ độ địa điểm).
            </p>
          </div>
        </div>
      </Card>

      {/* Học kỳ & Năm học */}
      <Card>
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-900">Học kỳ &amp; Năm học</h3>
          <p className="text-sm text-gray-500">Tự động tính theo ngày tổ chức. Bạn có thể điều chỉnh nếu cần.</p>

          <div className="grid grid-cols-2 gap-4">
            <Select label="Học kỳ" name="soHocKy" value={formData.soHocKy} onChange={handleChange}>
              <option value="">-- Chọn học kỳ --</option>
              {HOC_KY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>

            {namHocList.length > 0 ? (
              <Select label="Năm học" name="maNamHoc" value={formData.maNamHoc} onChange={handleChange}>
                <option value="">-- Chọn năm học --</option>
                {namHocList.map((nh) => (
                  <option key={nh.maNamHoc} value={nh.maNamHoc}>{nh.tenNamHoc}</option>
                ))}
              </Select>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Năm học</label>
                <div className="flex items-center h-10 px-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm">
                  {formData.tenNamHoc || <span className="text-gray-400">Chưa xác định</span>}
                </div>
                <p className="text-xs text-gray-400 mt-1">Tự động tính từ ngày tổ chức</p>
              </div>
            )}
          </div>

          {(formData.soHocKy || formData.tenNamHoc) && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="text-sm text-blue-700">
                Hoạt động thuộc{' '}
                <strong>
                  {formData.soHocKy ? `Học kỳ ${formData.soHocKy}` : ''}
                  {formData.soHocKy && formData.tenNamHoc ? ' – ' : ''}
                  {formData.tenNamHoc || ''}
                </strong>
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Check-in Settings */}
      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">Cài đặt Điểm danh</h3>
            <p className="text-sm text-gray-500 mt-1">
              Xác định chế độ và khung giờ hợp lệ để sinh viên check-in và check-out.
            </p>
          </div>

          {/* Chế độ điểm danh */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chế độ điểm danh</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'CHECKIN_CHECKOUT', label: '↔️ Check-in & Check-out', desc: 'Yêu cầu cả check-in lẫn check-out' },
                { value: 'CHECKIN_ONLY',     label: '→ Chỉ Check-in',          desc: 'Chỉ cần quét QR khi đến' },
                { value: 'CHECKOUT_ONLY',    label: '← Chỉ Check-out',         desc: 'Check-in tự động, chỉ quét QR khi ra về' },
                { value: 'AUTO_FULL',        label: '⚡ Tự động toàn bộ',      desc: 'BCH xác nhận, toàn bộ đăng ký = tham gia' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    formData.cheDoDiemDanh === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="cheDoDiemDanh"
                    value={opt.value}
                    checked={formData.cheDoDiemDanh === opt.value}
                    onChange={handleChange}
                    className="mt-0.5 w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            {formData.cheDoDiemDanh === 'AUTO_FULL' && (
              <p className="mt-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                ⚡ Sau khi kết thúc, BCH nhấn &quot;Xác nhận tham gia&quot; để ghi nhận toàn bộ SV đăng ký. Không cần quét QR.
              </p>
            )}
            {formData.cheDoDiemDanh === 'CHECKOUT_ONLY' && (
              <p className="mt-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                ← Check-in tự động theo giờ bắt đầu. Sinh viên chỉ cần quét QR khi ra về.
              </p>
            )}
          </div>

          {/* Timeline hint */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
            <p className="font-bold mb-1 underline">Mốc thời gian thực tế dựa trên cài đặt của bạn:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              <p>
                <span className="font-semibold">Mở Check-in:</span> {formData.thoiGianBatDau ? addMinutesToTime(formData.thoiGianBatDau, -(formData.choPhepCheckInSom || 30)) : '—'}
              </p>
              <p>
                <span className="font-semibold">Đóng Check-in:</span> {formData.thoiGianBatDau ? addMinutesToTime(formData.thoiGianBatDau, (formData.thoiGianTreToiDa || 15)) : '—'}
              </p>
              <p>
                <span className="font-semibold">Mở Check-out:</span> {formData.thoiGianKetThuc || '—'}
              </p>
              <p>
                <span className="font-semibold">Đóng Check-out:</span> {formData.thoiGianKetThuc ? addMinutesToTime(formData.thoiGianKetThuc, 30) : '—'}
              </p>
            </div>
            <p className="mt-2 italic text-[10px] text-amber-600">
              * Hệ thống sẽ tự động từ chối quét QR ngoài các khung giờ nêu trên.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Giờ bắt đầu hoạt động *"
                type="time"
                name="thoiGianBatDau"
                value={formData.thoiGianBatDau}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-400 mt-1">
                Cổng check-in mở từ <strong>[giờ này − {formData.choPhepCheckInSom || 30} phút]</strong>
              </p>
            </div>
            <div>
              <Input
                label="Giờ kết thúc hoạt động *"
                type="time"
                name="thoiGianKetThuc"
                value={formData.thoiGianKetThuc}
                onChange={handleChange}
                error={errors.thoiGianKetThuc}
              />
              <p className="text-xs text-gray-400 mt-1">
                Cổng check-out mở từ giờ này, đóng sau 30 phút
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Cho phép check-in sớm (phút)"
                type="number"
                name="choPhepCheckInSom"
                value={formData.choPhepCheckInSom}
                onChange={handleChange}
                min="0"
              />
              <p className="text-xs text-gray-400 mt-1">
                Mặc định: 30 phút trước giờ bắt đầu
              </p>
            </div>
            <div>
              <Input
                label="Thời gian trễ tối đa (phút)"
                type="number"
                name="thoiGianTreToiDa"
                value={formData.thoiGianTreToiDa}
                onChange={handleChange}
                min="0"
              />
              <p className="text-xs text-gray-400 mt-1">
                Muộn quá mức này = không tính điểm danh
              </p>
            </div>
          </div>

          <div>
            <Input
              label="Thời gian tham gia tối thiểu (phút)"
              type="number"
              name="thoiGianToiThieu"
              value={formData.thoiGianToiThieu}
              onChange={handleChange}
              min="0"
            />
            <p className="text-xs text-gray-400 mt-1">
              Yêu cầu check-out: sinh viên phải tham gia ít nhất ngần này phút mới được tính hoàn thành
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="yeuCauCheckOut"
              name="yeuCauCheckOut"
              checked={formData.yeuCauCheckOut}
              onChange={handleChange}
              className="w-4 h-4 text-primary rounded border-gray-300"
            />
            <label htmlFor="yeuCauCheckOut" className="text-sm text-gray-700">
              Yêu cầu check-out (bắt buộc sinh viên phải quét QR khi về mới tính hoàn thành)
            </label>
          </div>
        </div>
      </Card>

      {/* Capacity */}
      <Card>
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-900">Quy mô</h3>
          <Input
            label="Số lượng tối đa"
            type="number"
            name="soLuongToiDa"
            value={formData.soLuongToiDa}
            onChange={handleChange}
            min="0"
            className="max-w-xs"
          />
        </div>
      </Card>

      {/* Điểm rèn luyện */}
      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">Điểm rèn luyện</h3>
            <p className="text-sm text-gray-500 mt-1">
              Chọn tiêu chí phù hợp theo quy chế đánh giá rèn luyện sinh viên của trường.
            </p>
          </div>
          <RenLuyenSelector
            maDanhMuc={formData.maDanhMucRenLuyen}
            maTieuChi={formData.maTieuChiRenLuyen}
            diemRenLuyen={formData.diemRenLuyen}
            onChange={handleRenLuyenChange}
          />
        </div>
      </Card>

      {/* Registration & Status */}
      <Card>
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-900">Đăng ký &amp; Trạng thái</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="form-label">Hạn đăng ký</label>
              <div className="custom-date-input">
                <input
                  type="datetime-local"
                  name="hanDangKy"
                  value={formData.hanDangKy || ""}
                  onChange={handleChange}
                  className="form-input"
                  placeholder=" "
                />
                <div className="custom-date-display">
                  {formData.hanDangKy ? formatDateTime(formData.hanDangKy) : <span className="text-gray-400">dd/mm/yyyy HH:mm</span>}
                </div>
              </div>
            </div>

            {/* Trạng thái: dropdown khi tạo mới, badge + action buttons khi edit */}
            {isEdit ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Trạng thái hiện tại
                </label>
                <StatusBadge status={formData.trangThai} />
                <StatusActions
                  maHoatDong={initialData?.maHoatDong}
                  currentStatus={formData.trangThai}
                  onRefresh={handleStatusRefresh}
                />
              </div>
            ) : (
              <Select
                label="Trạng thái ban đầu"
                name="trangThai"
                value={formData.trangThai}
                onChange={handleChange}
              >
                {TRANG_THAI_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            )}
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="choPhepDangKy"
                checked={formData.choPhepDangKy}
                onChange={handleChange}
                className="w-4 h-4 text-primary rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Cho phép đăng ký</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="yeuCauDiemDanh"
                checked={formData.yeuCauDiemDanh}
                onChange={handleChange}
                className="w-4 h-4 text-primary rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Yêu cầu điểm danh</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Ghi chú & Poster */}
      <Card>
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-900">Thông tin thêm</h3>
          <Textarea
            label="Ghi chú"
            name="ghiChu"
            value={formData.ghiChu || ''}
            onChange={handleChange}
            placeholder="Ghi chú nội bộ..."
            rows={2}
          />
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Hủy
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? 'Cập nhật' : 'Tạo hoạt động'}
        </Button>
      </div>
    </form>
  );
};

export default ActivityForm;
