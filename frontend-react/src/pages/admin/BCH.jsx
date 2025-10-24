import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Eye, RefreshCw } from 'lucide-react';
import bchService from '../../services/bchService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import BCHForm from '../../components/admin/BCHForm';
import Card from '../../components/common/Card';

const BCH = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [chucVuFilter, setChucVuFilter] = useState('');
  const [khoaFilter, setKhoaFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBCH, setSelectedBCH] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  // Fetch BCH list with filters
  const { data: bchList = [], isLoading, refetch } = useQuery(
    ['bch', search, chucVuFilter, khoaFilter],
    async () => {
      if (search || chucVuFilter || khoaFilter) {
        return bchService.searchAdvanced(search, chucVuFilter, khoaFilter);
      }
      return bchService.getAll();
    },
    { keepPreviousData: true }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (maBch) => bchService.delete(maBch),
    {
      onSuccess: () => {
        toast.success('Xóa BCH thành công!');
        queryClient.invalidateQueries('bch');
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
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      header: 'Họ và tên',
      accessor: 'hoTen',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary font-semibold text-xs">
              {value?.charAt(0)}
            </span>
          </div>
          <div>
            <div className="font-medium text-sm">{value}</div>
            <div className="text-xs text-gray-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Chức vụ',
      accessor: 'chucVu',
      render: (value) => <Badge variant="info">{value || '-'}</Badge>,
    },
    {
      header: 'Khoa',
      accessor: 'tenKhoa',
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
        <Badge variant={value ? 'success' : 'danger'} dot>
          {value ? 'Hoạt động' : 'Ngừng'}
        </Badge>
      ),
    },
    {
      header: 'Thao tác',
      accessor: 'actions',
      width: '120px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
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
    setSelectedBCH(null);
    setIsModalOpen(true);
  };

  const handleEdit = (bch) => {
    setModalMode('edit');
    setSelectedBCH(bch);
    setIsModalOpen(true);
  };

  const handleDelete = (bch) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${bch.hoTen}?`)) {
      deleteMutation.mutate(bch.maBch);
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    queryClient.invalidateQueries('bch');
  };

  const chucVuOptions = [
    { value: '', label: 'Tất cả chức vụ' },
    { value: 'Chủ tịch', label: 'Chủ tịch' },
    { value: 'Phó chủ tịch', label: 'Phó chủ tịch' },
    { value: 'Tuyên truyền', label: 'Tuyên truyền' },
    { value: 'Ngoại ngữ', label: 'Ngoại ngữ' },
    { value: 'Văn hóa - Thể thao', label: 'Văn hóa - Thể thao' },
    { value: 'Học tập', label: 'Học tập' },
    { value: 'Công tác xã hội', label: 'Công tác xã hội' },
  ];

  const khoaOptions = [
    { value: '', label: 'Tất cả khoa' },
    { value: 'CNTT', label: 'Công nghệ thông tin' },
    { value: 'KT', label: 'Kỹ thuật' },
    { value: 'QL', label: 'Quản lý' },
    { value: 'KN', label: 'Kinh tế' },
    { value: 'NN', label: 'Ngoại ngữ' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý BCH</h1>
          <p className="text-gray-600 mt-1">
            Quản lý thành viên Ban Chủ nhiệm Đoàn
          </p>
        </div>
        <Button icon={Plus} onClick={handleCreate}>
          Thêm BCH
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SearchInput
              placeholder="Tìm kiếm theo tên, email..."
              value={search}
              onSearch={setSearch}
              className="md:col-span-2"
            />
            <Select
              options={chucVuOptions}
              value={chucVuFilter}
              onChange={(e) => setChucVuFilter(e.target.value)}
            />
            <div className="flex items-end gap-2">
              <Select
                options={khoaOptions}
                value={khoaFilter}
                onChange={(e) => setKhoaFilter(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                icon={RefreshCw}
                onClick={() => refetch()}
                size="sm"
              >
                Làm mới
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          data={bchList}
          isLoading={isLoading}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm thành viên BCH' : 'Chỉnh sửa BCH'}
        size="lg"
      >
        <BCHForm
          initialData={selectedBCH}
          mode={modalMode}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default BCH;
