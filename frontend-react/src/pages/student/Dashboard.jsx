import { useEffect, useState } from 'react';
import { Calendar, Activity, Award, Clock } from 'lucide-react';
import activityService from '../../services/activityService';
import Loading from '../../components/common/Loading';
import { formatDate } from '../../utils/dateFormat';
import { ACTIVITY_STATUS_COLORS, ACTIVITY_STATUS_LABELS } from '../../utils/constants';

const StudentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [upcomingActivities, setUpcomingActivities] = useState([]);
  const [stats, setStats] = useState({
    registered: 0,
    attended: 0,
    certificates: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const activities = await activityService.getUpcoming();
      setUpcomingActivities(activities.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Hoạt động đã đăng ký',
      value: stats.registered,
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      title: 'Hoạt động đã tham gia',
      value: stats.attended,
      icon: Activity,
      color: 'bg-green-500',
    },
    {
      title: 'Chứng nhận',
      value: stats.certificates,
      icon: Award,
      color: 'bg-yellow-500',
    },
  ];

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Sinh viên</h1>
        <p className="text-gray-600 mt-1">Chào mừng bạn trở lại!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Activities */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Hoạt động sắp diễn ra</h3>
          <button className="text-sm text-primary hover:text-primary-600">
            Xem tất cả
          </button>
        </div>
        <div className="card-body">
          {upcomingActivities.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Không có hoạt động sắp diễn ra</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingActivities.map((activity) => (
                <div
                  key={activity.maHoatDong}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {activity.tenHoatDong}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formatDate(activity.ngayToChuc)}
                    </p>
                  </div>
                  <span className={`badge ${ACTIVITY_STATUS_COLORS[activity.trangThai]}`}>
                    {ACTIVITY_STATUS_LABELS[activity.trangThai]}
                  </span>
                  <button className="btn btn-primary btn-sm">
                    Đăng ký
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
