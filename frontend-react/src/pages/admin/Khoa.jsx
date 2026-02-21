import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import khoaService from '../../services/khoaService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { useForm } from 'react-hook-form';

// Form Component
const KhoaForm = ({ initialData, mode = 'create', onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      maKhoa: '',
      tenKhoa: '',
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (mode === 'create') {
        return khoaService.create(data);
      } else {
        return khoaService.update(initialData.maKhoa, data);
      }
    },
    onSuccess: () => {
        toast.success(
          mode === 'create' ? 'Thêm khoa thành công!' : 'Cập nhật khoa thành công!'
        );
        onSuccess();
    },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    },
    }
  );

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <Input
        label="Mã khoa"
        {...register('maKhoa', { required: 'Mã khoa là bắt buộc' })}
        error={errors.maKhoa?.message}
        disabled={mode === 'edit'}
        required
      />
      <Input
        label="Tên khoa"
        {...register('tenKhoa', { required: 'Tên khoa là bắt buộc' })}
        error={errors.tenKhoa?.message}
        required
      />
      <Select
        label="Trạng thái"
        {...register('isActive')}
        options={[
          { value: 'true', label: 'Hoạt động' },
          { value: 'false', label: 'Ngừng' },
        ]}
      />
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>Hủy</Button>
        <Button isLoading={mutation.isLoading} disabled={mutation.isLoading}>
          {mode === 'create' ? 'Thêm khoa' : 'Cập nhật'}
        </Button>
      </div>
    </form>
  );
};

const Khoa = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKhoa, setSelectedKhoa] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  const { data: khoaList = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['khoa', search, statusFilter],
    queryFn: async () => {
      let result = await khoaService.getAll();
      if (search) {
        result = result.filter(k =>
          k.maKhoa.toLowerCase().includes(search.toLowerCase()) ||
          k.tenKhoa.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (statusFilter !== '') {
        const active = statusFilter === 'active';
        result = result.filter(k => k.isActive === active);
      }
      return result;
    },
    keepPreviousData: true,
      retry: 3,
      onError: (error) => {
        toast.error('Không thể tải danh sách khoa. Vui lòng thử lại.');
      }
  });

  const deleteMutation = useMutation({
    mutationFn: (maKhoa) => khoaService.delete(maKhoa),
    onSuccess: () => {
        toast.success('Xóa khoa thành công!');
        queryClient.invalidateQueries(['khoa']);
    },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Xóa thất bại!');
    },
    }
  );

  const columns = [
    {
      header: 'Mã khoa',
      accessor: 'maKhoa',
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      header: 'Tên khoa',
      accessor: 'tenKhoa',
    },
    {
      header: 'Trạng thái',
      accessor: 'isActive',
      render: (value) => (
        <Badge variant={value ? 'success' : 'danger'} dot>
          {value ? 'Hoạt động' : 'Ngừng'}
        </Badge>
      ),
    },
    {
      header: 'Thao tác',
      accessor: 'actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            icon={Edit}
            onClick={() => {
              setSelectedKhoa(row);
              setModalMode('edit');
              setIsModalOpen(true);
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            icon={Trash2}
            className="text-red-600"
            onClick={() => {
              if (window.confirm(`Xóa khoa ${row.tenKhoa}?`)) {
                deleteMutation.mutate(row.maKhoa);
              }
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Khoa</h1>
          <p className="text-gray-600 mt-1">Quản lý các khoa/bộ môn</p>
        </div>
        <Button icon={Plus} onClick={() => {
          setSelectedKhoa(null);
          setModalMode('create');
          setIsModalOpen(true);
        }}>
          Thêm khoa
        </Button>
      </div>

      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SearchInput
              placeholder="Tìm kiếm..."
              value={search}
              onSearch={setSearch}
              className="md:col-span-2"
            />
            <Select
              options={[
                { value: '', label: 'Tất cả trạng thái' },
                { value: 'active', label: 'Hoạt động' },
                { value: 'inactive', label: 'Ngừng' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
            <Button variant="outline" icon={RefreshCw} onClick={() => refetch()}>
              Làm mới
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        {isError && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-red-700 font-medium">
              ⚠️ Có lỗi xảy ra khi tải danh sách khoa
            </p>
            <p className="text-red-600 text-sm mt-1">
              {error?.response?.data?.message || error?.message || 'Vui lòng thử lại'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              className="mt-3"
            >
              Thử lại
            </Button>
          </div>
        )}
        {!isError && khoaList.length === 0 && !isLoading && (
          <div className="p-6 text-center">
            <p className="text-gray-500">Chưa có khoa nào. Vui lòng thêm khoa mới.</p>
          </div>
        )}
        <Table columns={columns} data={khoaList} isLoading={isLoading} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm khoa' : 'Chỉnh sửa khoa'}
        size="md"
      >
        <KhoaForm
          initialData={selectedKhoa}
          mode={modalMode}
          onSuccess={() => {
            setIsModalOpen(false);
            queryClient.invalidateQueries(['khoa']);
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Khoa;
