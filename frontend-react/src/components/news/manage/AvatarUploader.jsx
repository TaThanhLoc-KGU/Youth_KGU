import { useState, useRef } from 'react';
import { Image as ImageIcon, RotateCcw, X, Upload } from 'lucide-react';
import ImageCropModal from '../../common/ImageCropModal';
import Button from '../../common/Button';
import newsService from '../../../services/newsService';

/**
 * AvatarUploader - Dùng cho ảnh đại diện bài viết (Thumbnail)
 * 
 * Props:
 * - value: string (URL ảnh hiện tại)
 * - onChange: function(url) - callback khi có URL ảnh mới
 * - error: string (lỗi validate nếu có)
 * - label: string (nhãn hiển thị)
 */
const AvatarUploader = ({ value, onChange, error, label = 'Ảnh đại diện bài viết' }) => {
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh (jpg, png, webp)');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropConfirm = async (blob) => {
    if (!blob || !(blob instanceof Blob)) {
      alert('Lỗi xử lý ảnh. Vui lòng thử lại.');
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'avatar.jpg');
      
      const response = await newsService.uploadImage(formData);
      if (response && response.url) {
        onChange(response.url);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload ảnh thất bại. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (e) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      
      {!value ? (
        <div 
          onClick={() => fileInputRef.current.click()}
          className={`
            relative cursor-pointer group
            border-2 border-dashed rounded-xl p-8 
            flex flex-col items-center justify-center gap-3
            transition-all duration-200
            ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}
          `}
        >
          <div className="p-4 rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform duration-200">
            <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">
              Kéo thả ảnh vào đây hoặc click để chọn
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Khuyến nghị: 1200×675px (Tỷ lệ 16:9)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="relative group overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-gray-50 max-w-2xl mx-auto">
          <div className="aspect-video w-full overflow-hidden">
            <img 
              src={value} 
              alt="Thumbnail preview" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            />
          </div>
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
            <Button
              size="sm"
              variant="white"
              icon={RotateCcw}
              onClick={() => fileInputRef.current.click()}
              loading={isUploading}
            >
              Đổi ảnh
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={X}
              onClick={removeImage}
              disabled={isUploading}
            >
              Xóa
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
        </div>
      )}
      
      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={() => {
          setIsCropModalOpen(false);
          setSelectedImage(null);
        }}
        imageSrc={selectedImage}
        onConfirm={handleCropConfirm}
        defaultAspect={16 / 9}
      />
    </div>
  );
};

export default AvatarUploader;
