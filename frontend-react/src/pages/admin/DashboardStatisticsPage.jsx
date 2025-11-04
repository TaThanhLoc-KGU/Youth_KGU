import React from 'react';
import { useQuery } from '@tanstack/react-query';
import accountService from '../../services/accountService';
import { ROLE_GROUP_LABELS, ORGANIZATION_LABELS } from '../../constants/accountConstants';

export default function DashboardStatisticsPage() {
  // Query: System Statistics
  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ['systemStatistics'],
    queryFn: () => accountService.getSystemStatistics(),
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Query: Pending Count
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['pendingCount'],
    queryFn: () => accountService.getPendingApprovalsCount(),
    refetchInterval: 30000
  });

  // Query: Statistics by Role
  const { data: statsByRole = {} } = useQuery({
    queryKey: ['statsByRole'],
    queryFn: () => accountService.getStatisticsByRole()
  });

  // Query: Statistics by Organization
  const { data: statsByOrg = {} } = useQuery({
    queryKey: ['statsByOrganization'],
    queryFn: () => accountService.getStatisticsByOrganization()
  });

  const StatCard = ({ title, value, icon, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200'
    };

    return (
      <div className={`rounded-lg border-2 p-6 ${colorClasses[color]}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${colorClasses[color].split(' ')[0]}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium opacity-75">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </div>
    );
  };

  const BarChart = ({ data, title, max = null }) => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">{title}</h3>
          <p className="text-gray-500 text-center py-4">Không có dữ liệu</p>
        </div>
      );
    }

    const maxValue =
      max ||
      Math.max(...Object.values(data).map((v) => (typeof v === 'number' ? v : 0)));

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <div className="space-y-4">
          {Object.entries(data).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{key}</span>
                <span className="text-sm font-bold text-blue-600">{value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: maxValue > 0 ? `${(value / maxValue) * 100}%` : '0%'
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num || 0);
  };

  if (statsLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg
            className="w-12 h-12 animate-spin mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <p className="text-gray-600">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Thống kê hệ thống</h1>
        <p className="text-gray-600 mt-2">
          Tổng quan về hoạt động của hệ thống quản lý Đoàn - Hội
        </p>
      </div>

      {/* Key Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Tổng tài khoản"
          value={formatNumber(stats.totalAccounts)}
          color="blue"
          icon={
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          }
        />

        <StatCard
          title="Tài khoản hoạt động"
          value={formatNumber(stats.activeAccounts)}
          color="green"
          icon={
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          }
        />

        <StatCard
          title="Chờ phê duyệt"
          value={formatNumber(pendingCount)}
          color="yellow"
          icon={
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          }
        />

        <StatCard
          title="Hoạt động"
          value={formatNumber(stats.totalActivities)}
          color="purple"
          icon={
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M7 3a1 1 0 000 2h6a1 1 0 000-2H7zM4 7a1 1 0 011-1h10a1 1 0 011 1v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
            </svg>
          }
        />

        <StatCard
          title="Đăng ký hoạt động"
          value={formatNumber(stats.totalRegistrations)}
          color="red"
          icon={
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 1 1 0 000-2H6a6 6 0 100 12H4a2 2 0 01-2-2v-4a2 2 0 012-2h10a2 2 0 01.894.553l.448-.894A2 2 0 0013 4H4zm12 4a1 1 0 100 2h1a1 1 0 100-2h-1z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Role Distribution */}
        <BarChart
          data={statsByRole}
          title="Phân bố tài khoản theo vai trò"
        />

        {/* Organization Distribution */}
        <BarChart
          data={statsByOrg}
          title="Phân bố tài khoản theo tổ chức"
        />
      </div>

      {/* Status Distribution */}
      {stats.accountsByApprovalStatus && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">Trạng thái phê duyệt tài khoản</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.accountsByApprovalStatus).map(([status, count]) => {
              const statusLabels = {
                'Chờ phê duyệt': { color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
                'Đã phê duyệt': { color: 'bg-green-100 text-green-800', icon: '✅' },
                'Từ chối': { color: 'bg-red-100 text-red-800', icon: '❌' }
              };

              const style = statusLabels[status] || {
                color: 'bg-gray-100 text-gray-800',
                icon: '◯'
              };

              return (
                <div key={status} className={`rounded-lg p-6 ${style.color}`}>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{style.icon}</span>
                    <div>
                      <p className="text-sm font-medium opacity-75">{status}</p>
                      <p className="text-2xl font-bold">{formatNumber(count)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Department Distribution */}
      {stats.accountsByDepartment && Object.keys(stats.accountsByDepartment).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Phân bố tài khoản theo ban chuyên môn</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left font-semibold">Ban chuyên môn</th>
                  <th className="px-4 py-2 text-right font-semibold">Số thành viên</th>
                  <th className="px-4 py-2 text-left font-semibold">Biểu đồ</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.accountsByDepartment).map(([dept, count]) => {
                  const maxCount = Math.max(
                    ...Object.values(stats.accountsByDepartment)
                  );
                  return (
                    <tr key={dept} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{dept}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatNumber(count)}</td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(count / maxCount) * 100}%`
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
