import { useState } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import { Calendar, MapPin, Users, Filter, Search } from 'lucide-react';
import activityService from '../../services/activityService';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ActivityRegistrationModal from '../../components/student/ActivityRegistrationModal';
import Loading from '../../components/common/Loading';
import {
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_LEVEL_LABELS,
} from '../../utils/constants';

const StudentActivities = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

  // Fetch all activities
  const { data: activities = [], isLoading } = useQuery(
    ['student-activities', search, statusFilter, typeFilter],
    () => activityService.getAllNoPagination(),
    { keepPreviousData: true }
  );

  // Filter activities
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      !search ||
      activity.tenHoatDong.toLowerCase().includes(search.toLowerCase()) ||
      activity.maHoatDong.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || activity.trangThai === statusFilter;

    const matchesType = typeFilter === 'all' || activity.loaiHoatDong === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleRegisterClick = (activity) => {
    setSelectedActivity(activity);
    setIsRegistrationModalOpen(true);
  };

  const handleRegistrationSuccess = () => {
    setIsRegistrationModalOpen(false);
    setSelectedActivity(null);
    toast.success('Đăng ký hoạt động thành công!');
  };

  const isActivityFull = (activity) => {
    return (
      activity.soNguoiToiDa > 0 &&
      (activity.soNguoiDangKy || 0) >= activity.soNguoiToiDa
    );
  };

  const getActivityStatus = (activity) => {
    if (activity.trangThai === 'MO_DANG_KY') {
      return {
        label: 'Mở đăng ký',
        variant: 'success',
        canRegister: !isActivityFull(activity),
      };
    }
    if (activity.trangThai === 'DANG_DIEN_RA') {
      return {
        label: 'Đang diễn ra',
        variant: 'warning',
        canRegister: false,
      };
    }
    return {
      label: ACTIVITY_STATUS_LABELS[activity.trangThai] || 'Không xác định',
      variant: 'gray',
      canRegister: false,
    };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Các hoạt động</h1>
        <p className="text-gray-600 mt-1">
          Xem và đăng ký tham gia hoạt động Đoàn - Hội sinh viên
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SearchInput
              placeholder="Tìm kiếm hoạt động..."
              value={search}
              onSearch={setSearch}
              className="md:col-span-2"
            />
            <Select
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'MO_DANG_KY', label: 'Mở đăng ký' },
                { value: 'DANG_DIEN_RA', label: 'Đang diễn ra' },
                { value: 'DA_KET_THUC', label: 'Đã kết thúc' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
            <Select
              options={[
                { value: 'all', label: 'Tất cả loại' },
                { value: 'HOI_THAO', label: 'Hội thảo' },
                { value: 'CHUYEN_DE', label: 'Chuyên đề' },
                { value: 'TINH_NGUYEN', label: 'Tình nguyện' },
                { value: 'VAN_HOA_NGHE_THUAT', label: 'Văn hóa - Nghệ thuật' },
                { value: 'THE_THAO', label: 'Thể thao' },
              ]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Activities Grid */}
      {isLoading ? (
        <Loading fullScreen />
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Không tìm thấy hoạt động nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity) => {
            const status = getActivityStatus(activity);
            const isFull = isActivityFull(activity);

            return (
              <div
                key={activity.maHoatDong}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Image Placeholder */}
                <div className="h-40 bg-gradient-to-r from-primary-100 to-primary-50 flex items-center justify-center">
                  <Calendar className="w-16 h-16 text-primary-300" />
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Header */}
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
                      {activity.tenHoatDong}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{activity.maHoatDong}</p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={status.variant} size="sm">
                      {status.label}
                    </Badge>
                    <Badge variant="info" size="sm" dot>
                      {ACTIVITY_TYPE_LABELS[activity.loaiHoatDong]}
                    </Badge>
                    <Badge variant="warning" size="sm" dot>
                      {ACTIVITY_LEVEL_LABELS[activity.capDo]}
                    </Badge>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(activity.ngayToChuc).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{activity.diaDiem || 'Chưa xác định'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>
                        {activity.soNguoiDangKy || 0} / {activity.soNguoiToiDa || '∞'}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {activity.moTa && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {activity.moTa}
                    </p>
                  )}

                  {/* Status Warning */}
                  {isFull && (
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <p className="text-xs text-red-700 font-medium">
                        Hoạt động đã kín chỗ
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant={status.canRegister ? 'primary' : 'outline'}
                      size="sm"
                      fullWidth
                      onClick={() => handleRegisterClick(activity)}
                      disabled={!status.canRegister}
                    >
                      {status.canRegister ? 'Đăng ký' : 'Không thể đăng ký'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Registration Modal */}
      <Modal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        title="Đăng ký hoạt động"
        size="md"
      >
        <ActivityRegistrationModal
          activity={selectedActivity}
          onSuccess={handleRegistrationSuccess}
          onCancel={() => setIsRegistrationModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default StudentActivities;
