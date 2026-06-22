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
import { formatDate, formatDateTime, addMinutesToTime } from '../../utils/dateFormat';
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

// ── Map Picker Component ─────────────────────────────────────────────────────
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
        const L = window.L;
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        mapRef.current.setView([lat, lng], 17);
        if (markerRef.current) markerRef.current.remove();
        markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
        setCoords({ lat, lng });
      })
      .finally(() => setSearching(false));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ height: 500 }}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-500" /> Chọn vị trí tổ chức
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex gap-2 px-4 py-2 border-b">
          <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Tìm tên đường, địa danh..." className="flex-1 px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-orange-500" />
          <button type="button" onClick={handleSearch} disabled={searching}
            className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tìm'}
          </button>
        </div>
        <div ref={containerRef} className="flex-1 min-h-0" />
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 rounded-b-xl">
          <p className="text-xs text-gray-500">{coords ? `Đã chọn: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Click vào bản đồ để chọn'}</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm border rounded-lg bg-white">Hủy</button>
            <button type="button" disabled={!coords} onClick={() => onConfirm(coords.lat, coords.lng)}
              className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">Xác nhận</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── ClbActivityForm Component ────────────────────────────────────────────────
const ClbActivityForm = ({ initialData = null, mode = 'create', onSuccess, onCancel }) => {
  const isEdit = mode === 'edit';
  const queryClient = useQueryClient();
  const initialized = useRef(false);

  const [formData, setFormData] = useState({
    maHoatDong: '',
    tenHoatDong: '',
    moTa: '',
    loaiHoatDong: 'KHAC',
    capDo: 'BAN_DOI_CLB', // Cố định cấp CLB
    ngayToChuc: '',
    ngayKetThuc: '',
    gioToChuc: '',
    thoiGianBatDau: '',
    thoiGianKetThuc: '',
    thoiGianTreToiDa: 15,
    thoiGianToiThieu: 60,
    choPhepCheckInSom: 30,
    yeuCauCheckOut: false,
    cheDoDiemDanh: 'CHECKIN_ONLY',
    diaDiem: '',
    viDo: null,
    kinhDo: null,
    khoangCachToiDa: 100,
    soLuongToiDa: '',
    diemRenLuyen: '',
    maDanhMucRenLuyen: '',
    maTieuChiRenLuyen: '',
    trangThai: 'CHO_DUYET', // Luôn bắt đầu bằng Chờ phê duyệt
    choPhepDangKy: true,
    soHocKy: '',
    maNamHoc: '',
  });

  const [errors, setErrors] = useState({});
  const [showMap, setShowMap] = useState(false);

  // Sync data khi edit
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
    let finalValue = type === 'checkbox' ? checked : value;
    if (name === 'maHoatDong') finalValue = finalValue.toUpperCase().replace(/[^A-Z0-9_\-]/g, '');
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleNgayToChucChange = (e) => {
    const ngay = e.target.value;
    setFormData(prev => {
      const updated = { ...prev, ngayToChuc: ngay };
      if (ngay) {
        const date = new Date(ngay);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        updated.soHocKy = (month >= 8 && month <= 11) ? 1 : (month <= 5 ? 2 : 3);
        const startYear = (month >= 8) ? year : year - 1;
        updated.maNamHoc = `NH${startYear}-${startYear + 1}`;
      }
      return updated;
    });
  };

  const createMutation = useMutation({
    mutationFn: (data) => activityService.create(data),
    onSuccess: () => { toast.success('Đã gửi yêu cầu phê duyệt hoạt động!'); onSuccess(); },
    onError: (err) => { toast.error(err.response?.data?.message || 'Lỗi khi tạo hoạt động!'); },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => activityService.update(initialData.maHoatDong, data),
    onSuccess: () => { toast.success('Cập nhật thành công!'); onSuccess(); },
    onError: (err) => { toast.error(err.response?.data?.message || 'Cập nhật thất bại!'); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validation sơ bộ
    if (!formData.tenHoatDong) { toast.error('Vui lòng nhập tên hoạt động'); return; }
    if (!formData.ngayToChuc) { toast.error('Vui lòng chọn ngày tổ chức'); return; }

    const submitData = {
      ...formData,
      capDo: 'BAN_DOI_CLB',
      trangThai: isEdit ? formData.trangThai : 'CHO_DUYET',
    };
    if (isEdit) updateMutation.mutate(submitData);
    else createMutation.mutate(submitData);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Alert quy trình */}
      {!isEdit && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex gap-3">
          <Info className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <div className="text-sm text-orange-800">
            <p className="font-bold">Quy trình đăng ký hoạt động CLB</p>
            <p>Hoạt động sẽ được gửi ở trạng thái <strong>Chờ phê duyệt</strong>. Sau khi Đoàn trường/Hội SV duyệt, hoạt động mới hiển thị công khai.</p>
          </div>
        </div>
      )}

      {/* Thông tin chính */}
      <Card title="1. Thông tin cơ bản" icon={FileText}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isEdit && (
            <Input label="Mã hoạt động" name="maHoatDong" value={formData.maHoatDong} onChange={handleChange} placeholder="VD: CLB_GUITAR_01" required />
          )}
          <div className={isEdit ? 'col-span-2' : ''}>
            <Input label="Tên hoạt động" name="tenHoatDong" value={formData.tenHoatDong} onChange={handleChange} placeholder="VD: Giao lưu âm nhạc cuối tuần" required />
          </div>
          <Select label="Loại hoạt động" name="loaiHoatDong" value={formData.loaiHoatDong} onChange={handleChange}>
            {LOAI_HOAT_DONG_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </Select>
          <div className="flex items-end">
             <div className="w-full p-2.5 bg-gray-50 border rounded-lg text-sm text-gray-500 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Cấp độ: Ban - Đội - CLB (Tự động)
             </div>
          </div>
        </div>
        <div className="mt-4">
          <Textarea label="Mô tả hoạt động" name="moTa" value={formData.moTa} onChange={handleChange} rows={3} />
        </div>
      </Card>

      {/* Thời gian & Địa điểm */}
      <Card title="2. Thời gian & Địa điểm" icon={Calendar}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Ngày tổ chức" type="date" name="ngayToChuc" value={formData.ngayToChuc} onChange={handleNgayToChucChange} required />
          <Input label="Giờ bắt đầu" type="time" name="thoiGianBatDau" value={formData.thoiGianBatDau} onChange={handleChange} />
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Vị trí tổ chức</label>
            <div className="flex gap-2">
              <input type="text" value={formData.diaDiem} onChange={e => setFormData(p => ({...p, diaDiem: e.target.value}))}
                placeholder="VD: Sân bóng rổ, Hội trường A..." className="flex-1 px-3 py-2 border rounded-lg text-sm" />
              <button type="button" onClick={() => setShowMap(true)} className="px-3 py-2 border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" /> {formData.viDo ? 'Đã ghim' : 'Ghim bản đồ'}
              </button>
            </div>
          </div>
          <Input label="Số lượng tối đa" type="number" name="soLuongToiDa" value={formData.soLuongToiDa} onChange={handleChange} placeholder="Để trống nếu không giới hạn" />
        </div>
      </Card>

      {/* Điểm rèn luyện */}
      <Card title="3. Quyền lợi sinh viên" icon={Users}>
        <RenLuyenSelector
          maDanhMuc={formData.maDanhMucRenLuyen}
          maTieuChi={formData.maTieuChiRenLuyen}
          diemRenLuyen={formData.diemRenLuyen}
          onChange={({ maDanhMucRenLuyen, maTieuChiRenLuyen, diemRenLuyen }) => setFormData(p => ({ ...p, maDanhMucRenLuyen, maTieuChiRenLuyen, diemRenLuyen }))}
        />
      </Card>

      {/* Cài đặt điểm danh */}
      <Card title="4. Cài đặt điểm danh" icon={QrCode}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Chế độ điểm danh" name="cheDoDiemDanh" value={formData.cheDoDiemDanh} onChange={handleChange}>
            <option value="CHECKIN_ONLY">Chỉ Check-in</option>
            <option value="CHECKIN_CHECKOUT">Check-in & Check-out</option>
            <option value="AUTO_FULL">Xác nhận tự động (không quét QR)</option>
          </Select>
          <Input label="Bán kính điểm danh (mét)" type="number" name="khoangCachToiDa" value={formData.khoangCachToiDa} onChange={handleChange} />
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Hủy</Button>
        <Button type="submit" isLoading={isLoading} className="bg-orange-600 hover:bg-orange-700">
          {isEdit ? 'Lưu thay đổi' : 'Gửi yêu cầu phê duyệt'}
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

export default ClbActivityForm;
