import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, RotateCcw, RefreshCw, Download, Upload, Search } from 'lucide-react';
import lopService from '../../services/lopService';
import useAuthStore from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/constants';
import khoaService from '../../services/khoaService';
import nganhService from '../../services/nganhService';
import khoahocService from '../../services/khoahocService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchableSelect from '../../components/common/SearchableSelect';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import LopExcelImport from '../../components/admin/LopExcelImport';
import { useForm } from 'react-hook-form';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const LopForm = ({ initialData, mode = 'create', onSuccess, onCancel, khoas, nganhs, khoahocs }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: initialData ? {
      ...initialData,
      isActive: initialData.isActive === true || initialData.isActive === 1,
    } : {
      maLop: '',
      tenLop: '',
      maKhoa: '',
      maNganh: '',
      maKhoahoc: '',
      isActive: true,
      loai: 'LOP',
    },
  });

  const selectedKhoa = watch('maKhoa');
  const selectedLoai = watch('loai');

  const filteredNganhs = selectedKhoa
    ? nganhs.filter(n => n.maKhoa === selectedKhoa)
    : [];

  const mutation = useMutation({
    mutationFn: (data) => {
      // Convert isActive to boolean if it's a string
      const submitData = {
        ...data,
        isActive: data.isActive === true || data.isActive === 'true',
      };

      if (mode === 'create') {
        if (submitData.loai === 'CHI_DOAN') {
          return api.post('/api/lop/chi-doan', submitData).then(res => res.data?.data);
        }
        return lopService.create(submitData);
      } else {
        return lopService.update(initialData.maLop, submitData);
      }
    },
    onSuccess: () => {
        toast.success(mode === 'create' ? 'Thêm lớp thành công!' : 'Cập nhật lớp thành công!');
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
        label="Mã lớp"
        {...register('maLop', { required: 'Mã lớp là bắt buộc' })}
        disabled={mode === 'edit'}
        required
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Loại</label>
        <div className="flex items-center gap-4 mt-2">
          <label className="inline-flex items-center">
            <input type="radio" value="LOP" {...register('loai')} className="form-radio text-primary-600" />
            <span className="ml-2">Lớp học</span>
          </label>
          <label className="inline-flex items-center">
            <input type="radio" value="CHI_DOAN" {...register('loai')} className="form-radio text-primary-600" />
            <span className="ml-2">Chi đoàn</span>
          </label>
        </div>
      </div>

      <Input
        label="Tên lớp"
        {...register('tenLop', { required: 'Tên lớp là bắt buộc' })}
        error={errors.tenLop?.message}
        required
      />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Khoa/Phòng/Ban/Trung tâm (Bỏ trống nếu trực thuộc Đoàn trường)</label>
        <SearchableSelect
          placeholder="-- Chọn Khoa/Phòng/Ban/Trung tâm --"
          options={khoas.map(k => ({ value: k.maKhoa, label: k.tenKhoa }))}
          value={watch('maKhoa')}
          onChange={(val) => {
            const e = { target: { name: 'maKhoa', value: val } };
            register('maKhoa').onChange(e);
            // Reset ngành khi đổi khoa
            const eNganh = { target: { name: 'maNganh', value: '' } };
            register('maNganh').onChange(eNganh);
          }}
        />
        {errors.maKhoa && <p className="text-xs text-red-500">{errors.maKhoa.message}</p>}
      </div>

      {selectedLoai === 'LOP' && (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Ngành (Bỏ trống nếu là Chi đoàn)</label>
          <SearchableSelect
            placeholder="-- Chọn ngành --"
            options={filteredNganhs.map(n => ({ value: n.maNganh, label: n.tenNganh }))}
            value={watch('maNganh')}
            onChange={(val) => {
              const e = { target: { name: 'maNganh', value: val } };
              register('maNganh').onChange(e);
            }}
            isDisabled={!selectedKhoa}
          />
          {errors.maNganh && <p className="text-xs text-red-500">{errors.maNganh.message}</p>}
        </div>
      )}

      {selectedLoai === 'LOP' && (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Khóa học</label>
        <SearchableSelect
          placeholder="-- Chọn khóa học --"
          options={khoahocs.map(k => ({ value: k.maKhoahoc, label: k.tenKhoahoc }))}
          value={watch('maKhoahoc')}
          onChange={(val) => {
            const e = { target: { name: 'maKhoahoc', value: val } };
            register('maKhoahoc').onChange(e);
          }}
        />
      </div>
      )}

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
          {mode === 'create' ? 'Thêm lớp' : 'Cập nhật'}
        </Button>
      </div>
    </form>
  );
};

const Lop = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission(PERMISSIONS.CAI_DAT_HE_THONG);
  const [confirmState, setConfirmState] = useState(null);
  const [search, setSearch] = useState('');
  const [khoaFilter, setKhoaFilter] = useState('');
  const [nganhFilter, setNganhFilter] = useState('');
  const [khoahocFilter, setKhoahocFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedLop, setSelectedLop] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  // Fetch all necessary data
  const { data: khoas = [] } = useQuery({
    queryKey: ['khoa-all'],
    queryFn: () => khoaService.getAll(),
    retry: 3
  });
  const { data: nganhs = [] } = useQuery({
    queryKey: ['nganh-all'],
    queryFn: () => nganhService.getAll(),
    retry: 3
  });
  const { data: khoahocs = [] } = useQuery({
    queryKey: ['khoahoc-all'],
    queryFn: () => khoahocService.getAll(),
    retry: 3
  });

  const { data: lopList = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['lop', search, khoaFilter, nganhFilter, khoahocFilter, statusFilter],
    queryFn: async () => {
      let result = await lopService.getAll();

      // Apply filters
      if (search) {
        result = result.filter(l =>
          l.maLop.toLowerCase().includes(search.toLowerCase()) ||
          l.tenLop.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (khoaFilter) {
        result = result.filter(l => l.maKhoa === khoaFilter);
      }
      if (nganhFilter) {
        result = result.filter(l => l.maNganh === nganhFilter);
      }
      if (khoahocFilter) {
        result = result.filter(l => l.maKhoaHoc === khoahocFilter);
      }
      if (statusFilter !== '') {
        const active = statusFilter === 'active';
        result = result.filter(l => l.isActive === active);
      }

      return result;
    },
    keepPreviousData: true,
      retry: 3,
      onError: () => {
        toast.error('Không thể tải danh sách lớp');
      }
  });

  const deleteMutation = useMutation({
    mutationFn: (maLop) => lopService.delete(maLop),
    onSuccess: () => {
        toast.success('Xóa lớp thành công!');
        queryClient.invalidateQueries(['lop']);
    },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Xóa thất bại!');
    },
    }
  );

  const restoreMutation = useMutation({
    mutationFn: (maLop) => lopService.restore(maLop),
    onSuccess: () => {
        toast.success('Khôi phục lớp thành công!');
        queryClient.invalidateQueries(['lop']);
    },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Khôi phục thất bại!');
    },
    }
  );

  const columns = [
    {
      header: 'Mã lớp',
      accessor: 'maLop',
      render: (v) => <span className="font-semibold text-primary">{v}</span>,
    },
    {
      header: 'Tên lớp',
      accessor: 'tenLop',
    },
    {
      header: 'Khoa/Phòng/Ban/Trung tâm',
      accessor: 'tenKhoa',
      render: (value) => (
        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
          {value || 'Trực thuộc Đoàn trường'}
        </span>
      ),
    },
    {
      header: 'Ngành',
      accessor: 'tenNganh',
      render: (value) => (
        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
          {value || '-'}
        </span>
      ),
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
      header: 'Loại',
      accessor: 'loai',
      render: (value) => (
        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">
          {value === 'CHI_DOAN' ? 'Chi đoàn' : 'Lớp học'}
        </span>
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
                setSelectedLop(row);
                setModalMode('edit');
                setIsModalOpen(true);
              }}
            />
          )}
          {canManage && row.isActive && (
            <Button
              size="sm"
              variant="ghost"
              icon={Trash2}
              className="text-red-600"
              onClick={() => setConfirmState({ type: 'delete', id: row.maLop, name: row.tenLop })}
            />
          )}
          {canManage && !row.isActive && (
            <Button
              size="sm"
              variant="ghost"
              icon={RotateCcw}
              className="text-blue-600"
              onClick={() => setConfirmState({ type: 'restore', id: row.maLop, name: row.tenLop })}
            />
          )}
        </div>
      ),
    },
  ];

  const filteredNganhs = khoaFilter
    ? nganhs.filter(n => n.maKhoa === khoaFilter)
    : nganhs;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý Lớp / Chi đoàn</h1>
          <p className="text-gray-600 mt-1">Quản lý các lớp học và chi đoàn trực thuộc</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage && (
          <Button
            variant="outline"
            icon={Upload}
            onClick={() => setIsImportModalOpen(true)}
          >
            <span className="hidden sm:inline">Import Excel</span>
          </Button>
          )}
          {canManage && (
          <Button
            variant="outline"
            icon={Download}
            onClick={async () => {
              try {
                const blob = await lopService.exportToExcel();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `lop-${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('Xuất Excel thành công');
              } catch (error) {
                toast.error('Lỗi xuất Excel');
              }
            }}
          >
            <span className="hidden sm:inline">Export Excel</span>
          </Button>
          )}
          {canManage && (
          <Button icon={Plus} onClick={() => {
            setSelectedLop(null);
            setModalMode('create');
            setIsModalOpen(true);
          }}>
            <span className="hidden sm:inline">Thêm lớp</span>
          </Button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Tìm kiếm */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Tìm kiếm lớp
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Mã lớp hoặc tên lớp..."
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
              options={khoas.map(k => ({ value: k.maKhoa, label: k.tenKhoa }))}
              value={khoaFilter}
              onChange={(val) => {
                setKhoaFilter(val || '');
                setNganhFilter('');
              }}
            />
          </div>

          {/* Ngành */}
          <div>
            <SearchableSelect
              label="Ngành"
              labelClassName="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
              placeholder="Tất cả ngành"
              options={filteredNganhs.map(n => ({ value: n.maNganh, label: n.tenNganh }))}
              value={nganhFilter}
              onChange={(val) => setNganhFilter(val || '')}
              isDisabled={!khoaFilter}
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
              setNganhFilter('');
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
              ⚠️ Có lỗi xảy ra khi tải danh sách lớp
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
        {!isError && lopList.length === 0 && !isLoading && (
          <div className="p-6 text-center">
            <p className="text-gray-500">Chưa có lớp nào. Vui lòng thêm lớp mới.</p>
          </div>
        )}
        <div className="overflow-x-auto">
          <Table columns={columns} data={lopList} isLoading={isLoading} />
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm lớp' : 'Chỉnh sửa lớp'}
        size="lg"
      >
        <LopForm
          initialData={selectedLop}
          mode={modalMode}
          khoas={khoas}
          nganhs={nganhs}
          khoahocs={khoahocs}
          onSuccess={() => {
            setIsModalOpen(false);
            queryClient.invalidateQueries(['lop']);
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập danh sách lớp từ Excel"
        size="lg"
      >
        <LopExcelImport
          onImportSuccess={() => {
            setIsImportModalOpen(false);
            queryClient.invalidateQueries(['lop']);
          }}
          onCancel={() => setIsImportModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmState && confirmState.type === 'delete'}
        onClose={() => setConfirmState(null)}
        onConfirm={() => { deleteMutation.mutate(confirmState?.id); setConfirmState(null); }}
        title="Xóa lớp"
        description={`Bạn có chắc muốn xóa lớp "${confirmState?.name}"? Hành động này không thể hoàn tác.`}
        isLoading={deleteMutation.isPending}
      />
      <ConfirmDialog
        isOpen={!!confirmState && confirmState.type === 'restore'}
        onClose={() => setConfirmState(null)}
        onConfirm={() => { restoreMutation.mutate(confirmState?.id); setConfirmState(null); }}
        title="Khôi phục lớp"
        description={`Bạn có chắc muốn khôi phục lớp "${confirmState?.name}"?`}
        isLoading={restoreMutation.isPending}
        variant="warning"
      />
    </div>
  );
};

export default Lop;
