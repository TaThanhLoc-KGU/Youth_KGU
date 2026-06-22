import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, MapPin, CheckCircle, XCircle, Loader2, CameraOff, AlertTriangle } from 'lucide-react';
import jsQR from 'jsqr';
import { toast } from 'react-toastify';
import diemDanhService from '../../services/diemDanhService';

const SelfAttendanceScanner = () => {
  const [cameraState, setCameraState] = useState('idle'); // idle | starting | scanning | done
  const [gpsState, setGpsState]       = useState('pending'); // pending | ok | denied | unavailable
  const [result, setResult]           = useState(null);  // { success, message, data }
  const [loading, setLoading]         = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const streamRef    = useRef(null);
  const animRef      = useRef(null);
  // Dùng ref thay state để tránh stale-closure trong requestAnimationFrame
  const isActiveRef  = useRef(false);
  const processedRef = useRef(false);
  const locationRef  = useRef(null); // ref cho GPS — dùng khi submit

  // ── GPS: lấy khi mount — BẮT BUỘC để tránh giả mạo vị trí ─────────────
  useEffect(() => {
    if (!('geolocation' in navigator)) { setGpsState('denied'); return; }
    setGpsState('pending');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locationRef.current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setGpsState('ok');
      },
      (err) => {
        console.warn('GPS error:', err.code, err.message);
        if (err.code === 1) {
          // PERMISSION_DENIED — người dùng từ chối, phải yêu cầu lại
          setGpsState('denied');
        } else {
          // POSITION_UNAVAILABLE (2) hoặc TIMEOUT (3) — thiết bị không có GPS (laptop/PC)
          // Vẫn cho phép quét, backend nhận null coords
          setGpsState('unavailable');
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 },
    );
    return () => stopCamera();
  }, []); // eslint-disable-line

  // ── Dừng camera ──────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    isActiveRef.current = false;
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraState((s) => (s === 'scanning' || s === 'starting' ? 'idle' : s));
  }, []);

  // ── Vòng lặp quét QR — đọc từ ref, tránh stale closure ──────────────────
  const tick = useCallback(() => {
    if (!isActiveRef.current || processedRef.current) return;

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (video.readyState >= video.HAVE_ENOUGH_DATA) {
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imgData.data, imgData.width, imgData.height, {
        inversionAttempts: 'dontInvert',
      });
      if (code?.data) {
        processedRef.current = true;
        handleScan(code.data);
        return;
      }
    }

    animRef.current = requestAnimationFrame(tick);
  }, []); // eslint-disable-line

  // ── Mở camera ────────────────────────────────────────────────────────────
  const startCamera = async () => {
    // Chỉ block khi người dùng CHỦ ĐỘNG từ chối GPS (code 1)
    // unavailable = thiết bị không có chip GPS (laptop/PC) → vẫn cho quét, backend nhận null
    if (gpsState === 'denied') {
      toast.error('Vui lòng cấp quyền vị trí cho trang web trong cài đặt trình duyệt, sau đó tải lại trang!');
      return;
    }
    if (gpsState === 'pending') {
      toast.error('Đang lấy vị trí GPS, vui lòng đợi giây lát…');
      return;
    }

    setCameraError(null);
    setResult(null);
    processedRef.current = false;
    setCameraState('starting');

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Trình duyệt không hỗ trợ camera. Hãy dùng Chrome/Safari mới nhất.');
      setCameraState('idle');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) { stopCamera(); return; }

      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('muted', 'true');

      await video.play();

      isActiveRef.current = true;
      setCameraState('scanning');
      animRef.current = requestAnimationFrame(tick);
    } catch (err) {
      stopCamera();
      const msg =
        err.name === 'NotAllowedError'
          ? 'Camera bị chặn. Vào cài đặt trình duyệt → cho phép Camera → thử lại.'
          : err.name === 'NotFoundError'
          ? 'Không tìm thấy camera. Kiểm tra lại thiết bị.'
          : err.name === 'NotReadableError'
          ? 'Camera đang được dùng bởi ứng dụng khác.'
          : `Lỗi camera: ${err.message}`;
      setCameraError(msg);
      toast.error(msg);
    }
  };

  // ── Xử lý sau khi quét được QR ───────────────────────────────────────────
  const handleScan = async (qrData) => {
    stopCamera();
    setLoading(true);
    setCameraState('done');

    try {
      const loc = locationRef.current;
      const res = await diemDanhService.selfScanQR(
        qrData,
        loc?.latitude ?? null,
        loc?.longitude ?? null,
      );
      setResult({ success: true, message: res.message || 'Điểm danh thành công!', data: res.data });
      toast.success('Điểm danh thành công!');
    } catch (error) {
      const msg = error.response?.data?.message || 'Mã QR không hợp lệ hoặc đã hết hạn.';
      setResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const retryScan = () => {
    setResult(null);
    setCameraState('idle');
    startCamera();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const isScanning = cameraState === 'scanning';
  const isStarting = cameraState === 'starting';

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 px-4 py-4 text-white text-center">
        <h2 className="text-xl font-bold">Điểm danh Tự phục vụ</h2>
        <p className="text-sm opacity-90 mt-0.5">Quét mã QR do BTC cung cấp</p>
      </div>

      <div className="p-5">
        {/* GPS indicator */}
        <div className={`flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg border text-xs font-medium ${
          gpsState === 'ok'          ? 'bg-green-50 border-green-200 text-green-700'  :
          gpsState === 'denied'      ? 'bg-red-50 border-red-200 text-red-700'        :
          gpsState === 'unavailable' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                       'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1">
            {gpsState === 'ok'          && 'GPS đã bật — vị trí được xác minh khi điểm danh'}
            {gpsState === 'denied'      && 'GPS bị chặn — vui lòng cấp quyền vị trí trong cài đặt trình duyệt'}
            {gpsState === 'unavailable' && 'Thiết bị không có GPS — điểm danh không kèm xác minh vị trí'}
            {gpsState === 'pending'     && 'Đang lấy vị trí GPS, vui lòng đợi…'}
          </span>
          {gpsState === 'ok'          && <span className="font-bold text-green-600">✓</span>}
          {gpsState === 'unavailable' && <span className="font-bold text-yellow-600">!</span>}
        </div>

        {/* Camera error */}
        {cameraError && (
          <div className="flex items-start gap-2 mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{cameraError}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-12 flex flex-col items-center text-blue-600">
            <Loader2 className="w-12 h-12 animate-spin mb-3" />
            <p className="text-gray-600 font-medium">Đang xác thực mã QR…</p>
          </div>
        )}

        {/* Result */}
        {!loading && result && (
          <div className="py-8 text-center">
            {result.success
              ? <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-3" />
              : <XCircle    className="w-20 h-20 text-red-500   mx-auto mb-3" />
            }
            <h3 className={`text-xl font-bold mb-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
              {result.success ? 'Thành công!' : 'Thất bại'}
            </h3>
            <p className="text-gray-600 mb-6 text-sm">{result.message}</p>
            <button
              onClick={retryScan}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
            >
              Quét lại
            </button>
          </div>
        )}

        {/* Scanner area */}
        {!loading && !result && (
          <div className="flex flex-col items-center">
            {/* Video — luôn render trong DOM để ref sẵn sàng */}
            <div className={`relative w-full rounded-xl overflow-hidden bg-black shadow-inner transition-all duration-300 ${
              isScanning || isStarting ? 'aspect-[3/4] max-h-[60vh]' : 'h-0'
            }`}>
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Starting overlay */}
              {isStarting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
                  <Loader2 className="w-8 h-8 animate-spin mr-2" /> Đang khởi động camera…
                </div>
              )}

              {/* Scan overlay */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 border-2 border-blue-400 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                    <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-white rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-white rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-white rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-white rounded-br-xl" />
                    <div
                      className="absolute left-0 w-full h-0.5 bg-red-500"
                      style={{ animation: 'qrScan 2s linear infinite', boxShadow: '0 0 8px rgba(239,68,68,0.8)' }}
                    />
                  </div>
                  <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-xs bg-black/40 px-3 py-1 rounded-full whitespace-nowrap">
                    Hướng camera vào mã QR
                  </p>
                </div>
              )}

              {/* Stop button */}
              {(isScanning || isStarting) && (
                <button
                  onClick={stopCamera}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full border border-white/40 font-medium text-sm"
                >
                  <CameraOff className="w-4 h-4" /> Hủy quét
                </button>
              )}
            </div>

            {/* Idle state */}
            {cameraState === 'idle' && (
              <div className="py-8 flex flex-col items-center text-center w-full">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${
                  gpsState === 'denied' ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-500'
                }`}>
                  <Camera size={36} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Bắt đầu điểm danh</h3>
                <p className="text-gray-500 text-sm mb-6 px-4 leading-relaxed">
                  Đưa camera vào mã QR được BTC chiếu trên màn hình.
                </p>

                {/* GPS denied — người dùng CHỦ ĐỘNG từ chối */}
                {gpsState === 'denied' && (
                  <div className="w-full mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-left">
                    <p className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> GPS bị chặn
                    </p>
                    <p className="text-xs text-red-600 leading-relaxed">
                      Bạn đã từ chối quyền vị trí. Vào <strong>biểu tượng khóa/i trên thanh địa chỉ → Vị trí → Cho phép</strong>, sau đó tải lại trang.
                    </p>
                  </div>
                )}

                {/* GPS unavailable — laptop/PC không có chip GPS */}
                {gpsState === 'unavailable' && (
                  <div className="w-full mb-5 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-left">
                    <p className="text-sm font-semibold text-yellow-700 mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Không xác định được vị trí
                    </p>
                    <p className="text-xs text-yellow-700 leading-relaxed">
                      Thiết bị này không có GPS (thường gặp trên laptop/PC). Bạn vẫn có thể điểm danh, nhưng vị trí sẽ không được xác minh.
                    </p>
                  </div>
                )}

                {/* GPS pending */}
                {gpsState === 'pending' && (
                  <div className="w-full mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-amber-500 animate-spin flex-shrink-0" />
                    <p className="text-sm text-amber-700">Đang lấy vị trí GPS, vui lòng đợi…</p>
                  </div>
                )}

                <button
                  onClick={startCamera}
                  disabled={gpsState === 'denied' || gpsState === 'pending'}
                  className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md transition-all ${
                    gpsState === 'denied' || gpsState === 'pending'
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                  }`}
                >
                  {gpsState === 'pending' ? 'Đang chờ GPS…' : 'Mở Camera quét QR'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes qrScan {
          0%   { top: 0%; }
          50%  { top: calc(100% - 2px); }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
};

export default SelfAttendanceScanner;
