import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import banService from '../../services/banService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Card from '../../components/common/Card';
import BanForm from '../../components/admin/BanForm';

const LOAI_BAN_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'DOAN', label: 'Đoàn' },
  { value: 'HOI', label: 'Hội' },
  { value: 'DOI', label: 'Đội' },
  { value: 'CLB', label: 'CLB' },
  { value: 'BAN', label: 'Ban' },
];

const getBadgeVariant = (loaiBan) => {
  switch (loaiBan) {
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
    case 'DOI_CLB_BAN':
      return 'warning';
    default:
      return 'secondary';
  }
};

const getLoaiBanLabel = (loaiBan) => {
  return LOAI_BAN_OPTIONS.find(op => op.value === loaiBan)?.label || loaiBan;
};

const Ban = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [loaiBanFilter, setLoaiBanFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBan, setSelectedBan] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  // Fetch ban list
  const { data: banList = [], isLoading, refetch } = useQuery({
    queryKey: ['ban', search, loaiBanFilter],
    queryFn: async () => {
      const allBan = await banService.getAll();

      let filtered = allBan;

      if (search) {
        filtered = filtered.filter(b =>
          b.tenBan?.toLowerCase().includes(search.toLowerCase()) ||
          b.maBan?.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (loaiBanFilter) {
        filtered = filtered.filter(b => b.loaiBan === loaiBanFilter);
      }

      return filtered;
    },
    keepPreviousData: true
  }
  );

  // Fetch statistics
  const { data: stats = {} } = useQuery({
    queryKey: ['ban-statistics'],
    queryFn: banService.getStatistics
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (maBan) => banService.delete(maBan),
    onSuccess: () => {
        toast.success('Xóa ban thành công!');
        queryClient.invalidateQueries(['ban']);
        queryClient.invalidateQueries(['ban-statistics']);
    },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Xóa ban thất bại!');
    },
  });

  // Table columns
  const columns = [
    {
      header: 'Mã ban',
      accessor: 'maBan',
      width: '120px',
      render: (value) => <span className="font-mono font-medium">{value}</span>,
    },
    {
      header: 'Tên ban',
      accessor: 'tenBan',
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      header: 'Loại ban',
      accessor: 'loaiBan',
      width: '140px',
      render: (value) => (
        <Badge variant={getBadgeVariant(value)}>
          {getLoaiBanLabel(value)}
        </Badge>
      ),
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
          <Button
            size="sm"
            variant="outline"
            icon={Edit}
            onClick={() => handleEdit(row)}
            title="Chỉnh sửa"
          />
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:bg-red-50"
            icon={Trash2}
            onClick={() => handleDelete(row.maBan)}
            title="Xóa"
          />
        </div>
      ),
    },
  ];

  const handleCreate = () => {
    setSelectedBan(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEdit = (ban) => {
    setSelectedBan(ban);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = (maBan) => {
    if (confirm('Bạn chắc chắn muốn xóa ban này?')) {
      deleteMutation.mutate(maBan);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedBan(null);
  };

  const handleSuccess = () => {
    handleModalClose();
    queryClient.invalidateQueries(['ban']);
    queryClient.invalidateQueries(['ban-statistics']);
    toast.success(
      modalMode === 'create'
        ? 'Tạo ban thành công!'
        : 'Cập nhật ban thành công!'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Ban/Đội/CLB</h1>
          <p className="text-gray-600 mt-1">Quản lý các ban, đội, CLB trong Ban Chấp hành</p>
        </div>
        <Button icon={Plus} onClick={handleCreate}>
          Thêm ban mới
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <SearchInput
            placeholder="Tìm theo mã hoặc tên ban..."
            value={search}
            onChange={setSearch}
          />
        </div>
        <Select
          value={loaiBanFilter}
          onChange={(e) => setLoaiBanFilter(e.target.value)}
          className="w-48"
        >
          {LOAI_BAN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
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
          data={banList}
          loading={isLoading}
          emptyMessage="Không có ban nào"
        />
      </Card>

      {/* Modal Form */}
      <Modal isOpen={isModalOpen} onClose={handleModalClose}>
        <BanForm
          initialData={selectedBan}
          mode={modalMode}
          onSuccess={handleSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </div>
  );
};

export default Ban;
