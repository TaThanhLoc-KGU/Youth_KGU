import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Eye, RefreshCw, Settings } from 'lucide-react';
import bchService from '../../services/bchService';
import chucVuService from '../../services/chucVuService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import AddChucVuModal from '../../components/admin/AddChucVuModal';
import BCHCreateForm from '../../components/admin/BCHCreateForm';
import BCHEditForm from '../../components/admin/BCHEditForm';
import BCHDetailView from '../../components/admin/BCHDetailView';

const BCH = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [nhiemKyFilter, setNhiemKyFilter] = useState('');
  const [loaiThanhVienFilter, setLoaiThanhVienFilter] = useState('');

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isChucVuModalOpen, setIsChucVuModalOpen] = useState(false);
  const [selectedBCH, setSelectedBCH] = useState(null);

  // Fetch BCH list
  const { data: bchList = [], isLoading, refetch } = useQuery(
    ['bch', search, nhiemKyFilter, loaiThanhVienFilter],
    async () => {
      let results = [];
      if (search) {
        results = await bchService.search(search);
      } else if (nhiemKyFilter) {
        results = await bchService.getByNhiemKy(nhiemKyFilter);
      } else {
        results = await bchService.getAll();
      }

      // Filter by loaiThanhVien if selected
      if (loaiThanhVienFilter) {
        results = results.filter(bch => bch.loaiThanhVien === loaiThanhVienFilter);
      }

      return results.filter(bch => bch && bch.hoTen); // Filter null results
    },
    { keepPreviousData: true }
  );

  // Fetch statistics
  const { data: stats = {} } = useQuery(
    'bch-statistics',
    bchService.getStatistics
  );

  // Fetch chuc vu for filter options
  const { data: chucVuList = [] } = useQuery(
    'chuc-vu-for-filter',
    chucVuService.getAll
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (maBch) => bchService.delete(maBch),
    {
      onSuccess: () => {
        toast.success('Xóa BCH thành công!');
        queryClient.invalidateQueries('bch');
        queryClient.invalidateQueries('bch-statistics');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Xóa BCH thất bại!');
      },
    }
  );

  // Table columns
  const columns = [
    {
      header: 'Mã BCH',
      accessor: 'maBch',
      width: '100px',
      render: (value) => <span className="font-mono font-medium">{value}</span>,
    },
    {
      header: 'Thông tin',
      accessor: 'hoTen',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary font-semibold text-xs">
              {value?.charAt(0) || 'B'}
            </span>
          </div>
          <div>
            <div className="font-medium text-sm">{value || '-'}</div>
            <div className="text-xs text-gray-500">{row.email || ''}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Loại',
      accessor: 'loaiThanhVien',
      width: '100px',
      render: (value) => {
        const loaiColor = {
          SINH_VIEN: 'info',
          GIANG_VIEN: 'success',
          CHUYEN_VIEN: 'warning',
        };
        const loaiDisplay = {
          SINH_VIEN: 'Sinh viên',
          GIANG_VIEN: 'Giảng viên',
          CHUYEN_VIEN: 'Chuyên viên',
        };
        return <Badge variant={loaiColor[value] || 'default'}>{loaiDisplay[value] || '-'}</Badge>;
      },
    },
    {
      header: 'Chức vụ',
      accessor: 'danhSachChucVu',
      render: (chucVuList = []) => (
        <div className="flex flex-wrap gap-1">
          {chucVuList.length === 0 ? (
            <span className="text-gray-500 text-xs">-</span>
          ) : (
            chucVuList.map((cv) => (
              <Badge key={cv.id} variant="info" size="sm">
                {cv.tenChucVu}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      header: 'Lớp',
      accessor: 'tenLop',
      render: (value) => value || '-',
    },
    {
      header: 'Nhiệm kỳ',
      accessor: 'nhiemKy',
      render: (value) => value || '-',
    },
    {
      header: 'Trạng thái',
      accessor: 'isActive',
      width: '100px',
      render: (value) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? 'Hoạt động' : 'Ngừng'}
        </Badge>
      ),
    },
    {
      header: 'Thao tác',
      accessor: 'actions',
      width: '140px',
      render: (_, row) => (
        <div className="flex items-center gap-1 justify-center">
          <Button
            size="sm"
            variant="ghost"
            icon={Eye}
            onClick={() => handleView(row)}
            title="Xem chi tiết"
          />
          <Button
            size="sm"
            variant="ghost"
            icon={Edit}
            onClick={() => handleEdit(row)}
            title="Chỉnh sửa"
          />
          <Button
            size="sm"
            variant="ghost"
            icon={Settings}
            onClick={() => handleManageChucVu(row)}
            title="Quản lý chức vụ"
          />
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700"
            icon={Trash2}
            onClick={() => handleDelete(row)}
            title="Xóa"
          />
        </div>
      ),
    },
  ];

  const handleCreate = () => {
    setSelectedBCH(null);
    setIsCreateFormOpen(true);
  };

  const handleView = (bch) => {
    setSelectedBCH(bch);
    setIsViewModalOpen(true);
  };

  const handleEdit = (bch) => {
    setSelectedBCH(bch);
    setIsEditFormOpen(true);
  };

  const handleManageChucVu = (bch) => {
    setSelectedBCH(bch);
    setIsChucVuModalOpen(true);
  };

  const handleDelete = (bch) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${bch.hoTen || bch.maBch}?`)) {
      deleteMutation.mutate(bch.maBch);
    }
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedBCH(null);
  };

  const handleCreateFormClose = () => {
    setIsCreateFormOpen(false);
    setSelectedBCH(null);
  };

  const handleEditFormClose = () => {
    setIsEditFormOpen(false);
    setSelectedBCH(null);
  };

  const handleChucVuModalClose = () => {
    setIsChucVuModalOpen(false);
    setSelectedBCH(null);
  };

  const handleCreateSuccess = () => {
    handleCreateFormClose();
    refetch();
    queryClient.invalidateQueries('bch-statistics');
  };

  const handleEditSuccess = () => {
    handleEditFormClose();
    refetch();
    queryClient.invalidateQueries('bch-statistics');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Ban Chấp hành</h1>
          <p className="text-gray-600 mt-1">Quản lý thành viên Ban Chấp hành Đoàn - Hội</p>
        </div>
        <Button icon={Plus} onClick={handleCreate}>
          Thêm BCH mới
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{stats.totalBCH || 0}</div>
            <div className="text-gray-600 text-sm">Tổng BCH</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {stats.bySinhVien || 0}
            </div>
            <div className="text-gray-600 text-sm">Sinh viên</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {stats.byGiangVien || 0}
            </div>
            <div className="text-gray-600 text-sm">Giảng viên</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {stats.byChuyenVien || 0}
            </div>
            <div className="text-gray-600 text-sm">Chuyên viên</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <SearchInput
            placeholder="Tìm theo tên, email, mã sinh viên..."
            value={search}
            onChange={setSearch}
          />
        </div>
        <Select
          value={nhiemKyFilter}
          onChange={(e) => setNhiemKyFilter(e.target.value)}
          className="w-48"
        >
          <option value="">Tất cả nhiệm kỳ</option>
          <option value="2023-2024">2023-2024</option>
          <option value="2024-2025">2024-2025</option>
          <option value="2025-2026">2025-2026</option>
        </Select>
        <Select
          value={loaiThanhVienFilter}
          onChange={(e) => setLoaiThanhVienFilter(e.target.value)}
          className="w-48"
        >
          <option value="">Tất cả loại</option>
          <option value="SINH_VIEN">Sinh viên</option>
          <option value="GIANG_VIEN">Giảng viên</option>
          <option value="CHUYEN_VIEN">Chuyên viên</option>
        </Select>
        <Button
          variant="outline"
          icon={RefreshCw}
          onClick={() => refetch()}
          title="Làm mới"
        />
      </div>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          data={bchList}
          loading={isLoading}
          emptyMessage="Không có thành viên BCH nào"
        />
      </Card>

      {/* View Detail Modal */}
      <BCHDetailView
        isOpen={isViewModalOpen}
        bch={selectedBCH}
        onClose={handleViewModalClose}
        onEdit={() => {
          handleViewModalClose();
          handleEdit(selectedBCH);
        }}
      />

      {/* Chuc Vu Management Modal */}
      <AddChucVuModal
        isOpen={isChucVuModalOpen}
        maBch={selectedBCH?.maBch}
        onClose={handleChucVuModalClose}
        onSuccess={() => {
          handleChucVuModalClose();
          refetch();
          queryClient.invalidateQueries('bch-statistics');
        }}
      />

      {/* Create BCH Form */}
      <BCHCreateForm
        isOpen={isCreateFormOpen}
        onClose={handleCreateFormClose}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit BCH Form */}
      <BCHEditForm
        isOpen={isEditFormOpen}
        bch={selectedBCH}
        onClose={handleEditFormClose}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default BCH;
