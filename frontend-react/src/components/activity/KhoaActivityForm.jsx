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
import RenLuyenSelector from './RenLuyenSelector';
import activityService from '../../services/activityService';
import usePublicSettings from '../../hooks/usePublicSettings';
import { formatDate, formatDateTime } from '../../utils/dateFormat';
import {
  LOAI_HOAT_DONG_OPTIONS,
  TRANG_THAI_HOAT_DONG,
  HOC_KY_OPTIONS,
} from '../../constants/activityConstants';

// ── Leaflet loader ───────────────────────────────────────────────────────────
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

// ── Attendance mode options ───────────────────────────────────────────────────
const QR_MODES = [
  { value: 'CHECKIN_CHECKOUT', icon: ArrowLeftRight, label: 'Check-in & Check-out', desc: 'Quét cả khi đến lẫn khi về',     color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-400'   },
  { value: 'CHECKIN_ONLY',     icon: LogIn,          label: 'Chỉ Check-in',          desc: 'Quét QR một lần khi đến',       color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-400'  },
  { value: 'CHECKOUT_ONLY',    icon: LogOut,         label: 'Chỉ Check-out',          desc: 'Tự check-in, quét QR khi về',  color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-400' },
  { value: 'AUTO_FULL',        icon: Zap,            label: 'Tự động hoàn toàn',      desc: 'BCH xác nhận, không quét QR',  color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-400' },
];

const Toggle = ({ name, checked, label, hint, onToggle }) => (
  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 border border-gray-100">
    <div className="flex-1 pr-4">
      <p className="text-sm font-medium text-gray-800">{label}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
    <button type="button" role="switch" aria-checked={checked}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(name, !checked); }}
      className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  </div>
);

// ── Map Picker Modal ─────────────────────────────────────────────────────────
const MapPickerModal = ({ initialLat, initialLng, onConfirm, onClose }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [coords, setCoords] = useState(initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null);
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
        attribution: '© OpenStreetMap',
      }).addTo(map);
      mapRef.current = map;
      if (initialLat && initialLng) markerRef.current = L.marker([initialLat, initialLng]).addTo(map);
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
  }, []);

  const handleSearch = () => {
    if (!searchQ.trim() || !mapRef.current) return;
    setSearching(true);
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQ)}&format=json&limit=1&countrycodes=vn`)
      .then(r => r.json())
      .then(data => {
        if (!data.length || !mapRef.current) return;
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        mapRef.current.setView([lat, lng], 17);
        if (markerRef.current) markerRef.current.remove();
        markerRef.current = window.L.marker([lat, lng]).addTo(mapRef.current);
        setCoords({ lat, lng });
      })
      .finally(() => setSearching(false));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ height: 500 }}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-500" /> Chọn vị trí (Đoàn Khoa)
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex gap-2 px-4 py-2 border-b">
          <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Tìm địa chỉ..." className="flex-1 px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500" />
          <button type="button" onClick={handleSearch} disabled={searching}
            className="px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tìm'}
          </button>
        </div>
        <div ref={containerRef} className="flex-1 min-h-0" />
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 rounded-b-xl">
          <p className="text-xs text-gray-500">{coords ? `GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Vui lòng chọn vị trí'}</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm border rounded-lg bg-white">Hủy</button>
            <button type="button" disabled={!coords} onClick={() => onConfirm(coords.lat, coords.lng)}
              className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700">Xác nhận</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── KhoaActivityForm Component ───────────────────────────────────────────────
const KhoaActivityForm = ({ initialData = null, mode = 'create', onSuccess, onCancel }) => {
  const isEdit = mode === 'edit';
  const queryClient = useQueryClient();
  const initialized = useRef(false);

  // Feature-flag ảnh hưởng luồng tạo hoạt động cấp khoa (xem trang "Cài đặt hệ thống")
  const { isOn } = usePublicSettings();
  const canDuyet    = isOn('hoatdong.duyet_doan_khoa_bat_buoc'); // true = phải chờ duyệt
  const khoaTuCongKhai = isOn('hoatdong.khoa_tu_cong_khai');

  const [formData, setFormData] = useState({
    maHoatDong: '',
    tenHoatDong: '',
    moTa: '',
    loaiHoatDong: 'KHAC',
    capDo: 'KHOA', // Cố định cấp Khoa
    ngayToChuc: '',
    ngayKetThuc: '',
    gioToChuc: '',
    thoiGianBatDau: '',
    thoiGianKetThuc: '',
    thoiGianTreToiDa: 15,
    thoiGianToiThieu: 60,
    choPhepCheckInSom: 30,
    yeuCauCheckOut: false,
    cheDoDiemDanh: 'CHECKIN_CHECKOUT',
    diaDiem: '',
    viDo: null,
    kinhDo: null,
    khoangCachToiDa: 100,
    soLuongToiDa: '',
    diemRenLuyen: '',
    maDanhMucRenLuyen: '',
    maTieuChiRenLuyen: '',
    trangThai: 'CHO_DUYET',
    choPhepDangKy: true,
    isKhongDangKy: false,
    soHocKy: '',
    maNamHoc: '',
  });

  const [showMap, setShowMap] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (initialData && !initialized.current) {
      initialized.current = true;
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const { data: academicInfo } = useQuery({
    queryKey: ['academic-info'],
    queryFn: () => activityService.getCurrentAcademicInfo(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isEdit && academicInfo) {
      setFormData(prev => ({
        ...prev,
        soHocKy: prev.soHocKy || academicInfo.soHocKy,
        maNamHoc: prev.maNamHoc || academicInfo.maNamHoc,
      }));
    }
  }, [academicInfo, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleToggle = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));

  const createMutation = useMutation({
    mutationFn: (data) => activityService.create(data),
    onSuccess: () => {
      if (canDuyet) toast.success('Đã gửi hoạt động chờ duyệt!');
      else if (khoaTuCongKhai) toast.success('Đã tạo & công khai hoạt động!');
      else toast.success('Đã tạo hoạt động (chưa công khai).');
      onSuccess();
    },
    onError: (err) => { toast.error(err.response?.data?.message || 'Lỗi khi tạo hoạt động!'); },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => activityService.update(initialData.maHoatDong, data),
    onSuccess: () => { toast.success('Cập nhật thành công!'); onSuccess(); },
    onError: (err) => { toast.error(err.response?.data?.message || 'Cập nhật thất bại!'); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.tenHoatDong || !formData.ngayToChuc) {
      toast.error('Vui lòng điền các thông tin bắt buộc');
      return;
    }
    if (isEdit) {
      // Không cho khoa tự đổi trạng thái / cấp độ khi sửa — backend cũng chặn, nhưng không gửi cho gọn
      const { trangThai, capDo, ...rest } = formData;
      updateMutation.mutate(rest);
    } else {
      createMutation.mutate({ ...formData, capDo: 'KHOA' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Banner Đoàn Khoa */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
        <Info className="w-5 h-5 text-amber-500 flex-shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-bold">Portal Quản lý Đoàn Khoa</p>
          <p>
            Hoạt động tạo mới tự động gán cấp <strong>Khoa</strong>.{' '}
            {canDuyet
              ? 'Hoạt động sẽ ở trạng thái chờ duyệt trước khi hiển thị cho sinh viên.'
              : khoaTuCongKhai
                ? 'Hoạt động sẽ ở trạng thái Sắp diễn ra và được công khai ngay.'
                : 'Hoạt động sẽ ở trạng thái Sắp diễn ra, cần bấm Công khai sau để hiển thị.'}
          </p>
        </div>
      </div>

      <Card title="Thông tin cơ bản" icon={FileText}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Tên hoạt động" name="tenHoatDong" value={formData.tenHoatDong} onChange={handleChange} placeholder="VD: Hội thảo hướng nghiệp khoa CNTT" required />
          </div>
          <Select label="Loại hoạt động" name="loaiHoatDong" value={formData.loaiHoatDong} onChange={handleChange}>
            {LOAI_HOAT_DONG_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </Select>
          <div className="flex items-end">
            <div className="w-full p-2.5 bg-gray-50 border rounded-lg text-sm text-gray-500 flex items-center gap-2">
              <Lock className="w-4 h-4" /> Cấp độ: Khoa (Tự động)
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Textarea label="Mô tả chi tiết" name="moTa" value={formData.moTa} onChange={handleChange} rows={3} />
        </div>
      </Card>

      <Card title="Thời gian & Vị trí" icon={Calendar}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Ngày tổ chức" type="date" name="ngayToChuc" value={formData.ngayToChuc} onChange={handleChange} required />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Giờ bắt đầu" type="time" name="thoiGianBatDau" value={formData.thoiGianBatDau} onChange={handleChange} />
            <Input label="Giờ kết thúc" type="time" name="thoiGianKetThuc" value={formData.thoiGianKetThuc} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Địa điểm tổ chức</label>
            <div className="flex gap-2">
              <input type="text" value={formData.diaDiem} onChange={e => setFormData(p => ({...p, diaDiem: e.target.value}))}
                placeholder="Hội trường, phòng học..." className="flex-1 px-3 py-2 border rounded-lg text-sm" />
              <button type="button" onClick={() => setShowMap(true)} className="px-3 py-2 border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-50 flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" /> {formData.viDo ? 'Đã ghim' : 'Ghim bản đồ'}
              </button>
            </div>
          </div>
          <Input label="Số lượng tối đa" type="number" name="soLuongToiDa" value={formData.soLuongToiDa} onChange={handleChange} />
        </div>
      </Card>

      <Card title="Cấu hình điểm danh" icon={QrCode}>
        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Chế độ quét QR</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          {QR_MODES.map(({ value, icon: Icon, label, desc, color, bg, border }) => {
            const active = formData.cheDoDiemDanh === value;
            return (
              <label key={value}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                  active ? `${border} ${bg}` : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input type="radio" name="cheDoDiemDanh" value={value} checked={active} onChange={handleChange} className="sr-only" />
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? bg : 'bg-gray-100'}`}>
                  <Icon className={`w-4 h-4 ${active ? color : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${active ? color : 'text-gray-700'}`}>{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </label>
            );
          })}
        </div>

        {(formData.cheDoDiemDanh === 'CHECKIN_CHECKOUT') && (
          <div className="mb-3">
            <Toggle name="yeuCauCheckOut" checked={!!formData.yeuCauCheckOut}
              label="Bắt buộc check-out"
              hint="Sinh viên phải quét QR khi về mới tính hoàn thành"
              onToggle={handleToggle}
            />
          </div>
        )}

        <button type="button" onClick={() => setShowAdvanced(v => !v)}
          className="text-sm text-amber-700 font-medium hover:text-amber-800 flex items-center gap-1">
          <Settings2 className="w-3.5 h-3.5" />
          {showAdvanced ? 'Ẩn tuỳ chọn nâng cao' : 'Tuỳ chọn nâng cao (đã có sẵn giá trị mặc định hợp lý)'}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
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
                <p className="text-xs text-gray-400 mt-1">Thời gian tham dự tối thiểu</p>
              </div>
            )}
            <div className="md:col-span-3">
              <Input label="Bán kính điểm danh (m)" type="number" name="khoangCachToiDa"
                value={formData.khoangCachToiDa ?? ''} onChange={handleChange} min="0" placeholder="Không giới hạn" />
              <p className="text-xs text-gray-400 mt-1">Cần ghim toạ độ GPS để dùng tính năng này</p>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-2">
        <Toggle name="isKhongDangKy" checked={!!formData.isKhongDangKy}
          label="Hoạt động không đăng ký (kêu gọi offline)"
          hint="Danh sách tham gia sẽ nhập thủ công hoặc import Excel sau khi tạo hoạt động"
          onToggle={handleToggle} />
      </div>

      <Card title="Điểm rèn luyện" icon={Users}>
        <RenLuyenSelector
          maDanhMuc={formData.maDanhMucRenLuyen}
          maTieuChi={formData.maTieuChiRenLuyen}
          diemRenLuyen={formData.diemRenLuyen}
          onChange={({ maDanhMucRenLuyen, maTieuChiRenLuyen, diemRenLuyen }) => setFormData(p => ({ ...p, maDanhMucRenLuyen, maTieuChiRenLuyen, diemRenLuyen }))}
        />
      </Card>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>Hủy</Button>
        <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending} className="bg-amber-600 hover:bg-amber-700">
          {isEdit ? 'Lưu thay đổi' : 'Tạo hoạt động'}
        </Button>
      </div>

      {showMap && (
        <MapPickerModal
          initialLat={formData.viDo} initialLng={formData.kinhDo}
          onConfirm={(lat, lng) => { setFormData(p => ({...p, viDo: lat, kinhDo: lng})); setShowMap(false); }}
          onClose={() => setShowMap(false)}
        />
      )}
    </form>
  );
};

export default KhoaActivityForm;
