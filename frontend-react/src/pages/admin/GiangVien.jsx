import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, RotateCcw, RefreshCw } from 'lucide-react';
import giangvienService from '../../services/giangvienService';
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

const GiangVienForm = ({ initialData, mode = 'create', onSuccess, onCancel, khoas }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      maGv: '',
      hoTen: '',
      email: '',
      sdt: '',
      maKhoa: '',
      isActive: true,
    },
  });

  const mutation = useMutation(
    (data) => {
      if (mode === 'create') {
        return giangvienService.create(data);
      } else {
        return giangvienService.update(initialData.maGv, data);
      }
    },
    {
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
      <Input
        label="Số điện thoại"
        {...register('sdt', {
          pattern: { value: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số' }
        })}
        error={errors.sdt?.message}
        placeholder="0123456789"
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
  const [search, setSearch] = useState('');
  const [khoaFilter, setKhoaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGV, setSelectedGV] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  const { data: khoas = [] } = useQuery('khoa-for-gv', () => khoaService.getAll());

  const { data: gvList = [], isLoading, refetch } = useQuery(
    ['giangvien', search, khoaFilter, statusFilter],
    async () => {
      let result = await giangvienService.getAll();

      if (search) {
        result = result.filter(gv =>
          gv.maGv.toLowerCase().includes(search.toLowerCase()) ||
          gv.hoTen.toLowerCase().includes(search.toLowerCase()) ||
          gv.email.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (khoaFilter) {
        result = result.filter(gv => gv.maKhoa === khoaFilter);
      }
      if (statusFilter !== '') {
        const active = statusFilter === 'active';
        result = result.filter(gv => gv.isActive === active);
      }

      return result;
    },
    { keepPreviousData: true }
  );

  const deleteMutation = useMutation(
    (maGv) => giangvienService.delete(maGv),
    {
      onSuccess: () => {
        toast.success('Xóa giảng viên thành công!');
        queryClient.invalidateQueries('giangvien');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Xóa thất bại!');
      },
    }
  );

  const restoreMutation = useMutation(
    (maGv) => giangvienService.restore(maGv),
    {
      onSuccess: () => {
        toast.success('Khôi phục giảng viên thành công!');
        queryClient.invalidateQueries('giangvien');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Khôi phục thất bại!');
      },
    }
  );

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
    },
    {
      header: 'Số điện thoại',
      accessor: 'sdt',
      render: (v) => v || '-',
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
              setSelectedGV(row);
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
                if (window.confirm(`Xóa giảng viên ${row.hoTen}?`)) {
                  deleteMutation.mutate(row.maGv);
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
                if (window.confirm(`Khôi phục giảng viên ${row.hoTen}?`)) {
                  restoreMutation.mutate(row.maGv);
                }
              }}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Giảng viên</h1>
          <p className="text-gray-600 mt-1">Quản lý thông tin giảng viên</p>
        </div>
        <Button icon={Plus} onClick={() => {
          setSelectedGV(null);
          setModalMode('create');
          setIsModalOpen(true);
        }}>
          Thêm GV
        </Button>
      </div>

      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SearchInput
              placeholder="Tìm kiếm mã, tên, email..."
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
        <Table columns={columns} data={gvList} isLoading={isLoading} />
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
            queryClient.invalidateQueries('giangvien');
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default GiangVien;
