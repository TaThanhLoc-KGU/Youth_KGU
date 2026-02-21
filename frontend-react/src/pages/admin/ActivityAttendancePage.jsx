import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  UserCheck,
  Download
} from 'lucide-react';
import activityService from '../../services/activityService';
import { format } from 'date-fns';

export default function ActivityAttendancePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, CHECKED_IN, NOT_CHECKED_IN

  // Fetch activity details
  const { data: activity, isLoading: loadingActivity } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => activityService.getById(id),
  });

  // Fetch attendance status list
  const { data: attendanceList = [], isLoading: loadingList } = useQuery({
    queryKey: ['attendance-status', id],
    queryFn: () => activityService.getAttendanceStatusList(id),
  });

  // Filter and search logic
  const filteredList = attendanceList.filter(item => {
    const matchesSearch = 
      item.hoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maSv?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lop?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'CHECKED_IN') return item.daDiemDanh;
    if (filterStatus === 'NOT_CHECKED_IN') return !item.daDiemDanh;
    
    return true;
  });

  const stats = {
    total: attendanceList.length,
    checkedIn: attendanceList.filter(i => i.daDiemDanh).length,
    notCheckedIn: attendanceList.filter(i => !i.daDiemDanh).length,
  };

  if (loadingActivity || loadingList) {
    return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;
  }

  if (!activity) {
    return <div className="p-8 text-center text-red-500">Không tìm thấy hoạt động</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/admin/activities')}
          className="flex items-center text-gray-500 hover:text-blue-600 mb-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Quay lại danh sách
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{activity.tenHoatDong}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {format(new Date(activity.ngayToChuc), 'dd/MM/yyyy')}
              </span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                {activity.loaiHoatDong}
              </span>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="flex gap-3">
            <div className="bg-white border rounded-lg p-3 px-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase font-semibold">Tổng đăng ký</p>
              <p className="text-xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-lg p-3 px-4 shadow-sm">
              <p className="text-xs text-green-600 uppercase font-semibold">Đã điểm danh</p>
              <p className="text-xl font-bold text-green-700">{stats.checkedIn}</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 px-4 shadow-sm">
              <p className="text-xs text-red-600 uppercase font-semibold">Chưa điểm danh</p>
              <p className="text-xl font-bold text-red-700">{stats.notCheckedIn}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, MSSV, lớp..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3">
            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="CHECKED_IN">Đã điểm danh</option>
              <option value="NOT_CHECKED_IN">Chưa điểm danh</option>
            </select>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              Xuất Excel
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Sinh viên</th>
                <th className="p-4 font-semibold">Lớp</th>
                <th className="p-4 font-semibold">Check-in</th>
                <th className="p-4 font-semibold">Check-out</th>
                <th className="p-4 font-semibold text-center">Trạng thái</th>
                <th className="p-4 font-semibold">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredList.length > 0 ? (
                filteredList.map((item) => (
                  <tr key={item.maSv} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.hoTen}</p>
                        <p className="text-sm text-gray-500">{item.maSv}</p>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{item.lop || '—'}</td>
                    
                    {/* Check-in Column */}
                    <td className="p-4">
                      {item.thoiGianCheckIn ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {format(new Date(item.thoiGianCheckIn), 'HH:mm')}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.trangThaiCheckIn === 'DUNG_GIO' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.trangThaiCheckIn === 'DUNG_GIO' ? 'Đúng giờ' : `Trễ ${item.soPhutTre}p`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>

                    {/* Check-out Column */}
                    <td className="p-4">
                      {item.thoiGianCheckOut ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {format(new Date(item.thoiGianCheckOut), 'HH:mm')}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.trangThaiCheckOut === 'DUNG_GIO' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {item.trangThaiCheckOut === 'DUNG_GIO' ? 'Đúng giờ' : `Sớm ${item.soPhutVeSom}p`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>

                    {/* Status Column */}
                    <td className="p-4 text-center">
                      {item.daDiemDanh ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100">
                          <CheckCircle className="w-4 h-4" />
                          Đã tham gia
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium border border-gray-200">
                          <XCircle className="w-4 h-4" />
                          Chưa tham gia
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-sm text-gray-500 max-w-xs truncate">
                      {item.ghiChu || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    Không tìm thấy dữ liệu phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t bg-gray-50 text-sm text-gray-500 flex justify-between items-center">
          <span>Hiển thị {filteredList.length} sinh viên</span>
        </div>
      </div>
    </div>
  );
}
