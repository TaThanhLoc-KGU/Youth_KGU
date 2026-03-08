import { useState, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download, RefreshCw, BarChart3, TrendingUp, Calendar, ChevronDown, ChevronRight,
  Activity, Users, CheckSquare, AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import attendanceService from '../../services/attendanceService';
import useAuthStore from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/constants';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { toast } from 'react-toastify';

// ======================== HELPER ========================

const getRateVariant = (rate) => {
  if (rate >= 80) return 'success';
  if (rate >= 60) return 'warning';
  if (rate > 0)   return 'danger';
  return 'gray';
};

const getRateLabel = (rate, registered) => {
  if (registered === 0) return 'Không có ĐK';
  if (rate >= 80) return 'Tốt';
  if (rate >= 60) return 'Trung bình';
  if (rate > 0)   return 'Thấp';
  return 'Không tham gia';
};

const StatCard = ({ icon: Icon, label, value, sub, color = 'blue' }) => {
  const colors = {
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    green:  'bg-green-50 text-green-700 border-green-200',
    red:    'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    gray:   'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs mt-0.5 opacity-70">{sub}</p>}
    </div>
  );
};

// ======================== TAB: HOẠT ĐỘNG ========================

const ActivityReportTab = ({ canExport }) => {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedRows, setExpandedRows] = useState({});

  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ['activity-report', startDate, endDate],
    queryFn: () => attendanceService.getActivityReport({ from: startDate, to: endDate }),
  });

  const toggleRow = (maHoatDong) => {
    setExpandedRows(prev => ({ ...prev, [maHoatDong]: !prev[maHoatDong] }));
  };

  const handleExport = async () => {
    try {
      toast.info('Đang xuất file...');
      await attendanceService.exportReportExcel('general', { from: startDate, to: endDate });
      toast.success('Xuất thành công!');
    } catch {
      toast.error('Lỗi khi xuất file');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <div className="p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Từ ngày</label>
            <input type="date" lang="vi" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Đến ngày</label>
            <input type="date" lang="vi" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <Button variant="outline" icon={RefreshCw} onClick={() => refetch()}>Làm mới</Button>
          {canExport && (
            <Button variant="outline" icon={Download} onClick={handleExport}>Xuất Excel</Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Không có dữ liệu trong khoảng thời gian này</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">STT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Mã hoạt động</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Tên hoạt động</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Ngày tổ chức</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Tổng đăng ký</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Đã điểm danh</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((act, idx) => {
                  const rate = act.tongDangKy > 0 ? (act.daDiemDanh / act.tongDangKy) * 100 : 0;
                  const isExpanded = expandedRows[act.maHoatDong];
                  const faculties = act.facultyBreakdown
                    ? Object.entries(act.facultyBreakdown).sort((a, b) => b[1].dangKy - a[1].dangKy)
                    : [];

                  return (
                    <Fragment key={act.maHoatDong}>
                      <tr
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => faculties.length > 0 && toggleRow(act.maHoatDong)}
                      >
                        <td className="px-4 py-3 text-gray-400">
                          {faculties.length > 0 && (
                            isExpanded
                              ? <ChevronDown className="w-4 h-4" />
                              : <ChevronRight className="w-4 h-4" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono text-blue-600">{act.maHoatDong}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{act.tenHoatDong}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {act.ngayToChuc ? new Date(act.ngayToChuc).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{act.tongDangKy}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">{act.daDiemDanh}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={getRateVariant(rate)}>{rate.toFixed(1)}%</Badge>
                        </td>
                      </tr>

                      {isExpanded && faculties.length > 0 && (
                        <tr className="bg-blue-50 border-b border-blue-100">
                          <td colSpan={8} className="px-8 py-3">
                            <div className="text-xs font-semibold text-blue-700 mb-2">
                              Chi tiết theo đoàn khoa — {act.tenHoatDong}
                            </div>
                            <table className="w-full text-xs border border-blue-200 rounded-lg overflow-hidden">
                              <thead className="bg-blue-100">
                                <tr>
                                  <th className="px-3 py-2 text-left font-semibold text-blue-700">STT</th>
                                  <th className="px-3 py-2 text-left font-semibold text-blue-700">Đoàn khoa</th>
                                  <th className="px-3 py-2 text-right font-semibold text-blue-700">Đăng ký</th>
                                  <th className="px-3 py-2 text-right font-semibold text-blue-700">Điểm danh</th>
                                  <th className="px-3 py-2 text-center font-semibold text-blue-700">Tỷ lệ</th>
                                </tr>
                              </thead>
                              <tbody>
                                {faculties.map(([tenKhoa, stats], fi) => {
                                  const fr = stats.dangKy > 0 ? (stats.diemDanh / stats.dangKy) * 100 : 0;
                                  return (
                                    <tr key={tenKhoa} className="border-t border-blue-200 bg-white">
                                      <td className="px-3 py-1.5 text-gray-500">{fi + 1}</td>
                                      <td className="px-3 py-1.5 font-medium text-gray-800">{tenKhoa}</td>
                                      <td className="px-3 py-1.5 text-right">{stats.dangKy}</td>
                                      <td className="px-3 py-1.5 text-right text-green-700 font-semibold">{stats.diemDanh}</td>
                                      <td className="px-3 py-1.5 text-center">
                                        <Badge variant={getRateVariant(fr)}>{fr.toFixed(1)}%</Badge>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {/* Total row */}
                                <tr className="border-t-2 border-blue-300 bg-blue-50 font-semibold">
                                  <td colSpan={2} className="px-3 py-1.5 text-blue-800">Tổng cộng</td>
                                  <td className="px-3 py-1.5 text-right text-blue-800">{act.tongDangKy}</td>
                                  <td className="px-3 py-1.5 text-right text-green-700">{act.daDiemDanh}</td>
                                  <td className="px-3 py-1.5 text-center">
                                    <Badge variant={getRateVariant(rate)}>{rate.toFixed(1)}%</Badge>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

// ======================== TAB: THÁNG ========================

const MonthlyReportTab = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [exporting, setExporting] = useState(false);

  const getMonthRange = (m, y) => {
    const from = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const to = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;
    return { from, to };
  };

  const { data: report = { data: [], tongHoatDong: 0 }, isLoading, refetch } = useQuery({
    queryKey: ['monthly-report', month, year],
    queryFn: () => attendanceService.getMonthlyReport(getMonthRange(month, year)),
  });

  const handleExport = async () => {
    try {
      setExporting(true);
      toast.info('Đang xuất file...');
      const { from, to } = getMonthRange(month, year);
      await attendanceService.exportMonthlyExcel(from, to, month, year);
      toast.success('Xuất báo cáo tháng thành công!');
    } catch {
      toast.error('Lỗi khi xuất file');
    } finally {
      setExporting(false);
    }
  };

  const activities = report.data || [];

  const TRANG_THAI_LABEL = {
    SAP_DIEN_RA: 'Sắp diễn ra',
    DANG_MO_DANG_KY: 'Đang mở ĐK',
    DANG_DIEN_RA: 'Đang diễn ra',
    DA_HOAN_THANH: 'Đã hoàn thành',
    DA_KET_THUC: 'Đã kết thúc',
    DA_HUY: 'Đã hủy',
  };

  const TRANG_THAI_VARIANT = {
    SAP_DIEN_RA: 'default',
    DANG_MO_DANG_KY: 'warning',
    DANG_DIEN_RA: 'primary',
    DA_HOAN_THANH: 'success',
    DA_KET_THUC: 'success',
    DA_HUY: 'danger',
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));

  return (
    <div className="space-y-4">
      {/* Filter */}
      <Card>
        <div className="p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tháng</label>
            <select value={month} onChange={e => setMonth(+e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Năm</label>
            <select value={year} onChange={e => setYear(+e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <Button variant="outline" icon={RefreshCw} onClick={() => refetch()}>Làm mới</Button>
          <Button variant="outline" icon={Download} onClick={handleExport} disabled={exporting}>
            {exporting ? 'Đang xuất...' : 'Xuất Excel'}
          </Button>
        </div>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Activity}    label="Số hoạt động"  value={report.tongHoatDong || 0} color="blue" />
        <StatCard icon={Users}       label="Tổng đăng ký"  value={report.tongDangKy    || 0} color="gray" />
        <StatCard icon={CheckSquare} label="Đã điểm danh"  value={report.tongDiemDanh  || 0} color="green" />
        <StatCard icon={TrendingUp}  label="Tỷ lệ tham gia" value={`${report.tyLe || 0}%`}
          sub="trên tổng đăng ký" color={report.tyLe >= 80 ? 'green' : report.tyLe >= 60 ? 'yellow' : 'red'} />
      </div>

      {/* Table */}
      <Card>
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-semibold text-gray-900">
            Các hoạt động tháng {month}/{year}
          </h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Không có hoạt động nào trong tháng {month}/{year}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">STT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Mã hoạt động</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Tên hoạt động</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Ngày tổ chức</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Đăng ký</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Điểm danh</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Tỷ lệ</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((act, idx) => {
                  const rate = act.tongDangKy > 0 ? (act.daDiemDanh / act.tongDangKy) * 100 : 0;
                  return (
                    <tr key={act.maHoatDong} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-blue-600">{act.maHoatDong}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{act.tenHoatDong}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {act.ngayToChuc ? new Date(act.ngayToChuc).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{act.tongDangKy}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">{act.daDiemDanh}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={getRateVariant(rate)}>{rate.toFixed(1)}%</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={TRANG_THAI_VARIANT[act.trangThai] || 'default'}>
                          {TRANG_THAI_LABEL[act.trangThai] || act.trangThai || '—'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

// ======================== TAB: QUÝ ========================

const QuarterlyReportTab = () => {
  const now = new Date();
  const currentQ = Math.ceil((now.getMonth() + 1) / 3);
  const [quarter, setQuarter] = useState(currentQ);
  const [year, setYear]   = useState(now.getFullYear());
  const [exporting, setExporting] = useState(false);

  const getQuarterRange = (q, y) => {
    const startMonth = (q - 1) * 3 + 1;
    const endMonth   = q * 3;
    const lastDay    = new Date(y, endMonth, 0).getDate();
    return {
      from: `${y}-${String(startMonth).padStart(2, '0')}-01`,
      to:   `${y}-${String(endMonth).padStart(2, '0')}-${lastDay}`,
    };
  };

  const { data: report = { theoKhoa: [] }, isLoading, refetch } = useQuery({
    queryKey: ['quarterly-report', quarter, year],
    queryFn: () => attendanceService.getQuarterlyReport(getQuarterRange(quarter, year)),
  });

  const handleExport = async () => {
    try {
      setExporting(true);
      toast.info('Đang xuất file...');
      const { from, to } = getQuarterRange(quarter, year);
      await attendanceService.exportQuarterlyExcel(from, to, quarter, year);
      toast.success('Xuất báo cáo quý thành công!');
    } catch {
      toast.error('Lỗi khi xuất file');
    } finally {
      setExporting(false);
    }
  };

  const theoKhoa = report.theoKhoa || [];
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  // Chart data (top 10)
  const chartData = theoKhoa.slice(0, 10).map(k => ({
    name: k.tenKhoa,
    'Đã điểm danh': k.tongDiemDanh,
    'Đã đăng ký': k.tongDangKy - k.tongDiemDanh,
    tyLe: k.tyLe,
  }));

  return (
    <div className="space-y-4">
      {/* Filter */}
      <Card>
        <div className="p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quý</label>
            <select value={quarter} onChange={e => setQuarter(+e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {[1, 2, 3, 4].map(q => <option key={q} value={q}>Quý {q}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Năm</label>
            <select value={year} onChange={e => setYear(+e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <Button variant="outline" icon={RefreshCw} onClick={() => refetch()}>Làm mới</Button>
          <Button variant="outline" icon={Download} onClick={handleExport} disabled={exporting}>
            {exporting ? 'Đang xuất...' : 'Xuất Excel'}
          </Button>
        </div>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Activity}      label="Số hoạt động"        value={report.tongHoatDong || 0}       color="blue" />
        <StatCard icon={Users}         label="Tổng đăng ký"         value={report.tongDangKy   || 0}       color="gray" />
        <StatCard icon={CheckSquare}   label="Tổng điểm danh"       value={report.tongDiemDanh || 0}       color="green" />
        <StatCard icon={TrendingUp}    label="Tỷ lệ tham gia"       value={`${report.tyLeTong || 0}%`}
          sub="toàn quý"
          color={(report.tyLeTong || 0) >= 80 ? 'green' : (report.tyLeTong || 0) >= 60 ? 'yellow' : 'red'} />
        <StatCard icon={AlertTriangle} label="Khoa không tham gia"  value={report.soKhoaKhongThamGia || 0} color="red" />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Tỷ lệ tham gia theo đoàn khoa — Quý {quarter}/{year}
            </h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val, name) => [val, name]}
                  labelFormatter={(label) => `Khoa: ${label}`}
                />
                <Legend />
                <Bar dataKey="Đã điểm danh" stackId="a" fill="#10b981" />
                <Bar dataKey="Đã đăng ký"   stackId="a" fill="#d1fae5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Faculty table */}
      <Card>
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-semibold text-gray-900">
            Xếp hạng tham gia theo đoàn khoa
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Sắp xếp theo tỷ lệ tham gia từ cao đến thấp</p>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : theoKhoa.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Không có dữ liệu cho Quý {quarter}/{year}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Xếp hạng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Đoàn khoa</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Tổng đăng ký</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Đã tham gia</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Tỷ lệ</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {theoKhoa.map((khoa, idx) => {
                  const rankBadge = idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`;
                  return (
                    <tr key={khoa.tenKhoa}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        khoa.tongDiemDanh === 0 && khoa.tongDangKy > 0 ? 'bg-red-50' : ''
                      }`}>
                      <td className="px-4 py-3 font-semibold text-gray-700">{rankBadge}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{khoa.tenKhoa}</td>
                      <td className="px-4 py-3 text-right">{khoa.tongDangKy}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">{khoa.tongDiemDanh}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={getRateVariant(khoa.tyLe)}>{khoa.tyLe}%</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={getRateVariant(khoa.tyLe)}>
                          {getRateLabel(khoa.tyLe, khoa.tongDangKy)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

// ======================== MAIN COMPONENT ========================

const AttendanceReport = () => {
  const { hasPermission } = useAuthStore();
  const canExport = hasPermission(PERMISSIONS.EXPORT_BAO_CAO);

  const [activeTab, setActiveTab] = useState('hoat-dong');

  const tabs = [
    { id: 'hoat-dong', label: 'Báo cáo hoạt động', icon: Activity },
    { id: 'thang',     label: 'Báo cáo tháng',     icon: Calendar },
    { id: 'quy',       label: 'Báo cáo quý',        icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo Điểm danh</h1>
        <p className="text-gray-600 mt-1">Thống kê và báo cáo điểm danh sinh viên theo hoạt động, tháng và quý</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex gap-0 min-w-max">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors
                  ${isActive
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'hoat-dong' && <ActivityReportTab canExport={canExport} />}
      {activeTab === 'thang'     && <MonthlyReportTab />}
      {activeTab === 'quy'       && <QuarterlyReportTab />}
    </div>
  );
};

export default AttendanceReport;
