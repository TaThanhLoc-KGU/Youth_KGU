import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, RefreshCw, BarChart3, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import attendanceService from '../../services/attendanceService';
import useAuthStore from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/constants';
import lopService from '../../services/lopService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { toast } from 'react-toastify';

const AttendanceReport = () => {
  const { hasPermission } = useAuthStore();
  const canExport = hasPermission(PERMISSIONS.EXPORT_BAO_CAO);
  const [search, setSearch] = useState('');
  const [lopFilter, setLopFilter] = useState('');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch classes for filter
  const { data: lops = [] } = useQuery({
    queryKey: ['lops-for-report'],
    queryFn: () => lopService.getAll()
  });

  // Fetch overall statistics
  const { data: stats = {}, isLoading: isLoadingStats } = useQuery({
    queryKey: ['attendance-stats-overview'],
    queryFn: () => attendanceService.getStatisticsOverview()
  });

  // Fetch attendance data (using getStatisticsOverview for now as placeholder for detailed report)
  // In a real scenario, you might want a specific endpoint for list data
  const { data: reportData = [], isLoading: isLoadingReport, refetch } = useQuery({
    queryKey: ['attendance-report-list', lopFilter, startDate, endDate],
    queryFn: async () => {
      return attendanceService.getReportData('general', { from: startDate, to: endDate });
    },
    keepPreviousData: true
  });

  // Prepare chart data from stats
  const attendanceChartData = [
    { name: 'Thành công', value: stats.diemDanhThanhCong || 0, fill: '#10b981' },
    { name: 'Vắng', value: stats.vangKhongPhep || 0, fill: '#ef4444' },
  ];

  const facultyData = stats.thongKeTheoKhoa ? Object.entries(stats.thongKeTheoKhoa).map(([name, value]) => ({
    name,
    value
  })) : [];

  const handleExport = async () => {
    try {
      toast.info('Đang chuẩn bị file báo cáo...');
      await attendanceService.exportReportExcel('general');
      toast.success('Xuất báo cáo thành công!');
    } catch (error) {
      toast.error('Lỗi khi xuất báo cáo');
    }
  };

  const columns = [
    {
      header: 'Mã hoạt động',
      accessor: 'maHoatDong',
    },
    {
      header: 'Tên hoạt động',
      accessor: 'tenHoatDong',
    },
    {
      header: 'Ngày tổ chức',
      accessor: 'ngayToChuc',
      render: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
    },
    {
      header: 'Đăng ký',
      accessor: 'tongDangKy',
      render: (v) => <span className="font-semibold">{v}</span>,
    },
    {
      header: 'Tham gia',
      accessor: 'daDiemDanh',
      render: (v) => <span className="font-semibold text-green-600">{v}</span>,
    },
    {
      header: 'Tỷ lệ (%)',
      accessor: 'tyLe',
      render: (_, row) => {
        const v = row.tongDangKy > 0 ? (row.daDiemDanh / row.tongDangKy) * 100 : 0;
        return (
          <Badge variant={v >= 80 ? 'success' : v >= 60 ? 'warning' : 'danger'}>
            {v.toFixed(1)}%
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo Điểm danh</h1>
          <p className="text-gray-600 mt-1">Thống kê và báo cáo điểm danh sinh viên</p>
        </div>
        {canExport && (
          <Button variant="outline" icon={Download} onClick={handleExport}>
            Xuất Excel
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-xs text-gray-600">Tổng lượt điểm danh</p>
            <p className="text-2xl font-bold text-gray-900">{stats.tongLuotDiemDanh || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs text-gray-600">Điểm danh thành công</p>
            <p className="text-2xl font-bold text-green-600">{stats.diemDanhThanhCong || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs text-gray-600">Vắng không phép</p>
            <p className="text-2xl font-bold text-red-600">{stats.vangKhongPhep || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs text-gray-600">Tỷ lệ có mặt</p>
            <p className="text-2xl font-bold text-blue-600">{stats.tiLeCoMat || 0}%</p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Status Chart */}
        <Card>
          <div className="border-b border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Trạng thái điểm danh
            </h3>
          </div>
          <div className="p-6">
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Faculty Statistics Chart */}
        <Card>
          <div className="border-b border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Thống kê theo Khoa
            </h3>
          </div>
          <div className="p-6">
            {facultyData.length > 0 ? (
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={facultyData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" name="Số lượng" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <Select
              label="Lớp"
              options={[{ value: '', label: 'Tất cả lớp' }, ...lops.map(l => ({
                value: l.maLop, label: l.tenLop
              }))]}
              value={lopFilter}
              onChange={(e) => setLopFilter(e.target.value)}
            />
            <SearchInput
              placeholder="Tìm kiếm..."
              value={search}
              onSearch={setSearch}
            />
            <div className="flex items-end">
              <Button variant="outline" icon={RefreshCw} onClick={() => refetch()} className="w-full">
                Làm mới
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Report Table */}
      <Card>
        <Table
          columns={columns}
          data={reportData}
          loading={isLoadingReport}
        />
      </Card>
    </div>
  );
};

export default AttendanceReport;
