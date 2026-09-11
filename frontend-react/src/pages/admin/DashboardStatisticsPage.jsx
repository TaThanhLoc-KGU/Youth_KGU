import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Calendar, CheckCircle, TrendingUp, Users, RefreshCcw, Award,
  ClipboardList, Clock, LogOut, Layers, ShieldCheck, Building2,
} from 'lucide-react';
import thongKeService from '../../services/thongKeService';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6', '#6366f1', '#ec4899', '#84cc16'];
const TOOLTIP_STYLE = { borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: 12 };

const TABS = [
  { key: 'hoatDong', label: 'Hoạt động', icon: Calendar },
  { key: 'diemDanh', label: 'Điểm danh & Tham gia', icon: ClipboardList },
  { key: 'diemRenLuyen', label: 'Điểm rèn luyện', icon: Award },
  { key: 'clbTaiKhoan', label: 'CLB & Tài khoản', icon: Layers },
];

export default function DashboardStatisticsPage() {
  const [tab, setTab] = useState('hoatDong');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['thong-ke-tong-hop'],
    queryFn: thongKeService.getTongHop,
    staleTime: 60_000,
  });

  if (isLoading) return <Loading />;

  const scope = data?.scope || {};

  return (
    <div className="p-4 sm:p-6 space-y-5 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Thống kê &amp; Báo cáo</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Phạm vi:{' '}
            <span className="font-semibold text-slate-700">{scope.phamVi || 'Toàn trường'}</span>
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm text-slate-600"
        >
          <RefreshCcw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-t-lg -mb-px border-b-2 transition-colors ${
                active
                  ? 'border-primary text-primary bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'hoatDong' && <HoatDongTab d={data?.hoatDong} toanHeThong={scope.toanHeThong} />}
      {tab === 'diemDanh' && <DiemDanhTab d={data?.diemDanh} />}
      {tab === 'diemRenLuyen' && <DiemRenLuyenTab d={data?.diemRenLuyen} />}
      {tab === 'clbTaiKhoan' && <ClbTaiKhoanTab d={data?.clbTaiKhoan} />}
    </div>
  );
}

/* ─────────────────────────── Cụm 1 — Hoạt động ─────────────────────────── */
function HoatDongTab({ d, toanHeThong }) {
  if (!d) return <Empty />;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Tổng hoạt động" value={d.tong} icon={<Calendar className="w-5 h-5 text-blue-600" />} bg="bg-blue-50" />
        <StatCard title="Đang diễn ra" value={d.dangDienRa} icon={<TrendingUp className="w-5 h-5 text-emerald-600" />} bg="bg-emerald-50" />
        <StatCard title="Đã hoàn thành" value={d.hoanThanh} icon={<CheckCircle className="w-5 h-5 text-violet-600" />} bg="bg-violet-50" />
        <StatCard title="Tỉ lệ hoàn thành" value={`${d.tyLeHoanThanh ?? 0}%`} icon={<Award className="w-5 h-5 text-amber-600" />} bg="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Số hoạt động theo tháng (12 tháng)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={d.theoThang || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="thang" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="soHoatDong" name="Số hoạt động" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Phân bố theo trạng thái">
          <NamedPie data={d.theoTrangThai} />
        </ChartCard>

        <ChartCard title="Phân bố theo loại hình">
          <NamedBar data={d.theoLoai} color="#22c55e" />
        </ChartCard>

        <ChartCard title="Phân bố theo cấp độ">
          <NamedBar data={d.theoCapDo} color="#a855f7" />
        </ChartCard>

        {toanHeThong && d.theoKhoa?.length > 0 && (
          <ChartCard title="Hoạt động theo khoa" className="lg:col-span-2">
            <NamedBar data={d.theoKhoa} color="#3b82f6" vertical />
          </ChartCard>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── Cụm 2 — Điểm danh & Tham gia ─────────────────────── */
function DiemDanhTab({ d }) {
  if (!d) return <Empty />;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Tổng đăng ký" value={d.tongDangKy} icon={<ClipboardList className="w-5 h-5 text-blue-600" />} bg="bg-blue-50" />
        <StatCard title="Đã tham gia" value={d.daThamGia} icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} bg="bg-emerald-50" />
        <StatCard title="Tỉ lệ tham gia" value={`${d.tyLeThamGia ?? 0}%`} icon={<TrendingUp className="w-5 h-5 text-violet-600" />} bg="bg-violet-50" />
        <StatCard title="Vắng mặt" value={d.vangMat} icon={<Users className="w-5 h-5 text-rose-600" />} bg="bg-rose-50" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Tổng lượt điểm danh" value={d.tongLuot} icon={<ClipboardList className="w-5 h-5 text-slate-500" />} bg="bg-slate-100" />
        <StatCard title="Đi trễ" value={d.soDiTre} icon={<Clock className="w-5 h-5 text-amber-600" />} bg="bg-amber-50" />
        <StatCard title="Về sớm" value={d.soVeSom} icon={<LogOut className="w-5 h-5 text-orange-600" />} bg="bg-orange-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {d.theoKhoa?.length > 0 && (
          <ChartCard title="Điểm danh theo khoa">
            <NamedBar data={d.theoKhoa} valueKey="tongDiemDanh" color="#3b82f6" vertical />
          </ChartCard>
        )}
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">Top 10 sinh viên tích cực</h3>
          </div>
          <RankTable
            rows={d.topSinhVien}
            cols={[
              { key: 'hoTen', label: 'Sinh viên', render: (r) => <><p className="font-medium text-slate-800">{r.hoTen}</p><p className="text-xs text-slate-400">{r.maSv}</p></> },
              { key: 'soLan', label: 'Số lần', align: 'center', render: (r) => <Badge>{r.soLan} lần</Badge> },
            ]}
            empty="Chưa có dữ liệu tham gia"
          />
        </Card>
      </div>
    </div>
  );
}

/* ───────────────────────── Cụm 3 — Điểm rèn luyện ───────────────────────── */
function DiemRenLuyenTab({ d }) {
  if (!d) return <Empty />;
  const hasData = (d.tongBanGhi ?? 0) > 0;
  if (!hasData) return <Empty msg="Chưa có dữ liệu điểm rèn luyện trong phạm vi này" />;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Tổng bản ghi" value={d.tongBanGhi} icon={<Award className="w-5 h-5 text-blue-600" />} bg="bg-blue-50" />
        {d.theoTrangThai?.map((r) => (
          <StatCard key={r.ten} title={r.ten} value={r.giaTri} icon={<ShieldCheck className="w-5 h-5 text-slate-500" />} bg="bg-slate-100" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Phân bố theo xếp loại">
          <NamedPie data={d.theoXepLoai} />
        </ChartCard>
        <ChartCard title="Điểm trung bình theo học kỳ">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={d.theoHocKy || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="hocKy" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="diemTB" name="Điểm TB" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {d.theoKhoa?.length > 0 && (
          <Card className="p-0 overflow-hidden lg:col-span-2">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm">Điểm rèn luyện theo khoa</h3>
            </div>
            <RankTable
              rows={d.theoKhoa}
              cols={[
                { key: 'ten', label: 'Khoa', render: (r) => <span className="font-medium text-slate-800">{r.ten}</span> },
                { key: 'soLuong', label: 'Số bản ghi', align: 'center', render: (r) => r.soLuong },
                { key: 'diemTB', label: 'Điểm TB', align: 'center', render: (r) => <Badge>{r.diemTB}</Badge> },
              ]}
            />
          </Card>
        )}
      </div>
    </div>
  );
}

/* ──────────────────── Cụm 4 — CLB & Tài khoản / Phân quyền ──────────────────── */
function ClbTaiKhoanTab({ d }) {
  if (!d) return <Empty />;
  const { clb = {}, taiKhoan = {}, phanQuyen } = d;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="CLB / Đội / Nhóm" value={clb.tong} icon={<Building2 className="w-5 h-5 text-blue-600" />} bg="bg-blue-50" />
        <StatCard title="Tài khoản hoạt động" value={taiKhoan.tongHoatDong} icon={<Users className="w-5 h-5 text-emerald-600" />} bg="bg-emerald-50" />
        {phanQuyen && (
          <>
            <StatCard title="Tổng quyền hệ thống" value={phanQuyen.tongQuyen} icon={<ShieldCheck className="w-5 h-5 text-violet-600" />} bg="bg-violet-50" />
            <StatCard title="TK có quyền riêng" value={phanQuyen.soTaiKhoanCoQuyenRieng} icon={<ShieldCheck className="w-5 h-5 text-amber-600" />} bg="bg-amber-50" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {clb.theoLoai?.length > 0 && (
          <ChartCard title="CLB theo loại">
            <NamedPie data={clb.theoLoai} />
          </ChartCard>
        )}
        {taiKhoan.theoVaiTro?.length > 0 && (
          <ChartCard title="Tài khoản theo vai trò">
            <NamedBar data={taiKhoan.theoVaiTro} color="#6366f1" vertical />
          </ChartCard>
        )}
        {taiKhoan.theoPheDuyet?.length > 0 && (
          <ChartCard title="Tài khoản theo trạng thái phê duyệt">
            <NamedBar data={taiKhoan.theoPheDuyet} color="#f59e0b" />
          </ChartCard>
        )}
        {phanQuyen?.theoVaiTro?.length > 0 && (
          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm">Số quyền mặc định theo vai trò</h3>
            </div>
            <RankTable
              rows={phanQuyen.theoVaiTro}
              cols={[
                { key: 'ten', label: 'Vai trò', render: (r) => <span className="font-medium text-slate-800">{r.ten}</span> },
                { key: 'soQuyen', label: 'Số quyền', align: 'center', render: (r) => <Badge>{r.soQuyen}</Badge> },
              ]}
            />
          </Card>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Shared bits ─────────────────────────── */
function StatCard({ title, value, icon, bg }) {
  return (
    <Card className="p-4">
      <div className={`inline-flex p-2.5 rounded-xl ${bg}`}>{icon}</div>
      <p className="text-xs font-medium text-slate-500 mt-3">{title}</p>
      <h4 className="text-xl font-bold text-slate-900 mt-0.5">{value ?? 0}</h4>
    </Card>
  );
}

function ChartCard({ title, children, className = '' }) {
  return (
    <Card className={`p-5 ${className}`}>
      <h3 className="font-semibold text-slate-800 text-sm mb-4">{title}</h3>
      <div className="h-64">{children}</div>
    </Card>
  );
}

function NamedBar({ data = [], color = '#3b82f6', vertical = false, valueKey = 'giaTri' }) {
  if (!data?.length) return <Empty inline />;
  if (vertical) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="ten" width={130} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey={valueKey} name="Số lượng" fill={color} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="ten" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
        <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey={valueKey} name="Số lượng" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function NamedPie({ data = [] }) {
  if (!data?.length) return <Empty inline />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="giaTri" nameKey="ten" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function RankTable({ rows = [], cols, empty = 'Chưa có dữ liệu' }) {
  if (!rows?.length) return <Empty msg={empty} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            <th className="px-4 py-2.5 w-10">#</th>
            {cols.map((c) => (
              <th key={c.key} className={`px-4 py-2.5 ${c.align === 'center' ? 'text-center' : ''}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-slate-50/60">
              <td className="px-4 py-2.5">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  i === 0 ? 'bg-amber-100 text-amber-700' :
                  i === 1 ? 'bg-slate-100 text-slate-600' :
                  i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'
                }`}>{i + 1}</span>
              </td>
              {cols.map((c) => (
                <td key={c.key} className={`px-4 py-2.5 ${c.align === 'center' ? 'text-center' : ''}`}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Badge = ({ children }) => (
  <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-bold">{children}</span>
);

function Empty({ msg = 'Chưa có dữ liệu', inline = false }) {
  return (
    <div className={`flex items-center justify-center text-sm text-slate-400 ${inline ? 'h-full' : 'py-12'}`}>
      {msg}
    </div>
  );
}
