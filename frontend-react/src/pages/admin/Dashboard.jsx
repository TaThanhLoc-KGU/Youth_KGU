import { useEffect, useState } from 'react';
import { Users, Activity, ClipboardCheck, TrendingUp } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import studentService from '../../services/studentService';
import activityService from '../../services/activityService';
import Loading from '../../components/common/Loading';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalActivities: 0,
    todayAttendance: 0,
    activeActivities: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [studentCount, activityStats] = await Promise.all([
        studentService.getCount(),
        activityService.getStatisticsByStatus(),
      ]);

      setStats({
        totalStudents: studentCount.count || 0,
        totalActivities: Object.values(activityStats).reduce((a, b) => a + b, 0),
        todayAttendance: 0, // TODO: Get from attendance API
        activeActivities: activityStats.DANG_DIEN_RA || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Tổng sinh viên',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      trend: '+12%',
    },
    {
      title: 'Hoạt động',
      value: stats.totalActivities,
      icon: Activity,
      color: 'bg-green-500',
      trend: '+8%',
    },
    {
      title: 'Điểm danh hôm nay',
      value: stats.todayAttendance,
      icon: ClipboardCheck,
      color: 'bg-yellow-500',
      trend: '+5%',
    },
    {
      title: 'Hoạt động đang diễn ra',
      value: stats.activeActivities,
      icon: TrendingUp,
      color: 'bg-purple-500',
      trend: '+3%',
    },
  ];

  const attendanceChartData = {
    labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    datasets: [
      {
        label: 'Số lượt điểm danh',
        data: [120, 150, 180, 200, 160, 90, 30],
        borderColor: 'rgb(28, 102, 129)',
        backgroundColor: 'rgba(28, 102, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const activityChartData = {
    labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'],
    datasets: [
      {
        label: 'Hoạt động',
        data: [12, 19, 15, 25, 22, 30],
        backgroundColor: 'rgba(28, 102, 129, 0.8)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
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
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.trend} so với tháng trước
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Điểm danh 7 ngày qua</h3>
          </div>
          <div className="card-body">
            <div style={{ height: '300px' }}>
              <Line data={attendanceChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Hoạt động theo tháng</h3>
          </div>
          <div className="card-body">
            <div style={{ height: '300px' }}>
              <Bar data={activityChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Hoạt động gần đây</h3>
          <button className="text-sm text-primary hover:text-primary-600">
            Xem tất cả
          </button>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    Hoạt động tình nguyện {item}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {item * 50} sinh viên đã đăng ký
                  </p>
                </div>
                <span className="badge badge-success">Đang diễn ra</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
