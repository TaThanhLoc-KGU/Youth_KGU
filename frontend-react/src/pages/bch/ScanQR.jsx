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
  WifiOff,
  Loader2,
  Zap,
  ScanLine,
  Info,
} from 'lucide-react';
import { toast } from 'react-toastify';
import attendanceService from '../../services/attendanceService';
import activityService from '../../services/activityService';

// Canvas resolution cho WASM / jsQR path
// 240px = ít pixel hơn 320px ~44%, QR vẫn nhận được vì có error correction
const PROCESS_WIDTH = 240;
const COOLDOWN_MS   = 1200;
const DEDUPE_MS     = 3000;

// Engine labels + styles
const ENGINE_UI = {
  native: { label: 'Native API',  title: 'BarcodeDetector (native — ~0.3s/mã)',    cls: 'bg-green-50 text-green-700 border-green-200' },
  wasm:   { label: 'WASM',        title: 'zxing-wasm (WebAssembly — ~0.5-1s/mã)',  cls: 'bg-blue-50  text-blue-700  border-blue-200'  },
  js:     { label: 'JS Fallback', title: 'jsQR (JavaScript thuần — ~3-5s/mã)',     cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const BCHScanQR = () => {
  // ── Camera refs ─────────────────────────────────────────────────────
  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const streamRef    = useRef(null);
  const rafRef       = useRef(null);
  const cooldownRef  = useRef(false);
  const lastQRRef    = useRef({ code: null, at: 0 });

  // ── Detector refs ────────────────────────────────────────────────────
  const detectorRef  = useRef(null); // BarcodeDetector instance (native)
  const zxingFnRef   = useRef(null); // readBarcodesFromImageData (wasm)
  const detectingRef = useRef(false);

  // ── Hardware scanner ref ─────────────────────────────────────────────
  const scannerInputRef = useRef(null);

  // ── State ─────────────────────────────────────────────────────────────
  const [scanMode, setScanMode]               = useState('camera'); // 'camera' | 'scanner'
  const [isStreaming, setIsStreaming]           = useState(false);
  const [cameraError, setCameraError]           = useState(null);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [scanResult, setScanResult]             = useState(null);
  const [isProcessing, setIsProcessing]         = useState(false);
  const [scanHistory, setScanHistory]           = useState([]);
  const [networkError, setNetworkError]         = useState(false);
  const [brightness, setBrightness]             = useState(100);
  const [scanEngine, setScanEngine]             = useState(null); // 'native' | 'wasm' | 'js' | null
  const [scannerInput, setScannerInput]         = useState('');

  // ── Khởi tạo engine theo thứ tự ưu tiên: native → wasm → js ──────────
  useEffect(() => {
    async function initWasm() {
      try {
        const { readBarcodesFromImageData } = await import('zxing-wasm/reader');
        zxingFnRef.current = readBarcodesFromImageData;
        setScanEngine('wasm');
      } catch {
        setScanEngine('js'); // jsQR fallback
      }
    }

    if ('BarcodeDetector' in window) {
      BarcodeDetector.getSupportedFormats()
        .then((formats) => {
          if (formats.includes('qr_code')) {
            detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] });
            setScanEngine('native');
          } else {
            initWasm();
          }
        })
        .catch(() => initWasm());
    } else {
      initWasm();
    }
  }, []);

  // ── Auto-focus input khi chuyển sang chế độ máy quét ─────────────────
  useEffect(() => {
    if (scanMode === 'scanner') {
      setTimeout(() => scannerInputRef.current?.focus(), 100);
    }
  }, [scanMode]);

  // ── Danh sách hoạt động đang diễn ra ─────────────────────────────────
  const { data: ongoingActivities = [] } = useQuery({
    queryKey: ['scan-qr-ongoing'],
    queryFn: () => activityService.getOngoing(),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  // ── Dừng camera ──────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    cooldownRef.current  = false;
    detectingRef.current = false;
    setIsStreaming(false);
    setScanResult(null);
  }, []);

  // ── Xử lý QR detected (chung cho cả 3 engine + hardware scanner) ─────
  const handleQRDetected = useCallback(
    async (qrData) => {
      if (!selectedActivity) {
        toast.warning('Vui lòng chọn hoạt động trước!');
        return;
      }
      const now = Date.now();
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
        const msg     = response?.message || (success ? 'Điểm danh thành công' : 'Điểm danh thất bại');
        const hoTen   = response?.data?.hoTen || response?.data?.tenSinhVien || '';

        setScanResult({ success, message: msg, hoTen });
        setScanHistory((prev) =>
          [{ id: now, time: new Date().toLocaleTimeString('vi-VN'), success, message: msg, hoTen }, ...prev].slice(0, 30),
        );
        if (success) toast.success(msg);
        else toast.warning(msg);
      } catch (err) {
        const isNetwork = !err.response;
        const msg = isNetwork
          ? 'Mất kết nối máy chủ — kiểm tra mạng và thử lại'
          : err.response?.data?.message || 'Lỗi khi điểm danh';
        setNetworkError(isNetwork);
        setScanResult({ success: false, message: msg, hoTen: '' });
        if (isNetwork) toast.error('Mất kết nối máy chủ');
        else toast.warning(msg);
      } finally {
        setIsProcessing(false);
        setTimeout(() => {
          cooldownRef.current = false;
          setScanResult(null);
          if (scanMode === 'scanner') scannerInputRef.current?.focus();
        }, COOLDOWN_MS);
      }
    },
    [selectedActivity, scanMode],
  );

  // ── Vòng lặp quét (RAF) ───────────────────────────────────────────────
  const scanLoop = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    if (!cooldownRef.current) {
      if (detectorRef.current) {
        // ── Tầng 1: Native BarcodeDetector (gọi thẳng video element) ──
        if (!detectingRef.current) {
          detectingRef.current = true;
          detectorRef.current
            .detect(video)
            .then((barcodes) => {
              detectingRef.current = false;
              if (barcodes.length > 0) handleQRDetected(barcodes[0].rawValue);
            })
            .catch(() => { detectingRef.current = false; });
        }
      } else {
        // Tầng 2 & 3 đều dùng canvas — scale xuống PROCESS_WIDTH (320px)
        const canvas = canvasRef.current;
        if (canvas) {
          const scale   = Math.min(1, PROCESS_WIDTH / video.videoWidth);
          canvas.width  = Math.round(video.videoWidth  * scale);
          canvas.height = Math.round(video.videoHeight * scale);
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          if (zxingFnRef.current) {
            // ── Tầng 2: zxing-wasm (WebAssembly — async) ──────────────
            if (!detectingRef.current) {
              detectingRef.current = true;
              zxingFnRef.current(imageData, { formats: ['QRCode'], tryHarder: false })
                .then((results) => {
                  detectingRef.current = false;
                  if (results.length > 0) handleQRDetected(results[0].text);
                })
                .catch(() => { detectingRef.current = false; });
            }
          } else {
            // ── Tầng 3: jsQR (JavaScript thuần — sync, ultimate fallback)
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });
            if (code?.data) handleQRDetected(code.data);
          }
        }
      }
    }

    rafRef.current = requestAnimationFrame(scanLoop);
  }, [handleQRDetected]);

  // ── Bật camera ───────────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError(null);
    setNetworkError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 }, height: { ideal: 720 },
          frameRate: { ideal: 30 },
          focusMode: { ideal: 'continuous' },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        videoRef.current.onloadedmetadata = () => {
          setIsStreaming(true);
          rafRef.current = requestAnimationFrame(scanLoop);
        };
      }
    } catch (err) {
      if (err.name === 'NotAllowedError')
        setCameraError('Trình duyệt bị từ chối quyền camera. Vào Cài đặt → Quyền riêng tư → Camera để cấp phép.');
      else if (err.name === 'NotFoundError')
        setCameraError('Không tìm thấy camera nào trên thiết bị này.');
      else
        setCameraError(`Không thể bật camera: ${err.message}`);
    }
  };

  // ── Chuyển chế độ ────────────────────────────────────────────────────
  const handleModeChange = (mode) => {
    if (mode === scanMode) return;
    if (isStreaming) stopCamera();
    setScanResult(null);
    setScannerInput('');
    lastQRRef.current = { code: null, at: 0 };
    setScanMode(mode);
  };

  // ── Input từ máy quét vật lý ─────────────────────────────────────────
  const handleScannerKeyDown = (e) => {
    if (e.key === 'Enter' && scannerInput.trim() && !isProcessing) {
      const val = scannerInput.trim();
      setScannerInput('');
      handleQRDetected(val);
    }
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Render ────────────────────────────────────────────────────────────
  const engineInfo = scanEngine ? ENGINE_UI[scanEngine] : null;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-blue-600" /> Quét QR Điểm danh
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Hướng camera hoặc dùng máy quét vào mã QR của sinh viên
          </p>
        </div>

        {/* Engine badge — chỉ ở chế độ camera */}
        {scanMode === 'camera' && engineInfo && (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border cursor-default ${engineInfo.cls}`}
            title={engineInfo.title}
          >
            <Zap className="w-3 h-3" />
            {engineInfo.label}
          </span>
        )}
      </div>

      {/* Network error banner */}
      {networkError && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          Mất kết nối máy chủ. Kiểm tra mạng và thử lại.
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-gray-50 p-1 gap-1">
        <button
          onClick={() => handleModeChange('camera')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
            scanMode === 'camera'
              ? 'bg-white text-blue-700 shadow-sm border border-blue-100'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Camera className="w-4 h-4" /> Dùng camera
        </button>
        <button
          onClick={() => handleModeChange('scanner')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
            scanMode === 'scanner'
              ? 'bg-white text-blue-700 shadow-sm border border-blue-100'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ScanLine className="w-4 h-4" /> Máy quét QR
        </button>
      </div>

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
              setScannerInput('');
              lastQRRef.current = { code: null, at: 0 };
              if (scanMode === 'scanner') setTimeout(() => scannerInputRef.current?.focus(), 50);
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

      {/* ── CHẾ ĐỘ CAMERA ───────────────────────────────────────────────── */}
      {scanMode === 'camera' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${isStreaming ? 'block' : 'hidden'}`}
              playsInline muted
              style={{ filter: `brightness(${brightness}%)` }}
            />
            {/* Canvas ẩn — dùng cho WASM & jsQR paths */}
            <canvas ref={canvasRef} className="hidden" />

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

            {isProcessing && !scanResult && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              </div>
            )}

            {scanResult && (
              <div className={`absolute inset-0 flex items-center justify-center ${scanResult.success ? 'bg-green-900/85' : 'bg-red-900/85'}`}>
                <div className="text-center text-white px-6">
                  {scanResult.success
                    ? <CheckCircle2 className="w-16 h-16 mx-auto mb-3 text-green-300" />
                    : <XCircle className="w-16 h-16 mx-auto mb-3 text-red-300" />}
                  {scanResult.hoTen && <p className="text-2xl font-bold mb-1">{scanResult.hoTen}</p>}
                  <p className="text-sm opacity-90">{scanResult.message}</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 flex gap-3">
            {!isStreaming ? (
              <button
                onClick={startCamera} disabled={!selectedActivity}
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

          {isStreaming && (
            <div className="px-4 py-2 flex items-center gap-3 border-t border-gray-50">
              <span className="text-xs text-gray-400 w-16 flex-shrink-0">Độ sáng</span>
              <input
                type="range" min="40" max="150" value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <span className="text-xs text-gray-400 w-8 text-right">{brightness}%</span>
            </div>
          )}

          {cameraError && (
            <div className="px-4 pb-4">
              <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CHẾ ĐỘ MÁY QUÉT VẬT LÝ ─────────────────────────────────────── */}
      {scanMode === 'scanner' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-start gap-2 text-blue-700 text-xs bg-blue-50 border-b border-blue-100 px-4 py-3">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Cắm máy quét QR vào máy tính qua USB hoặc kết nối Bluetooth.
              Ô bên dưới cần được chọn (click vào nếu chưa focus). Quét mã QR → máy tự gửi dữ liệu và Enter.
            </span>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vùng nhận dữ liệu máy quét
              </label>
              <div className="relative">
                <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                <input
                  ref={scannerInputRef}
                  type="text"
                  value={scannerInput}
                  onChange={(e) => setScannerInput(e.target.value)}
                  onKeyDown={handleScannerKeyDown}
                  placeholder={
                    !selectedActivity ? 'Chọn hoạt động trước...'
                    : isProcessing ? 'Đang xử lý...'
                    : 'Đang chờ quét mã QR...'
                  }
                  disabled={!selectedActivity || isProcessing}
                  autoComplete="off"
                  className={`w-full pl-10 pr-4 py-3 text-sm border-2 rounded-xl transition-all focus:outline-none ${
                    !selectedActivity || isProcessing
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-blue-300 bg-blue-50/30 focus:border-blue-500 focus:bg-white'
                  }`}
                />
                {selectedActivity && !isProcessing && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-green-600">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    Sẵn sàng
                  </span>
                )}
                {isProcessing && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                )}
              </div>
            </div>

            {scanResult && (
              <div className={`flex items-center gap-3 rounded-xl p-4 border ${
                scanResult.success
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {scanResult.success
                  ? <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0" />
                  : <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />}
                <div>
                  {scanResult.hoTen && <p className="font-bold text-base">{scanResult.hoTen}</p>}
                  <p className="text-sm">{scanResult.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lịch sử quét */}
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
                {entry.success
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
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
