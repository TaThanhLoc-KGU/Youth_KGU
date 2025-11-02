import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Download, RefreshCw } from 'lucide-react';
import nganhService from '../../services/nganhService';
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

  const mutation = useMutation(
    (data) => {
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
    {
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
          <p className="text-sm text-red-700">⚠️ Không thể tải danh sách khoa</p>
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
      <Select
        label="Khoa"
        {...register('maKhoa', { required: 'Khoa là bắt buộc' })}
        options={khoaOptions}
        error={errors.maKhoa?.message}
        disabled={khoasLoading || (khoas && khoas.length === 0) || khoasError}
        required
      />
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
  const [search, setSearch] = useState('');
  const [khoaFilter, setKhoaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNganh, setSelectedNganh] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  const { data: khoas = [], isError: khoasError } = useQuery(
    'khoa-for-nganh',
    () => khoaService.getAll(),
    {
      retry: 3,
      onError: () => {
        toast.error('Không thể tải danh sách khoa');
      }
    }
  );

  const { data: nganhList = [], isLoading, isError, error, refetch } = useQuery(
    ['nganh', search, khoaFilter, statusFilter],
    async () => {
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
    {
      keepPreviousData: true,
      retry: 3,
      onError: () => {
        toast.error('Không thể tải danh sách ngành');
      }
    }
  );

  const deleteMutation = useMutation(
    (maNganh) => nganhService.delete(maNganh),
    {
      onSuccess: () => {
        toast.success('Xóa ngành thành công!');
        queryClient.invalidateQueries('nganh');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Xóa thất bại!');
      },
    }
  );

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
      header: 'Khoa',
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
              setSelectedNganh(row);
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
              if (window.confirm(`Xóa ngành ${row.tenNganh}?`)) {
                deleteMutation.mutate(row.maNganh);
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Ngành</h1>
          <p className="text-gray-600 mt-1">Quản lý các ngành học</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={Download} onClick={handleExport}>
            Export Excel
          </Button>
          <Button icon={Plus} onClick={() => {
            setSelectedNganh(null);
            setModalMode('create');
            setIsModalOpen(true);
          }}>
            Thêm ngành
          </Button>
        </div>
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
              options={[{ value: '', label: 'Tất cả khoa' }, ...khoas.map(k => ({
                value: k.maKhoa, label: k.tenKhoa
              }))]}
              value={khoaFilter}
              onChange={(e) => setKhoaFilter(e.target.value)}
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
          </div>
        </div>
      </Card>

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
        <Table columns={columns} data={nganhList} isLoading={isLoading} />
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
            queryClient.invalidateQueries('nganh');
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Nganh;
