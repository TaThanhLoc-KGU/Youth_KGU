import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Eye, RefreshCw } from 'lucide-react';
import chuyenVienService from '../../services/chuyenVienService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';

const ChuyenVien = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedChuyenVien, setSelectedChuyenVien] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // view, create, edit
  const [formData, setFormData] = useState({
    hoTen: '',
    email: '',
    sdt: '',
    chucDanh: '',
    isActive: true,
  });
  const [errors, setErrors] = useState({});

  // Fetch chuyenvien list
  const { data: chuyenvienList = [], isLoading, refetch } = useQuery({
    queryKey: ['chuyenvien', search],
    queryFn: async () => {
      let results = [];
      if (search) {
        results = await chuyenVienService.search(search);
      } else {
        results = await chuyenVienService.getAll();
      }
      return Array.isArray(results) ? results : [];
    },
    keepPreviousData: true
  }
  );

  // Fetch statistics
  const { data: stats = {} } = useQuery({
    queryKey: ['chuyenvien-statistics'],
    queryFn: chuyenVienService.getStatistics
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => chuyenVienService.delete(id),
    onSuccess: () => {
        toast.success('Xóa chuyên viên thành công!');
        queryClient.invalidateQueries(['chuyenvien']);
        queryClient.invalidateQueries(['chuyenvien-statistics']);
    },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Xóa chuyên viên thất bại!');
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => chuyenVienService.create(data),
    onSuccess: () => {
        toast.success('Tạo chuyên viên thành công!');
        queryClient.invalidateQueries(['chuyenvien']);
        queryClient.invalidateQueries(['chuyenvien-statistics']);
        handleModalClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Tạo chuyên viên thất bại!');
    },
    }
  );

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => chuyenVienService.update(selectedChuyenVien.id, data),
    onSuccess: () => {
        toast.success('Cập nhật chuyên viên thành công!');
        queryClient.invalidateQueries(['chuyenvien']);
        queryClient.invalidateQueries(['chuyenvien-statistics']);
        handleModalClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Cập nhật chuyên viên thất bại!');
    },
    }
  );

  // Table columns
  const columns = [
    {
      header: 'Họ tên',
      accessor: 'hoTen',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600 font-semibold text-xs">
              {value?.charAt(0) || 'C'}
            </span>
          </div>
          <div>
            <div className="font-medium text-sm">{value || '-'}</div>
            <div className="text-xs text-gray-500">{row.email || ''}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (value) => value || '-',
    },
    {
      header: 'SĐT',
      accessor: 'sdt',
      render: (value) => value || '-',
    },
    {
      header: 'Chức danh',
      accessor: 'chucDanh',
      render: (value) => <Badge variant="info">{value || '-'}</Badge>,
    },
    {
      header: 'Trạng thái',
      accessor: 'isActive',
      width: '100px',
      render: (value) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? 'Hoạt động' : 'Ngừng'}
        </Badge>
      ),
    },
    {
      header: 'Thao tác',
      accessor: 'actions',
      width: '120px',
      render: (_, row) => (
        <div className="flex items-center gap-1 justify-center">
          <Button
            size="sm"
            variant="ghost"
            icon={Eye}
            onClick={() => handleView(row)}
            title="Xem chi tiết"
          />
          <Button
            size="sm"
            variant="ghost"
            icon={Edit}
            onClick={() => handleEdit(row)}
            title="Chỉnh sửa"
          />
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700"
            icon={Trash2}
            onClick={() => handleDelete(row)}
            title="Xóa"
          />
        </div>
      ),
    },
  ];

  const handleCreate = () => {
    setSelectedChuyenVien(null);
    setModalMode('create');
    setFormData({
      hoTen: '',
      email: '',
      sdt: '',
      chucDanh: '',
      isActive: true,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleView = (chuyenvien) => {
    setSelectedChuyenVien(chuyenvien);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEdit = (chuyenvien) => {
    setSelectedChuyenVien(chuyenvien);
    setModalMode('edit');
    setFormData({
      hoTen: chuyenvien.hoTen || '',
      email: chuyenvien.email || '',
      sdt: chuyenvien.sdt || '',
      chucDanh: chuyenvien.chucDanh || '',
      isActive: chuyenvien.isActive !== false,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = (chuyenvien) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${chuyenvien.hoTen}?`)) {
      deleteMutation.mutate(chuyenvien.id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedChuyenVien(null);
    setFormData({
      hoTen: '',
      email: '',
      sdt: '',
      chucDanh: '',
      isActive: true,
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.hoTen) newErrors.hoTen = 'Vui lòng nhập họ tên';
    if (!formData.email) newErrors.email = 'Vui lòng nhập email';
    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Email không hợp lệ';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (modalMode === 'create') {
      createMutation.mutate(formData);
    } else if (modalMode === 'edit') {
      updateMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Chuyên viên</h1>
          <p className="text-gray-600 mt-1">Quản lý thông tin chuyên viên Ban Đoàn - Hội</p>
        </div>
        <Button icon={Plus} onClick={handleCreate}>
          Thêm chuyên viên mới
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.total || 0}</div>
            <div className="text-gray-600 text-sm">Tổng chuyên viên</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {stats.active || 0}
            </div>
            <div className="text-gray-600 text-sm">Đang hoạt động</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <SearchInput
            placeholder="Tìm theo tên, email, SĐT..."
            value={search}
            onChange={setSearch}
          />
        </div>
        <Button
          variant="outline"
          icon={RefreshCw}
          onClick={() => refetch()}
          title="Làm mới"
        />
      </div>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          data={chuyenvienList}
          loading={isLoading}
          emptyMessage="Không có chuyên viên nào"
        />
      </Card>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={handleModalClose} size="lg">
        {modalMode === 'view' ? (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold">Chi tiết chuyên viên</h2>
            {selectedChuyenVien && (
              <>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Họ tên</label>
                      <p className="mt-1 font-medium">{selectedChuyenVien.hoTen}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1">{selectedChuyenVien.email || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">SĐT</label>
                      <p className="mt-1">{selectedChuyenVien.sdt || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Chức danh</label>
                      <p className="mt-1">{selectedChuyenVien.chucDanh || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Trạng thái</label>
                      <p className="mt-1">
                        <Badge variant={selectedChuyenVien.isActive ? 'success' : 'danger'}>
                          {selectedChuyenVien.isActive ? 'Hoạt động' : 'Ngừng'}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleModalClose}>
                    Đóng
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-2xl font-bold">
              {modalMode === 'create' ? 'Thêm chuyên viên mới' : 'Chỉnh sửa chuyên viên'}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Họ tên"
                  placeholder="Nhập họ tên"
                  value={formData.hoTen}
                  onChange={(e) => handleInputChange('hoTen', e.target.value)}
                  error={errors.hoTen}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="Nhập email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={errors.email}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="SĐT"
                  placeholder="Nhập số điện thoại"
                  value={formData.sdt}
                  onChange={(e) => handleInputChange('sdt', e.target.value)}
                />
                <Input
                  label="Chức danh"
                  placeholder="VD: TS, ThS, Ths..."
                  value={formData.chucDanh}
                  onChange={(e) => handleInputChange('chucDanh', e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Đang hoạt động
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleModalClose}>
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                loading={createMutation.isLoading || updateMutation.isLoading}
              >
                {modalMode === 'create' ? 'Tạo mới' : 'Cập nhật'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ChuyenVien;
