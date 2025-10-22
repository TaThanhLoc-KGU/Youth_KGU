import { Edit, Calendar, MapPin, Users, Type } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { ACTIVITY_STATUS_LABELS, ACTIVITY_TYPE_LABELS, ACTIVITY_LEVEL_LABELS } from '../../utils/constants';

const ActivityDetail = ({ activity, onEdit, onClose }) => {
  if (!activity) return null;

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
        <h2 className="text-2xl font-bold">{activity.tenHoatDong}</h2>
        <p className="text-base-content/70 mt-1">Mã: {activity.maHoatDong}</p>
        <div className="mt-3 flex items-center gap-2">
          <Badge variant="primary">
            {ACTIVITY_STATUS_LABELS[activity.trangThai]}
          </Badge>
          <Badge variant="info" dot>
            {ACTIVITY_TYPE_LABELS[activity.loaiHoatDong]}
          </Badge>
          <Badge variant="warning" dot>
            {ACTIVITY_LEVEL_LABELS[activity.capDo]}
          </Badge>
        </div>
      </div>

      {/* Description */}
      {activity.moTa && (
        <div className="bg-base-200 border border-base-300 rounded-lg p-4">
          <h4 className="font-medium mb-2">Mô tả</h4>
          <p className="whitespace-pre-wrap">{activity.moTa}</p>
        </div>
      )}

      {/* Details */}
      <div className="space-y-1">
        <InfoRow
          icon={Calendar}
          label="Ngày tổ chức"
          value={new Date(activity.ngayToChuc).toLocaleString('vi-VN')}
        />
        <InfoRow
          icon={MapPin}
          label="Địa điểm"
          value={activity.diaDiem}
        />
        <InfoRow
          icon={Users}
          label="Số người đăng ký"
          value={`${activity.soNguoiDangKy || 0} / ${activity.soNguoiToiDa || 'Không giới hạn'}`}
        />
        <InfoRow
          icon={Type}
          label="Cấp độ"
          value={ACTIVITY_LEVEL_LABELS[activity.capDo]}
        />
      </div>

      {/* Statistics */}
      {activity.soNguoiDangKy !== undefined && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-info/10 border border-info/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-info">{activity.soNguoiDangKy || 0}</div>
            <div className="text-sm text-info/80 mt-1">Người đã đăng ký</div>
          </div>
          <div className="bg-success/10 border border-success/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-success">
              {activity.soNguoiToiDa - (activity.soNguoiDangKy || 0)}
            </div>
            <div className="text-sm text-success/80 mt-1">Chỗ còn trống</div>
          </div>
        </div>
      )}

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
