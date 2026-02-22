import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import jsQR from 'jsqr';
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
} from 'lucide-react';
import activityService from '../../services/activityService';
import diemDanhService from '../../services/diemDanhService';
import { format } from 'date-fns';

// ─── Time window helper ─────────────────────────────────────────────────────
function isAttendanceWindowOpen(activity) {
  if (!activity) return false;
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
function QRScannerPanel({ maHoatDong, onClose, onResult }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const cooldownRef = useRef(new Set());
  const [cameraError, setCameraError] = useState(null);
  const [isStarting, setIsStarting] = useState(true);
  const [lastScan, setLastScan] = useState(null); // { success, message, hoTen, time }

  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
  }, []);

  const scanLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

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
        // Remove from cooldown after 4s so the same QR can be re-scanned if needed
        setTimeout(() => cooldownRef.current.delete(code.data), 4000);
        handleQRDetected(code.data);
      }
    }

    animRef.current = requestAnimationFrame(scanLoop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maHoatDong]);

  const handleQRDetected = async (maQR) => {
    try {
      const result = await diemDanhService.scanQR(maQR, { thietBi: 'Web Browser - Admin' });
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
    let mounted = true;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (!mounted) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStarting(false);
        scanLoop();
      } catch (e) {
        if (mounted) setCameraError(e.name === 'NotAllowedError' ? 'Không được phép truy cập camera. Hãy cấp quyền camera.' : 'Không thể mở camera: ' + e.message);
        setIsStarting(false);
      }
    };
    startCamera();
    return () => {
      mounted = false;
      stopCamera();
    };
  }, [scanLoop, stopCamera]);

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
        {/* Scan overlay frame */}
        {!cameraError && !isStarting && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-52 h-52 border-2 border-green-400 rounded-lg opacity-80" style={{
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
            }} />
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Last scan result */}
      <div className="p-4 min-h-[80px]">
        {lastScan ? (
          <div className={`flex items-start gap-3 p-3 rounded-lg ${lastScan.success ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'}`}>
            {lastScan.success
              ? <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-400" />
              : <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-400" />}
            <div>
              <p className="font-semibold text-sm">{lastScan.success ? '✓ Điểm danh thành công' : '✗ Thất bại'}</p>
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
          <CameraOff className="w-4 h-4" /> Dừng quét QR
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ActivityAttendancePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [mode, setMode] = useState('VIEW'); // VIEW | QR | MANUAL
  const [selectedSvs, setSelectedSvs] = useState(new Set());
  const [manualNote, setManualNote] = useState('');
  const [qrScanCount, setQrScanCount] = useState(0);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: activity, isLoading: loadingActivity } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => activityService.getById(id),
  });

  const { data: attendanceList = [], isLoading: loadingList, refetch: refetchList } = useQuery({
    queryKey: ['attendance-status', id],
    queryFn: () => activityService.getAttendanceStatusList(id),
    refetchInterval: mode === 'QR' ? 5000 : false, // Auto-refresh during QR mode
  });

  const { data: notCheckedIn = [], refetch: refetchNotCheckedIn } = useQuery({
    queryKey: ['not-checked-in', id],
    queryFn: () => diemDanhService.getNotCheckedIn(id),
    enabled: mode === 'MANUAL',
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
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

  const stats = useMemo(() => ({
    total: attendanceList.length,
    checkedIn: attendanceList.filter((i) => i.daDiemDanh).length,
    notCheckedIn: attendanceList.filter((i) => !i.daDiemDanh).length,
  }), [attendanceList]);

  const filteredList = useMemo(() => attendanceList.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      item.hoTen?.toLowerCase().includes(q) ||
      item.maSv?.toLowerCase().includes(q) ||
      item.lop?.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filterStatus === 'CHECKED_IN') return item.daDiemDanh;
    if (filterStatus === 'NOT_CHECKED_IN') return !item.daDiemDanh;
    return true;
  }), [attendanceList, searchTerm, filterStatus]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleQRResult = useCallback((scanInfo) => {
    if (scanInfo.success) {
      setQrScanCount((c) => c + 1);
      queryClient.invalidateQueries({ queryKey: ['attendance-status', id] });
    }
  }, [queryClient, id]);

  const handleToggleSv = (maSv) => {
    setSelectedSvs((prev) => {
      const next = new Set(prev);
      next.has(maSv) ? next.delete(maSv) : next.add(maSv);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedSvs.size === notCheckedIn.length) {
      setSelectedSvs(new Set());
    } else {
      setSelectedSvs(new Set(notCheckedIn.map((s) => s.maSv)));
    }
  };

  const handleConfirmManual = () => {
    if (selectedSvs.size === 0) { toast.warn('Chưa chọn sinh viên nào'); return; }
    manualCheckInMutation.mutate({ maSvList: [...selectedSvs], ghiChu: manualNote || 'Điểm danh thủ công' });
  };

  const handleSwitchMode = (newMode) => {
    if (newMode === mode) { setMode('VIEW'); return; }
    setMode(newMode);
    if (newMode === 'MANUAL') {
      setSelectedSvs(new Set());
      refetchNotCheckedIn();
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
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">{activity.tenHoatDong}</h1>
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
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex gap-3 flex-shrink-0">
            <div className="bg-white border rounded-lg p-3 px-4 shadow-sm text-center">
              <p className="text-xs text-gray-500 font-semibold uppercase">Tổng</p>
              <p className="text-xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-lg p-3 px-4 shadow-sm text-center">
              <p className="text-xs text-green-600 font-semibold uppercase">Đã điểm danh</p>
              <p className="text-xl font-bold text-green-700">{stats.checkedIn}</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 px-4 shadow-sm text-center">
              <p className="text-xs text-red-600 font-semibold uppercase">Chưa điểm danh</p>
              <p className="text-xl font-bold text-red-700">{stats.notCheckedIn}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* QR Scan Button */}
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
            {mode === 'QR' ? 'Đang quét QR — Nhấn để dừng' : 'Điểm danh bằng QR'}
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

        {/* Manual Attendance Button */}
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

      {/* ── QR Scanner Panel ── */}
      {mode === 'QR' && (
        <QRScannerPanel
          maHoatDong={id}
          onClose={() => setMode('VIEW')}
          onResult={handleQRResult}
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
              {/* Select all + note */}
              <div className="px-5 py-3 border-b bg-gray-50 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-emerald-700 font-medium transition-colors"
                >
                  {selectedSvs.size === notCheckedIn.length
                    ? <CheckSquare className="w-4 h-4 text-emerald-600" />
                    : <Square className="w-4 h-4" />}
                  {selectedSvs.size === notCheckedIn.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
                <input
                  type="text"
                  placeholder="Ghi chú (tùy chọn)"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* Student list */}
              <div className="divide-y max-h-72 overflow-y-auto">
                {notCheckedIn.map((sv) => (
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

      {/* ── Table Section ── */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b flex flex-col md:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
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
              <option value="CHECKED_IN">Đã điểm danh</option>
              <option value="NOT_CHECKED_IN">Chưa điểm danh</option>
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
            <thead className="bg-gray-50 border-b text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-semibold">Sinh viên</th>
                <th className="p-4 font-semibold">Lớp</th>
                <th className="p-4 font-semibold">Check-in</th>
                <th className="p-4 font-semibold">Check-out</th>
                <th className="p-4 font-semibold text-center">Trạng thái</th>
                <th className="p-4 font-semibold">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredList.length > 0 ? (
                filteredList.map((item) => (
                  <tr key={item.maSv} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-gray-900">{item.hoTen}</p>
                      <p className="text-xs text-gray-400">{item.maSv}</p>
                    </td>
                    <td className="p-4 text-gray-600">{item.lop || '—'}</td>

                    <td className="p-4">
                      {item.thoiGianCheckIn ? (
                        <div>
                          <p className="font-medium text-gray-900">
                            {format(new Date(item.thoiGianCheckIn), 'HH:mm')}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.trangThaiCheckIn === 'DUNG_GIO'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.trangThaiCheckIn === 'DUNG_GIO'
                              ? 'Đúng giờ'
                              : `Trễ ${item.soPhutTre || 0}p`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    <td className="p-4">
                      {item.thoiGianCheckOut ? (
                        <div>
                          <p className="font-medium text-gray-900">
                            {format(new Date(item.thoiGianCheckOut), 'HH:mm')}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.trangThaiCheckOut === 'DUNG_GIO'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {item.trangThaiCheckOut === 'DUNG_GIO'
                              ? 'Đúng giờ'
                              : `Sớm ${item.soPhutVeSom || 0}p`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      {item.daDiemDanh ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
                          <CheckCircle className="w-3.5 h-3.5" /> Đã tham gia
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium border border-gray-200">
                          <XCircle className="w-3.5 h-3.5" /> Chưa tham gia
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-xs text-gray-400 max-w-[160px] truncate">
                      {item.ghiChu || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-400">
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
            {stats.checkedIn}/{stats.total} đã điểm danh
            {stats.total > 0 ? ` (${Math.round(stats.checkedIn / stats.total * 100)}%)` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
