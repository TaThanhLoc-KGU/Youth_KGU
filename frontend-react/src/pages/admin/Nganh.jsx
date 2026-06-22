import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Download, RefreshCw, Search } from 'lucide-react';
import nganhService from '../../services/nganhService';
import khoaService from '../../services/khoaService';
import useAuthStore from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/constants';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchableSelect from '../../components/common/SearchableSelect';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const NganhForm = ({ initialData, mode = 'create', onSuccess, onCancel, khoas = [], khoasLoading = false, khoasError = null }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData ? {
      ...initialData,
      isActive: initialData.isActive === true || initialData.isActive === 1,
    } : {
      maNganh: '',
      tenNganh: '',
      maKhoa: '',
      moTa: '',
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      // Convert isActive to boolean
      const submitData = {
        ...data,
        isActive: data.isActive === true || data.isActive === 'true',
      };

      if (mode === 'create') {
        return nganhService.create(submitData);
      } else {
        return nganhService.update(initialData.maNganh, submitData);
      }
    },
    onSuccess: () => {
        toast.success(mode === 'create' ? 'Thêm ngành thành công!' : 'Cập nhật ngành thành công!');
        onSuccess();
    },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    },
    }
  );

  const khoaOptions = khoas && khoas.length > 0
    ? [{ value: '', label: '-- Chọn khoa --' }, ...khoas.map(k => ({
        value: k.maKhoa,
        label: k.tenKhoa
      }))]
    : [{ value: '', label: khoasLoading ? 'Đang tải...' : 'Không có khoa nào' }];

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      {khoasError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">⚠️ Không thể tải danh sách Khoa/Phòng/Ban/Trung tâm</p>
        </div>
      )}

      <Input
        label="Mã ngành"
        {...register('maNganh', { required: 'Mã ngành là bắt buộc' })}
        error={errors.maNganh?.message}
        disabled={mode === 'edit'}
        required
      />
      <Input
        label="Tên ngành"
        {...register('tenNganh', { required: 'Tên ngành là bắt buộc' })}
        error={errors.tenNganh?.message}
        required
      />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Khoa/Phòng/Ban/Trung tâm <span className="text-red-500">*</span></label>
        <SearchableSelect
          placeholder="-- Chọn Khoa/Phòng/Ban/Trung tâm --"
          options={khoas.map(k => ({ value: k.maKhoa, label: k.tenKhoa }))}
          value={register('maKhoa').value}
          onChange={(val) => {
            const e = { target: { name: 'maKhoa', value: val } };
            register('maKhoa').onChange(e);
          }}
          isDisabled={khoasLoading || (khoas && khoas.length === 0) || khoasError}
        />
        {errors.maKhoa && <p className="text-xs text-red-500">{errors.maKhoa.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
        <textarea
          {...register('moTa')}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nhập mô tả ngành học..."
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
        <Button
          isLoading={mutation.isLoading}
          disabled={mutation.isLoading || khoasLoading || (khoas && khoas.length === 0) || khoasError}
        >
          {mode === 'create' ? 'Thêm ngành' : 'Cập nhật'}
        </Button>
      </div>
    </form>
  );
};

const Nganh = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission(PERMISSIONS.CAI_DAT_HE_THONG);
  const [confirmState, setConfirmState] = useState(null);
  const [search, setSearch] = useState('');
  const [khoaFilter, setKhoaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNganh, setSelectedNganh] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  const { data: khoas = [], isError: khoasError } = useQuery({
    queryKey: ['khoa-for-nganh'],
    queryFn: () => khoaService.getAll(),
    retry: 3,
    onError: () => {
      toast.error('Không thể tải danh sách Khoa/Phòng/Ban/Trung tâm');
    }
  });

  const { data: nganhList = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['nganh', search, khoaFilter, statusFilter],
    queryFn: async () => {
      let result = await nganhService.getAll();

      if (search) {
        result = result.filter(n =>
          n.maNganh.toLowerCase().includes(search.toLowerCase()) ||
          n.tenNganh.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (khoaFilter) {
        result = result.filter(n => n.maKhoa === khoaFilter);
      }
      if (statusFilter !== '') {
        const active = statusFilter === 'active';
        result = result.filter(n => n.isActive === active);
      }

      return result;
    },
    keepPreviousData: true,
    retry: 3,
    onError: () => {
      toast.error('Không thể tải danh sách ngành');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (maNganh) => nganhService.delete(maNganh),
    onSuccess: () => {
      toast.success('Xóa ngành thành công!');
      queryClient.invalidateQueries(['nganh']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xóa thất bại!');
    },
  });

  const handleExport = async () => {
    try {
      const blob = await nganhService.exportToExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nganh-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Xuất Excel thành công');
    } catch (error) {
      toast.error('Lỗi xuất Excel');
    }
  };

  const columns = [
    {
      header: 'Mã ngành',
      accessor: 'maNganh',
      render: (v) => <span className="font-medium">{v}</span>,
    },
    {
      header: 'Tên ngành',
      accessor: 'tenNganh',
    },
    {
      header: 'Khoa/Phòng/Ban/Trung tâm',
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
          {canManage && (
            <Button
              size="sm"
              variant="ghost"
              icon={Edit}
              onClick={() => {
                setSelectedNganh(row);
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
              onClick={() => setConfirmState({ id: row.maNganh, name: row.tenNganh })}
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý Ngành</h1>
          <p className="text-gray-600 mt-1">Quản lý các ngành học</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage && (
            <Button variant="outline" icon={Download} onClick={handleExport}>
              <span className="hidden sm:inline">Export Excel</span>
            </Button>
          )}
          {canManage && (
            <Button icon={Plus} onClick={() => {
              setSelectedNganh(null);
              setModalMode('create');
              setIsModalOpen(true);
            }}>
              <span className="hidden sm:inline">Thêm ngành</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tìm kiếm */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Tìm kiếm ngành
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Mã ngành hoặc tên ngành..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          {/* Khoa */}
          <div>
            <SearchableSelect
              label="Khoa/Phòng/Ban/Trung tâm"
              labelClassName="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
              placeholder="Tất cả Khoa/Phòng/Ban/Trung tâm"
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
              refetch();
            }}
            className="text-gray-500 hover:text-primary-600 font-medium text-xs"
          >
            Làm mới bộ lọc
          </Button>
        </div>
      </div>

      <Card>
        {isError && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-red-700 font-medium">
              ⚠️ Có lỗi xảy ra khi tải danh sách ngành
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
        {!isError && nganhList.length === 0 && !isLoading && (
          <div className="p-6 text-center">
            <p className="text-gray-500">Chưa có ngành nào. Vui lòng thêm ngành mới.</p>
          </div>
        )}
        <div className="overflow-x-auto">
          <Table columns={columns} data={nganhList} isLoading={isLoading} />
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm ngành' : 'Chỉnh sửa ngành'}
        size="lg"
      >
        <NganhForm
          initialData={selectedNganh}
          mode={modalMode}
          khoas={khoas}
          khoasLoading={false}
          khoasError={khoasError}
          onSuccess={() => {
            setIsModalOpen(false);
            queryClient.invalidateQueries(['nganh']);
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={() => { deleteMutation.mutate(confirmState?.id); setConfirmState(null); }}
        title="Xóa ngành"
        description={`Bạn có chắc muốn xóa ngành "${confirmState?.name}"? Hành động này không thể hoàn tác.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Nganh;
