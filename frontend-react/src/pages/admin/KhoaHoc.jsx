import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Check, RefreshCw } from 'lucide-react';
import khoahocService from '../../services/khoahocService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { useForm } from 'react-hook-form';

const KhoaHocForm = ({ initialData, mode = 'create', onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      maKhoaHoc: '',
      tenKhoaHoc: '',
      namBatDau: new Date().getFullYear(),
      namKetThuc: new Date().getFullYear() + 1,
      isCurrent: false,
      isActive: true,
    },
  });

  const mutation = useMutation(
    (data) => {
      if (mode === 'create') {
        return khoahocService.create(data);
      } else {
        return khoahocService.update(initialData.maKhoaHoc, data);
      }
    },
    {
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
        {...register('maKhoaHoc', { required: 'Mã khóa học là bắt buộc' })}
        error={errors.maKhoaHoc?.message}
        disabled={mode === 'edit'}
        placeholder="VD: K20, K21"
        required
      />
      <Input
        label="Tên khóa học"
        {...register('tenKhoaHoc', { required: 'Tên khóa học là bắt buộc' })}
        error={errors.tenKhoaHoc?.message}
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
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register('isCurrent')}
            className="w-4 h-4 border border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">Khóa học hiện tại</span>
        </label>
      </div>
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
          {mode === 'create' ? 'Thêm khóa học' : 'Cập nhật'}
        </Button>
      </div>
    </form>
  );
};

const KhoaHoc = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKhoaHoc, setSelectedKhoaHoc] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  const { data: khoahocList = [], isLoading, refetch } = useQuery(
    ['khoahoc', search, statusFilter],
    async () => {
      let result = await khoahocService.getAll();

      if (search) {
        result = result.filter(k =>
          k.maKhoaHoc.toLowerCase().includes(search.toLowerCase()) ||
          k.tenKhoaHoc.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (statusFilter !== '') {
        const active = statusFilter === 'active';
        result = result.filter(k => k.isActive === active);
      }

      return result;
    },
    { keepPreviousData: true }
  );

  const deleteMutation = useMutation(
    (maKhoaHoc) => khoahocService.delete(maKhoaHoc),
    {
      onSuccess: () => {
        toast.success('Xóa khóa học thành công!');
        queryClient.invalidateQueries('khoahoc');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Xóa thất bại!');
      },
    }
  );

  const columns = [
    {
      header: 'Mã khóa',
      accessor: 'maKhoaHoc',
      render: (v) => <span className="font-medium">{v}</span>,
    },
    {
      header: 'Tên khóa học',
      accessor: 'tenKhoaHoc',
    },
    {
      header: 'Năm học',
      accessor: 'namBatDau',
      render: (value, row) => `${value} - ${row.namKetThuc}`,
    },
    {
      header: 'Khóa hiện tại',
      accessor: 'isCurrent',
      render: (value) => value ? <Check className="w-5 h-5 text-green-500" /> : '-',
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
              setSelectedKhoaHoc(row);
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
              if (window.confirm(`Xóa khóa học ${row.tenKhoaHoc}?`)) {
                deleteMutation.mutate(row.maKhoaHoc);
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Khóa học</h1>
          <p className="text-gray-600 mt-1">Quản lý các khóa học/năm học</p>
        </div>
        <Button icon={Plus} onClick={() => {
          setSelectedKhoaHoc(null);
          setModalMode('create');
          setIsModalOpen(true);
        }}>
          Thêm khóa học
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
            queryClient.invalidateQueries('khoahoc');
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default KhoaHoc;
