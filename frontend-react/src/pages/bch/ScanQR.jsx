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
  Activity,
} from 'lucide-react';
import { toast } from 'react-toastify';
import attendanceService from '../../services/attendanceService';
import activityService from '../../services/activityService';

const SCAN_INTERVAL_MS = 500; // Quét mỗi 500ms

const BCHScanQR = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [scanResult, setScanResult] = useState(null); // { success, message, hoTen }
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanHistory, setScanHistory] = useState([]); // Lịch sử quét trong phiên

  // Lấy danh sách hoạt động đang diễn ra
  const { data: ongoingActivities = [] } = useQuery({
    queryKey: ['scan-qr-ongoing'],
    queryFn: () => activityService.getOngoing(),
    staleTime: 60 * 1000,
  });

  // Dừng camera
  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Xử lý khi quét được QR
  const handleQRDetected = useCallback(
    async (qrData) => {
      if (isProcessing || !selectedActivity) return;

      setIsProcessing(true);
      setScanResult(null);

      try {
        const response = await attendanceService.scanQRCode({
          maQR: qrData,
          maHoatDong: selectedActivity,
        });

        const success = response?.success !== false;
        const msg = response?.message || (success ? 'Điểm danh thành công' : 'Điểm danh thất bại');
        const hoTen = response?.data?.hoTen || response?.data?.tenSinhVien || '';

        setScanResult({ success, message: msg, hoTen });

        const historyEntry = {
          id: Date.now(),
          time: new Date().toLocaleTimeString('vi-VN'),
          success,
          message: msg,
          hoTen,
        };
        setScanHistory((prev) => [historyEntry, ...prev].slice(0, 20));

        if (success) {
          toast.success(msg);
        } else {
          toast.warning(msg);
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Lỗi khi điểm danh';
        setScanResult({ success: false, message: msg, hoTen: '' });
        toast.error(msg);
      } finally {
        // Chờ 2 giây rồi mới cho quét tiếp
        setTimeout(() => {
          setIsProcessing(false);
          setScanResult(null);
        }, 2000);
      }
    },
    [isProcessing, selectedActivity]
  );

  // Bắt đầu quét từ canvas
  const startScanning = useCallback(() => {
    intervalRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code?.data) {
        handleQRDetected(code.data);
      }
    }, SCAN_INTERVAL_MS);
  }, [handleQRDetected]);

  // Mở camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Camera sau (mobile)
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsStreaming(true);
      startScanning();
    } catch (err) {
      setCameraError('Không thể truy cập camera. Vui lòng cấp quyền camera cho trình duyệt.');
    }
  };

  // Cleanup khi unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

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

      {/* Chọn hoạt động */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Chọn hoạt động điểm danh <span className="text-red-500">*</span>
        </label>
        {ongoingActivities.length === 0 ? (
          <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Không có hoạt động nào đang diễn ra
          </div>
        ) : (
          <select
            value={selectedActivity}
            onChange={(e) => {
              setSelectedActivity(e.target.value);
              setScanHistory([]);
              setScanResult(null);
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
        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${isStreaming ? 'block' : 'hidden'}`}
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Overlay khi chưa stream */}
          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <Camera className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-400 text-sm">Camera chưa bật</p>
              </div>
            </div>
          )}

          {/* QR finder overlay */}
          {isStreaming && !isProcessing && !scanResult && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-white rounded-xl opacity-60">
                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white rounded-tl" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white rounded-tr" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white rounded-bl" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white rounded-br" />
              </div>
            </div>
          )}

          {/* Scan result overlay */}
          {scanResult && (
            <div className={`absolute inset-0 flex items-center justify-center ${
              scanResult.success ? 'bg-green-900/80' : 'bg-red-900/80'
            }`}>
              <div className="text-center text-white">
                {scanResult.success ? (
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-3 text-green-300" />
                ) : (
                  <XCircle className="w-16 h-16 mx-auto mb-3 text-red-300" />
                )}
                {scanResult.hoTen && (
                  <p className="text-xl font-bold mb-1">{scanResult.hoTen}</p>
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

        {/* Camera error */}
        {cameraError && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {cameraError}
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
          <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
            {scanHistory.map((entry) => (
              <div key={entry.id} className="px-5 py-3 flex items-center gap-3">
                {entry.success ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  {entry.hoTen && (
                    <p className="text-sm font-medium text-gray-900">{entry.hoTen}</p>
                  )}
                  <p className="text-xs text-gray-500">{entry.message}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{entry.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BCHScanQR;
