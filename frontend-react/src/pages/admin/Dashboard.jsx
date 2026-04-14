import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { LayoutGrid, Newspaper } from 'lucide-react';
import DashboardGrid from '../../components/dashboard/DashboardGrid';
import useAuthStore from '../../stores/authStore';
import { ROUTES } from '../../utils/constants';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.vaiTro === 'ADMIN';

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tổng quan hệ thống quản lý hoạt động</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={ROUTES.ADMIN_NEWS}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 text-gray-600 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
          >
            <Newspaper className="w-4 h-4" />
            Tin tức
          </Link>
          {isAdmin && (
            <button
              onClick={() => navigate('/admin/layout-editor')}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 text-gray-600 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
            >
              <LayoutGrid className="w-4 h-4" />
              Tùy chỉnh layout
            </button>
          )}
        </div>
      </div>

      {/* Widget grid */}
      <DashboardGrid />
    </div>
  );
};

export default AdminDashboard;
