import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, RotateCcw, RefreshCw } from 'lucide-react';
import lopService from '../../services/lopService';
import khoaService from '../../services/khoaService';
import nganhService from '../../services/nganhService';
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

const LopForm = ({ initialData, mode = 'create', onSuccess, onCancel, khoas, nganhs, khoahocs }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: initialData || {
      maLop: '',
      tenLop: '',
      maKhoa: '',
      maNganh: '',
      maKhoaHoc: '',
      isActive: true,
    },
  });

  const selectedKhoa = watch('maKhoa');

  const filteredNganhs = selectedKhoa
    ? nganhs.filter(n => n.maKhoa === selectedKhoa)
    : [];

  const mutation = useMutation(
    (data) => {
      if (mode === 'create') {
        return lopService.create(data);
      } else {
        return lopService.update(initialData.maLop, data);
      }
    },
    {
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
        error={errors.maLop?.message}
        disabled={mode === 'edit'}
        required
      />
      <Input
        label="Tên lớp"
        {...register('tenLop', { required: 'Tên lớp là bắt buộc' })}
        error={errors.tenLop?.message}
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
        label="Ngành"
        {...register('maNganh', { required: 'Ngành là bắt buộc' })}
        options={[{ value: '', label: '-- Chọn ngành --' }, ...filteredNganhs.map(n => ({
          value: n.maNganh, label: n.tenNganh
        }))]}
        error={errors.maNganh?.message}
        disabled={!selectedKhoa}
        required
      />
      <Select
        label="Khóa học"
        {...register('maKhoaHoc')}
        options={[{ value: '', label: '-- Chọn khóa học --' }, ...khoahocs.map(k => ({
          value: k.maKhoaHoc, label: k.tenKhoaHoc
        }))]}
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
          {mode === 'create' ? 'Thêm lớp' : 'Cập nhật'}
        </Button>
      </div>
    </form>
  );
};

const Lop = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [khoaFilter, setKhoaFilter] = useState('');
  const [nganhFilter, setNganhFilter] = useState('');
  const [khoahocFilter, setKhoahocFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLop, setSelectedLop] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  // Fetch all necessary data
  const { data: khoas = [] } = useQuery(
    'khoa-all',
    () => khoaService.getAll(),
    { retry: 3 }
  );
  const { data: nganhs = [] } = useQuery(
    'nganh-all',
    () => nganhService.getAll(),
    { retry: 3 }
  );
  const { data: khoahocs = [] } = useQuery(
    'khoahoc-all',
    () => khoahocService.getAll(),
    { retry: 3 }
  );

  const { data: lopList = [], isLoading, isError, error, refetch } = useQuery(
    ['lop', search, khoaFilter, nganhFilter, khoahocFilter, statusFilter],
    async () => {
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
    {
      keepPreviousData: true,
      retry: 3,
      onError: () => {
        toast.error('Không thể tải danh sách lớp');
      }
    }
  );

  const deleteMutation = useMutation(
    (maLop) => lopService.delete(maLop),
    {
      onSuccess: () => {
        toast.success('Xóa lớp thành công!');
        queryClient.invalidateQueries('lop');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Xóa thất bại!');
      },
    }
  );

  const restoreMutation = useMutation(
    (maLop) => lopService.restore(maLop),
    {
      onSuccess: () => {
        toast.success('Khôi phục lớp thành công!');
        queryClient.invalidateQueries('lop');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Khôi phục thất bại!');
      },
    }
  );

  const columns = [
    { header: 'Mã lớp', accessor: 'maLop', render: (v) => <span className="font-medium">{v}</span> },
    { header: 'Tên lớp', accessor: 'tenLop' },
    { header: 'Khoa', accessor: 'tenKhoa' },
    { header: 'Ngành', accessor: 'tenNganh' },
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
              setSelectedLop(row);
              setModalMode('edit');
              setIsModalOpen(true);
            }}
          />
          {row.isActive ? (
            <Button
              size="sm"
              variant="ghost"
              icon={Trash2}
              className="text-red-600"
              onClick={() => {
                if (window.confirm(`Xóa lớp ${row.tenLop}?`)) {
                  deleteMutation.mutate(row.maLop);
                }
              }}
            />
          ) : (
            <Button
              size="sm"
              variant="ghost"
              icon={RotateCcw}
              className="text-blue-600"
              onClick={() => {
                if (window.confirm(`Khôi phục lớp ${row.tenLop}?`)) {
                  restoreMutation.mutate(row.maLop);
                }
              }}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Lớp</h1>
          <p className="text-gray-600 mt-1">Quản lý các lớp học</p>
        </div>
        <Button icon={Plus} onClick={() => {
          setSelectedLop(null);
          setModalMode('create');
          setIsModalOpen(true);
        }}>
          Thêm lớp
        </Button>
      </div>

      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              onChange={(e) => {
                setKhoaFilter(e.target.value);
                setNganhFilter('');
              }}
            />
            <Select
              options={[{ value: '', label: 'Tất cả ngành' }, ...filteredNganhs.map(n => ({
                value: n.maNganh, label: n.tenNganh
              }))]}
              value={nganhFilter}
              onChange={(e) => setNganhFilter(e.target.value)}
              disabled={!khoaFilter}
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
        <Table columns={columns} data={lopList} isLoading={isLoading} />
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
            queryClient.invalidateQueries('lop');
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Lop;
