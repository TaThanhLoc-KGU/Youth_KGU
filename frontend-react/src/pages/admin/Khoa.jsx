import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import useAuthStore from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/constants';
import { Plus, Edit, Trash2, RefreshCw, Search } from 'lucide-react';
import khoaService from '../../services/khoaService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
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
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission(PERMISSIONS.CAI_DAT_HE_THONG);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKhoa, setSelectedKhoa] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [deleteTarget, setDeleteTarget] = useState(null);

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
        setDeleteTarget(null);
    },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Xóa thất bại!');
        setDeleteTarget(null);
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
        <div className="flex gap-2 justify-end">
          {canManage && (
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
          )}
          {canManage && (
            <Button
              size="sm"
              variant="danger-ghost"
              icon={Trash2}
              onClick={() => setDeleteTarget(row)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Khoa</h1>
          <p className="page-subtitle">Quản lý các khoa/bộ môn</p>
        </div>
        {canManage && (
          <Button icon={Plus} onClick={() => {
            setSelectedKhoa(null);
            setModalMode('create');
            setIsModalOpen(true);
          }}>
            <span className="hidden sm:inline">Thêm khoa</span>
          </Button>
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tìm kiếm */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Tìm kiếm khoa
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Mã khoa hoặc tên khoa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          {/* Trạng thái */}
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                refetch();
              }}
              className="w-full"
            >
              Làm mới
            </Button>
          </div>
        </div>
      </div>

      <Card>
        {isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
            <p className="text-red-700 font-medium">
              Có lỗi xảy ra khi tải danh sách khoa
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.maKhoa)}
        title="Xóa khoa"
        description={`Bạn có chắc chắn muốn xóa khoa "${deleteTarget?.tenKhoa}"? Hành động này không thể hoàn tác.`}
        isLoading={deleteMutation.isPending || deleteMutation.isLoading}
      />
    </div>
  );
};

export default Khoa;
