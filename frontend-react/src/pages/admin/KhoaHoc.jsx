import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, RefreshCw, Search } from 'lucide-react';
import khoahocService from '../../services/khoahocService';
import useAuthStore from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/constants';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const KhoaHocForm = ({ initialData, mode = 'create', onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData ? {
      ...initialData,
      isActive: initialData.isActive === true || initialData.isActive === 1,
    } : {
      maKhoahoc: '',
      tenKhoahoc: '',
      namBatDau: new Date().getFullYear(),
      namKetThuc: new Date().getFullYear() + 1,
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      // Convert boolean to proper format if needed
      const submitData = {
        ...data,
        isActive: data.isActive === true || data.isActive === 'true',
      };

      if (mode === 'create') {
        return khoahocService.create(submitData);
      } else {
        return khoahocService.update(initialData.maKhoahoc, submitData);
      }
    },
    onSuccess: () => {
        toast.success(mode === 'create' ? 'Thêm khóa học thành công!' : 'Cập nhật khóa học thành công!');
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
        label="Mã khóa học"
        {...register('maKhoahoc', { required: 'Mã khóa học là bắt buộc' })}
        error={errors.maKhoahoc?.message}
        disabled={mode === 'edit'}
        placeholder="VD: K20, K21"
        required
      />
      <Input
        label="Tên khóa học"
        {...register('tenKhoahoc', { required: 'Tên khóa học là bắt buộc' })}
        error={errors.tenKhoahoc?.message}
        placeholder="VD: Khóa 2020-2024"
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Năm bắt đầu"
          type="number"
          {...register('namBatDau', { required: 'Năm bắt đầu là bắt buộc' })}
          error={errors.namBatDau?.message}
          required
        />
        <Input
          label="Năm kết thúc"
          type="number"
          {...register('namKetThuc', { required: 'Năm kết thúc là bắt buộc' })}
          error={errors.namKetThuc?.message}
          required
        />
      </div>
      <Select
        label="Trạng thái"
        {...register('isActive')}
        options={[
          { value: true, label: 'Hoạt động' },
          { value: false, label: 'Ngừng' },
        ]}
      />
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>Hủy</Button>
        <Button isLoading={mutation.isLoading} disabled={mutation.isLoading}>
          {mode === 'create' ? 'Thêm khóa học' : 'Cập nhật'}
        </Button>
      </div>
    </form>
  );
};

const KhoaHoc = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission(PERMISSIONS.CAI_DAT_HE_THONG);
  const [confirmState, setConfirmState] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKhoaHoc, setSelectedKhoaHoc] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  const { data: khoahocList = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['khoahoc', search, statusFilter],
    queryFn: async () => {
      let result = await khoahocService.getAll();

      if (search) {
        result = result.filter(k =>
          k.maKhoahoc.toLowerCase().includes(search.toLowerCase()) ||
          k.tenKhoahoc.toLowerCase().includes(search.toLowerCase())
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
      onError: () => {
        toast.error('Không thể tải danh sách khóa học');
      }
  });

  const deleteMutation = useMutation({
    mutationFn: (maKhoaHoc) => khoahocService.delete(maKhoaHoc),
    onSuccess: () => {
        toast.success('Xóa khóa học thành công!');
        queryClient.invalidateQueries(['khoahoc']);
    },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Xóa thất bại!');
    },
    }
  );

  const columns = [
    {
      header: 'Mã khóa',
      accessor: 'maKhoahoc',
      render: (v) => <span className="font-medium">{v}</span>,
    },
    {
      header: 'Tên khóa học',
      accessor: 'tenKhoahoc',
    },
    {
      header: 'Năm học',
      accessor: 'namBatDau',
      render: (value, row) => `${value} - ${row.namKetThuc}`,
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
          {canManage && (
            <Button
              size="sm"
              variant="ghost"
              icon={Edit}
              onClick={() => {
                setSelectedKhoaHoc(row);
                setModalMode('edit');
                setIsModalOpen(true);
              }}
            />
          )}
          {canManage && (
            <Button
              size="sm"
              variant="ghost"
              icon={Trash2}
              className="text-red-600"
              onClick={() => setConfirmState({ id: row.maKhoahoc, name: row.tenKhoahoc })}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý Khóa học</h1>
          <p className="text-gray-600 mt-1">Quản lý các khóa học/năm học</p>
        </div>
        {canManage && (
          <Button icon={Plus} onClick={() => {
            setSelectedKhoaHoc(null);
            setModalMode('create');
            setIsModalOpen(true);
          }}>
            Thêm khóa học
          </Button>
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tìm kiếm */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Tìm kiếm khóa học
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Mã khóa hoặc tên khóa..."
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
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-red-700 font-medium">
              ⚠️ Có lỗi xảy ra khi tải danh sách khóa học
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
        {!isError && khoahocList.length === 0 && !isLoading && (
          <div className="p-6 text-center">
            <p className="text-gray-500">Chưa có khóa học nào. Vui lòng thêm khóa học mới.</p>
          </div>
        )}
        <Table columns={columns} data={khoahocList} isLoading={isLoading} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm khóa học' : 'Chỉnh sửa khóa học'}
        size="md"
      >
        <KhoaHocForm
          initialData={selectedKhoaHoc}
          mode={modalMode}
          onSuccess={() => {
            setIsModalOpen(false);
            queryClient.invalidateQueries(['khoahoc']);
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={() => { deleteMutation.mutate(confirmState?.id); setConfirmState(null); }}
        title="Xóa khóa học"
        description={`Bạn có chắc muốn xóa khóa học "${confirmState?.name}"? Hành động này không thể hoàn tác.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default KhoaHoc;
