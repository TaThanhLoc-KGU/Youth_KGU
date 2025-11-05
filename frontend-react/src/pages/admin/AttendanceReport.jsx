import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, RefreshCw, BarChart3, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import attendanceService from '../../services/attendanceService';
import lopService from '../../services/lopService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { toast } from 'react-toastify';

const AttendanceReport = () => {
  const [search, setSearch] = useState('');
  const [lopFilter, setLopFilter] = useState('');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: lops = [] } = useQuery({
    queryKey: ['lops-for-report'],
    queryFn: () => lopService.getAll()
  });

  const { data: reportData = [], isLoading, refetch } = useQuery({
    queryKey: ['attendance-report', lopFilter, startDate, endDate],
    queryFn: async () => {
      if (startDate && endDate) {
        return attendanceService.getByDateRange(startDate, endDate);
      }
      return attendanceService.getReport();
    },
    keepPreviousData: true
  });

  const { data: stats = {} } = useQuery({
    queryKey: ['attendance-stats', lopFilter, startDate, endDate],
    queryFn: () => attendanceService.getStatistics({ maLop: lopFilter, startDate, endDate })
  });

  const { data: trends = [] } = useQuery({
    queryKey: ['attendance-trends', startDate, endDate],
    queryFn: () => attendanceService.getTrends(
      Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
    )
  });

  const { data: rateByClass = [] } = useQuery({
    queryKey: ['attendance-rate-by-class'],
    queryFn: () => attendanceService.getRateByClass()
  });

  const filteredData = search
    ? reportData.filter(r =>
        r.tenLop?.toLowerCase().includes(search.toLowerCase()) ||
        r.tenHoatDong?.toLowerCase().includes(search.toLowerCase())
      )
    : reportData;

  const lopFilteredData = lopFilter
    ? filteredData.filter(r => r.maLop === lopFilter)
    : filteredData;

  const handleExport = async () => {
    try {
      const blob = await attendanceService.exportReport({
        maLop: lopFilter,
        startDate,
        endDate,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diemdanh-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Xuất báo cáo thành công');
    } catch (error) {
      toast.error('Lỗi xuất báo cáo');
    }
  };

  const columns = [
    {
      header: 'Lớp',
      accessor: 'tenLop',
    },
    {
      header: 'Hoạt động',
      accessor: 'tenHoatDong',
    },
    {
      header: 'Ngày',
      accessor: 'ngayDiemDanh',
      render: (v) => new Date(v).toLocaleDateString('vi-VN'),
    },
    {
      header: 'Có mặt',
      accessor: 'soCoDiemDanh',
      render: (v) => <span className="font-semibold text-green-600">{v}</span>,
    },
    {
      header: 'Vắng mặt',
      accessor: 'soVang',
      render: (v) => <span className="font-semibold text-red-600">{v}</span>,
    },
    {
      header: 'Đi trễ',
      accessor: 'soTre',
      render: (v) => <span className="font-semibold text-yellow-600">{v}</span>,
    },
    {
      header: 'Tỷ lệ (%)',
      accessor: 'tyLe',
      render: (v) => (
        <Badge variant={v >= 80 ? 'success' : v >= 60 ? 'warning' : 'danger'}>
          {v?.toFixed(1)}%
        </Badge>
      ),
    },
  ];

  const attendanceChartData = trends.map(t => ({
    date: new Date(t.date).toLocaleDateString('vi-VN'),
    present: t.present || 0,
    absent: t.absent || 0,
    late: t.late || 0,
  }));

  const classRateData = rateByClass.map(r => ({
    name: r.maLop,
    rate: r.rate || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo Điểm danh</h1>
          <p className="text-gray-600 mt-1">Thống kê và báo cáo điểm danh sinh viên</p>
        </div>
        <Button variant="outline" icon={Download} onClick={handleExport}>
          Xuất Excel
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-xs text-gray-600">Tổng buổi học</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalSessions || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs text-gray-600">Có mặt trung bình</p>
            <p className="text-2xl font-bold text-green-600">{stats.avgPresent?.toFixed(0) || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs text-gray-600">Vắng trung bình</p>
            <p className="text-2xl font-bold text-red-600">{stats.avgAbsent?.toFixed(0) || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs text-gray-600">Tỷ lệ trung bình</p>
            <p className="text-2xl font-bold text-blue-600">{stats.avgRate?.toFixed(1) || 0}%</p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend Chart */}
        <Card>
          <div className="border-b border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Xu hướng điểm danh
            </h3>
          </div>
          <div className="p-6">
            {attendanceChartData.length > 0 ? (
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="present" stroke="#10b981" name="Có mặt" />
                    <Line type="monotone" dataKey="absent" stroke="#ef4444" name="Vắng" />
                    <Line type="monotone" dataKey="late" stroke="#f59e0b" name="Đi trễ" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </Card>

        {/* Attendance Rate by Class Chart */}
        <Card>
          <div className="border-b border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Tỷ lệ theo lớp
            </h3>
          </div>
          <div className="p-6">
            {classRateData.length > 0 ? (
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classRateData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={60} />
                    <Tooltip />
                    <Bar dataKey="rate" fill="#3b82f6" name="Tỷ lệ %" />
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
          data={lopFilteredData}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
};

export default AttendanceReport;
