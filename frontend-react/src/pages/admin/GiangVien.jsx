import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import useAuthStore from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/constants';
import { Plus, Edit, Trash2, RotateCcw, RefreshCw, Search } from 'lucide-react';
import giangvienService from '../../services/giangvienService';
import khoaService from '../../services/khoaService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchableSelect from '../../components/common/SearchableSelect';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const GiangVienForm = ({ initialData, mode = 'create', onSuccess, onCancel, khoas }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      maGv: '',
      hoTen: '',
      email: '',
      maKhoa: '',
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (mode === 'create') {
        return giangvienService.create(data);
      } else {
        return giangvienService.update(initialData.maGv, data);
      }
    },
    onSuccess: () => {
        toast.success(mode === 'create' ? 'Thêm giảng viên thành công!' : 'Cập nhật giảng viên thành công!');
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
        label="Mã giảng viên"
        {...register('maGv', { required: 'Mã GV là bắt buộc' })}
        error={errors.maGv?.message}
        disabled={mode === 'edit'}
        required
      />
      <Input
        label="Họ và tên"
        {...register('hoTen', { required: 'Họ tên là bắt buộc' })}
        error={errors.hoTen?.message}
        required
      />
      <Input
        label="Email"
        type="email"
        {...register('email', {
          required: 'Email là bắt buộc',
          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' }
        })}
        error={errors.email?.message}
        required
      />
      <Select
        label="Khoa"
        {...register('maKhoa', { required: 'Khoa là bắt buộc' })}
        options={[{ value: '', label: '-- Chọn khoa --' }, ...khoas.map(k => ({
          value: k.maKhoa, label: k.tenKhoa
        }))]}
        error={errors.maKhoa?.message}
        required
      />
      <Select
        label="Trạng thái"
        {...register('isActive')}
        options={[
          { value: 'true', label: 'Hoạt động' },
          { value: 'false', label: 'Ngừng hoạt động' },
        ]}
      />
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>Hủy</Button>
        <Button isLoading={mutation.isLoading} disabled={mutation.isLoading}>
          {mode === 'create' ? 'Thêm GV' : 'Cập nhật'}
        </Button>
      </div>
    </form>
  );
};

const GiangVien = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const canView   = hasPermission(PERMISSIONS.XEM_GIANG_VIEN);
  const canAdd    = hasPermission(PERMISSIONS.THEM_GIANG_VIEN);
  const canEdit   = hasPermission(PERMISSIONS.SUA_GIANG_VIEN);
  const canDelete = hasPermission(PERMISSIONS.XOA_GIANG_VIEN);
  const canViewKhoa = hasPermission(PERMISSIONS.XEM_KHOA);
  const [confirmState, setConfirmState] = useState(null);
  const [search, setSearch] = useState('');
  const [khoaFilter, setKhoaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGV, setSelectedGV] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  // Chỉ fetch khoa khi có quyền để tránh spam 403
  const { data: khoas = [] } = useQuery({
    queryKey: ['khoa-for-gv'],
    queryFn: () => khoaService.getAll(),
    enabled: canViewKhoa,
  });

  const { data: gvList = [], isLoading, error, refetch } = useQuery({
    queryKey: ['giangvien', search, khoaFilter, statusFilter],
    queryFn: async () => {
      try {
        const params = {};
        if (search) params.search = search;
        if (khoaFilter) params.khoa = khoaFilter;
        if (statusFilter) params.status = statusFilter;

        const result = await giangvienService.getAll(params);
        // Đảm bảo trả về array
        return Array.isArray(result) ? result : (result.data || []);
      } catch (error) {
        console.error('Error fetching giangvien:', error);
        throw error;
      }
    },
    keepPreviousData: true,
    retry: 1,
    refetchOnWindowFocus: false,
    onError: (error) => {
      toast.error('Lỗi tải dữ liệu giảng viên: ' + (error.message || 'Unknown error'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (maGv) => giangvienService.delete(maGv),
    onSuccess: () => {
      toast.success('Xóa giảng viên thành công!');
      queryClient.invalidateQueries({ queryKey: ['giangvien'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xóa thất bại!');
    }
  });

  const restoreMutation = useMutation({
    mutationFn: (maGv) => giangvienService.restore(maGv),
    onSuccess: () => {
      toast.success('Khôi phục giảng viên thành công!');
      queryClient.invalidateQueries({ queryKey: ['giangvien'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Khôi phục thất bại!');
    }
  });

  const columns = [
    {
      header: 'Mã GV',
      accessor: 'maGv',
      render: (v) => <span className="font-medium">{v}</span>,
    },
    {
      header: 'Họ và tên',
      accessor: 'hoTen',
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Khoa',
      accessor: 'tenKhoa',
      render: (v) => v || <span className="text-gray-400 italic">—</span>,
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
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              icon={Edit}
              onClick={() => {
                setSelectedGV(row);
                setModalMode('edit');
                setIsModalOpen(true);
              }}
            />
          )}
          {canDelete && row.isActive && (
            <Button
              size="sm"
              variant="ghost"
              icon={Trash2}
              className="text-red-600"
              onClick={() => setConfirmState({ type: 'delete', id: row.maGv, name: row.hoTen })}
            />
          )}
          {canEdit && !row.isActive && (
            <Button
              size="sm"
              variant="ghost"
              icon={RotateCcw}
              className="text-blue-600"
              onClick={() => setConfirmState({ type: 'restore', id: row.maGv, name: row.hoTen })}
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý Giảng viên</h1>
          <p className="text-gray-600 mt-1">Quản lý thông tin giảng viên</p>
        </div>
        {canAdd && (
          <Button icon={Plus} onClick={() => {
            setSelectedGV(null);
            setModalMode('create');
            setIsModalOpen(true);
          }}>
            Thêm GV
          </Button>
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tìm kiếm */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Tìm kiếm giảng viên
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Nhập mã GV, tên hoặc email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          {/* Khoa */}
          <div>
            <SearchableSelect
              label="Khoa"
              labelClassName="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
              placeholder="Tất cả khoa"
              options={khoas.map(k => ({
                value: k.maKhoa,
                label: k.tenKhoa
              }))}
              value={khoaFilter}
              onChange={setKhoaFilter}
            />
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
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t border-gray-50">
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={() => {
              setSearch('');
              setKhoaFilter('');
              setStatusFilter('');
            }}
            className="text-gray-500 hover:text-primary-600 font-medium text-xs"
          >
            Làm mới bộ lọc
          </Button>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p className="font-medium">Có lỗi xảy ra khi tải dữ liệu</p>
            <p className="text-sm mt-1">{error.message}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => refetch()}
              icon={RefreshCw}
            >
              Thử lại
            </Button>
          </div>
        ) : gvList && gvList.length > 0 ? (
          <Table columns={columns} data={gvList} />
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>Không có dữ liệu giảng viên</p>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm giảng viên' : 'Chỉnh sửa giảng viên'}
        size="lg"
      >
        <GiangVienForm
          initialData={selectedGV}
          mode={modalMode}
          khoas={khoas}
          onSuccess={() => {
            setIsModalOpen(false);
            queryClient.invalidateQueries(['giangvien']);
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmState && confirmState.type === 'delete'}
        onClose={() => setConfirmState(null)}
        onConfirm={() => { deleteMutation.mutate(confirmState?.id); setConfirmState(null); }}
        title="Xóa giảng viên"
        description={`Bạn có chắc muốn xóa giảng viên "${confirmState?.name}"? Hành động này không thể hoàn tác.`}
        isLoading={deleteMutation.isPending}
      />
      <ConfirmDialog
        isOpen={!!confirmState && confirmState.type === 'restore'}
        onClose={() => setConfirmState(null)}
        onConfirm={() => { restoreMutation.mutate(confirmState?.id); setConfirmState(null); }}
        title="Khôi phục giảng viên"
        description={`Bạn có chắc muốn khôi phục giảng viên "${confirmState?.name}"?`}
        isLoading={restoreMutation.isPending}
        variant="warning"
      />
    </div>
  );
};

export default GiangVien;
