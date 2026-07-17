import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import jsQR from 'jsqr';
import XuatDanhSachModal from '../../components/activity/XuatDanhSachModal';
import DynamicQRDisplay from '../../components/admin/DiemDanh/DynamicQRDisplay';
import {
  ArrowLeft,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  QrCode,
  UserCheck,
  Camera,
  CameraOff,
  Square,
  CheckSquare,
  Loader2,
  AlertTriangle,
  Users,
  StopCircle,
  LogOut,
  Video,
  Play,
  Ban,
  CheckCheck,
  RefreshCw,
  MapPin,
  Home,
  FileCheck,
  Smartphone,
  X,
  FileUp,
  Plus,
  Trash2,
} from 'lucide-react';
import api from '../../services/api';
import activityService from '../../services/activityService';
import diemDanhService from '../../services/diemDanhService';
import useAuthStore from '../../stores/authStore';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

// ─── Geolocation helper ──────────────────────────────────────────────────────
function getBrowserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}

// ─── Checkout window helper ───────────────────────────────────────────────────
function isCheckoutWindowOpen(activity) {
  if (!activity) return false;
  const allowedMinutes = activity.thoiGianChoPhepCheckOut ?? 30;

  // Early termination
  if (activity.ketThucSom && activity.thoiGianKetThucThucTe) {
    const earlyEnd = new Date(activity.thoiGianKetThucThucTe);
    const deadline = new Date(earlyEnd.getTime() + allowedMinutes * 60000);
    const now = new Date();
    return now >= earlyEnd && now < deadline;
  }

  // Normal end
  if (!activity.ngayToChuc || !activity.thoiGianKetThuc) return false;
  const now = new Date();
  const actDate = new Date(activity.ngayToChuc);
  if (now.toDateString() !== actDate.toDateString()) return false;
  const [endH, endM] = activity.thoiGianKetThuc.split(':').map(Number);
  const endMs = endH * 60 + endM;
  const nowMs = now.getHours() * 60 + now.getMinutes();
  return nowMs > endMs && nowMs < endMs + allowedMinutes;
}

// ─── Time window helper ─────────────────────────────────────────────────────
function isAttendanceWindowOpen(activity) {
  if (!activity) return false;

  // Hoạt động đã kết thúc hoàn toàn → không cho điểm danh
  if (['DA_HUY', 'DA_HOAN_THANH', 'DA_KET_THUC'].includes(activity.trangThai)) return false;

  // BCH đã bấm "Bắt đầu sự kiện" thủ công → cho phép, nhưng vẫn check quá hạn checkout
  if (activity.trangThai === 'DANG_DIEN_RA') {
    const allowedMin = activity.thoiGianChoPhepCheckOut ?? 30;
    // Kết thúc sớm → check window từ thoiGianKetThucThucTe
    if (activity.ketThucSom && activity.thoiGianKetThucThucTe) {
      const earlyEnd = new Date(activity.thoiGianKetThucThucTe);
      if (new Date() > new Date(earlyEnd.getTime() + allowedMin * 60000)) return false;
      return true;
    }
    // Bình thường → check window từ thoiGianKetThuc
    if (activity.thoiGianKetThuc && activity.ngayToChuc) {
      const actDate = new Date(activity.ngayToChuc);
      const now = new Date();
      if (now.toDateString() === actDate.toDateString()) {
        const [endH, endM] = activity.thoiGianKetThuc.split(':').map(Number);
        const nowMs = now.getHours() * 60 + now.getMinutes();
        if (nowMs > endH * 60 + endM + allowedMin) return false;
      }
    }
    return true;
  }

  if (!activity.thoiGianBatDau) return true; // no restriction

  const now = new Date();
  const actDate = new Date(activity.ngayToChuc);

  // Only allow on the activity date
  if (
    now.getFullYear() !== actDate.getFullYear() ||
    now.getMonth() !== actDate.getMonth() ||
    now.getDate() !== actDate.getDate()
  ) {
    return false;
  }

  const [startH, startM] = activity.thoiGianBatDau.split(':').map(Number);
  const startMs = startH * 60 + startM;
  const earlyMs = startMs - (activity.choPhepCheckInSom || 0);
  const nowMs = now.getHours() * 60 + now.getMinutes();

  if (nowMs < earlyMs) return false;

  if (activity.thoiGianKetThuc) {
    const [endH, endM] = activity.thoiGianKetThuc.split(':').map(Number);
    const endMs = endH * 60 + endM;
    if (nowMs > endMs) return false;
  }

  return true;
}

function getWindowMessage(activity) {
  if (!activity?.thoiGianBatDau) return null;
  const early = activity.choPhepCheckInSom
    ? `(từ ${activity.thoiGianBatDau} trừ ${activity.choPhepCheckInSom} phút)`
    : `(từ ${activity.thoiGianBatDau})`;
  const end = activity.thoiGianKetThuc ? ` đến ${activity.thoiGianKetThuc}` : '';
  return `Điểm danh mở ${early}${end}`;
}

// ─── QR Scanner Component ────────────────────────────────────────────────────
function QRScannerPanel({ maHoatDong, onClose, onResult, scanMode = 'CHECK_IN' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const cooldownRef = useRef(new Set());
  const [cameraError, setCameraError] = useState(null);
  const [isStarting, setIsStarting] = useState(true);
  const [lastScan, setLastScan] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');

  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async (deviceId) => {
    stopCamera();
    setIsStarting(true);
    setCameraError(null);
    try {
      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStarting(false);
      scanLoop();
    } catch (e) {
      setCameraError(e.name === 'NotAllowedError' ? 'Không được phép truy cập camera. Hãy cấp quyền camera.' : 'Không thể mở camera: ' + e.message);
      setIsStarting(false);
    }
  }, [stopCamera]); // Removed scanLoop from dependencies

  const scanLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data && !cooldownRef.current.has(code.data)) {
        cooldownRef.current.add(code.data);
        setTimeout(() => cooldownRef.current.delete(code.data), 4000);
        handleQRDetected(code.data);
      }
    }
    animRef.current = requestAnimationFrame(scanLoop);
  }, []); // Removed handleQRDetected from dependencies

  const handleQRDetected = async (maQR) => {
    try {
      const location = await getBrowserLocation();
      const result = await diemDanhService.scanQR(maQR, {
        thietBi: 'Web Browser - Admin',
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
      });
      const scanInfo = {
        success: result.success,
        message: result.message,
        hoTen: result.data?.hoTenSinhVien || result.data?.maSv || '',
        maSv: result.data?.maSv || '',
        time: new Date().toLocaleTimeString('vi-VN'),
      };
      setLastScan(scanInfo);
      onResult(scanInfo);
    } catch {
      const scanInfo = {
        success: false,
        message: 'Lỗi kết nối. Thử lại.',
        hoTen: '',
        maSv: '',
        time: new Date().toLocaleTimeString('vi-VN'),
      };
      setLastScan(scanInfo);
    }
  };

  useEffect(() => {
    const getCameras = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true }); // Request permission
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          const preferredCamera = videoDevices.find(d => d.label.toLowerCase().includes('back')) || videoDevices[0];
          setSelectedCameraId(preferredCamera.deviceId);
        }
      } catch (e) {
        setCameraError('Không thể truy cập camera. Vui lòng cấp quyền và thử lại.');
      }
    };
    getCameras();
  }, []);

  useEffect(() => {
    if (selectedCameraId) {
      startCamera(selectedCameraId);
    }
    return () => {
      stopCamera();
    };
  }, [selectedCameraId, startCamera, stopCamera]);


  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      {/* Camera view */}
      <div className="relative bg-black" style={{ minHeight: 280 }}>
        {isStarting && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <Loader2 className="w-8 h-8 animate-spin mr-2" /> Đang khởi động camera...
          </div>
        )}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-6 text-center">
            <CameraOff className="w-10 h-10 mb-2" />
            <p>{cameraError}</p>
          </div>
        )}
        <video
          ref={videoRef}
          className="w-full object-cover"
          playsInline
          muted
          style={{ display: cameraError ? 'none' : 'block', maxHeight: 400 }}
        />
        {!cameraError && !isStarting && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-52 h-52 border-2 border-green-400 rounded-lg opacity-80" style={{
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
            }} />
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Camera Selector */}
      {cameras.length > 1 && (
        <div className="px-4 pt-3">
          <div className="relative">
            <Video className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {cameras.map((camera) => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Mode indicator */}
      <div className={`px-4 py-2 text-xs font-semibold text-center ${scanMode === 'CHECK_OUT' ? 'bg-orange-800 text-orange-200' : 'bg-indigo-800 text-indigo-200'}`}>
        {scanMode === 'CHECK_OUT' ? '⬅ Chế độ CHECK-OUT' : '➡ Chế độ CHECK-IN'}
      </div>

      {/* Last scan result */}
      <div className="p-4 min-h-[80px]">
        {lastScan ? (
          <div className={`flex items-start gap-3 p-3 rounded-lg ${lastScan.success ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'}`}>
            {lastScan.success
              ? <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-400" />
              : <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-400" />}
            <div>
              <p className="font-semibold text-sm">{lastScan.success ? `✓ ${scanMode === 'CHECK_OUT' ? 'Check-out' : 'Check-in'} thành công` : '✗ Thất bại'}</p>
              {lastScan.hoTen && <p className="text-xs mt-0.5">{lastScan.hoTen} {lastScan.maSv ? `(${lastScan.maSv})` : ''}</p>}
              <p className="text-xs mt-0.5 opacity-75">{lastScan.message} — {lastScan.time}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center text-gray-400 text-sm gap-2">
            <QrCode className="w-4 h-4" />
            <span>Hướng mã QR vào khung để quét</span>
          </div>
        )}
      </div>

      {/* Close button */}
      <div className="px-4 pb-4">
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <CameraOff className="w-4 h-4" /> Dừng quét
        </button>
      </div>
    </div>
  );
}


// ─── Reverse geocoding cache + component ─────────────────────────────────────
const geocodeCache = {};

const LocationCell = memo(({ lat, lng }) => {
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const [address, setAddress] = useState('');

  const load = async () => {
    if (state === 'loading' || state === 'done') return;
    const key = `${lat},${lng}`;
    if (geocodeCache[key]) { setAddress(geocodeCache[key]); setState('done'); return; }
    setState('loading');
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi`,
        { headers: { 'Accept-Language': 'vi' } }
      );
      const d = await r.json();
      const addr = d.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      geocodeCache[key] = addr;
      setAddress(addr);
      setState('done');
    } catch {
      setState('error');
    }
  };

  if (!lat || !lng) return <span className="text-gray-300 text-xs">—</span>;

  return (
    <div className="text-xs">
      {state === 'idle' && (
        <button
          onClick={load}
          className="flex items-center gap-1 text-blue-500 hover:text-blue-700 hover:underline transition-colors"
        >
          <MapPin className="w-3 h-3" /> Xem vị trí
        </button>
      )}
      {state === 'loading' && (
        <span className="flex items-center gap-1 text-gray-400">
          <Loader2 className="w-3 h-3 animate-spin" /> Đang tải...
        </span>
      )}
      {state === 'done' && (
        <div className="max-w-[200px]">
          <p className="text-gray-700 leading-snug line-clamp-2" title={address}>{address}</p>
          <p className="text-gray-400 mt-0.5">{lat.toFixed(5)}, {lng.toFixed(5)}</p>
        </div>
      )}
      {state === 'error' && (
        <span className="text-red-400">Lỗi tải địa chỉ</span>
      )}
    </div>
  );
});

// ─── Thêm SV theo MSSV (admin) — multi-select ────────────────────────────────
function ThemSVTheoMSSVPanel({ maHoatDong, onSuccess }) {
  const [open, setOpen]               = useState(false);
  const [keyword, setKeyword]         = useState('');
  const [debouncedKw, setDebouncedKw] = useState('');
  const [selectedList, setSelectedList] = useState([]); // multi-select
  const [ghiChu, setGhiChu]           = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKw(keyword.trim()), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: results = [], isFetching: searching } = useQuery({
    queryKey: ['sv-search-them', debouncedKw],
    queryFn: () =>
      api.get('/api/sinhvien', { params: { search: debouncedKw, size: 10, isActive: true } })
        .then(r => r.data.content || []),
    enabled: debouncedKw.length >= 2,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (results.length > 0 && debouncedKw.length >= 2) setShowDropdown(true);
  }, [results, debouncedKw]);

  const mutation = useMutation({
    mutationFn: () => Promise.allSettled(
      selectedList.map(sv => diemDanhService.themThuCongTheoMSSV(maHoatDong, sv.maSv, ghiChu.trim()))
    ),
    onSuccess: (settled) => {
      const ok   = settled.filter(r => r.status === 'fulfilled').length;
      const fail = settled.filter(r => r.status === 'rejected').length;
      if (ok > 0) toast.success(`Đã thêm ${ok} sinh viên vào danh sách tham gia`);
      if (fail > 0) toast.error(`${fail} sinh viên không thêm được (đã điểm danh hoặc lỗi)`);
      setSelectedList([]); setKeyword(''); setGhiChu(''); setShowDropdown(false);
      onSuccess?.();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Có lỗi xảy ra'),
  });

  const handleSelect = (sv) => {
    if (!selectedList.find(s => s.maSv === sv.maSv)) {
      setSelectedList(prev => [...prev, sv]);
    }
    setKeyword('');
    setShowDropdown(false);
  };

  const handleRemove = (maSv) => setSelectedList(prev => prev.filter(s => s.maSv !== maSv));

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-xl text-sm font-medium transition-colors self-start"
      >
        <UserCheck className="w-4 h-4" /> Thêm sinh viên thủ công
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-violet-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-violet-50 border-b border-violet-100">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-violet-600" />
          <span className="font-semibold text-violet-800 text-sm">Thêm sinh viên thủ công</span>
          {selectedList.length > 0 && (
            <span className="px-2 py-0.5 bg-violet-600 text-white rounded-full text-xs font-bold">
              {selectedList.length}
            </span>
          )}
        </div>
        <button onClick={() => { setOpen(false); setSelectedList([]); setKeyword(''); setGhiChu(''); }}
          className="p-1 rounded-lg text-violet-400 hover:text-violet-700 hover:bg-violet-100">
          <XCircle className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Search box */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Tìm sinh viên
            <span className="text-gray-400 font-normal ml-1">(tìm theo họ tên hoặc MSSV, có thể chọn nhiều)</span>
          </label>
          <div className="relative" ref={wrapperRef}>
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-violet-400">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
                placeholder="Nhập họ tên hoặc MSSV..."
                className="flex-1 text-sm bg-transparent outline-none"
              />
              {searching && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 flex-shrink-0" />}
              {keyword && (
                <button type="button" onClick={() => { setKeyword(''); setShowDropdown(false); }}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>

            {showDropdown && results.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                <div className="px-3 py-1.5 bg-gray-50 border-b text-xs text-gray-500">
                  {results.length} kết quả — click để chọn
                </div>
                <ul className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                  {results.map(sv => {
                    const already = selectedList.some(s => s.maSv === sv.maSv);
                    return (
                      <li key={sv.maSv}>
                        <button
                          type="button"
                          onMouseDown={e => { e.preventDefault(); if (!already) handleSelect(sv); }}
                          className={`w-full text-left px-3 py-2.5 transition-colors flex items-center gap-3 ${already ? 'bg-violet-50 cursor-default' : 'hover:bg-violet-50'}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${already ? 'bg-violet-300' : 'bg-violet-100'}`}>
                            {already
                              ? <CheckCircle className="w-4 h-4 text-violet-700" />
                              : <span className="text-xs font-bold text-violet-600">{sv.hoTen?.charAt(0)?.toUpperCase() || '?'}</span>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${already ? 'text-violet-700' : 'text-gray-900'}`}>{sv.hoTen}</p>
                            <p className="text-xs text-gray-500">
                              <span className="font-mono">{sv.maSv}</span>
                              {sv.maLop && <span className="ml-2 text-blue-500">{sv.maLop}</span>}
                              {sv.tenKhoa && <span className="ml-2 text-gray-400">{sv.tenKhoa}</span>}
                            </p>
                          </div>
                          {already && <span className="text-xs text-violet-500 flex-shrink-0">Đã chọn</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {showDropdown && results.length === 0 && debouncedKw.length >= 2 && !searching && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-500 text-center">
                Không tìm thấy sinh viên nào
              </div>
            )}
          </div>
        </div>

        {/* Danh sách đã chọn */}
        {selectedList.length > 0 && (
          <div className="border border-violet-100 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-violet-50 border-b border-violet-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-violet-700">Đã chọn ({selectedList.length} sinh viên)</span>
              <button onClick={() => setSelectedList([])} className="text-xs text-violet-500 hover:text-violet-700">Xóa tất cả</button>
            </div>
            <ul className="max-h-36 overflow-y-auto divide-y divide-gray-50">
              {selectedList.map(sv => (
                <li key={sv.maSv} className="flex items-center gap-3 px-3 py-2">
                  <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-violet-600">{sv.hoTen?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{sv.hoTen}</p>
                    <p className="text-xs text-gray-500 font-mono">{sv.maSv}{sv.maLop && ` · ${sv.maLop}`}</p>
                  </div>
                  <button onClick={() => handleRemove(sv.maSv)}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ghi chú + nút thêm */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú</label>
            <input
              type="text"
              value={ghiChu}
              onChange={e => setGhiChu(e.target.value)}
              placeholder="Lý do thêm thủ công..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <button
            onClick={() => mutation.mutate()}
            disabled={selectedList.length === 0 || mutation.isPending}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 flex-shrink-0"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            {mutation.isPending ? 'Đang thêm...' : selectedList.length > 0 ? `Thêm ${selectedList.length} sinh viên` : 'Thêm & Điểm danh'}
          </button>
        </div>

        <p className="text-xs text-gray-400">
          ⓘ Sinh viên được chọn sẽ được đăng ký và điểm danh <strong>Có mặt</strong> ngay lập tức.
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ActivityAttendancePage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('ma'); // dùng query param để tránh lỗi slash trong maHoatDong
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { maKhoa } = useAuthStore();
  const isKhoaScoped = !!maKhoa;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [mode, setMode] = useState('VIEW'); // VIEW | QR | MANUAL | CHECKOUT
  const [selectedSvs, setSelectedSvs] = useState(new Set());
  const [manualNote, setManualNote] = useState('');
  const [manualSearchTerm, setManualSearchTerm] = useState('');
  const [qrScanCount, setQrScanCount] = useState(0);
  const [checkoutScanCount, setCheckoutScanCount] = useState(0);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: activity, isLoading: loadingActivity } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => activityService.getById(id),
    refetchInterval: 30000, // Cập nhật trạng thái mỗi 30s
  });

  const { data: attendanceList = [], isLoading: loadingList, refetch: refetchList } = useQuery({
    queryKey: ['attendance-status', id],
    queryFn: () => activityService.getAttendanceStatusList(id),
    // Auto-refresh: 5s khi quét QR, 15s bình thường, dừng khi activity đã kết thúc
    refetchInterval: (query) => {
      const status = query.state.data == null
        ? 10000
        : ['DA_HOAN_THANH', 'DA_KET_THUC', 'DA_HUY'].includes(activity?.trangThai)
          ? false
          : (mode === 'QR' || mode === 'CHECKOUT') ? 5000 : 15000;
      return status;
    },
  });

  const { data: notCheckedIn = [], refetch: refetchNotCheckedIn } = useQuery({
    queryKey: ['not-checked-in', id],
    queryFn: () => diemDanhService.getNotCheckedIn(id),
    enabled: mode === 'MANUAL',
  });

  const { data: checkedInList = [], refetch: refetchCheckedIn } = useQuery({
    queryKey: ['checked-in', id],
    queryFn: () => diemDanhService.getCheckedIn(id),
    enabled: mode === 'CHECKOUT' || mode === 'CHECKOUT_MANUAL',
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const startActivityMutation = useMutation({
    mutationFn: () => activityService.start(id),
    onSuccess: () => {
      toast.success('Đã bắt đầu sự kiện! Cửa sổ điểm danh đang mở.');
      queryClient.invalidateQueries({ queryKey: ['activity', id] });
    },
    onError: (err) => toast.error('Lỗi bắt đầu sự kiện: ' + err.message),
  });

  const earlyTerminateMutation = useMutation({
    mutationFn: () => activityService.earlyTerminate(id),
    onSuccess: () => {
      toast.success('Đã kết thúc sự kiện. Cửa sổ check-out đang mở (nếu có)!');
      queryClient.invalidateQueries({ queryKey: ['activity', id] });
    },
    onError: (err) => toast.error('Lỗi kết thúc sự kiện: ' + err.message),
  });

  const completeActivityMutation = useMutation({
    mutationFn: () => activityService.complete(id),
    onSuccess: () => {
      toast.success('Đã đánh dấu hoạt động hoàn thành!');
      queryClient.invalidateQueries({ queryKey: ['activity', id] });
      queryClient.invalidateQueries({ queryKey: ['attendance-status', id] });
    },
    onError: (err) => toast.error('Lỗi hoàn thành hoạt động: ' + err.message),
  });

  const cancelActivityMutation = useMutation({
    mutationFn: (lyDo) => activityService.cancel(id, lyDo),
    onSuccess: () => {
      toast.success('Đã hủy hoạt động.');
      queryClient.invalidateQueries({ queryKey: ['activity', id] });
    },
    onError: (err) => toast.error('Lỗi hủy hoạt động: ' + err.message),
  });

  const manualCheckOutMutation = useMutation({
    mutationFn: ({ maSvList }) => {
      const idMap = {};
      checkedInList.forEach((s) => { idMap[s.maSv] = s.id; });
      return Promise.all(
        maSvList.map((maSv) =>
          diemDanhService.checkOut({ diemDanhId: idMap[maSv] })
        )
      );
    },
    onSuccess: () => {
      toast.success('Checkout thủ công thành công!');
      setSelectedSvs(new Set());
      setMode('VIEW');
      queryClient.invalidateQueries({ queryKey: ['attendance-status', id] });
      queryClient.invalidateQueries({ queryKey: ['checked-in', id] });
    },
    onError: (err) => toast.error('Lỗi checkout thủ công: ' + err.message),
  });

  const manualCheckInMutation = useMutation({
    mutationFn: ({ maSvList, ghiChu }) => diemDanhService.manualCheckInBulk(id, maSvList, ghiChu),
    onSuccess: (results) => {
      const successCount = Object.values(results).filter((v) => v === 'SUCCESS').length;
      const failCount = Object.values(results).length - successCount;
      toast.success(`Điểm danh thành công ${successCount} sinh viên${failCount > 0 ? `, ${failCount} thất bại` : ''}`);
      setSelectedSvs(new Set());
      setManualNote('');
      setMode('VIEW');
      queryClient.invalidateQueries({ queryKey: ['attendance-status', id] });
      queryClient.invalidateQueries({ queryKey: ['not-checked-in', id] });
    },
    onError: (err) => toast.error('Lỗi điểm danh thủ công: ' + err.message),
  });

  // ── Derived state ─────────────────────────────────────────────────────────
  const windowOpen = useMemo(() => isAttendanceWindowOpen(activity), [activity]);
  const windowMsg = useMemo(() => getWindowMessage(activity), [activity]);
  const checkoutWindowOpen = useMemo(() => isCheckoutWindowOpen(activity), [activity]);

  // Derived: QR mode context — used to show/hide buttons
  const cheDo       = activity?.cheDoDiemDanh || 'CHECKIN_CHECKOUT';
  const hasCheckin  = cheDo !== 'CHECKOUT_ONLY' && cheDo !== 'AUTO_FULL';
  const hasCheckout = cheDo === 'CHECKIN_CHECKOUT' || cheDo === 'CHECKOUT_ONLY';
  const usesQR      = cheDo !== 'AUTO_FULL';
  // QR tự phục vụ có thể hiển thị trong cả cửa sổ check-in lẫn check-out
  const qrDisplayEnabled = usesQR && (windowOpen || checkoutWindowOpen);

  const todayStr = new Date().toISOString().split('T')[0];
  const isActivityEnded = ['DA_HOAN_THANH', 'DA_KET_THUC', 'DA_HUY'].includes(activity?.trangThai);
  const isStartAvailable = activity?.ngayToChuc === todayStr
    && !['DANG_DIEN_RA', 'DA_HUY', 'DA_HOAN_THANH', 'DA_KET_THUC'].includes(activity?.trangThai);
  const isEarlyTerminateAvailable = activity?.trangThai === 'DANG_DIEN_RA' && !activity?.ketThucSom;
  // Hoàn thành: khi hoạt động đã hết giờ (DA_KET_THUC) hoặc kết thúc sớm nhưng chưa đánh dấu DA_HOAN_THANH
  const isCompleteAvailable = activity?.trangThai === 'DA_KET_THUC';
  // Hủy: khi chưa kết thúc/hủy/hoàn thành
  const isCancelAvailable = !['DA_HUY', 'DA_HOAN_THANH'].includes(activity?.trangThai);

  const filteredNotCheckedIn = useMemo(() => {
    if (!manualSearchTerm) return notCheckedIn;
    const q = manualSearchTerm.toLowerCase();
    return notCheckedIn.filter((sv) =>
      sv.hoTen?.toLowerCase().includes(q) ||
      sv.maSv?.toLowerCase().includes(q) ||
      sv.lop?.toLowerCase().includes(q)
    );
  }, [notCheckedIn, manualSearchTerm]);

  const stats = useMemo(() => ({
    total:        attendanceList.length,
    checkedIn:    attendanceList.filter((i) => i.daDiemDanh && i.thoiGianCheckOut).length,
    noCheckout:   attendanceList.filter((i) => i.daDiemDanh && !i.thoiGianCheckOut).length,
    notCheckedIn: attendanceList.filter((i) => !i.daDiemDanh).length,
  }), [attendanceList]);

  const filteredList = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return attendanceList
      .filter((item) => {
        const matchSearch =
          item.hoTen?.toLowerCase().includes(q) ||
          item.maSv?.toLowerCase().includes(q) ||
          item.lop?.toLowerCase().includes(q);
        if (!matchSearch) return false;
        if (filterStatus === 'CHECKED_IN')     return item.daDiemDanh && item.thoiGianCheckOut;
        if (filterStatus === 'NO_CHECKOUT')    return item.daDiemDanh && !item.thoiGianCheckOut;
        if (filterStatus === 'NOT_CHECKED_IN') return !item.daDiemDanh;
        return true;
      })
      .sort((a, b) => {
        // Mới đăng ký nhất lên đầu
        const ta = a.ngayDangKy ? new Date(a.ngayDangKy).getTime() : 0;
        const tb = b.ngayDangKy ? new Date(b.ngayDangKy).getTime() : 0;
        return tb - ta;
      });
  }, [attendanceList, searchTerm, filterStatus]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleQRResult = useCallback((scanInfo) => {
    if (scanInfo.success) {
      if (mode === 'CHECKOUT') {
        setCheckoutScanCount((c) => c + 1);
      } else {
        setQrScanCount((c) => c + 1);
      }
      queryClient.invalidateQueries({ queryKey: ['attendance-status', id] });
    }
  }, [queryClient, id, mode]);

  const handleToggleSv = (maSv) => {
    setSelectedSvs((prev) => {
      const next = new Set(prev);
      next.has(maSv) ? next.delete(maSv) : next.add(maSv);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedSvs.size === filteredNotCheckedIn.length && filteredNotCheckedIn.length > 0) {
      setSelectedSvs(new Set());
    } else {
      setSelectedSvs(new Set(filteredNotCheckedIn.map((s) => s.maSv)));
    }
  };

  const handleConfirmManual = () => {
    if (selectedSvs.size === 0) { toast.warn('Chưa chọn sinh viên nào'); return; }
    manualCheckInMutation.mutate({ maSvList: [...selectedSvs], ghiChu: manualNote || 'Điểm danh thủ công' });
  };

  const handleKdkThemThuCong = async () => {
    if (!kdkMaSv.trim()) return;
    try {
      const result = await diemDanhService.themThuCongKhongDangKy(id, [kdkMaSv.trim()]);
      if (result.added > 0) {
        toast.success(`Đã thêm sinh viên ${kdkMaSv.trim()}`);
        setKdkMaSv('');
        queryClient.invalidateQueries({ queryKey: ['attendance-status', id] });
      } else if (result.skipped > 0) {
        toast.info('Sinh viên này đã có trong danh sách');
        setKdkMaSv('');
      } else if (result.errors?.length > 0) {
        toast.error(result.errors[0]);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    }
  };

  const handleKdkImportExcel = async () => {
    if (!kdkFile) return;
    try {
      const result = await diemDanhService.importExcelKhongDangKy(id, kdkFile);
      toast.success(`Import thành công: ${result.added || 0} thêm, ${result.skipped || 0} bỏ qua`);
      if (result.errors?.length > 0) {
        result.errors.forEach(e => toast.warn(e));
      }
      setKdkFile(null);
      if (kdkFileRef.current) kdkFileRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['attendance-status', id] });
    } catch (err) {
      toast.error('Import thất bại: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleKdkDownloadTemplate = () => {
    const headers = ['Mã sinh viên (bắt buộc)', 'Họ và Tên (tùy chọn — để xác nhận)'];
    const samples = [
      ['SV2021001', 'Nguyễn Văn A'],
      ['SV2021002', 'Trần Thị B'],
      ['SV2022003', ''],
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...samples]);
    ws['!cols'] = [{ wch: 28 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachThamGia');
    XLSX.writeFile(wb, 'MauNhapDanhSachThamGia.xlsx');
  };

  const handleSwitchMode = (newMode) => {
    if (newMode === mode) { setMode('VIEW'); return; }
    setMode(newMode);
    if (newMode === 'MANUAL') {
      setSelectedSvs(new Set());
      setManualSearchTerm('');
      refetchNotCheckedIn();
    }
    if (newMode === 'CHECKOUT' || newMode === 'CHECKOUT_MANUAL') {
      setSelectedSvs(new Set());
      refetchCheckedIn();
    }
  };

  const handleStartActivity = () => {
    if (window.confirm('Xác nhận bắt đầu sự kiện?\nCửa sổ điểm danh sẽ mở ngay sau đó.')) {
      startActivityMutation.mutate();
    }
  };

  const handleEarlyTerminate = () => {
    const mode = activity?.cheDoDiemDanh;
    const msg = (mode === 'CHECKIN_CHECKOUT' || mode === 'CHECKOUT_ONLY')
      ? 'Kết thúc sự kiện và mở cửa sổ check-out?\nSinh viên có thể quét QR để check-out.'
      : 'Xác nhận kết thúc sự kiện?';
    if (window.confirm(msg)) {
      earlyTerminateMutation.mutate();
    }
  };

  const handleCompleteActivity = () => {
    if (window.confirm('Xác nhận hoàn thành hoạt động?\nTrạng thái sẽ chuyển sang "Đã hoàn thành".')) {
      completeActivityMutation.mutate();
    }
  };

  const handleCancelActivity = () => {
    const lyDo = window.prompt('Nhập lý do hủy hoạt động:');
    if (lyDo === null) return; // User cancelled prompt
    if (!lyDo.trim()) { toast.warn('Vui lòng nhập lý do hủy'); return; }
    if (window.confirm(`Xác nhận HỦY hoạt động?\nLý do: ${lyDo}\nHành động này không thể hoàn tác!`)) {
      cancelActivityMutation.mutate(lyDo);
    }
  };

  const handleConfirmManualCheckout = () => {
    if (selectedSvs.size === 0) { toast.warn('Chưa chọn sinh viên nào'); return; }
    manualCheckOutMutation.mutate({ maSvList: [...selectedSvs] });
  };

  const [showXuatModal,    setShowXuatModal]    = useState(false);
  const [showBanHanhModal, setShowBanHanhModal] = useState(false);

  // Hoạt động không đăng ký
  const [kdkMaSv, setKdkMaSv] = useState('');
  const [kdkFile, setKdkFile] = useState(null);
  const kdkFileRef = useRef(null);

  const handleExportExcel = async () => {
    try {
      toast.info('Đang chuẩn bị file Excel...');
      await diemDanhService.exportExcel(id);
      toast.success('Tải về thành công!');
    } catch (error) {
      toast.error('Lỗi khi xuất file Excel');
    }
  };

  if (loadingActivity || loadingList) {
    return (
      <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Đang tải dữ liệu...
      </div>
    );
  }

  if (!activity) {
    return <div className="p-8 text-center text-red-500">Không tìm thấy hoạt động</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* ── Header ── */}
      <div>
        <button
          onClick={() => navigate('/admin/activities')}
          className="flex items-center text-gray-500 hover:text-blue-600 mb-3 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại danh sách
        </button>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">{activity.tenHoatDong}</h1>
              {/* Status Badge */}
              {activity.trangThai && (() => {
                const statusMap = {
                  SAP_DIEN_RA:       { label: 'Sắp diễn ra',        cls: 'bg-gray-100 text-gray-600 border-gray-200' },
                  DANG_MO_DANG_KY:   { label: 'Đang mở đăng ký',    cls: 'bg-blue-50 text-blue-700 border-blue-200' },
                  DANG_DIEN_RA:      { label: '🟢 Đang diễn ra',    cls: 'bg-green-50 text-green-700 border-green-200' },
                  DA_KET_THUC:       { label: 'Đã kết thúc',         cls: 'bg-orange-50 text-orange-700 border-orange-200' },
                  DA_HOAN_THANH:     { label: '✔ Đã hoàn thành',    cls: 'bg-purple-50 text-purple-700 border-purple-200' },
                  DA_HUY:            { label: '✕ Đã hủy',            cls: 'bg-red-50 text-red-700 border-red-200' },
                };
                const s = statusMap[activity.trangThai] || { label: activity.trangThai, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
                return (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}>
                    {s.label}
                  </span>
                );
              })()}
            </div>
            {activity.isKhongDangKy && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-300 rounded-full text-xs font-semibold mb-1">
                <UserCheck className="w-3 h-3" /> Không đăng ký (kêu gọi offline)
              </span>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {activity.ngayToChuc ? format(new Date(activity.ngayToChuc), 'dd/MM/yyyy') : '—'}
              </span>
              {activity.thoiGianBatDau && (
                <span className="text-xs text-gray-400">
                  {activity.thoiGianBatDau}{activity.thoiGianKetThuc ? ` – ${activity.thoiGianKetThuc}` : ''}
                </span>
              )}
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                {activity.loaiHoatDong}
              </span>
              {(() => {
                const modeMap = {
                  CHECKIN_CHECKOUT: { label: 'Check-in & Check-out', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                  CHECKIN_ONLY:     { label: 'Chỉ Check-in',         cls: 'bg-green-50 text-green-700 border-green-200' },
                  CHECKOUT_ONLY:    { label: 'Chỉ Check-out',        cls: 'bg-orange-50 text-orange-700 border-orange-200' },
                  AUTO_FULL:        { label: 'Tự động hoàn toàn',    cls: 'bg-purple-50 text-purple-700 border-purple-200' },
                };
                const m = modeMap[cheDo] || modeMap.CHECKIN_CHECKOUT;
                return (
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${m.cls}`}>
                    <QrCode className="w-3 h-3" />
                    {m.label}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <div className="bg-white border rounded-lg p-3 px-4 shadow-sm text-center">
              <p className="text-xs text-gray-500 font-semibold uppercase">Tổng</p>
              <p className="text-xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-lg p-3 px-4 shadow-sm text-center">
              <p className="text-xs text-green-600 font-semibold uppercase">Có mặt</p>
              <p className="text-xl font-bold text-green-700">{stats.checkedIn}</p>
            </div>
            {stats.noCheckout > 0 && (
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 px-4 shadow-sm text-center">
                <p className="text-xs text-orange-600 font-semibold uppercase">Chưa checkout</p>
                <p className="text-xl font-bold text-orange-700">{stats.noCheckout}</p>
              </div>
            )}
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 px-4 shadow-sm text-center">
              <p className="text-xs text-red-600 font-semibold uppercase">Vắng mặt</p>
              <p className="text-xl font-bold text-red-700">{stats.notCheckedIn}</p>
            </div>
            <button
              onClick={handleExportExcel}
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-3 px-4 shadow-sm flex flex-col items-center justify-center transition-colors"
              title="Xuất file Excel danh sách tham gia"
            >
              <Download className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold uppercase">Xuất Excel</span>
            </button>
            {(() => {
              const canKySo = !isKhoaScoped || (activity?.maKhoa && activity.maKhoa === maKhoa);
              const kySoTitle = !canKySo ? 'Đoàn khoa không có quyền ký số hoạt động của đoàn trường' : 'Xuất danh sách PDF có ký số';
              return (
                <>
                  <button
                    onClick={() => canKySo && setShowXuatModal(true)}
                    disabled={!canKySo}
                    className={`rounded-lg p-3 px-4 shadow-sm flex flex-col items-center justify-center transition-colors ${canKySo ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    title={kySoTitle}
                  >
                    <Download className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold uppercase">Xuất PDF</span>
                  </button>
                  {(['DA_HOAN_THANH', 'DA_KET_THUC'].includes(activity?.trangThai)) && (
                    <button
                      onClick={() => canKySo && setShowBanHanhModal(true)}
                      disabled={!canKySo}
                      className={`rounded-lg p-3 px-4 shadow-sm flex flex-col items-center justify-center transition-colors ${canKySo ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                      title={canKySo ? 'Ban hành danh sách chính thức có ký số' : kySoTitle}
                    >
                      <FileCheck className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-bold uppercase">Ban Hành</span>
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Activity ended warning + Hoàn thành button ── */}
      {isActivityEnded && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl">
          <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-gray-500" />
            <span>
              Hoạt động đã {activity?.trangThai === 'DA_HUY' ? 'bị hủy' : activity?.trangThai === 'DA_HOAN_THANH' ? 'hoàn thành' : 'kết thúc'} — chức năng điểm danh đã đóng.
            </span>
          </div>
          {/* Khi đã kết thúc (DA_KET_THUC) → cho phép đánh dấu hoàn thành */}
          {isCompleteAvailable && (
            <button
              onClick={handleCompleteActivity}
              disabled={completeActivityMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-lg text-sm font-semibold shadow transition-colors"
            >
              {completeActivityMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
              Đánh dấu hoàn thành
            </button>
          )}
        </div>
      )}

      {/* ── Start / End / Cancel Event Buttons ── */}
      <div className="flex flex-wrap justify-end gap-3">
        {/* Nút làm mới danh sách */}
        <button
          onClick={() => { refetchList(); }}
          title="Làm mới danh sách điểm danh"
          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
        {!isActivityEnded && (
          <>
            {isStartAvailable && (
              <button
                onClick={handleStartActivity}
                disabled={startActivityMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg text-sm font-semibold shadow transition-colors"
              >
                {startActivityMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Bắt đầu sự kiện
              </button>
            )}
            {isEarlyTerminateAvailable && (
              <button
                onClick={handleEarlyTerminate}
                disabled={earlyTerminateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg text-sm font-semibold shadow transition-colors"
              >
                {earlyTerminateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <StopCircle className="w-4 h-4" />}
                Kết thúc sự kiện
              </button>
            )}
            {isCancelAvailable && (
              <button
                onClick={handleCancelActivity}
                disabled={cancelActivityMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-semibold shadow transition-colors"
              >
                {cancelActivityMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                Hủy hoạt động
              </button>
            )}
          </>
        )}
      </div>

      {/* Checkout window indicator — chỉ hiện khi mode hỗ trợ checkout */}
      {checkoutWindowOpen && hasCheckout && (
        <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-sm font-medium">
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Cửa sổ check-out đang mở — Sinh viên có thể quét QR tự phục vụ để check-out!</span>
        </div>
      )}

      {/* ── Hoạt động không đăng ký — Panel nhập danh sách ── */}
      {activity.isKhongDangKy && !isActivityEnded && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
            <UserCheck className="w-4 h-4" />
            Hoạt động không đăng ký — Nhập danh sách tham gia
          </div>

          {/* Manual add */}
          <div className="flex gap-2">
            <input
              value={kdkMaSv}
              onChange={e => setKdkMaSv(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleKdkThemThuCong(); }}
              placeholder="Nhập mã sinh viên..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={handleKdkThemThuCong}
              disabled={!kdkMaSv.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Thêm
            </button>
          </div>

          {/* Excel import */}
          <div className="flex flex-wrap items-center gap-3">
            <input ref={kdkFileRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={e => setKdkFile(e.target.files?.[0] || null)} />
            <button
              onClick={() => kdkFileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 border border-amber-400 text-amber-700 rounded-lg text-sm hover:bg-amber-100"
            >
              <FileUp className="w-4 h-4" />
              {kdkFile ? kdkFile.name : 'Chọn file Excel'}
            </button>
            {kdkFile && (
              <button
                onClick={handleKdkImportExcel}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                Import
              </button>
            )}
            <button
              onClick={handleKdkDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50"
            >
              <Download className="w-3.5 h-3.5" /> Tải file mẫu
            </button>
            <span className="text-xs text-amber-600">Cột A: Mã SV (bắt buộc), Cột B: Họ tên (tùy chọn)</span>
          </div>
        </div>
      )}

      {/* ── Action Buttons ── */}
      {!isActivityEnded && !activity.isKhongDangKy && (
        <div className={`grid grid-cols-1 gap-4 ${
          usesQR && hasCheckin ? 'md:grid-cols-3' : usesQR ? 'md:grid-cols-2' : 'md:grid-cols-1'
        }`}>
          {/* Trình chiếu QR Tự phục vụ — ẩn khi AUTO_FULL */}
          {usesQR && (
            <div>
              <button
                onClick={() => handleSwitchMode('DYNAMIC_QR')}
                disabled={!qrDisplayEnabled}
                className={`w-full py-4 px-5 rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-all border-2 ${
                  mode === 'DYNAMIC_QR'
                    ? 'bg-blue-700 border-blue-700 text-white shadow-lg'
                    : qrDisplayEnabled
                    ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-md'
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                {mode === 'DYNAMIC_QR' ? 'Đang chiếu QR — Nhấn để đóng' : 'Trình chiếu QR Tự phục vụ'}
              </button>
              {!qrDisplayEnabled && windowMsg && (
                <p className="text-xs text-gray-400 mt-1 text-center">{windowMsg}</p>
              )}
            </div>
          )}

          {/* Quét QR Check-in (Admin) — chỉ hiện khi có check-in và dùng QR */}
          {usesQR && hasCheckin && (
            <div>
              <button
                onClick={() => handleSwitchMode('QR')}
                disabled={!windowOpen}
                className={`w-full py-4 px-5 rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-all border-2 ${
                  mode === 'QR'
                    ? 'bg-indigo-700 border-indigo-700 text-white shadow-lg'
                    : windowOpen
                    ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {mode === 'QR' ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                {mode === 'QR' ? 'Đang quét QR Check-in — Nhấn để dừng' : 'Quét QR Check-in (Admin)'}
                {mode === 'QR' && qrScanCount > 0 && (
                  <span className="ml-1 bg-white text-indigo-700 rounded-full text-xs font-bold px-2 py-0.5">
                    {qrScanCount}
                  </span>
                )}
              </button>
              {!windowOpen && windowMsg && (
                <p className="text-xs text-gray-400 mt-1 text-center">{windowMsg}</p>
              )}
            </div>
          )}

          {/* Điểm danh thủ công — luôn hiển thị */}
          <div>
            <button
              onClick={() => handleSwitchMode('MANUAL')}
              disabled={!windowOpen}
              className={`w-full py-4 px-5 rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-all border-2 ${
                mode === 'MANUAL'
                  ? 'bg-emerald-700 border-emerald-700 text-white shadow-lg'
                  : windowOpen
                  ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                  : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              {mode === 'MANUAL' ? 'Đang điểm danh thủ công — Nhấn để đóng' : 'Điểm danh thủ công'}
            </button>
            {!windowOpen && windowMsg && (
              <p className="text-xs text-gray-400 mt-1 text-center">{windowMsg}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Checkout Buttons (chỉ hiện khi mode có checkout VÀ cửa sổ checkout đang mở) ── */}
      {checkoutWindowOpen && hasCheckout && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* QR Checkout Button */}
          <button
            onClick={() => handleSwitchMode('CHECKOUT')}
            className={`w-full py-4 px-5 rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-all border-2 ${
              mode === 'CHECKOUT'
                ? 'bg-orange-700 border-orange-700 text-white shadow-lg'
                : 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600 shadow-md'
            }`}
          >
            {mode === 'CHECKOUT' ? <CameraOff className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
            {mode === 'CHECKOUT' ? 'Đang quét QR (Check-out) — Nhấn để dừng' : 'Quét QR Check-out'}
            {mode === 'CHECKOUT' && checkoutScanCount > 0 && (
              <span className="ml-1 bg-white text-orange-700 rounded-full text-xs font-bold px-2 py-0.5">
                {checkoutScanCount}
              </span>
            )}
          </button>

          {/* Manual Checkout Button */}
          <button
            onClick={() => handleSwitchMode('CHECKOUT_MANUAL')}
            className={`w-full py-4 px-5 rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-all border-2 ${
              mode === 'CHECKOUT_MANUAL'
                ? 'bg-amber-700 border-amber-700 text-white shadow-lg'
                : 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600 shadow-md'
            }`}
          >
            <UserCheck className="w-5 h-5" />
            {mode === 'CHECKOUT_MANUAL' ? 'Đang checkout thủ công — Nhấn để đóng' : 'Checkout thủ công'}
          </button>
        </div>
      )}

      {/* ── QR Scanner Panel (Check-in) ── */}
      {mode === 'QR' && (
        <QRScannerPanel
          maHoatDong={id}
          onClose={() => setMode('VIEW')}
          onResult={handleQRResult}
          scanMode="CHECK_IN"
        />
      )}

      {/* ── QR Scanner Panel (Check-out) ── */}
      {mode === 'CHECKOUT' && (
        <QRScannerPanel
          maHoatDong={id}
          onClose={() => setMode('VIEW')}
          onResult={handleQRResult}
          scanMode="CHECK_OUT"
        />
      )}

      {/* ── Manual Checkout Panel ── */}
      {mode === 'CHECKOUT_MANUAL' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b bg-orange-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-orange-800">Checkout thủ công</h3>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                {checkedInList.filter((s) => !s.thoiGianCheckOut).length} sinh viên chưa checkout
              </span>
            </div>
            <span className="text-sm text-orange-700 font-medium">Đã chọn: {selectedSvs.size}</span>
          </div>

          {checkedInList.filter((s) => !s.thoiGianCheckOut).length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-300" />
              <p>Tất cả sinh viên đã checkout!</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b bg-gray-50">
                <button
                  onClick={() => {
                    const notCheckedOut = checkedInList.filter((s) => !s.thoiGianCheckOut).map((s) => s.maSv);
                    if (selectedSvs.size === notCheckedOut.length) {
                      setSelectedSvs(new Set());
                    } else {
                      setSelectedSvs(new Set(notCheckedOut));
                    }
                  }}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-orange-700 font-medium"
                >
                  <Square className="w-4 h-4" /> Chọn tất cả
                </button>
              </div>
              <div className="divide-y max-h-72 overflow-y-auto">
                {checkedInList.filter((s) => !s.thoiGianCheckOut).map((sv) => (
                  <label
                    key={sv.maSv}
                    className={`flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors ${
                      selectedSvs.has(sv.maSv) ? 'bg-orange-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSvs.has(sv.maSv)}
                      onChange={() => {
                        setSelectedSvs((prev) => {
                          const next = new Set(prev);
                          next.has(sv.maSv) ? next.delete(sv.maSv) : next.add(sv.maSv);
                          return next;
                        });
                      }}
                      className="w-4 h-4 accent-orange-600"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{sv.hoTenSinhVien}</p>
                      <p className="text-xs text-gray-500">{sv.maSv}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="px-5 py-4 border-t bg-gray-50">
                <button
                  onClick={handleConfirmManualCheckout}
                  disabled={selectedSvs.size === 0 || manualCheckOutMutation.isPending}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                >
                  {manualCheckOutMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                    : <><LogOut className="w-4 h-4" /> Xác nhận checkout {selectedSvs.size > 0 ? `(${selectedSvs.size} SV)` : ''}</>}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Dynamic QR Presentation Modal ── */}
      {mode === 'DYNAMIC_QR' && (
        <DynamicQRDisplay
          maHoatDong={id}
          tenHoatDong={activity.tenHoatDong}
          onClose={() => setMode('VIEW')}
        />
      )}

      {/* ── Manual Attendance Panel ── */}
      {mode === 'MANUAL' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b bg-emerald-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-emerald-800">Điểm danh thủ công</h3>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                {notCheckedIn.length} sinh viên chưa điểm danh
              </span>
            </div>
            <span className="text-sm text-emerald-700 font-medium">
              Đã chọn: {selectedSvs.size}
            </span>
          </div>

          {notCheckedIn.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-300" />
              <p>Tất cả sinh viên đã điểm danh!</p>
            </div>
          ) : (
            <>
              {/* Search + Select all + note */}
              <div className="px-5 py-3 border-b bg-gray-50 flex flex-col gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Tìm tên, MSSV, lớp..."
                    value={manualSearchTerm}
                    onChange={(e) => setManualSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div className="flex flex-row gap-3 items-center">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-emerald-700 font-medium transition-colors"
                  >
                    {selectedSvs.size === filteredNotCheckedIn.length && filteredNotCheckedIn.length > 0
                      ? <CheckSquare className="w-4 h-4 text-emerald-600" />
                      : <Square className="w-4 h-4" />}
                    {selectedSvs.size === filteredNotCheckedIn.length && filteredNotCheckedIn.length > 0
                      ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                  <input
                    type="text"
                    placeholder="Ghi chú (tùy chọn)"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* Student list */}
              <div className="divide-y max-h-72 overflow-y-auto">
                {filteredNotCheckedIn.length === 0 && (
                  <div className="py-6 text-center text-gray-400 text-sm">
                    Không tìm thấy sinh viên phù hợp
                  </div>
                )}
                {filteredNotCheckedIn.map((sv) => (
                  <label
                    key={sv.maSv}
                    className={`flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors ${
                      selectedSvs.has(sv.maSv) ? 'bg-emerald-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSvs.has(sv.maSv)}
                      onChange={() => handleToggleSv(sv.maSv)}
                      className="w-4 h-4 accent-emerald-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{sv.hoTen}</p>
                      <p className="text-xs text-gray-500">{sv.maSv}</p>
                    </div>
                    {sv.lop && (
                      <span className="text-xs text-gray-400 flex-shrink-0">{sv.lop}</span>
                    )}
                  </label>
                ))}
              </div>

              {/* Confirm button */}
              <div className="px-5 py-4 border-t bg-gray-50">
                <button
                  onClick={handleConfirmManual}
                  disabled={selectedSvs.size === 0 || manualCheckInMutation.isPending}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  {manualCheckInMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Xác nhận điểm danh {selectedSvs.size > 0 ? `(${selectedSvs.size} SV)` : ''}</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Thêm SV thủ công theo MSSV (chỉ admin, luôn hiển thị khi HĐ đã kết thúc) ── */}
      <ThemSVTheoMSSVPanel maHoatDong={id} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['attendance', id] })} />

      {/* ── Table Section ── */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-md w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, MSSV, lớp..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">Tất cả</option>
              <option value="CHECKED_IN">Có mặt (đã checkout)</option>
              <option value="NO_CHECKOUT">Có check-in, chưa checkout</option>
              <option value="NOT_CHECKED_IN">Vắng mặt</option>
            </select>
            <button
              onClick={() => refetchList()}
              className="px-3 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              title="Làm mới"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-gray-100 border-b-2 border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-3 py-3 font-semibold text-center w-10">#</th>
                <th className="px-4 py-3 font-semibold">Sinh viên</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Đăng ký lúc</th>
                <th className="px-4 py-3 font-semibold">Check-in</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Check-out</th>
                <th className="px-4 py-3 font-semibold hidden xl:table-cell">Vị trí</th>
                <th className="px-4 py-3 font-semibold text-center">Trạng thái</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredList.length > 0 ? (
                filteredList.map((item, idx) => {
                  const rowCls = item.daDiemDanh && item.thoiGianCheckOut
                    ? 'hover:bg-green-50/40'
                    : item.daDiemDanh
                    ? 'hover:bg-orange-50/40'
                    : 'hover:bg-red-50/20';
                  return (
                  <tr key={item.maSv} className={`transition-colors ${rowCls}`}>
                    {/* # */}
                    <td className="px-3 py-3 text-center text-xs text-gray-400 font-mono">{idx + 1}</td>

                    {/* Sinh viên */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 text-sm">{item.hoTen}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.maSv}
                        {item.lop && <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium">{item.lop}</span>}
                      </p>
                    </td>

                    {/* Ngày đăng ký */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {item.ngayDangKy ? (
                        <span className="text-xs text-gray-500 tabular-nums">
                          {format(new Date(item.ngayDangKy), 'dd/MM HH:mm')}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>

                    {/* Check-in */}
                    <td className="px-4 py-3">
                      {item.thoiGianCheckIn ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900 tabular-nums">
                            {format(new Date(item.thoiGianCheckIn), 'HH:mm')}
                          </p>
                          <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            item.trangThaiCheckIn === 'DUNG_GIO'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.trangThaiCheckIn === 'DUNG_GIO' ? '✓ Đúng giờ' : `⚠ Trễ ${item.soPhutTre || 0}p`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Check-out */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      {item.thoiGianCheckOut ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900 tabular-nums">
                            {format(new Date(item.thoiGianCheckOut), 'HH:mm')}
                          </p>
                          {item.trangThaiCheckOut === 'VE_SOM' && (
                            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">
                              ⚠ Sớm {item.soPhutVeSom || 0}p
                            </span>
                          )}
                        </div>
                      ) : item.daDiemDanh ? (
                        <span className="text-xs text-orange-400">Chưa checkout</span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Vị trí check-in */}
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <LocationCell lat={item.latitude} lng={item.longitude} />
                    </td>

                    {/* Trạng thái */}
                    <td className="px-4 py-3 text-center">
                      {item.daDiemDanh && item.thoiGianCheckOut ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200 shadow-sm">
                          <CheckCircle className="w-3.5 h-3.5" /> Có mặt
                        </span>
                      ) : item.daDiemDanh ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold border border-orange-200 shadow-sm">
                          <Clock className="w-3.5 h-3.5" /> Check-in
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold border border-red-200 shadow-sm">
                          <XCircle className="w-3.5 h-3.5" /> Vắng
                        </span>
                      )}
                    </td>

                    {/* Ghi chú */}
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-[150px] truncate hidden lg:table-cell" title={item.ghiChu}>
                      {item.ghiChu || <span className="text-gray-200">—</span>}
                    </td>

                    {/* Xóa — chỉ hiện cho hoạt động không đăng ký */}
                    {activity.isKhongDangKy && (
                      <td className="px-2 py-3 text-center">
                        <button
                          onClick={async () => {
                            if (!window.confirm(`Xóa ${item.hoTen} (${item.maSv}) khỏi danh sách?`)) return;
                            try {
                              await diemDanhService.xoaKhoiDanhSachKhongDangKy(id, item.maSv);
                              toast.success('Đã xóa');
                              queryClient.invalidateQueries({ queryKey: ['attendance-status', id] });
                            } catch (err) {
                              toast.error(err?.response?.data?.message || err.message);
                            }
                          }}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Xóa khỏi danh sách"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-gray-400">
                    <UserCheck className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    Không tìm thấy sinh viên phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
          <span>Hiển thị {filteredList.length} / {attendanceList.length} sinh viên</span>
          <span className="text-green-600 font-medium">
            {stats.checkedIn}/{stats.total} có mặt
            {stats.total > 0 ? ` (${Math.round(stats.checkedIn / stats.total * 100)}%)` : ''}
            {stats.noCheckout > 0 && (
              <span className="text-orange-500 ml-2">· {stats.noCheckout} chưa checkout</span>
            )}
          </span>
        </div>
      </div>

      {/* Modal xuất danh sách PDF ký số */}
      {showXuatModal && activity?.maHoatDong && (
        <XuatDanhSachModal
          maHoatDong={activity.maHoatDong}
          onClose={() => setShowXuatModal(false)}
        />
      )}

      {/* Modal ban hành danh sách chính thức */}
      {showBanHanhModal && activity?.maHoatDong && (
        <XuatDanhSachModal
          maHoatDong={activity.maHoatDong}
          mode="BAN_HANH"
          onClose={() => setShowBanHanhModal(false)}
        />
      )}
    </div>
  );
}
