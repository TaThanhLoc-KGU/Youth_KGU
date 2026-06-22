import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { X, RefreshCw, Maximize, Minimize } from 'lucide-react';
import diemDanhService from '../../../services/diemDanhService';

const DynamicQRDisplay = ({ maHoatDong, tenHoatDong, onClose }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const containerRef = useRef(null);

  const fetchToken = async () => {
    try {
      // Don't set loading to true for background refreshes to avoid flicker
      if (!token) setLoading(true);
      const newToken = await diemDanhService.getDynamicQRToken(maHoatDong);
      setToken(newToken);
      setTimeLeft(30);
      setError(null);
    } catch (err) {
      console.error('Error fetching dynamic QR:', err);
      setError('Không thể lấy mã QR. Vui lòng kiểm tra kết nối mạng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
    
    // Refresh token every 28 seconds (slightly before the 30s expiration to account for network delay)
    const tokenInterval = setInterval(() => {
      fetchToken();
    }, 28000);

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(tokenInterval);
      clearInterval(countdownInterval);
    };
  }, [maHoatDong]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-[100] flex flex-col bg-white ${isFullscreen ? 'p-0' : 'p-4 sm:p-8 bg-black/80'}`}
    >
      <div className={`flex flex-col h-full ${!isFullscreen ? 'max-w-4xl mx-auto w-full bg-white rounded-2xl shadow-2xl overflow-hidden relative' : ''}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Điểm danh Tự phục vụ</h2>
            <p className="text-gray-500 mt-1">{tenHoatDong}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleFullscreen}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
            >
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            >
              <X size={28} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-gray-50">
          <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-xl flex flex-col items-center relative w-full max-w-2xl">
            
            <h3 className="text-xl font-medium text-gray-800 mb-8 text-center">
              Sinh viên sử dụng điện thoại quét mã QR bên dưới để điểm danh
            </h3>

            {loading && !token ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
                <p className="mt-4 text-gray-500">Đang tạo mã QR...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <X size={64} className="mx-auto" />
                </div>
                <p className="text-red-600 font-medium">{error}</p>
                <button 
                  onClick={fetchToken}
                  className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                >
                  <RefreshCw size={18} /> Thử lại
                </button>
              </div>
            ) : (
              <>
                <div className="p-4 border-4 border-blue-100 rounded-2xl bg-white transition-all duration-500">
                  <QRCode
                    value={token || ''}
                    size={isFullscreen ? 450 : 320}
                    level="H" // High error correction for easier scanning from distance
                    className="transition-all duration-300"
                  />
                </div>
                
                <div className="mt-10 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
                    <RefreshCw size={16} className={timeLeft < 5 ? "animate-spin text-orange-500" : ""} />
                    <span className="font-medium">Mã sẽ tự động làm mới sau</span>
                  </div>
                  <div className={`text-4xl font-bold font-mono ${timeLeft <= 5 ? 'text-orange-500' : 'text-blue-600'}`}>
                    {timeLeft}s
                  </div>
                </div>
              </>
            )}

            <div className="absolute top-4 right-4 flex gap-2">
                <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    Yêu cầu bật GPS
                </div>
            </div>

          </div>
          
          <p className="mt-8 text-gray-500 text-center max-w-lg">
            Hệ thống sử dụng mã QR động chống gian lận. 
            Mã này không thể chia sẻ ảnh chụp màn hình do giới hạn thời gian 30 giây.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DynamicQRDisplay;