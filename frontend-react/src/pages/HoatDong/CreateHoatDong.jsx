import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import hoatDongService from '../../services/hoatDongService';
import { ArrowLeft, Save, FileText, Upload, X, Download } from 'lucide-react';

// Validation Schema
const schema = yup.object().shape({
  maHoatDong: yup.string().required('Mã hoạt động là bắt buộc').max(20, 'Mã hoạt động tối đa 20 ký tự'),
  tenHoatDong: yup.string().required('Tên hoạt động là bắt buộc').max(200, 'Tên hoạt động tối đa 200 ký tự'),
  diaDiem: yup.string().required('Địa điểm là bắt buộc').max(200, 'Địa điểm tối đa 200 ký tự'),
  soLuongToiDa: yup.number().typeError('Số lượng phải là số').required('Số lượng là bắt buộc').min(1, 'Số lượng tối thiểu là 1'),
  diemRenLuyen: yup.number().typeError('Điểm rèn luyện phải là số').required('Điểm rèn luyện là bắt buộc').min(0, 'Điểm rèn luyện không được âm'),
  loaiHoatDong: yup.string().required('Vui lòng chọn loại hoạt động'),
  capDo: yup.string().required('Vui lòng chọn cấp độ'),
  ngayToChuc: yup.date().required('Ngày tổ chức là bắt buộc').typeError('Ngày không hợp lệ'),
  thoiGianBatDau: yup.string().required('Thời gian bắt đầu là bắt buộc'), // Time string HH:mm
  thoiGianKetThuc: yup.string().required('Thời gian kết thúc là bắt buộc')
    .test('is-after-start', 'Thời gian kết thúc phải sau thời gian bắt đầu', function(value) {
      const { thoiGianBatDau } = this.parent;
      if (!thoiGianBatDau || !value) return true;
      return value > thoiGianBatDau;
    }),
  choPhepCheckInSom: yup.number().typeError('Phải là số').min(0, 'Không được âm').default(30),
  thoiGianTreToiDa: yup.number().typeError('Phải là số').min(0, 'Không được âm').default(15),
  thoiGianToiThieu: yup.number().typeError('Phải là số').min(0, 'Không được âm').default(60),
  yeuCauCheckOut: yup.boolean().default(false),
  yeuCauDiemDanh: yup.boolean().default(true),
  choPhepDangKy: yup.boolean().default(true),
  cheDoDiemDanh: yup.string().oneOf(['CHECKIN_CHECKOUT', 'CHECKIN_ONLY', 'CHECKOUT_ONLY', 'AUTO_FULL']).default('CHECKIN_CHECKOUT'),
  moTa: yup.string(),
  ghiChu: yup.string()
});

const CreateHoatDong = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quyetDinhFile, setQuyetDinhFile] = useState(null);
  const [quyetDinhPreviewUrl, setQuyetDinhPreviewUrl] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, touchedFields } } = useForm({
    resolver: yupResolver(schema),
    mode: 'onBlur', // Validate on blur
    defaultValues: {
      loaiHoatDong: 'KHAC',
      capDo: 'TRUONG',
      cheDoDiemDanh: 'CHECKIN_CHECKOUT',
      yeuCauDiemDanh: true,
      choPhepDangKy: true,
      yeuCauCheckOut: false,
      choPhepCheckInSom: 30,
      thoiGianTreToiDa: 15,
      thoiGianToiThieu: 60,
      diemRenLuyen: 0,
      soLuongToiDa: 100
    }
  });

  const cheDoDiemDanh = watch('cheDoDiemDanh');

  // Dọn object URL preview khi đổi file hoặc unmount, tránh rò rỉ bộ nhớ
  useEffect(() => {
    return () => {
      if (quyetDinhPreviewUrl) URL.revokeObjectURL(quyetDinhPreviewUrl);
    };
  }, [quyetDinhPreviewUrl]);

  const handleQuyetDinhChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Chỉ chấp nhận file PDF');
      e.target.value = '';
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File không được vượt quá 50MB');
      e.target.value = '';
      return;
    }
    if (quyetDinhPreviewUrl) URL.revokeObjectURL(quyetDinhPreviewUrl);
    setQuyetDinhFile(file);
    setQuyetDinhPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveQuyetDinh = () => {
    if (quyetDinhPreviewUrl) URL.revokeObjectURL(quyetDinhPreviewUrl);
    setQuyetDinhFile(null);
    setQuyetDinhPreviewUrl(null);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Format time fields if needed, but input type="time" returns HH:mm which matches LocalTime
      // Format date to YYYY-MM-DD
      const formattedData = {
        ...data,
        ngayToChuc: new Date(data.ngayToChuc).toISOString().split('T')[0]
      };

      await hoatDongService.create(formattedData, quyetDinhFile);
      toast.success('Tạo hoạt động thành công! Đã tự động đăng tin tức giới thiệu.');
      navigate('/admin/activities');
    } catch (error) {
      console.error('Create activity error:', error);
      const message = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tạo hoạt động';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to check if field has error
  const hasError = (fieldName) => !!errors[fieldName];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/activities')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Tạo Hoạt Động Mới</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6">
        {/* Thông tin cơ bản */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">Thông tin cơ bản</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Mã hoạt động */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã hoạt động <span className="text-red-500">*</span></label>
              <input
                type="text"
                {...register('maHoatDong')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${hasError('maHoatDong') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                placeholder="VD: HD2023001"
              />
              {errors.maHoatDong && <p className="text-red-500 text-xs mt-1">{errors.maHoatDong.message}</p>}
            </div>

            {/* Tên hoạt động */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên hoạt động <span className="text-red-500">*</span></label>
              <input
                type="text"
                {...register('tenHoatDong')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${hasError('tenHoatDong') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                placeholder="Nhập tên hoạt động"
              />
              {errors.tenHoatDong && <p className="text-red-500 text-xs mt-1">{errors.tenHoatDong.message}</p>}
            </div>

            {/* Loại hoạt động */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại hoạt động <span className="text-red-500">*</span></label>
              <select
                {...register('loaiHoatDong')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${hasError('loaiHoatDong') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              >
                <option value="CHINH_TRI">Chính trị</option>
                <option value="VAN_HOA_NGHE_THUAT">Văn hóa - Nghệ thuật</option>
                <option value="THE_THAO">Thể thao</option>
                <option value="TINH_NGUYEN">Tình nguyện</option>
                <option value="HOC_THUAT">Học thuật</option>
                <option value="KY_NANG_MEM">Kỹ năng mềm</option>
                <option value="DOAN_HOI">Đoàn - Hội</option>
                <option value="CONG_DONG">Cộng đồng</option>
                <option value="KHAC">Khác</option>
              </select>
              {errors.loaiHoatDong && <p className="text-red-500 text-xs mt-1">{errors.loaiHoatDong.message}</p>}
            </div>

            {/* Cấp độ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cấp độ <span className="text-red-500">*</span></label>
              <select
                {...register('capDo')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${hasError('capDo') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              >
                <option value="DOAN_TRUONG">Đoàn trường</option>
                <option value="HOI_SINH_VIEN">Hội sinh viên</option>
                <option value="TRUONG">Trường</option>
                <option value="PHONG">Phòng</option>
                <option value="KHOA">Khoa</option>
                <option value="CHI_DOAN">Chi đoàn</option>
                <option value="TINH_DOAN">Tỉnh đoàn</option>
                <option value="HOAT_DONG_PHOI_HOP">Hoạt động phối hợp</option>
              </select>
              {errors.capDo && <p className="text-red-500 text-xs mt-1">{errors.capDo.message}</p>}
            </div>

            {/* Địa điểm */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm <span className="text-red-500">*</span></label>
              <input
                type="text"
                {...register('diaDiem')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${hasError('diaDiem') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                placeholder="Nhập địa điểm tổ chức"
              />
              {errors.diaDiem && <p className="text-red-500 text-xs mt-1">{errors.diaDiem.message}</p>}
            </div>

            {/* Số lượng tối đa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng tối đa <span className="text-red-500">*</span></label>
              <input
                type="number"
                {...register('soLuongToiDa')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${hasError('soLuongToiDa') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.soLuongToiDa && <p className="text-red-500 text-xs mt-1">{errors.soLuongToiDa.message}</p>}
            </div>

            {/* Điểm rèn luyện */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Điểm rèn luyện <span className="text-red-500">*</span></label>
              <input
                type="number"
                {...register('diemRenLuyen')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${hasError('diemRenLuyen') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.diemRenLuyen && <p className="text-red-500 text-xs mt-1">{errors.diemRenLuyen.message}</p>}
            </div>
          </div>
        </div>

        {/* Thời gian */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">Thời gian tổ chức</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Ngày tổ chức */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tổ chức <span className="text-red-500">*</span></label>
              <input
                type="date"
                lang="vi"
                {...register('ngayToChuc')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${hasError('ngayToChuc') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.ngayToChuc && <p className="text-red-500 text-xs mt-1">{errors.ngayToChuc.message}</p>}
            </div>

            {/* Giờ bắt đầu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu <span className="text-red-500">*</span></label>
              <input
                type="time"
                {...register('thoiGianBatDau')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${hasError('thoiGianBatDau') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.thoiGianBatDau && <p className="text-red-500 text-xs mt-1">{errors.thoiGianBatDau.message}</p>}
            </div>

            {/* Giờ kết thúc */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giờ kết thúc <span className="text-red-500">*</span></label>
              <input
                type="time"
                {...register('thoiGianKetThuc')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${hasError('thoiGianKetThuc') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.thoiGianKetThuc && <p className="text-red-500 text-xs mt-1">{errors.thoiGianKetThuc.message}</p>}
            </div>
          </div>
        </div>

        {/* Cấu hình điểm danh */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">Cấu hình điểm danh</h2>

          {/* Chế độ điểm danh */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Chế độ điểm danh</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'CHECKIN_CHECKOUT', label: '↔️ Check-in & Check-out', desc: 'Yêu cầu cả check-in lẫn check-out' },
                { value: 'CHECKIN_ONLY',     label: '→ Chỉ Check-in',          desc: 'Chỉ cần quét QR khi đến' },
                { value: 'CHECKOUT_ONLY',    label: '← Chỉ Check-out',         desc: 'Check-in tự động, chỉ quét QR khi ra về' },
                { value: 'AUTO_FULL',        label: '⚡ Tự động toàn bộ',      desc: 'BCH xác nhận, toàn bộ đăng ký = tham gia' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    cheDoDiemDanh === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    {...register('cheDoDiemDanh')}
                    value={opt.value}
                    className="mt-0.5 w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            {cheDoDiemDanh === 'AUTO_FULL' && (
              <p className="mt-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                ⚡ Sau khi hoạt động kết thúc, BCH nhấn &quot;Xác nhận tham gia&quot; để ghi nhận toàn bộ sinh viên đã đăng ký. Không cần quét QR.
              </p>
            )}
            {cheDoDiemDanh === 'CHECKOUT_ONLY' && (
              <p className="mt-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                ← Check-in tự động ghi nhận theo giờ bắt đầu. Sinh viên chỉ cần quét QR khi ra về.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Check-in sớm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cho phép check-in sớm (phút)</label>
              <input
                type="number"
                {...register('choPhepCheckInSom')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Trễ tối đa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian trễ tối đa (phút)</label>
              <input
                type="number"
                {...register('thoiGianTreToiDa')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Thời gian tối thiểu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian tham gia tối thiểu (phút)</label>
              <input
                type="number"
                {...register('thoiGianToiThieu')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('yeuCauDiemDanh')}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Yêu cầu điểm danh</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('yeuCauCheckOut')}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Yêu cầu Check-out</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('choPhepDangKy')}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Cho phép đăng ký</span>
            </label>
          </div>
        </div>

        {/* Mô tả & Ghi chú */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">Thông tin thêm</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả hoạt động</label>
              <textarea
                {...register('moTa')}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Nhập mô tả chi tiết về hoạt động..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <textarea
                {...register('ghiChu')}
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ghi chú thêm..."
              ></textarea>
            </div>
          </div>
        </div>

        {/* Quyết định đính kèm */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">Quyết định đính kèm</h2>
          {!quyetDinhFile ? (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-600">Bấm để chọn file quyết định (PDF, tối đa 50MB)</span>
              <input type="file" accept="application/pdf" onChange={handleQuyetDinhChange} className="hidden" />
            </label>
          ) : (
            <div className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{quyetDinhFile.name}</p>
                  <p className="text-xs text-gray-500">{(quyetDinhFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPdfPreview(true)}
                  className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Xem trước
                </button>
                <button
                  type="button"
                  onClick={handleRemoveQuyetDinh}
                  className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-4 justify-end pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/admin/activities')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center disabled:bg-blue-400"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSubmitting ? 'Đang lưu...' : 'Tạo hoạt động'}
          </button>
        </div>
      </form>

      {showPdfPreview && quyetDinhPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm flex-shrink-0">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <FileText className="w-5 h-5 text-red-500" />
              {quyetDinhFile?.name}
            </div>
            <div className="flex items-center gap-2">
              <a
                href={quyetDinhPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={quyetDinhFile?.name}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" /> Tải về
              </a>
              <button
                onClick={() => setShowPdfPreview(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe src={quyetDinhPreviewUrl} title="PDF Viewer" className="w-full h-full border-0" />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateHoatDong;
