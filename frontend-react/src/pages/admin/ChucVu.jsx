import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import useAuthStore from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/constants';
import { Plus, Edit, Trash2, RefreshCw, Search } from 'lucide-react';
import chucVuService from '../../services/chucVuService';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchableSelect from '../../components/common/SearchableSelect';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Card from '../../components/common/Card';
import ChucVuForm from '../../components/admin/ChucVuForm';

const THUOC_BAN_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'DOAN', label: 'Đoàn' },
  { value: 'HOI', label: 'Hội' },
  { value: 'DOI', label: 'Đội' },
  { value: 'CLB', label: 'CLB' },
  { value: 'BAN', label: 'Ban' },
];

const getBadgeVariant = (thuocBan) => {
  switch (thuocBan) {
    case 'DOAN':
      return 'info';
    case 'HOI':
      return 'success';
    case 'DOI':
      return 'warning';
    case 'CLB':
      return 'warning';
    case 'BAN':
      return 'warning';
    default:
      return 'secondary';
  }
};

const getThuocBanLabel = (thuocBan) => {
  return THUOC_BAN_OPTIONS.find(op => op.value === thuocBan)?.label || thuocBan;
};

const ChucVu = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission(PERMISSIONS.MANAGE_BCH);
  const [search, setSearch] = useState('');
  const [thuocBanFilter, setThuocBanFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChucVu, setSelectedChucVu] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fetch chuc vu list
  const { data: chucVuList = [], isLoading, refetch } = useQuery({
    queryKey: ['chuc-vu', search, thuocBanFilter],
    queryFn: async () => {
      const allChucVu = await chucVuService.getAll();

      let filtered = allChucVu;

      if (search) {
        filtered = filtered.filter(cv =>
          cv.tenChucVu?.toLowerCase().includes(search.toLowerCase()) ||
          cv.maChucVu?.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (thuocBanFilter) {
        filtered = filtered.filter(cv => cv.thuocBan === thuocBanFilter);
      }

      return filtered;
    },
    keepPreviousData: true
  });

  // Fetch statistics
  const { data: stats = {} } = useQuery({
    queryKey: ['chuc-vu-statistics'],
    queryFn: chucVuService.getStatistics
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (maChucVu) => chucVuService.delete(maChucVu),
    onSuccess: () => {
      toast.success('Xóa chức vụ thành công!');
      queryClient.invalidateQueries(['chuc-vu']);
      queryClient.invalidateQueries(['chuc-vu-statistics']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xóa chức vụ thất bại!');
    },
  });

  // Table columns
  const columns = [
    {
      header: 'Mã chức vụ',
      accessor: 'maChucVu',
      width: '120px',
      render: (value) => <span className="font-mono font-medium">{value}</span>,
    },
    {
      header: 'Tên chức vụ',
      accessor: 'tenChucVu',
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      header: 'Thuộc ban',
      accessor: 'thuocBan',
      width: '140px',
      render: (value) => (
        <Badge variant={getBadgeVariant(value)}>
          {getThuocBanLabel(value)}
        </Badge>
      ),
    },
    {
      header: 'Thứ tự',
      accessor: 'thuTu',
      width: '80px',
      render: (value) => <span className="text-center block">{value || '-'}</span>,
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
      width: '120px',
      render: (_, row) => (
        <div className="flex gap-2 justify-center">
          {canManage && (
            <Button size="sm" variant="outline" icon={Edit} onClick={() => handleEdit(row)} title="Chỉnh sửa" />
          )}
          {canManage && (
            <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" icon={Trash2} onClick={() => handleDelete(row.maChucVu)} title="Xóa" />
          )}
        </div>
      ),
    },
  ];

  const handleCreate = () => {
    setSelectedChucVu(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEdit = (chucVu) => {
    setSelectedChucVu(chucVu);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = (maChucVu) => setDeleteTarget(maChucVu);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedChucVu(null);
  };

  const handleSuccess = () => {
    handleModalClose();
    queryClient.invalidateQueries(['chuc-vu']);
    queryClient.invalidateQueries(['chuc-vu-statistics']);
    toast.success(
      modalMode === 'create'
        ? 'Tạo chức vụ thành công!'
        : 'Cập nhật chức vụ thành công!'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý Chức vụ</h1>
          <p className="text-gray-600 mt-1">Quản lý các chức vụ trong Ban Chấp hành</p>
        </div>
        {canManage && (
          <Button icon={Plus} onClick={handleCreate}>
            Thêm chức vụ mới
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{stats.total || 0}</div>
            <div className="text-gray-600 text-sm">Tổng cộng</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.DOAN || 0}</div>
            <div className="text-gray-600 text-sm">Đoàn</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.HOI || 0}</div>
            <div className="text-gray-600 text-sm">Hội</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.DOI || 0}</div>
            <div className="text-gray-600 text-sm">Đội</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.CLB || 0}</div>
            <div className="text-gray-600 text-sm">CLB</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{stats.BAN || 0}</div>
            <div className="text-gray-600 text-sm">Ban</div>
          </div>
        </Card>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tìm kiếm */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Tìm kiếm chức vụ
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Mã hoặc tên chức vụ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          {/* Thuộc ban */}
          <div>
            <SearchableSelect
              label="Thuộc ban"
              labelClassName="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
              placeholder="Tất cả ban"
              options={THUOC_BAN_OPTIONS.filter(opt => opt.value !== '').map(opt => ({
                value: opt.value,
                label: opt.label
              }))}
              value={thuocBanFilter}
              onChange={setThuocBanFilter}
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={() => {
                setSearch('');
                setThuocBanFilter('');
                refetch();
              }}
              className="w-full"
            >
              Làm mới
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          data={chucVuList}
          loading={isLoading}
          emptyMessage="Không có chức vụ nào"
        />
      </Card>

      {/* Modal Form */}
      <Modal isOpen={isModalOpen} onClose={handleModalClose}>
        <ChucVuForm
          initialData={selectedChucVu}
          mode={modalMode}
          onSuccess={handleSuccess}
          onCancel={handleModalClose}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteMutation.mutate(deleteTarget); setDeleteTarget(null); }}
        title="Xóa chức vụ"
        description="Bạn chắc chắn muốn xóa chức vụ này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ChucVu;
