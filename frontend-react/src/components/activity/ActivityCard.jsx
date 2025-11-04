import { Clock, MapPin, Users, Award, Calendar, ChevronRight } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatDate, formatTime } from '../../utils/dateFormat';
import {
  getLoaiHoatDongLabel,
  getLoaiHoatDongColor,
  getCapDoLabel,
  getTrangThaiLabel,
  getTrangThaiBadgeVariant,
} from '../../constants/activityConstants';

const ActivityCard = ({
  activity,
  onViewDetail,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  if (!activity) return null;

  const loaiLabel = getLoaiHoatDongLabel(activity.loaiHoatDong);
  const capDoLabel = getCapDoLabel(activity.capDo);
  const trangThaiLabel = getTrangThaiLabel(activity.trangThai);
  const trangThaiBadge = getTrangThaiBadgeVariant(activity.trangThai);

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
      {/* Poster */}
      {activity.hinhAnhPoster && (
        <div className="h-48 bg-gray-200 overflow-hidden">
          <img
            src={activity.hinhAnhPoster}
            alt={activity.tenHoatDong}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        {/* Header with badges */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex-1 line-clamp-2">
            {activity.tenHoatDong}
          </h3>
          <Badge variant={trangThaiBadge}>{trangThaiLabel}</Badge>
        </div>

        {/* Activity type and level */}
        <div className="flex gap-2 mb-3">
          <span className="inline-block px-2 py-1 text-xs font-medium rounded"
            style={{
              backgroundColor: getLoaiHoatDongColor(activity.loaiHoatDong) + '20',
              color: getLoaiHoatDongColor(activity.loaiHoatDong),
            }}>
            {loaiLabel}
          </span>
          <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
            {capDoLabel}
          </span>
        </div>

        {/* Description */}
        {activity.moTa && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {activity.moTa}
          </p>
        )}

        {/* Info row 1 - Date & Time */}
        <div className="space-y-2 mb-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(activity.ngayToChuc)}</span>
            {activity.gioToChuc && (
              <>
                <span className="text-gray-400">-</span>
                <Clock className="w-4 h-4" />
                <span>{formatTime(activity.gioToChuc)}</span>
              </>
            )}
          </div>

          {/* Location */}
          {activity.diaDiem && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="line-clamp-1">{activity.diaDiem}</span>
            </div>
          )}

          {/* Capacity */}
          {activity.soLuongToiDa && (
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4" />
              <span>Tối đa {activity.soLuongToiDa} người</span>
            </div>
          )}

          {/* Training points */}
          {activity.diemRenLuyen && (
            <div className="flex items-center gap-2 text-gray-600">
              <Award className="w-4 h-4" />
              <span>{activity.diemRenLuyen} điểm rèn luyện</span>
            </div>
          )}
        </div>

        {/* Check-in settings */}
        {activity.thoiGianBatDau && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mb-3">
            <div>Check-in: {formatTime(activity.thoiGianBatDau)}</div>
            {activity.choPhepCheckInSom && (
              <div>Cho phép check-in sớm {activity.choPhepCheckInSom} phút</div>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-3 border-t">
            <Button
              size="sm"
              className="flex-1 flex items-center justify-center gap-1"
              onClick={() => onViewDetail?.(activity)}
            >
              Chi tiết
              <ChevronRight className="w-4 h-4" />
            </Button>
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(activity)}
              >
                Sửa
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600"
                onClick={() => onDelete(activity.maHoatDong)}
              >
                Xóa
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityCard;
