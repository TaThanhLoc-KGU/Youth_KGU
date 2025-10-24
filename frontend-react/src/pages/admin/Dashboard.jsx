import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import {
  Users,
  Activity,
  ClipboardCheck,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import dashboardService from '../../services/dashboardService';
import Loading from '../../components/common/Loading';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

const AdminDashboard = () => {
  // Fetch dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery(
    'dashboard',
    dashboardService.getDashboard,
    { keepPreviousData: true }
  );

  // Fetch student count
  const { data: studentCount } = useQuery('student-count', () =>
    dashboardService.getStudentCount?.() || Promise.resolve({ count: 0 })
  );

  // Fetch activity statistics
  const { data: activityStats } = useQuery(
    'activity-stats',
    () => dashboardService.getActivityStatistics?.() || Promise.resolve({})
  );

  // Fetch activity trends (for line chart)
  const { data: activityTrends } = useQuery(
    'activity-trends',
    dashboardService.getActivityTrends
  );

  // Fetch participation by faculty (for pie chart)
  const { data: participationByFaculty } = useQuery(
    'participation-by-faculty',
    dashboardService.getParticipationByFaculty
  );

  // Fetch upcoming activities
  const { data: upcomingActivities } = useQuery(
    'upcoming-activities',
    () => dashboardService.getUpcomingActivities(7)
  );

  // Fetch top students
  const { data: topStudents } = useQuery(
    'top-students',
    () => dashboardService.getTopStudents(10)
  );

  // Fetch attendance statistics
  const { data: attendanceStats } = useQuery(
    'attendance-stats',
    dashboardService.getAttendanceStatistics
  );

  // Transform data for charts
  const attendanceChartData = activityTrends || [
    { name: 'T2', value: 120 },
    { name: 'T3', value: 150 },
    { name: 'T4', value: 180 },
    { name: 'T5', value: 200 },
    { name: 'T6', value: 160 },
    { name: 'T7', value: 90 },
    { name: 'CN', value: 30 },
  ];

  const facultyChartData = participationByFaculty
    ? participationByFaculty.map((item) => ({
        name: item.label || item.name || 'Unknown',
        value: item.data || item.value || 0,
      }))
    : [
        { name: 'Công nghệ thông tin', value: 35 },
        { name: 'Kỹ thuật', value: 25 },
        { name: 'Quản lý', value: 20 },
        { name: 'Kinh tế', value: 15 },
        { name: 'Ngoại ngữ', value: 5 },
      ];

  const activityChartData = [
    { name: 'Tháng 1', hoạtĐộng: 12 },
    { name: 'Tháng 2', hoạtĐộng: 19 },
    { name: 'Tháng 3', hoạtĐộng: 15 },
    { name: 'Tháng 4', hoạtĐộng: 25 },
    { name: 'Tháng 5', hoạtĐộng: 22 },
    { name: 'Tháng 6', hoạtĐộng: 30 },
  ];

  // Prepare stats cards
  const totalActivities =
    dashboardData?.tongHoatDong ||
    (activityStats && Object.values(activityStats).reduce((a, b) => a + b, 0)) ||
    0;
  const ongoingActivities =
    dashboardData?.hoatDongDangDienRa ||
    activityStats?.DANG_DIEN_RA ||
    0;
  const totalBCH = dashboardData?.tongBCH || 0;
  const totalStudents = studentCount?.count || 0;

  const statCards = [
    {
      title: 'Tổng sinh viên',
      value: totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      trend: '+12%',
    },
    {
      title: 'Tổng hoạt động',
      value: totalActivities,
      icon: Activity,
      color: 'bg-green-500',
      trend: '+8%',
    },
    {
      title: 'BCH hoạt động',
      value: totalBCH,
      icon: ClipboardCheck,
      color: 'bg-yellow-500',
      trend: '+5%',
    },
    {
      title: 'Hoạt động đang diễn ra',
      value: ongoingActivities,
      icon: TrendingUp,
      color: 'bg-purple-500',
      trend: '+3%',
    },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  if (isDashboardLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Tổng quan hệ thống quản lý hoạt động</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index}>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.trend} so với tháng trước
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center flex-shrink-0`}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Activity Trends */}
        <Card>
          <div className="border-b border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Xu hướng tham gia 7 ngày qua</h3>
          </div>
          <div className="p-6">
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#1c6681"
                    dot={{ fill: '#1c6681', r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Lượt tham gia"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Bar Chart - Activities by Month */}
        <Card>
          <div className="border-b border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Hoạt động theo tháng</h3>
          </div>
          <div className="p-6">
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="hoạtĐộng" fill="#1c6681" name="Số hoạt động" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* Pie Chart - Faculty Participation */}
      <Card>
        <div className="border-b border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900">Tỷ lệ tham gia theo khoa</h3>
        </div>
        <div className="p-6">
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={facultyChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {facultyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Attendance Statistics */}
      {attendanceStats && (
        <Card>
          <div className="border-b border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Thống kê điểm danh</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Đúng giờ</p>
                <p className="text-2xl font-bold text-green-600">{attendanceStats.onTime}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Trễ</p>
                <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Vắng</p>
                <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}%</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Top Students */}
      {topStudents && topStudents.length > 0 && (
        <Card>
          <div className="border-b border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Top 10 sinh viên tích cực nhất</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {topStudents.map((student, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {student.hoTen || student.name || 'Unknown'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Mã SV: {student.maSv || student.studentId || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {student.diemRenLuyen || student.score || 0} điểm
                    </p>
                    <p className="text-xs text-gray-600">
                      {student.soHoatDongThamGia || student.activitiesJoined || 0} hoạt động
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Upcoming Activities */}
      {upcomingActivities && upcomingActivities.length > 0 && (
        <Card>
          <div className="border-b border-gray-200 p-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Hoạt động sắp diễn ra (7 ngày tới)</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Xem tất cả
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingActivities.map((activity) => (
                <div
                  key={activity.maHoatDong || activity.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900">
                      {activity.tenHoatDong || activity.name || 'Unknown Activity'}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      📅 {activity.ngayToChuc || activity.date || 'N/A'} •{' '}
                      👥 {activity.soDangKy || activity.registrations || 0} đã đăng ký
                    </p>
                  </div>
                  <Badge
                    variant={
                      activity.trangThai === 'SAP_DIEN_RA' ||
                      activity.status === 'upcoming'
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {activity.trangThai === 'SAP_DIEN_RA' ? 'Sắp diễn ra' : 'Đang diễn ra'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
