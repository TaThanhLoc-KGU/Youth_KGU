import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Trash2, RotateCcw, Key, Shield, Lock } from 'lucide-react';
import taikhoanService from '../../services/taikhoanService';
import studentService from '../../services/studentService';
import giangvienService from '../../services/giangvienService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { formatDate } from '../../utils/dateFormat';
import { useForm } from 'react-hook-form';

const CreateAccountModal = ({ isOpen, onClose, usersWithoutAccount, userType, onSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      userId: '',
      username: '',
      password: '',
      role: userType || 'SINHVIEN',
    },
  });

  const mutation = useMutation({
    mutationFn: (data) => taikhoanService.create(data),
    onSuccess: () => {
      toast.success('Tạo tài khoản thành công!');
      reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    }
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo tài khoản" size="md">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <Select
          label="Loại tài khoản"
          {...register('role')}
          options={[
            { value: 'SINHVIEN', label: 'Sinh viên' },
            { value: 'GIANGVIEN', label: 'Giảng viên' },
            { value: 'ADMIN', label: 'Admin' },
          ]}
        />
        <Select
          label="Người dùng"
          {...register('userId', { required: 'Chọn người dùng' })}
          options={[{ value: '', label: '-- Chọn --' }, ...usersWithoutAccount.map(u => ({
            value: u.id || u.maSv || u.maGv,
            label: u.hoTen || u.tenGiangVien,
          }))]}
          error={errors.userId?.message}
        />
        <Input
          label="Tên đăng nhập"
          {...register('username', { required: 'Tên đăng nhập là bắt buộc' })}
          error={errors.username?.message}
          placeholder="Tên đăng nhập"
          required
        />
        <Input
          label="Mật khẩu"
          type="password"
          {...register('password', { required: 'Mật khẩu là bắt buộc' })}
          error={errors.password?.message}
          placeholder="Nhập mật khẩu"
          required
        />
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button isLoading={mutation.isLoading} disabled={mutation.isLoading}>
            Tạo tài khoản
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const Taikhoan = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createUserType, setCreateUserType] = useState('SINHVIEN');

  const { data: accountList = [], isLoading, refetch } = useQuery({
    queryKey: ['taikhoan', search, roleFilter, statusFilter],
    queryFn: async () => {
      let result = await taikhoanService.getAll();

      if (search) {
        result = result.filter(a =>
          a.tenDangNhap.toLowerCase().includes(search.toLowerCase()) ||
          a.hoTen.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (roleFilter) {
        result = result.filter(a => a.role === roleFilter);
      }
      if (statusFilter !== '') {
        const active = statusFilter === 'active';
        result = result.filter(a => a.isActive === active);
      }

      return result;
    },
    keepPreviousData: true
  });

  const { data: studentsWithoutAccount = [] } = useQuery({
    queryKey: ['students-no-account'],
    queryFn: () => taikhoanService.getStudentsWithoutAccount()
  });

  const { data: teachersWithoutAccount = [] } = useQuery({
    queryKey: ['teachers-no-account'],
    queryFn: () => taikhoanService.getTeachersWithoutAccount()
  });

  const { data: stats = {} } = useQuery({
    queryKey: ['taikhoan-stats'],
    queryFn: () => taikhoanService.getStatistics()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => taikhoanService.delete(id),
    onSuccess: () => {
      toast.success('Xóa tài khoản thành công!');
      queryClient.invalidateQueries({ queryKey: ['taikhoan'] });
    },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Xóa thất bại!');
    },
    }
  );

  const resetPasswordMutation = useMutation({
    mutationFn: (id) => taikhoanService.resetPassword(id),
    onSuccess: (result) => {
        toast.success(`Mật khẩu mới: ${result.newPassword || 'Kiểm tra email'}`);
        queryClient.invalidateQueries(['taikhoan']);
    },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Lỗi reset mật khẩu!');
    },
    }
  );

  const toggleStatusMutation = useMutation({
    mutationFn: (id) => taikhoanService.toggleStatus(id),
    onSuccess: () => {
        toast.success('Cập nhật trạng thái thành công!');
        queryClient.invalidateQueries(['taikhoan']);
    },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Cập nhật thất bại!');
    },
    }
  );

  const columns = [
    {
      header: 'Tên đăng nhập',
      accessor: 'tenDangNhap',
      render: (v) => <span className="font-medium">{v}</span>,
    },
    {
      header: 'Tên người dùng',
      accessor: 'hoTen',
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (value) => {
        const variants = {
          ADMIN: 'danger',
          GIANGVIEN: 'info',
          SINHVIEN: 'success',
        };
        const labels = {
          ADMIN: 'Admin',
          GIANGVIEN: 'Giảng viên',
          SINHVIEN: 'Sinh viên',
        };
        return <Badge variant={variants[value] || 'info'}>{labels[value] || value}</Badge>;
      },
    },
    {
      header: 'Trạng thái',
      accessor: 'isActive',
      render: (value) => (
        <Badge variant={value ? 'success' : 'danger'} dot>
          {value ? 'Hoạt động' : 'Vô hiệu' }
        </Badge>
      ),
    },
    {
      header: 'Ngày tạo',
      accessor: 'createdAt',
      render: (v) => formatDate(v),
    },
    {
      header: 'Thao tác',
      accessor: 'actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            icon={Key}
            title="Reset mật khẩu"
            onClick={() => {
              if (window.confirm('Reset mật khẩu cho tài khoản này?')) {
                resetPasswordMutation.mutate(row.id);
              }
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            icon={row.isActive ? Lock : Shield}
            title={row.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
            onClick={() => {
              if (window.confirm(`${row.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'} tài khoản này?`)) {
                toggleStatusMutation.mutate(row.id);
              }
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            icon={Trash2}
            className="text-red-600"
            onClick={() => {
              if (window.confirm(`Xóa tài khoản ${row.tenDangNhap}?`)) {
                deleteMutation.mutate(row.id);
              }
            }}
          />
        </div>
      ),
    },
  ];

  const usersToCreate = createUserType === 'SINHVIEN' ? studentsWithoutAccount : teachersWithoutAccount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Tài khoản</h1>
        <p className="text-gray-600 mt-1">Quản lý tài khoản người dùng hệ thống</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-xs text-gray-600">Tổng tài khoản</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs text-gray-600">Đang hoạt động</p>
            <p className="text-2xl font-bold text-green-600">{stats.active || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs text-gray-600">Vô hiệu hóa</p>
            <p className="text-2xl font-bold text-red-600">{stats.disabled || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs text-gray-600">Chưa có tài khoản</p>
            <p className="text-2xl font-bold text-yellow-600">
              {(studentsWithoutAccount?.length || 0) + (teachersWithoutAccount?.length || 0)}
            </p>
          </div>
        </Card>
      </div>

      {/* Batch Create Section */}
      {(studentsWithoutAccount.length > 0 || teachersWithoutAccount.length > 0) && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tạo tài khoản hàng loạt</h3>
            <div className="space-y-4">
              {studentsWithoutAccount.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Sinh viên chưa có tài khoản ({studentsWithoutAccount.length})
                  </p>
                  <Button
                    onClick={() => {
                      setCreateUserType('SINHVIEN');
                      setIsCreateModalOpen(true);
                    }}
                  >
                    Tạo tài khoản Sinh viên
                  </Button>
                </div>
              )}
              {teachersWithoutAccount.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Giảng viên chưa có tài khoản ({teachersWithoutAccount.length})
                  </p>
                  <Button
                    onClick={() => {
                      setCreateUserType('GIANGVIEN');
                      setIsCreateModalOpen(true);
                    }}
                  >
                    Tạo tài khoản Giảng viên
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SearchInput
              placeholder="Tìm kiếm tên đăng nhập, tên..."
              value={search}
              onSearch={setSearch}
              className="md:col-span-2"
            />
            <Select
              options={[
                { value: '', label: 'Tất cả roles' },
                { value: 'ADMIN', label: 'Admin' },
                { value: 'GIANGVIEN', label: 'Giảng viên' },
                { value: 'SINHVIEN', label: 'Sinh viên' },
              ]}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            />
            <Select
              options={[
                { value: '', label: 'Tất cả trạng thái' },
                { value: 'active', label: 'Hoạt động' },
                { value: 'inactive', label: 'Vô hiệu' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Accounts Table */}
      <Card>
        <Table columns={columns} data={accountList} isLoading={isLoading} />
      </Card>

      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        usersWithoutAccount={usersToCreate}
        userType={createUserType}
        onSuccess={() => {
          refetch();
          queryClient.invalidateQueries(['students-no-account']);
          queryClient.invalidateQueries(['teachers-no-account']);
        }}
      />
    </div>
  );
};

export default Taikhoan;
