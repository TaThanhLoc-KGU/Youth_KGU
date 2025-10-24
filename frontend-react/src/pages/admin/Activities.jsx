import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Eye, RefreshCw, Calendar, Users } from 'lucide-react';
import activityService from '../../services/activityService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ActivityForm from '../../components/admin/ActivityForm';
import ActivityDetail from '../../components/admin/ActivityDetail';
import {
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_STATUS_COLORS,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_LEVEL_LABELS
} from '../../utils/constants';

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
          <div className="text-xs text-gray-500">{ACTIVITY_TYPE_LABELS[row.loaiHoatDong]}</div>
        </div>
      ),
    },
    {
      header: 'Ngày tổ chức',
      accessor: 'ngayToChuc',
      width: '120px',
      render: (value) => new Date(value).toLocaleDateString('vi-VN'),
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
        <span className="text-xs">{ACTIVITY_LEVEL_LABELS[value]}</span>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: 'trangThai',
      width: '140px',
      render: (value) => (
        <Badge variant={value === 'MO_DANG_KY' ? 'success' : 'info'}>
          {ACTIVITY_STATUS_LABELS[value]}
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
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={() => refetch()}
              fullWidth
            >
              Làm mới
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <Table
          columns={columns}
          data={activitiesData?.content || []}
          isLoading={isLoading}
          onRowClick={handleView}
        />
        {activitiesData && (
          <Table.Pagination
            currentPage={activitiesData.number}
            totalPages={activitiesData.totalPages}
            pageSize={activitiesData.size}
            totalElements={activitiesData.totalElements}
            onPageChange={setPage}
            onPageSizeChange={setSize}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo hoạt động mới' : 'Chỉnh sửa hoạt động'}
        size="lg"
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
        size="lg"
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
