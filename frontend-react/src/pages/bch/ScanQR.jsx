import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import jsQR from 'jsqr';
import {
  QrCode,
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import attendanceService from '../../services/attendanceService';
import activityService from '../../services/activityService';

// Kích thước canvas xử lý — 480px đủ để jsQR nhận QR code, xử lý nhanh hơn 640
const PROCESS_WIDTH = 480;
// Thời gian chờ sau mỗi lần quét (ms)
const COOLDOWN_MS = 1200;
// Thời gian chống trùng QR (ms) — cùng 1 mã trong khoảng này bị bỏ qua
const DEDUPE_MS = 3000;

const BCHScanQR = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);            // requestAnimationFrame handle
  const cooldownRef = useRef(false);      // đang trong cooldown sau lần quét
  const lastQRRef = useRef({ code: null, at: 0 }); // chống trùng QR

  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [scanResult, setScanResult] = useState(null); // { success, message, hoTen }
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [networkError, setNetworkError] = useState(false);
  const [brightness, setBrightness] = useState(100);

  const { data: ongoingActivities = [] } = useQuery({
    queryKey: ['scan-qr-ongoing'],
    queryFn: () => activityService.getOngoing(),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    cooldownRef.current = false;
    setIsStreaming(false);
    setScanResult(null);
  }, []);

  const handleQRDetected = useCallback(
    async (qrData) => {
      if (!selectedActivity) return;

      const now = Date.now();
      // Bỏ qua nếu cùng mã QR trong vòng DEDUPE_MS
      if (lastQRRef.current.code === qrData && now - lastQRRef.current.at < DEDUPE_MS) return;
      lastQRRef.current = { code: qrData, at: now };

      cooldownRef.current = true;
      setIsProcessing(true);
      setScanResult(null);
      setNetworkError(false);

      try {
        const response = await attendanceService.scanQRCode({
          maQR: qrData,
          maHoatDong: selectedActivity,
        });

        const success = response?.success !== false;
        const msg = response?.message || (success ? 'Điểm danh thành công' : 'Điểm danh thất bại');
        const hoTen = response?.data?.hoTen || response?.data?.tenSinhVien || '';

        setScanResult({ success, message: msg, hoTen });
        setScanHistory((prev) => [
          { id: now, time: new Date().toLocaleTimeString('vi-VN'), success, message: msg, hoTen },
          ...prev,
        ].slice(0, 30));

        if (success) toast.success(msg);
        else toast.warning(msg);
      } catch (err) {
        const isNetwork = !err.response;
        const msg = isNetwork
          ? 'Mất kết nối máy chủ — kiểm tra mạng và thử lại'
          : (err.response?.data?.message || 'Lỗi khi điểm danh');

        setNetworkError(isNetwork);
        setScanResult({ success: false, message: msg, hoTen: '' });
        if (isNetwork) toast.error('Mất kết nối máy chủ');
        else toast.warning(msg);
      } finally {
        setIsProcessing(false);
        setTimeout(() => {
          cooldownRef.current = false;
          setScanResult(null);
        }, COOLDOWN_MS);
      }
    },
    [selectedActivity]
  );

  // Vòng lặp quét dùng requestAnimationFrame (mượt hơn setInterval)
  const scanLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    if (!cooldownRef.current) {
      // Scale canvas xuống để jsQR xử lý nhanh hơn
      const scale = Math.min(1, PROCESS_WIDTH / video.videoWidth);
      canvas.width  = Math.round(video.videoWidth  * scale);
      canvas.height = Math.round(video.videoHeight * scale);

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert', // tăng tốc: bỏ qua thử màu đảo
      });

      if (code?.data) {
        handleQRDetected(code.data);
      }
    }

    rafRef.current = requestAnimationFrame(scanLoop);
  }, [handleQRDetected]);

  const startCamera = async () => {
    setCameraError(null);
    setNetworkError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // camera sau trên mobile
          width:  { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          focusMode: { ideal: 'continuous' },   // auto-focus (nếu hỗ trợ)
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        // Chờ video sẵn sàng rồi mới bắt đầu scan loop
        videoRef.current.onloadedmetadata = () => {
          setIsStreaming(true);
          rafRef.current = requestAnimationFrame(scanLoop);
        };
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Trình duyệt bị từ chối quyền camera. Vào Cài đặt → Quyền riêng tư → Camera để cấp phép.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('Không tìm thấy camera nào trên thiết bị này.');
      } else {
        setCameraError(`Không thể bật camera: ${err.message}`);
      }
    }
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <QrCode className="w-6 h-6 text-blue-600" /> Quét QR Điểm danh
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Hướng camera vào mã QR của sinh viên để điểm danh
        </p>
      </div>

      {/* Network error banner */}
      {networkError && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>Mất kết nối máy chủ. Kiểm tra mạng và thử lại.</span>
        </div>
      )}

      {/* Chọn hoạt động */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Chọn hoạt động điểm danh <span className="text-red-500">*</span>
        </label>
        {ongoingActivities.length === 0 ? (
          <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Không có hoạt động nào đang diễn ra hôm nay
          </div>
        ) : (
          <select
            value={selectedActivity}
            onChange={(e) => {
              setSelectedActivity(e.target.value);
              setScanHistory([]);
              setScanResult(null);
              lastQRRef.current = { code: null, at: 0 };
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Chọn hoạt động --</option>
            {ongoingActivities.map((act) => (
              <option key={act.maHoatDong} value={act.maHoatDong}>
                {act.tenHoatDong}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Camera Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Camera view */}
        <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${isStreaming ? 'block' : 'hidden'}`}
            playsInline
            muted
            style={{ filter: `brightness(${brightness}%)` }}
          />
          {/* Canvas ẩn dùng để xử lý jsQR */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Overlay khi chưa stream */}
          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <Camera className="w-16 h-16 mx-auto mb-3 text-gray-500" />
                <p className="text-gray-400 text-sm">
                  {selectedActivity ? 'Nhấn "Bật camera" để bắt đầu quét' : 'Chọn hoạt động trước'}
                </p>
              </div>
            </div>
          )}

          {/* Scanning beam — toàn khung, không cần căn chỉnh */}
          {isStreaming && !isProcessing && !scanResult && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <style>{`
                @keyframes qr-sweep {
                  0%   { top: 5%;  opacity: 0; }
                  8%   { opacity: 1; }
                  92%  { opacity: 1; }
                  100% { top: 95%; opacity: 0; }
                }
              `}</style>
              <div
                className="absolute left-4 right-4 h-px"
                style={{
                  background: 'linear-gradient(90deg, transparent, #60a5fa, #93c5fd, #60a5fa, transparent)',
                  boxShadow: '0 0 8px 2px rgba(96,165,250,0.6)',
                  animation: 'qr-sweep 2.2s ease-in-out infinite',
                }}
              />
              <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white text-xs bg-black/40 px-3 py-1 rounded-full whitespace-nowrap">
                Hướng camera vào mã QR
              </p>
            </div>
          )}

          {/* Processing spinner */}
          {isProcessing && !scanResult && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
          )}

          {/* Scan result overlay */}
          {scanResult && (
            <div className={`absolute inset-0 flex items-center justify-center transition-colors ${
              scanResult.success ? 'bg-green-900/85' : 'bg-red-900/85'
            }`}>
              <div className="text-center text-white px-6">
                {scanResult.success ? (
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-3 text-green-300" />
                ) : (
                  <XCircle className="w-16 h-16 mx-auto mb-3 text-red-300" />
                )}
                {scanResult.hoTen && (
                  <p className="text-2xl font-bold mb-1">{scanResult.hoTen}</p>
                )}
                <p className="text-sm opacity-90">{scanResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Camera controls */}
        <div className="p-4 flex gap-3">
          {!isStreaming ? (
            <button
              onClick={startCamera}
              disabled={!selectedActivity}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              <Camera className="w-4 h-4" />
              {!selectedActivity ? 'Chọn hoạt động trước' : 'Bật camera'}
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition"
            >
              <CameraOff className="w-4 h-4" /> Tắt camera
            </button>
          )}
        </div>

        {/* Brightness control */}
        {isStreaming && (
          <div className="px-4 py-2 flex items-center gap-3 border-t border-gray-50">
            <span className="text-xs text-gray-400 w-16 flex-shrink-0">Độ sáng</span>
            <input
              type="range"
              min="40"
              max="150"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="flex-1 accent-blue-500"
            />
            <span className="text-xs text-gray-400 w-8 text-right">{brightness}%</span>
          </div>
        )}

        {/* Camera error */}
        {cameraError && (
          <div className="px-4 pb-4">
            <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          </div>
        )}
      </div>

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">
              Lịch sử quét ({scanHistory.length})
            </h3>
            <button
              onClick={() => setScanHistory([])}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Xóa
            </button>
          </div>
          <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
            {scanHistory.map((entry) => (
              <div key={entry.id} className="px-5 py-3 flex items-center gap-3">
                {entry.success ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  {entry.hoTen && (
                    <p className="text-sm font-medium text-gray-900 truncate">{entry.hoTen}</p>
                  )}
                  <p className="text-xs text-gray-500 truncate">{entry.message}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums">{entry.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BCHScanQR;
