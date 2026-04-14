import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Eye, RefreshCw, Download, Upload, Search } from 'lucide-react';
import studentService from '../../services/studentService';
import useAuthStore from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/constants';
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
import ConfirmDialog from '../../components/common/ConfirmDialog';
import SearchableSelect from '../../components/common/SearchableSelect';

const Students = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const canView   = hasPermission(PERMISSIONS.VIEW_SINH_VIEN);
  const canAdd    = hasPermission(PERMISSIONS.THEM_SINH_VIEN);
  const canEdit   = hasPermission(PERMISSIONS.SUA_SINH_VIEN);
  const canDelete = hasPermission(PERMISSIONS.XOA_SINH_VIEN);
  const canImport = hasPermission(PERMISSIONS.IMPORT_SINH_VIEN);
  const canManage = canAdd || canEdit || canDelete;
  const canViewLop   = hasPermission(PERMISSIONS.XEM_LOP);
  const canViewKhoa  = hasPermission(PERMISSIONS.XEM_KHOA);
  const canViewNganh = hasPermission(PERMISSIONS.XEM_NGANH);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [majorFilter, setMajorFilter] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());

  const [confirmState, setConfirmState] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'

  // Fetch dropdown data — chỉ gọi khi có quyền để tránh spam 403
  const { data: classList = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => lopService.getAll(),
    enabled: canViewLop,
  });
  const { data: facultyList = [] } = useQuery({
    queryKey: ['faculties'],
    queryFn: () => khoaService.getAll(),
    enabled: canViewKhoa,
  });
  const { data: majorList = [] } = useQuery({
    queryKey: ['majors'],
    queryFn: () => nganhService.getAll(),
    enabled: canViewNganh,
  });

  // Filter classes by faculty/major for display (client-side filtering)
  const filteredClasses = Array.isArray(classList) ? classList.filter(cls => {
    if (facultyFilter && cls.maKhoa !== facultyFilter) return false;
    if (majorFilter && cls.maNganh !== majorFilter) return false;
    return true;
  }) : [];

  // Fetch students with pagination and filters
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students', page, size, search, statusFilter, classFilter, facultyFilter, majorFilter],
    queryFn: () => studentService.getAll({
      page,
      size,
      sortBy: 'maSv',
      direction: 'asc',
      search,
      maLop: classFilter,
      maKhoa: facultyFilter,
      maNganh: majorFilter,
      isActive: statusFilter === 'all' ? null : statusFilter === 'active' ? true : false
    }),
    keepPreviousData: true
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => studentService.delete(id),
    onSuccess: () => {
      toast.success('Xóa sinh viên thành công!');
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xóa sinh viên thất bại!');
    },
  });

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
      accessor: 'maLop',
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
            onClick={(e) => { e.stopPropagation(); handleView(row); }}
            title="Xem chi tiết"
          />
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              icon={Edit}
              onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
              title="Sửa"
            />
          )}
          {canDelete && (
            <Button
              size="sm"
              variant="ghost"
              icon={Trash2}
              onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
              title="Xóa"
              className="text-red-600 hover:text-red-700"
            />
          )}
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
    setConfirmState({ id: student.maSv, name: student.hoTen });
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    queryClient.invalidateQueries(['students']);
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý Sinh viên</h1>
          <p className="text-gray-600 mt-1">
            Quản lý thông tin sinh viên và hồ sơ
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        {canImport && (
        <Button variant="outline" icon={Upload} onClick={() => setIsImportModalOpen(true)}>
        <span className="hidden sm:inline">Import</span>
        </Button>
        )}
        {canView && (
        <Button variant="outline" icon={Download} onClick={handleExport}>
        <span className="hidden sm:inline">Export</span>
        </Button>
        )}
        {canAdd && (
        <Button icon={Plus} onClick={handleCreate}>
        <span className="hidden sm:inline">Thêm sinh viên</span>
        </Button>
        )}
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Tìm kiếm */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Tìm kiếm sinh viên
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Nhập mã SV, tên hoặc email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && setPage(0)}
              />
            </div>
          </div>

          {/* Khoa */}
          <div>
            <SearchableSelect
              label="Khoa"
              labelClassName="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
              placeholder="Tất cả khoa"
              options={Array.isArray(facultyList) ? facultyList.map(f => ({
                value: f.maKhoa,
                label: f.tenKhoa || f.maKhoa
              })) : []}
              value={facultyFilter}
              onChange={(val) => {
                setFacultyFilter(val || '');
                setMajorFilter('');
                setClassFilter('');
                setPage(0);
              }}
            />
          </div>

          {/* Ngành */}
          <div>
            <SearchableSelect
              label="Ngành"
              labelClassName="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
              placeholder="Tất cả ngành"
              options={Array.isArray(majorList) ? majorList.map(m => ({
                value: m.maNganh,
                label: m.tenNganh || m.maNganh
              })) : []}
              value={majorFilter}
              onChange={(val) => {
                setMajorFilter(val || '');
                setClassFilter('');
                setPage(0);
              }}
            />
          </div>

          {/* Lớp */}
          <div>
            <SearchableSelect
              label="Lớp học"
              labelClassName="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
              placeholder="Tất cả lớp"
              options={filteredClasses.map(cls => ({
                value: cls.maLop,
                label: cls.maLop
              }))}
              value={classFilter}
              onChange={(val) => {
                setClassFilter(val || '');
                setPage(0);
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-50">
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary-500/20 outline-none cursor-pointer"
            >
              <option value="all">Mọi trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
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
              className="text-gray-500 hover:text-primary-600 font-medium text-xs"
            >
              Làm mới bộ lọc
            </Button>
            <Button
              size="sm"
              icon={Search}
              onClick={() => setPage(0)}
              className="px-6 shadow-sm shadow-primary-500/20"
            >
              Tìm kiếm
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            data={studentsData?.content || []}
            isLoading={isLoading}
            onRowClick={handleView}
          />
        </div>
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
            queryClient.invalidateQueries(['students']);
          }}
          onCancel={() => setIsImportModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={() => { deleteMutation.mutate(confirmState?.id); setConfirmState(null); }}
        title="Xóa sinh viên"
        description={`Bạn có chắc muốn xóa sinh viên "${confirmState?.name}"? Hành động này không thể hoàn tác.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Students;
