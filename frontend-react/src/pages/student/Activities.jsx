import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { formatDate } from '../../utils/dateFormat';
import {
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_LEVEL_LABELS,
} from '../../utils/constants';

const StudentActivities = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Tính toán HK/Năm học mặc định theo logic riêng của hệ thống
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const year = now.getFullYear();
  
  let defaultSemester;
  if (month >= 8 && month <= 11) {
    defaultSemester = 1;
  } else if (month === 12 || month === 1 || month === 2 || (month === 3 && day < 15)) {
    defaultSemester = 2;
  } else {
    defaultSemester = 3;
  }

  const startYear = month >= 8 ? year : year - 1;
  const defaultAcademicYear = `NH${startYear}-${startYear + 1}`;

  const [semesterFilter, setSemesterFilter] = useState(String(defaultSemester));
  const [yearFilter, setYearFilter] = useState(defaultAcademicYear);

  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

  // Lấy thông tin năm học từ hệ thống
  const { data: academicInfo } = useQuery({
    queryKey: ['academic-info-student'],
    queryFn: () => activityService.getCurrentAcademicInfo(),
    staleTime: 30 * 60 * 1000,
  });

  // Fetch all activities
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['student-activities'],
    queryFn: () => activityService.getAllNoPagination(),
    staleTime: 5 * 60 * 1000,
  });

  // Filter activities
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      !search ||
      activity.tenHoatDong.toLowerCase().includes(search.toLowerCase()) ||
      activity.maHoatDong.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || activity.trangThai === statusFilter;

    const matchesType = typeFilter === 'all' || activity.loaiHoatDong === typeFilter;
    
    const matchesSemester = semesterFilter === 'all' || String(activity.soHocKy) === semesterFilter;
    const matchesYear = yearFilter === 'all' || activity.maNamHoc === yearFilter;

    return matchesSearch && matchesStatus && matchesType && matchesSemester && matchesYear;
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
      activity.soLuongToiDa > 0 &&
      (activity.soNguoiDangKy || 0) >= activity.soLuongToiDa
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
        <div className="card-body space-y-4">
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Học kỳ</label>
              <Select
                options={[
                  { value: 'all', label: 'Tất cả học kỳ' },
                  { value: '1', label: 'Học kỳ 1' },
                  { value: '2', label: 'Học kỳ 2' },
                  { value: '3', label: 'Học kỳ 3' },
                ]}
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Năm học</label>
              <Select
                options={[
                  { value: 'all', label: 'Tất cả năm học' },
                  ...(academicInfo?.danhSachNamHoc?.map(nh => ({ value: nh.maNamHoc, label: nh.tenNamHoc })) || [])
                ]}
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 w-full">
                Đang hiển thị hoạt động của <strong>HK{semesterFilter === 'all' ? 'tất cả' : semesterFilter}</strong> năm học <strong>{yearFilter === 'all' ? 'tất cả' : (academicInfo?.danhSachNamHoc?.find(n => n.maNamHoc === yearFilter)?.tenNamHoc || yearFilter)}</strong>.
              </div>
            </div>
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
                        {formatDate(activity.ngayToChuc)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{activity.diaDiem || 'Chưa xác định'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>
                        {activity.soNguoiDangKy || 0} / {activity.soLuongToiDa ?? '∞'}
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
