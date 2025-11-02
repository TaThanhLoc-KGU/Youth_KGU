import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Eye, RefreshCw, Download, Upload } from 'lucide-react';
import studentService from '../../services/studentService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import StudentForm from '../../components/admin/StudentForm';
import StudentDetail from '../../components/admin/StudentDetail';
import StudentExcelImportWithPreview from '../../components/admin/StudentExcelImportWithPreview';

const Students = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'

  // Fetch students with pagination
  const { data: studentsData, isLoading, refetch } = useQuery(
    ['students', page, size, search, statusFilter],
    () => studentService.getAll({ page, size, sortBy: 'maSv', direction: 'asc' }),
    {
      keepPreviousData: true,
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => studentService.delete(id),
    {
      onSuccess: () => {
        toast.success('Xóa sinh viên thành công!');
        queryClient.invalidateQueries('students');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Xóa sinh viên thất bại!');
      },
    }
  );

  // Table columns
  const columns = [
    {
      header: 'Mã SV',
      accessor: 'maSv',
      width: '120px',
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      header: 'Họ và tên',
      accessor: 'hoTen',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">
              {value?.charAt(0)}
            </span>
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-gray-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Lớp',
      accessor: 'tenLop',
      render: (value) => value || '-',
    },
    {
      header: 'Số điện thoại',
      accessor: 'sdt',
      render: (value) => value || '-',
    },
    {
      header: 'Trạng thái',
      accessor: 'isActive',
      width: '120px',
      render: (value) => (
        <Badge variant={value ? 'success' : 'danger'} dot>
          {value ? 'Hoạt động' : 'Ngừng'}
        </Badge>
      ),
    },
    {
      header: 'Thao tác',
      accessor: 'actions',
      width: '150px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            icon={Eye}
            onClick={(e) => {
              e.stopPropagation();
              handleView(row);
            }}
            title="Xem chi tiết"
          />
          <Button
            size="sm"
            variant="ghost"
            icon={Edit}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            title="Sửa"
          />
          <Button
            size="sm"
            variant="ghost"
            icon={Trash2}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            title="Xóa"
            className="text-red-600 hover:text-red-700"
          />
        </div>
      ),
    },
  ];

  const handleCreate = () => {
    setModalMode('create');
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (student) => {
    setModalMode('edit');
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleView = (student) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
  };

  const handleDelete = (student) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sinh viên ${student.hoTen}?`)) {
      deleteMutation.mutate(student.maSv);
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    queryClient.invalidateQueries('students');
  };

  const handleExport = async () => {
    try {
      const blob = await studentService.exportToExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `danh-sach-sinh-vien-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Xuất Excel thành công');
    } catch (error) {
      toast.error('Lỗi xuất Excel');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Sinh viên</h1>
          <p className="text-gray-600 mt-1">
            Quản lý thông tin sinh viên và hồ sơ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={Upload}
            onClick={() => setIsImportModalOpen(true)}
          >
            Import
          </Button>
          <Button variant="outline" icon={Download} onClick={handleExport}>
            Export
          </Button>
          <Button icon={Plus} onClick={handleCreate}>
            Thêm sinh viên
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SearchInput
              placeholder="Tìm kiếm theo mã SV, tên..."
              value={search}
              onSearch={setSearch}
              className="md:col-span-2"
            />
            <Select
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'active', label: 'Đang hoạt động' },
                { value: 'inactive', label: 'Ngừng hoạt động' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={() => refetch()}
              fullWidth
            >
              Làm mới
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <Table
          columns={columns}
          data={studentsData?.content || []}
          isLoading={isLoading}
          onRowClick={handleView}
        />
        {studentsData && (
          <Table.Pagination
            currentPage={studentsData.number}
            totalPages={studentsData.totalPages}
            pageSize={studentsData.size}
            totalElements={studentsData.totalElements}
            onPageChange={setPage}
            onPageSizeChange={setSize}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm sinh viên mới' : 'Chỉnh sửa sinh viên'}
        size="lg"
      >
        <StudentForm
          initialData={selectedStudent}
          mode={modalMode}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Chi tiết sinh viên"
        size="lg"
      >
        <StudentDetail
          student={selectedStudent}
          onEdit={() => {
            setIsDetailModalOpen(false);
            handleEdit(selectedStudent);
          }}
          onClose={() => setIsDetailModalOpen(false)}
        />
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập danh sách sinh viên"
        size="xl"
      >
        <StudentExcelImportWithPreview
          onImportSuccess={() => {
            setIsImportModalOpen(false);
            queryClient.invalidateQueries('students');
          }}
          onCancel={() => setIsImportModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Students;
