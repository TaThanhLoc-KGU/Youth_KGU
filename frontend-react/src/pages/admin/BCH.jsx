import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import useAuthStore from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/constants';
import { Plus, Edit, Trash2, Eye, RefreshCw, Settings, Search } from 'lucide-react';
import bchService from '../../services/bchService';
import chucVuService from '../../services/chucVuService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchableSelect from '../../components/common/SearchableSelect';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import AddChucVuModal from '../../components/admin/AddChucVuModal';
import BCHCreateForm from '../../components/admin/BCHCreateForm';
import BCHEditForm from '../../components/admin/BCHEditForm';
import BCHDetailView from '../../components/admin/BCHDetailView';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const BCH = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const canView         = hasPermission(PERMISSIONS.XEM_BCH);
  const canAdd          = hasPermission(PERMISSIONS.THEM_BCH);
  const canEdit         = hasPermission(PERMISSIONS.SUA_BCH);
  const canDelete       = hasPermission(PERMISSIONS.XOA_BCH);
  const canManageChucVu = hasPermission(PERMISSIONS.QUAN_LY_CHUC_VU);
  const [search, setSearch] = useState('');
  const [nhiemKyFilter, setNhiemKyFilter] = useState('');
  const [loaiThanhVienFilter, setLoaiThanhVienFilter] = useState('');

  const [confirmState, setConfirmState] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isChucVuModalOpen, setIsChucVuModalOpen] = useState(false);
  const [selectedBCH, setSelectedBCH] = useState(null);

  // Fetch BCH list — chỉ khi có quyền xem BCH
  const { data: bchList = [], isLoading, refetch } = useQuery({
    queryKey: ['bch', search, nhiemKyFilter, loaiThanhVienFilter],
    queryFn: async () => {
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
    keepPreviousData: true,
    enabled: canView,
  });

  // Fetch statistics — chỉ khi có quyền xem BCH
  const { data: stats = {} } = useQuery({
    queryKey: ['bch-statistics'],
    queryFn: bchService.getStatistics,
    enabled: canView,
  });

  // Fetch chuc vu for filter options — chỉ khi có quyền xem BCH
  const { data: chucVuList = [] } = useQuery({
    queryKey: ['chuc-vu-for-filter'],
    queryFn: chucVuService.getAll,
    enabled: canView,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (maBch) => bchService.delete(maBch),
    onSuccess: () => {
        toast.success('Xóa BCH thành công!');
        queryClient.invalidateQueries(['bch']);
        queryClient.invalidateQueries(['bch-statistics']);
    },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Xóa BCH thất bại!');
    },
  });

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
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              icon={Edit}
              onClick={() => handleEdit(row)}
              title="Chỉnh sửa"
            />
          )}
          {canManageChucVu && (
            <Button
              size="sm"
              variant="ghost"
              icon={Settings}
              onClick={() => handleManageChucVu(row)}
              title="Quản lý chức vụ"
            />
          )}
          {canDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700"
              icon={Trash2}
              onClick={() => handleDelete(row)}
              title="Xóa"
            />
          )}
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
    setConfirmState({ id: bch.maBch, name: bch.hoTen || bch.maBch });
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
    queryClient.invalidateQueries(['bch-statistics']);
  };

  const handleEditSuccess = () => {
    handleEditFormClose();
    refetch();
    queryClient.invalidateQueries(['bch-statistics']);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý Ban Chấp hành</h1>
          <p className="text-gray-600 mt-1">Quản lý thành viên Ban Chấp hành Đoàn - Hội</p>
        </div>
        {canAdd && (
          <Button icon={Plus} onClick={handleCreate}>
            <span className="hidden sm:inline">Thêm BCH mới</span>
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tìm kiếm */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Tìm kiếm thành viên
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Tìm theo tên, email, mã số..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          {/* Nhiệm kỳ */}
          <div>
            <SearchableSelect
              label="Nhiệm kỳ"
              labelClassName="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
              placeholder="Tất cả nhiệm kỳ"
              options={[
                { value: '2023-2024', label: '2023-2024' },
                { value: '2024-2025', label: '2024-2025' },
                { value: '2025-2026', label: '2025-2026' },
              ]}
              value={nhiemKyFilter}
              onChange={setNhiemKyFilter}
            />
          </div>

          {/* Loại thành viên */}
          <div>
            <SearchableSelect
              label="Loại thành viên"
              labelClassName="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
              placeholder="Tất cả loại"
              options={[
                { value: 'SINH_VIEN', label: 'Sinh viên' },
                { value: 'GIANG_VIEN', label: 'Giảng viên' },
                { value: 'CHUYEN_VIEN', label: 'Chuyên viên' },
              ]}
              value={loaiThanhVienFilter}
              onChange={setLoaiThanhVienFilter}
            />
          </div>
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t border-gray-50">
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={() => {
              setSearch('');
              setNhiemKyFilter('');
              setLoaiThanhVienFilter('');
              refetch();
            }}
            className="text-gray-500 hover:text-primary-600 font-medium text-xs"
          >
            Làm mới bộ lọc
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            data={bchList}
            loading={isLoading}
            emptyMessage="Không có thành viên BCH nào"
          />
        </div>
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
          queryClient.invalidateQueries(['bch-statistics']);
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

      <ConfirmDialog
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={() => { deleteMutation.mutate(confirmState?.id); setConfirmState(null); }}
        title="Xóa BCH"
        description={`Bạn có chắc muốn xóa "${confirmState?.name}"? Hành động này không thể hoàn tác.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default BCH;
