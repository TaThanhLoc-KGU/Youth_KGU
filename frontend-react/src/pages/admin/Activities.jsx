import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Eye, RefreshCw, Calendar, Users, Download } from 'lucide-react';
import activityService from '../../services/activityService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Card from '../../components/common/Card';
import ActivityForm from '../../components/activity/ActivityForm';
import ActivityCard from '../../components/activity/ActivityCard';
import ActivityDetail from '../../components/admin/ActivityDetail';
import { formatDate } from '../../utils/dateFormat';
import {
  LOAI_HOAT_DONG_OPTIONS,
  CAP_DO_OPTIONS,
  TRANG_THAI_OPTIONS,
  getLoaiHoatDongLabel,
  getTrangThaiLabel,
  getTrangThaiBadgeVariant,
} from '../../constants/activityConstants';

const Activities = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  // Fetch activities with pagination
  const { data: activitiesData, isLoading, refetch } = useQuery(
    ['activities', page, size, search, statusFilter],
    () => activityService.getAllWithPagination({ page, size }),
    { keepPreviousData: true }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (maHoatDong) => activityService.delete(maHoatDong),
    {
      onSuccess: () => {
        toast.success('Xóa hoạt động thành công!');
        queryClient.invalidateQueries('activities');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Xóa hoạt động thất bại!');
      },
    }
  );

  // Table columns
  const columns = [
    {
      header: 'Mã hoạt động',
      accessor: 'maHoatDong',
      width: '120px',
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      header: 'Tên hoạt động',
      accessor: 'tenHoatDong',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{getLoaiHoatDongLabel(row.loaiHoatDong)}</div>
        </div>
      ),
    },
    {
      header: 'Ngày tổ chức',
      accessor: 'ngayToChuc',
      width: '120px',
      render: (value) => formatDate(value),
    },
    {
      header: 'Địa điểm',
      accessor: 'diaDiem',
      render: (value) => value || '-',
    },
    {
      header: 'Cấp độ',
      accessor: 'capDo',
      width: '100px',
      render: (value) => (
        <span className="text-xs">{value}</span>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: 'trangThai',
      width: '140px',
      render: (value) => (
        <Badge variant={getTrangThaiBadgeVariant(value)}>
          {getTrangThaiLabel(value)}
        </Badge>
      ),
    },
    {
      header: 'Thao tác',
      accessor: 'actions',
      width: '150px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            icon={Eye}
            onClick={(e) => {
              e.stopPropagation();
              handleView(row);
            }}
            title="Xem chi tiết"
          />
          <Button
            size="sm"
            variant="ghost"
            icon={Edit}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            title="Sửa"
          />
          <Button
            size="sm"
            variant="ghost"
            icon={Trash2}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            title="Xóa"
            className="text-red-600 hover:text-red-700"
          />
        </div>
      ),
    },
  ];

  const handleCreate = () => {
    setModalMode('create');
    setSelectedActivity(null);
    setIsModalOpen(true);
  };

  const handleEdit = (activity) => {
    setModalMode('edit');
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const handleView = (activity) => {
    setSelectedActivity(activity);
    setIsDetailModalOpen(true);
  };

  const handleDelete = (activity) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa hoạt động "${activity.tenHoatDong}"?`)) {
      deleteMutation.mutate(activity.maHoatDong);
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    queryClient.invalidateQueries('activities');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Hoạt động</h1>
          <p className="text-gray-600 mt-1">
            Quản lý các hoạt động Đoàn - Hội sinh viên
          </p>
        </div>
        <Button icon={Plus} onClick={handleCreate}>
          Tạo hoạt động mới
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SearchInput
              placeholder="Tìm kiếm hoạt động..."
              value={search}
              onChange={setSearch}
              className="md:col-span-2"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {TRANG_THAI_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={() => refetch()}
            >
              Làm mới
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          data={activitiesData?.content || []}
          loading={isLoading}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo hoạt động mới' : 'Chỉnh sửa hoạt động'}
        size="xl"
      >
        <ActivityForm
          initialData={selectedActivity}
          mode={modalMode}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Chi tiết hoạt động"
        size="xl"
      >
        <ActivityDetail
          activity={selectedActivity}
          onEdit={() => {
            setIsDetailModalOpen(false);
            handleEdit(selectedActivity);
          }}
          onClose={() => setIsDetailModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Activities;
