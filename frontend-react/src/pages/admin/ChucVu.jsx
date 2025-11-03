import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import chucVuService from '../../services/chucVuService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
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
  { value: 'BAN_PHUC_VU', label: 'Ban phục vụ' },
];

const getBadgeVariant = (thuocBan) => {
  switch (thuocBan) {
    case 'DOAN':
      return 'info';
    case 'HOI':
      return 'success';
    case 'BAN_PHUC_VU':
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
  const [search, setSearch] = useState('');
  const [thuocBanFilter, setThuocBanFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChucVu, setSelectedChucVu] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  // Fetch chuc vu list
  const { data: chucVuList = [], isLoading, refetch } = useQuery(
    ['chuc-vu', search, thuocBanFilter],
    async () => {
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
    { keepPreviousData: true }
  );

  // Fetch statistics
  const { data: stats = {} } = useQuery(
    'chuc-vu-statistics',
    chucVuService.getStatistics
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (maChucVu) => chucVuService.delete(maChucVu),
    {
      onSuccess: () => {
        toast.success('Xóa chức vụ thành công!');
        queryClient.invalidateQueries('chuc-vu');
        queryClient.invalidateQueries('chuc-vu-statistics');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Xóa chức vụ thất bại!');
      },
    }
  );

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
            onClick={() => handleDelete(row.maChucVu)}
            title="Xóa"
          />
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

  const handleDelete = (maChucVu) => {
    if (confirm('Bạn chắc chắn muốn xóa chức vụ này?')) {
      deleteMutation.mutate(maChucVu);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedChucVu(null);
  };

  const handleSuccess = () => {
    handleModalClose();
    queryClient.invalidateQueries('chuc-vu');
    queryClient.invalidateQueries('chuc-vu-statistics');
    toast.success(
      modalMode === 'create'
        ? 'Tạo chức vụ thành công!'
        : 'Cập nhật chức vụ thành công!'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Chức vụ</h1>
          <p className="text-gray-600 mt-1">Quản lý các chức vụ trong Ban Chấp hành</p>
        </div>
        <Button icon={Plus} onClick={handleCreate}>
          Thêm chức vụ mới
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{stats.total || 0}</div>
            <div className="text-gray-600 text-sm">Tổng chức vụ</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.DOAN || 0}</div>
            <div className="text-gray-600 text-sm">Chức vụ Đoàn</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.HOI || 0}</div>
            <div className="text-gray-600 text-sm">Chức vụ Hội</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {stats.BAN_PHUC_VU || 0}
            </div>
            <div className="text-gray-600 text-sm">Ban phục vụ</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <SearchInput
            placeholder="Tìm theo mã hoặc tên chức vụ..."
            value={search}
            onChange={setSearch}
          />
        </div>
        <Select
          value={thuocBanFilter}
          onChange={(e) => setThuocBanFilter(e.target.value)}
          className="w-48"
        >
          {THUOC_BAN_OPTIONS.map((opt) => (
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
    </div>
  );
};

export default ChucVu;
