/**
 * ImagePickerModal — chọn ảnh bằng 2 cách:
 *  1. Upload ảnh mới từ máy tính
 *  2. Chọn ảnh có sẵn trên server (thư viện)
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - onSelect: (url: string) => void  — callback khi chọn xong
 */
import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, Upload, Image, Check, Loader2, FolderOpen, AlertCircle } from 'lucide-react';
import uploadService from '../../services/uploadService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const ImagePickerModal = ({ isOpen, onClose, onSelect }) => {
  const [tab, setTab] = useState('upload');
  const [dragOver, setDragOver] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null); // { file, dataUrl }
  const [selected, setSelected] = useState(null);           // URL đã chọn từ thư viện
  const fileInputRef = useRef(null);

  // ── Query: danh sách ảnh server ─────────────────────────────────────────────
  const {
    data: serverImages = [],
    isLoading: loadingImages,
    refetch: refetchImages,
    error: listError,
  } = useQuery({
    queryKey: ['media-images'],
    queryFn: uploadService.listMediaImages,
    enabled: isOpen && tab === 'library',
    staleTime: 30_000,
  });

  // ── Mutation: upload ─────────────────────────────────────────────────────────
  const uploadMut = useMutation({
    mutationFn: (file) => uploadService.uploadMediaImage(file),
    onSuccess: (url) => {
      setUploadPreview(null);
      onSelect(url);
      onClose();
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleFileChange = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh (JPG, PNG, GIF, WebP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File không được vượt quá 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setUploadPreview({ file, dataUrl: e.target.result });
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileChange(e.dataTransfer.files?.[0]);
  }, [handleFileChange]);

  const handleClose = () => {
    setUploadPreview(null);
    setSelected(null);
    onClose();
  };

  const handleSelectFromLibrary = () => {
    if (selected) { onSelect(selected); onClose(); }
  };

  const fullUrl = (path) =>
    path?.startsWith('http') ? path : `${API_BASE}${path}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Image className="w-5 h-5 text-blue-500" /> Chọn hình ảnh
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {[
            { key: 'upload', label: 'Tải lên từ máy', icon: Upload },
            { key: 'library', label: 'Thư viện server', icon: FolderOpen },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => { setTab(key); setSelected(null); }}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── Tab Upload ── */}
          {tab === 'upload' && (
            <div className="space-y-4">
              {uploadPreview ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50" style={{ height: 220 }}>
                    <img src={uploadPreview.dataUrl} alt="preview" className="w-full h-full object-contain" />
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {uploadPreview.file.name} ({(uploadPreview.file.size / 1024).toFixed(0)} KB)
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadPreview(null)}
                      className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      Chọn ảnh khác
                    </button>
                    <button
                      type="button"
                      onClick={() => uploadMut.mutate(uploadPreview.file)}
                      disabled={uploadMut.isPending}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      {uploadMut.isPending
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang upload...</>
                        : <><Upload className="w-4 h-4" /> Upload & Chọn</>}
                    </button>
                  </div>
                  {uploadMut.isError && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {uploadMut.error?.response?.data?.message || 'Lỗi upload, vui lòng thử lại'}
                    </p>
                  )}
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                  }`}
                >
                  <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">Kéo thả ảnh vào đây</p>
                  <p className="text-xs text-gray-400 mt-1">hoặc nhấn để chọn file</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WebP — tối đa 10MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />
            </div>
          )}

          {/* ── Tab Thư viện ── */}
          {tab === 'library' && (
            <div>
              {loadingImages ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p className="text-sm">Đang tải thư viện...</p>
                </div>
              ) : listError ? (
                <div className="flex flex-col items-center justify-center py-16 text-red-400">
                  <AlertCircle className="w-8 h-8 mb-2" />
                  <p className="text-sm">Lỗi tải thư viện</p>
                  <button type="button" onClick={refetchImages} className="mt-2 text-xs text-blue-500 hover:underline">
                    Thử lại
                  </button>
                </div>
              ) : serverImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <FolderOpen className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm">Chưa có ảnh nào. Hãy upload ảnh đầu tiên.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {serverImages.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setSelected(selected === url ? null : url)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selected === url
                          ? 'border-blue-500 ring-2 ring-blue-300'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <img
                        src={fullUrl(url)}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      {selected === url && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer (library tab) */}
        {tab === 'library' && (
          <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center flex-shrink-0 bg-gray-50">
            <span className="text-xs text-gray-500">
              {selected ? '1 ảnh đã chọn' : `${serverImages.length} ảnh`}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSelectFromLibrary}
                disabled={!selected}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                Chọn ảnh này
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagePickerModal;
