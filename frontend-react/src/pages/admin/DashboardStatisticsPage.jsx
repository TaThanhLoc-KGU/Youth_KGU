import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users, Calendar, CheckCircle, TrendingUp, RefreshCcw, Download
} from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';

export default function DashboardStatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await dashboardService.getDashboardStats();
      setData(result);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  const tongQuan = data?.tongQuan || {};
  const xuHuong = data?.xuHuongTheoThang || [];
  const topHoatDong = data?.topHoatDong || [];
  const topSinhVien = data?.topSinhVien || [];
  const theoKhoa = data?.theoKhoa || [];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Thống kê & Báo cáo</h1>
          <p className="text-gray-500">Phân tích chi tiết hoạt động Đoàn - Hội</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
            title="Làm mới"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            <span>Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Tổng hoạt động"
          value={tongQuan.tongHoatDong ?? 0}
          icon={<Calendar className="w-6 h-6 text-blue-600" />}
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Tổng điểm danh"
          value={tongQuan.tongDiemDanh ?? 0}
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          bgColor="bg-green-50"
        />
        <StatCard
          title="Tỉ lệ tham gia"
          value={`${tongQuan.tyLeThamGia ?? 0}%`}
          icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
          bgColor="bg-purple-50"
        />
        <StatCard
          title="Khoa tham gia"
          value={tongQuan.soKhoaThamGia ?? 0}
          icon={<Users className="w-6 h-6 text-orange-600" />}
          bgColor="bg-orange-50"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend LineChart */}
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-4">Xu hướng 12 tháng gần nhất</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={xuHuong}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="thang"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  dy={8}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="soHoatDong"
                  name="Số hoạt động"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="tyLe"
                  name="Tỉ lệ tham gia (%)"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Faculty Comparison BarChart */}
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-4">Tham gia theo Khoa</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={theoKhoa} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis
                  dataKey="tenKhoa"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="tongDangKy" name="Đăng ký" fill="#93c5fd" radius={[0, 4, 4, 0]} />
                <Bar dataKey="tongDiemDanh" name="Điểm danh" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Activities */}
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-4">Top 5 Hoạt động có nhiều điểm danh nhất</h3>
          {topHoatDong.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">Hoạt động</th>
                    <th className="px-3 py-3">Ngày</th>
                    <th className="px-3 py-3 text-center">Điểm danh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topHoatDong.map((hd, index) => (
                    <tr key={hd.maHoatDong} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-600' :
                          index === 2 ? 'bg-orange-100 text-orange-600' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-[200px]">{hd.tenHoatDong}</p>
                        <p className="text-xs text-gray-400">{hd.maHoatDong}</p>
                      </td>
                      <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {hd.ngayToChuc ? String(hd.ngayToChuc) : '-'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold">
                          {hd.tongDiemDanh}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8 text-sm">Chưa có dữ liệu điểm danh</p>
          )}
        </Card>

        {/* Top 10 Students */}
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-4">Top 10 Sinh viên tham gia nhiều nhất</h3>
          {topSinhVien.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">Sinh viên</th>
                    <th className="px-3 py-3 text-center">Số lần</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topSinhVien.map((sv, index) => (
                    <tr key={sv.maSv} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-600' :
                          index === 2 ? 'bg-orange-100 text-orange-600' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {sv.hoTen ? sv.hoTen.split(' ').pop().charAt(0) : '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{sv.hoTen}</p>
                            <p className="text-xs text-gray-400">{sv.maSv}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-bold">
                          {sv.soLan} lần
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8 text-sm">Chưa có dữ liệu tham gia</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bgColor }) {
  return (
    <Card className="p-6 transition-transform hover:scale-[1.02] duration-300">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-2xl ${bgColor}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h4 className="text-2xl font-bold text-gray-900 mt-1">{value}</h4>
      </div>
    </Card>
  );
}
