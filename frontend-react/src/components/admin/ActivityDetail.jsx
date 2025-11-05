import { useQuery } from '@tanstack/react-query';
import { Edit, Calendar, MapPin, Users, Type, Loader } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { formatDate, formatDateTime } from '../../utils/dateFormat';
import api from '../../services/api';
import {
  getTrangThaiLabel,
  getLoaiHoatDongLabel,
  getCapDoLabel,
  getTrangThaiBadgeVariant,
} from '../../constants/activityConstants';

const ActivityDetail = ({ activity, onEdit, onClose }) => {
  if (!activity) return null;

  // Fetch registrations for this activity
  const { data: registrations, isLoading: isLoadingRegistrations } = useQuery({
    queryKey: ['activity-registrations', activity.maHoatDong],
    queryFn: async () => {
      try {
        const response = await api.get(`/api/dang-ky/activity/${activity.maHoatDong}`);
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching registrations:', error);
        return [];
      }
    },
    enabled: !!activity.maHoatDong,
      staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-base font-medium text-gray-900">{value || '-'}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{activity.tenHoatDong}</h2>
        <p className="text-gray-600 mt-1">Mã: {activity.maHoatDong}</p>
        <div className="mt-3 flex items-center gap-2">
          <Badge variant={getTrangThaiBadgeVariant(activity.trangThai)}>
            {getTrangThaiLabel(activity.trangThai)}
          </Badge>
          <Badge variant="info" dot>
            {getLoaiHoatDongLabel(activity.loaiHoatDong)}
          </Badge>
          <Badge variant="warning" dot>
            {getCapDoLabel(activity.capDo)}
          </Badge>
        </div>
      </div>

      {/* Description */}
      {activity.moTa && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Mô tả</h4>
          <p className="text-gray-700 whitespace-pre-wrap">{activity.moTa}</p>
        </div>
      )}

      {/* Details */}
      <div className="space-y-1">
        <InfoRow
          icon={Calendar}
          label="Ngày tổ chức"
          value={formatDate(activity.ngayToChuc)}
        />
        <InfoRow
          icon={MapPin}
          label="Địa điểm"
          value={activity.diaDiem}
        />
        <InfoRow
          icon={Users}
          label="Số người đăng ký"
          value={`${activity.soNguoiDangKy || 0} / ${activity.soLuongToiDa ?? 'Không giới hạn'}`}
        />
        <InfoRow
          icon={Type}
          label="Cấp độ"
          value={getCapDoLabel(activity.capDo)}
        />
      </div>

      {/* Statistics */}
      {activity.soNguoiDangKy !== undefined && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{activity.soNguoiDangKy || 0}</div>
            <div className="text-sm text-blue-700 mt-1">Người đã đăng ký</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {activity.soLuongToiDa - (activity.soNguoiDangKy || 0)}
            </div>
            <div className="text-sm text-green-700 mt-1">Chỗ còn trống</div>
          </div>
        </div>
      )}

      {/* Registrations */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh sách đăng ký</h3>
        {isLoadingRegistrations ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-5 h-5 text-gray-400 animate-spin" />
            <span className="ml-2 text-gray-600">Đang tải...</span>
          </div>
        ) : registrations && registrations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Mã SV</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Tên</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Lớp</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Ngày đăng ký</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">{reg.maSV || reg.maSinhVien || '-'}</td>
                    <td className="py-3 px-4 text-gray-900 font-medium">{reg.tenSV || reg.tenSinhVien || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{reg.email || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{reg.tenLop || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(reg.ngayDangKy || reg.createdAt)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={reg.trangThai === 'DA_THAM_GIA' ? 'success' : 'info'}>
                        {reg.trangThai === 'DA_THAM_GIA' ? 'Đã tham gia' : 'Đã đăng ký'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Chưa có ai đăng ký hoạt động này</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
        <Button icon={Edit} onClick={onEdit}>
          Chỉnh sửa
        </Button>
      </div>
    </div>
  );
};

export default ActivityDetail;
