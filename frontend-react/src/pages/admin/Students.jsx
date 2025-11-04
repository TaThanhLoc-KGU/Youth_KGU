import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Eye, RefreshCw, Download, Upload, Search } from 'lucide-react';
import studentService from '../../services/studentService';
import lopService from '../../services/lopService';
import khoaService from '../../services/khoaService';
import nganhService from '../../services/nganhService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import StudentForm from '../../components/admin/StudentForm';
import StudentDetail from '../../components/admin/StudentDetail';
import StudentExcelImport from '../../components/admin/StudentExcelImport';

const Students = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [majorFilter, setMajorFilter] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'

  // Fetch dropdown data
  const { data: classList = [] } = useQuery('classes', () => lopService.getAll());
  const { data: facultyList = [] } = useQuery('faculties', () => khoaService.getAll());
  const { data: majorList = [] } = useQuery('majors', () => nganhService.getAll());

  // Filter classes by faculty/major for display (client-side filtering)
  const filteredClasses = Array.isArray(classList) ? classList.filter(cls => {
    if (facultyFilter && cls.maKhoa !== facultyFilter) return false;
    if (majorFilter && cls.maNganh !== majorFilter) return false;
    return true;
  }) : [];

  // Fetch students with pagination and filters
  const { data: studentsData, isLoading } = useQuery(
    ['students', page, size, search, statusFilter, classFilter],
    () => studentService.getAll({
      page,
      size,
      sortBy: 'maSv',
      direction: 'asc',
      search,
      maLop: classFilter,
      isActive: statusFilter === 'all' ? null : statusFilter === 'active' ? true : false
    }),
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

  // Handle row selection
  const handleSelectRow = (maSv) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(maSv)) {
      newSelectedRows.delete(maSv);
    } else {
      newSelectedRows.add(maSv);
    }
    setSelectedRows(newSelectedRows);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === (studentsData?.content?.length || 0)) {
      setSelectedRows(new Set());
    } else {
      const allMaSv = studentsData?.content?.map(s => s.maSv) || [];
      setSelectedRows(new Set(allMaSv));
    }
  };

  // Table columns
  const columns = [
    {
      header: (
        <input
          type="checkbox"
          checked={selectedRows.size > 0 && selectedRows.size === (studentsData?.content?.length || 0)}
          onChange={handleSelectAll}
          className="w-4 h-4"
        />
      ),
      accessor: 'select',
      width: '50px',
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedRows.has(row.maSv)}
          onChange={() => handleSelectRow(row.maSv)}
          className="w-4 h-4"
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      header: 'STT',
      accessor: 'stt',
      width: '60px',
      render: (_, __, index) => <span>{index + 1}</span>,
    },
    {
      header: 'Mã SV',
      accessor: 'maSv',
      width: '120px',
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      header: 'Họ và tên',
      accessor: 'hoTen',
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">
              {value?.charAt(0)}
            </span>
          </div>
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (value) => <span className="text-sm text-gray-600">{value || '-'}</span>,
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
          <div className="space-y-4">
            {/* Search Row */}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm
                </label>
                <input
                  id="search-input"
                  type="text"
                  placeholder="Mã SV, tên, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setPage(0);
                    }
                  }}
                />
              </div>
              <Button
                icon={Search}
                onClick={() => setPage(0)}
                title="Tìm kiếm"
              >
                Tìm
              </Button>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label htmlFor="faculty-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Khoa
                </label>
                <select
                  id="faculty-filter"
                  value={facultyFilter}
                  onChange={(e) => {
                    setFacultyFilter(e.target.value);
                    setPage(0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="">Tất cả khoa</option>
                  {Array.isArray(facultyList) && facultyList.map(faculty => (
                    <option key={faculty.maKhoa} value={faculty.maKhoa}>
                      {faculty.tenKhoa || faculty.maKhoa}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="major-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Ngành
                </label>
                <select
                  id="major-filter"
                  value={majorFilter}
                  onChange={(e) => {
                    setMajorFilter(e.target.value);
                    setPage(0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="">Tất cả ngành</option>
                  {Array.isArray(majorList) && majorList.map(major => (
                    <option key={major.maNganh} value={major.maNganh}>
                      {major.tenNganh || major.maNganh}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Lớp
                </label>
                <select
                  id="class-filter"
                  value={classFilter}
                  onChange={(e) => {
                    setClassFilter(e.target.value);
                    setPage(0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="">Tất cả lớp</option>
                  {filteredClasses.map(cls => (
                    <option key={cls.maLop} value={cls.maLop}>
                      {cls.maLop} - {cls.tenLop || ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngừng hoạt động</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  icon={RefreshCw}
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setClassFilter('');
                    setFacultyFilter('');
                    setMajorFilter('');
                    setPage(0);
                    setSelectedRows(new Set());
                  }}
                  fullWidth
                >
                  Xóa lọc
                </Button>
              </div>
            </div>
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
        size="lg"
      >
        <StudentExcelImport
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
