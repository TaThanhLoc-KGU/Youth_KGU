import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import useAuthStore from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/constants';
import { Plus, Edit, Trash2, Eye, RefreshCw, Calendar, Users, Download, ClipboardList, Bell,
         CheckCircle2, XCircle, Clock, Building2, Mail, MessageCircle, Globe, EyeOff } from 'lucide-react';
import activityService from '../../services/activityService';
import hoatDongService from '../../services/hoatDongService';
import newsService from '../../services/newsService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import ActivityCard from '../../components/activity/ActivityCard';
import ActivityDetail from '../../components/admin/ActivityDetail';
import { formatDate } from '../../utils/dateFormat';
import { useNavigate } from 'react-router-dom';
import {
  LOAI_HOAT_DONG_OPTIONS,
  CAP_DO_OPTIONS,
  TRANG_THAI_OPTIONS,
  getLoaiHoatDongLabel,
  getTrangThaiLabel,
  getTrangThaiBadgeVariant,
  getHocKyLabel,
} from '../../constants/activityConstants';
import { findTieuChi } from '../../constants/renLuyenCriteria';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const Activities = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission, maKhoa } = useAuthStore();
  const isKhoaScoped = !!maKhoa;
  const canView    = hasPermission(PERMISSIONS.XEM_HOAT_DONG);
  const canCreate  = hasPermission(PERMISSIONS.TAO_HOAT_DONG);
  const canEdit    = hasPermission(PERMISSIONS.SUA_HOAT_DONG);
  const canDelete  = hasPermission(PERMISSIONS.XOA_HOAT_DONG);
  const canApprove       = hasPermission(PERMISSIONS.DUYET_HOAT_DONG);
  const canApproveClb    = hasPermission(PERMISSIONS.DUYET_HOAT_DONG_CLB);
  const canApproveAny    = canApprove || canApproveClb;
  const [showApprovalPanel, setShowApprovalPanel] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason]   = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Tính toán HK/Năm học mặc định theo logic riêng của hệ thống
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const year = now.getFullYear();
  
  let defaultSemester;
  if (month >= 8 && month <= 11) {
    defaultSemester = 1;
  } else if (month === 12 || month === 1 || month === 2 || (month === 3 && day < 15)) {
    defaultSemester = 2;
  } else {
    defaultSemester = 3;
  }

  const startYear = month >= 8 ? year : year - 1;
  const defaultAcademicYear = `NH${startYear}-${startYear + 1}`;

  const [semesterFilter, setSemesterFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

  const [confirmState, setConfirmState] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Lấy thông tin năm học từ hệ thống để đổ vào dropdown
  const { data: academicInfo } = useQuery({
    queryKey: ['academic-info-list'],
    queryFn: () => activityService.getCurrentAcademicInfo(),
    staleTime: 30 * 60 * 1000,
  });

  // Fetch hoạt động chờ duyệt (CLB/Khoa tạo)
  const { data: pendingActivities = [], refetch: refetchPending } = useQuery({
    queryKey: ['activities-cho-duyet'],
    queryFn: () => hoatDongService.getChouDuyet(),
    enabled: canApproveAny,
    refetchInterval: 30000,
  });

  // onError không gọi toast.error() ở đây — interceptor chung trong services/api.js đã tự hiện toast
  // cho mọi request lỗi rồi, gọi thêm ở đây sẽ hiện trùng 2 toast cho cùng 1 lỗi.
  const duyetMutation = useMutation({
    mutationFn: ({ ma, trangThaiMoi }) => hoatDongService.duyet(ma, trangThaiMoi),
    onSuccess: () => {
      toast.success('Đã phê duyệt hoạt động');
      queryClient.invalidateQueries(['activities-cho-duyet']);
      queryClient.invalidateQueries(['activities']);
    },
  });

  const tuChoiMutation = useMutation({
    mutationFn: ({ ma, lyDo }) => hoatDongService.tuChoi(ma, lyDo),
    onSuccess: () => {
      toast.success('Đã từ chối hoạt động');
      queryClient.invalidateQueries(['activities-cho-duyet']);
      queryClient.invalidateQueries(['activities']);
      setRejectTarget(null);
      setRejectReason('');
    },
  });

  // Fetch activities with pagination
  const { data: activitiesData, isLoading, refetch } = useQuery({
    queryKey: ['activities', page, size, search, statusFilter],
    queryFn: () => activityService.getAllWithPagination({ page, size }),
    keepPreviousData: true,
    enabled: canView,
  });

  // Client-side filter + sort theo ngày tạo mới nhất
  const displayActivities = (activitiesData?.content || [])
    .filter(act => {
      const matchesSemester = !semesterFilter || semesterFilter === 'all' || String(act.soHocKy) === semesterFilter;
      const matchesYear = !yearFilter || yearFilter === 'all' || act.maNamHoc === yearFilter;
      const matchesStatus = statusFilter === 'all' || act.trangThai === statusFilter;
      const matchesSearch = !search || act.tenHoatDong.toLowerCase().includes(search.toLowerCase()) || act.maHoatDong.toLowerCase().includes(search.toLowerCase());
      return matchesSemester && matchesYear && matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const db = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return db - da;
    });

  // Phân nhóm: Đoàn trường (maKhoa = null) vs Đoàn Khoa
  const doanTruongList = displayActivities.filter(a => !a.maKhoa);
  const doanKhoaList = displayActivities.filter(a => !!a.maKhoa);
  const doanKhoaGroups = doanKhoaList.reduce((acc, a) => {
    const key = a.tenKhoa || a.maKhoa || 'Khoa khác';
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});
  const hasSections = doanTruongList.length > 0 || doanKhoaList.length > 0;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (maHoatDong) => activityService.delete(maHoatDong),
    onSuccess: () => {
      toast.success('Xóa hoạt động thành công!');
      queryClient.invalidateQueries(['activities']);
    },
  });

  // Broadcast notification mutation — chỉ gửi khi bấm nút này (không tự động khi Duyệt/Công khai)
  const broadcastMutation = useMutation({
    mutationFn: (row) => newsService.broadcastNotification({
      title: `🎯 Hoạt động mới: ${row.tenHoatDong}`,
      message: `Hoạt động "${row.tenHoatDong}" sẽ diễn ra vào ${row.ngayToChuc ? new Date(row.ngayToChuc).toLocaleDateString('vi-VN') : ''}. Đăng ký ngay!`,
      type: 'HOAT_DONG',
      relatedId: row.maHoatDong,
    }),
    onSuccess: (count) => toast.success(`Đang gửi thông báo đến ${count} người dùng`),
  });

  const [emailingId, setEmailingId] = useState(null);
  const [emailConfirmRow, setEmailConfirmRow] = useState(null);
  const [zaloConfirmRow, setZaloConfirmRow] = useState(null);
  const [zaloingId, setZaloingId] = useState(null);

  const guiZaloMutation = useMutation({
    mutationFn: (row) => {
      setZaloingId(row.maHoatDong);
      return hoatDongService.guiZaloThongBao(row.maHoatDong);
    },
    onSuccess: (data, row) => {
      const soCoZalo = data?.data?.soCoZalo ?? 0;
      const soSV = data?.data?.soSinhVien ?? 0;
      toast.success(`Đang gửi Zalo đến ${soCoZalo}/${soSV} sinh viên đã liên kết cho "${row.tenHoatDong}"`);
      setZaloingId(null);
    },
    onError: () => {
      // Toast lỗi đã được interceptor chung (services/api.js) hiện rồi — ở đây chỉ cần dọn state loading.
      setZaloingId(null);
    },
  });

  const [congKhaiConfirmRow, setCongKhaiConfirmRow] = useState(null);

  const congKhaiMutation = useMutation({
    mutationFn: (row) => hoatDongService.congKhai(row.maHoatDong),
    onSuccess: (_, row) => {
      toast.success(`Đã công khai hoạt động "${row.tenHoatDong}" — sinh viên có thể xem và đăng ký`);
      queryClient.invalidateQueries(['activities']);
    },
  });

  const anMutation = useMutation({
    mutationFn: (row) => hoatDongService.an(row.maHoatDong),
    onSuccess: (_, row) => {
      toast.success(`Đã ẩn hoạt động "${row.tenHoatDong}"`);
      queryClient.invalidateQueries(['activities']);
    },
  });

  const guiEmailMutation = useMutation({
    mutationFn: (row) => {
      setEmailingId(row.maHoatDong);
      return hoatDongService.guiEmailThongBao(row.maHoatDong);
    },
    onSuccess: (data, row) => {
      const so = data?.data?.soSinhVien ?? '?';
      toast.success(`Đang gửi email đến ${so} sinh viên cho hoạt động "${row.tenHoatDong}"`);
      setEmailingId(null);
    },
    onError: () => {
      // Toast lỗi đã được interceptor chung (services/api.js) hiện rồi — ở đây chỉ cần dọn state loading.
      setEmailingId(null);
    },
  });

  // Table columns
  const columns = [
    {
      header: 'Mã hoạt động',
      accessor: 'maHoatDong',
      width: '120px',
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      header: 'Tên hoạt động',
      accessor: 'tenHoatDong',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{getLoaiHoatDongLabel(row.loaiHoatDong)}</div>
        </div>
      ),
    },
    {
      header: 'Ngày tổ chức',
      accessor: 'ngayToChuc',
      width: '120px',
      render: (value) => formatDate(value),
    },
    {
      header: 'Học kỳ – Năm học',
      accessor: 'soHocKy',
      width: '160px',
      render: (value, row) => (
        <div className="text-xs">
          {value ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-200">
              HK{value}
            </span>
          ) : (
            <span className="text-gray-400">–</span>
          )}
          {row.tenNamHoc && (
            <div className="text-gray-500 mt-0.5 truncate max-w-[140px]">{row.tenNamHoc}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Địa điểm',
      accessor: 'diaDiem',
      render: (value) => value || '-',
    },
    {
      header: 'Cấp độ',
      accessor: 'capDo',
      width: '100px',
      render: (value) => (
        <span className="text-xs">{value}</span>
      ),
    },
    {
      header: 'Điểm RL',
      accessor: 'diemRenLuyen',
      width: '110px',
      render: (value, row) => (
        <div className="text-xs">
          {value != null ? (
            <>
              <span className="font-semibold text-indigo-700 text-sm">{value}đ</span>
              {row.maTieuChiRenLuyen && (
                <div className="text-gray-500 mt-0.5">
                  TC {row.maTieuChiRenLuyen}
                  {row.diemToiDaTieuChi && (
                    <span className="text-gray-400">/{row.diemToiDaTieuChi}</span>
                  )}
                </div>
              )}
            </>
          ) : (
            <span className="text-gray-400">–</span>
          )}
        </div>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: 'trangThai',
      width: '160px',
      render: (value, row) => {
        const isPublic = row.congKhai !== false;
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge variant={getTrangThaiBadgeVariant(value)}>
              {getTrangThaiLabel(value)}
            </Badge>
            {value !== 'CHO_DUYET' && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                isPublic ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}>
                {isPublic ? <Globe className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                {isPublic ? 'Công khai' : 'Đang ẩn'}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Thao tác',
      accessor: 'actions',
      width: '210px',
      render: (_, row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Nút Duyệt / Từ chối — chỉ hiện khi CHO_DUYET và có quyền */}
          {canApproveAny && row.trangThai === 'CHO_DUYET' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); duyetMutation.mutate({ ma: row.maHoatDong, trangThaiMoi: 'DANG_MO_DANG_KY' }); }}
                disabled={duyetMutation.isPending}
                title="Duyệt hoạt động"
                className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3 h-3" /> Duyệt
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setRejectTarget(row); }}
                title="Từ chối hoạt động"
                className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
              >
                <XCircle className="w-3 h-3" /> Từ chối
              </button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            icon={Eye}
            onClick={(e) => { e.stopPropagation(); handleView(row); }}
            title="Xem chi tiết"
          />
          {(canEdit || canApprove) && (() => {
            const isDoanTruongActivity = isKhoaScoped && !row.maKhoa;
            return (
              <Button
                size="sm"
                variant="ghost"
                icon={ClipboardList}
                onClick={(e) => { e.stopPropagation(); navigate(`/admin/activities/attendance?ma=${encodeURIComponent(row.maHoatDong)}`); }}
                title={isDoanTruongActivity ? 'Đoàn khoa không có quyền xem điểm danh hoạt động đoàn trường' : 'Danh sách điểm danh'}
                className={isDoanTruongActivity ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:text-blue-700'}
                disabled={isDoanTruongActivity}
              />
            );
          })()}
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              icon={Edit}
              onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
              title="Sửa"
            />
          )}
          {canEdit && row.trangThai !== 'CHO_DUYET' && (
            row.congKhai === false ? (
              <Button
                size="sm"
                variant="ghost"
                icon={Globe}
                onClick={(e) => { e.stopPropagation(); setCongKhaiConfirmRow(row); }}
                title="Công khai — hiển thị cho sinh viên xem/đăng ký"
                disabled={congKhaiMutation.isPending}
                className="text-green-600 hover:text-green-700"
              />
            ) : (
              <Button
                size="sm"
                variant="ghost"
                icon={EyeOff}
                onClick={(e) => { e.stopPropagation(); anMutation.mutate(row); }}
                title="Ẩn khỏi danh sách công khai"
                disabled={anMutation.isPending}
                className="text-gray-500 hover:text-gray-700"
              />
            )
          )}
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              icon={Bell}
              onClick={(e) => { e.stopPropagation(); broadcastMutation.mutate(row); }}
              title="Gửi thông báo đến tất cả người dùng"
              disabled={broadcastMutation.isPending}
              className="text-indigo-500 hover:text-indigo-700"
            />
          )}
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              icon={Mail}
              onClick={(e) => { e.stopPropagation(); setEmailConfirmRow(row); }}
              title="Gửi email thông báo hoạt động"
              disabled={emailingId === row.maHoatDong}
              className="text-green-600 hover:text-green-700"
            />
          )}
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              icon={MessageCircle}
              onClick={(e) => { e.stopPropagation(); setZaloConfirmRow(row); }}
              title="Gửi Zalo thông báo hoạt động"
              disabled={zaloingId === row.maHoatDong}
              className="text-blue-500 hover:text-blue-700"
            />
          )}
          {canDelete && (
            <Button
              size="sm"
              variant="ghost"
              icon={Trash2}
              onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
              title="Xóa"
              className="text-red-600 hover:text-red-700"
            />
          )}
        </div>
      ),
    },
  ];

  const handleCreate = () => {
    navigate('/admin/activities/create');
  };

  const handleEdit = (activity) => {
    navigate(`/admin/activities/edit?ma=${encodeURIComponent(activity.maHoatDong)}`);
  };

  const handleView = (activity) => {
    setSelectedActivity(activity);
    setIsDetailModalOpen(true);
  };

  const handleDelete = (activity) => {
    setConfirmState({ id: activity.maHoatDong, name: activity.tenHoatDong });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý Hoạt động</h1>
          <p className="text-gray-600 mt-1">
            Quản lý các hoạt động Đoàn - Hội sinh viên
          </p>
        </div>
        <div className="flex gap-2">
          {canApproveAny && (
            <button onClick={() => setShowApprovalPanel(p => !p)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pendingActivities.length > 0
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : showApprovalPanel
                  ? 'bg-orange-100 text-orange-700 border border-orange-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}>
              <Clock className="w-4 h-4" />
              Phê duyệt CLB &amp; Khoa
              {pendingActivities.length > 0 && (
                <span className="bg-white text-orange-600 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {pendingActivities.length}
                </span>
              )}
            </button>
          )}
          {canCreate && (
            <Button icon={Plus} onClick={handleCreate}>
              <span className="hidden sm:inline">Tạo hoạt động mới</span>
            </Button>
          )}
        </div>
      </div>

      {/* Approval Panel */}
      {canApproveAny && showApprovalPanel && (() => {
        const clbPending   = pendingActivities.filter(a => !!a.maClb);
        const khoaPending  = pendingActivities.filter(a => !a.maClb && !!a.maKhoa);
        return (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-orange-800 flex items-center gap-2">
                <Clock className="w-5 h-5" /> Hoạt động chờ phê duyệt ({pendingActivities.length})
              </h3>
              <button onClick={() => setShowApprovalPanel(false)} className="text-orange-500 hover:text-orange-700 text-xs">Đóng</button>
            </div>

            {pendingActivities.length === 0 ? (
              <p className="text-orange-600 text-sm">Không có hoạt động nào chờ duyệt</p>
            ) : (
              <>
                {/* ── Hoạt động CLB ── */}
                {clbPending.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                        CLB / Ban / Đội ({clbPending.length})
                      </span>
                    </div>
                    {clbPending.map(a => (
                      <div key={a.maHoatDong} className="bg-white border border-blue-100 rounded-lg p-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{a.tenHoatDong}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {a.ngayToChuc}{a.diaDiem ? ` · ${a.diaDiem}` : ''}
                            {a.tenClb && <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-medium">CLB: {a.tenClb}</span>}
                          </p>
                          {a.capDo && <p className="text-xs text-gray-400 mt-0.5">Cấp độ: {a.capDo}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => duyetMutation.mutate({ ma: a.maHoatDong, trangThaiMoi: 'DANG_MO_DANG_KY' })}
                            disabled={duyetMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt
                          </button>
                          <button
                            onClick={() => setRejectTarget(a)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200">
                            <XCircle className="w-3.5 h-3.5" /> Từ chối
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Hoạt động Khoa ── */}
                {khoaPending.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                        Đoàn Khoa ({khoaPending.length})
                      </span>
                    </div>
                    {khoaPending.map(a => (
                      <div key={a.maHoatDong} className="bg-white border border-purple-100 rounded-lg p-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{a.tenHoatDong}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {a.ngayToChuc}{a.diaDiem ? ` · ${a.diaDiem}` : ''}
                            {a.tenKhoa && <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-medium">Khoa: {a.tenKhoa}</span>}
                          </p>
                          {a.capDo && <p className="text-xs text-gray-400 mt-0.5">Cấp độ: {a.capDo}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => duyetMutation.mutate({ ma: a.maHoatDong, trangThaiMoi: 'DANG_MO_DANG_KY' })}
                            disabled={duyetMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt
                          </button>
                          <button
                            onClick={() => setRejectTarget(a)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200">
                            <XCircle className="w-3.5 h-3.5" /> Từ chối
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-2">Từ chối hoạt động</h3>
            <p className="text-sm text-gray-600 mb-4">{rejectTarget.tenHoatDong}</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              rows={3} placeholder="Lý do từ chối (không bắt buộc)..."
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50">Hủy</button>
              <button
                onClick={() => tuChoiMutation.mutate({ ma: rejectTarget.maHoatDong, lyDo: rejectReason })}
                disabled={tuChoiMutation.isPending}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {tuChoiMutation.isPending ? 'Đang xử lý…' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SearchInput
              placeholder="Tìm kiếm hoạt động..."
              value={search}
              onChange={setSearch}
              className="md:col-span-2"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              {TRANG_THAI_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setSemesterFilter('all');
                setYearFilter('all');
                refetch();
              }}
            >
              Làm mới
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-gray-100">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Học kỳ</label>
              <Select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
              >
                <option value="all">Tất cả học kỳ</option>
                <option value="1">Học kỳ 1</option>
                <option value="2">Học kỳ 2</option>
                <option value="3">Học kỳ 3</option>
              </Select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Năm học</label>
              <Select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="all">Tất cả năm học</option>
                {academicInfo?.danhSachNamHoc?.map(nh => (
                  <option key={nh.maNamHoc} value={nh.maNamHoc}>{nh.tenNamHoc}</option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-2 flex items-end">
              <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 w-full">
                <strong>Ghi chú:</strong> Đang hiển thị các hoạt động thuộc <strong>HK{semesterFilter === 'all' ? 'tất cả' : semesterFilter}</strong> năm học <strong>{yearFilter === 'all' ? 'tất cả' : (academicInfo?.danhSachNamHoc?.find(n => n.maNamHoc === yearFilter)?.tenNamHoc || yearFilter)}</strong>.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Table — chia theo Đoàn trường / Đoàn Khoa */}
      {isLoading ? (
        <Card>
          <div className="overflow-x-auto">
            <Table columns={columns} data={[]} loading={true} />
          </div>
        </Card>
      ) : hasSections ? (
        <>
          {/* Đoàn trường */}
          {doanTruongList.length > 0 && (
            <Card>
              <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                <div className="w-1 h-5 bg-blue-500 rounded-full flex-shrink-0" />
                <h3 className="font-semibold text-blue-700 text-sm uppercase tracking-wide">
                  Đoàn trường
                </h3>
                <span className="text-[11px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                  {doanTruongList.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table columns={columns} data={doanTruongList} loading={false} />
              </div>
            </Card>
          )}

          {/* Đoàn Khoa groups */}
          {Object.entries(doanKhoaGroups).map(([tenKhoa, list]) => (
            <Card key={tenKhoa}>
              <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                <div className="w-1 h-5 bg-emerald-500 rounded-full flex-shrink-0" />
                <h3 className="font-semibold text-emerald-700 text-sm uppercase tracking-wide">
                  Đoàn {tenKhoa}
                </h3>
                <span className="text-[11px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-semibold">
                  {list.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table columns={columns} data={list} loading={false} />
              </div>
            </Card>
          ))}
        </>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table columns={columns} data={[]} loading={false} />
          </div>
        </Card>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Chi tiết hoạt động"
        size="xl"
      >
        <ActivityDetail
          activity={selectedActivity}
          onEdit={() => {
            setIsDetailModalOpen(false);
            handleEdit(selectedActivity);
          }}
          onClose={() => setIsDetailModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={() => { deleteMutation.mutate(confirmState?.id); setConfirmState(null); }}
        title="Xóa hoạt động"
        description={`Bạn có chắc muốn xóa hoạt động "${confirmState?.name}"? Hành động này không thể hoàn tác.`}
        isLoading={deleteMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!emailConfirmRow}
        onClose={() => setEmailConfirmRow(null)}
        onConfirm={() => { guiEmailMutation.mutate(emailConfirmRow); setEmailConfirmRow(null); }}
        title="Xác nhận gửi email hàng loạt"
        description={`Bạn sắp gửi email thông báo hoạt động "${emailConfirmRow?.tenHoatDong}" đến TẤT CẢ sinh viên đang hoạt động. Bạn có chắc chắn không?`}
        confirmLabel="Gửi email"
        isLoading={guiEmailMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!congKhaiConfirmRow}
        onClose={() => setCongKhaiConfirmRow(null)}
        onConfirm={() => { congKhaiMutation.mutate(congKhaiConfirmRow); setCongKhaiConfirmRow(null); }}
        title="Công khai hoạt động"
        description={`Hoạt động "${congKhaiConfirmRow?.tenHoatDong}" sẽ hiển thị cho sinh viên xem và đăng ký, hệ thống sẽ tự tạo tin tức giới thiệu. Việc gửi email/thông báo tới sinh viên KHÔNG tự động — dùng riêng nút Gửi thông báo / Gửi email khi bạn muốn.`}
        confirmLabel="Công khai"
        variant="primary"
        isLoading={congKhaiMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!zaloConfirmRow}
        onClose={() => setZaloConfirmRow(null)}
        onConfirm={() => { guiZaloMutation.mutate(zaloConfirmRow); setZaloConfirmRow(null); }}
        title="Xác nhận gửi thông báo Zalo"
        description={`Bạn sắp gửi thông báo Zalo cho hoạt động "${zaloConfirmRow?.tenHoatDong}" đến tất cả sinh viên đã liên kết Zalo OA. Bạn có chắc chắn không?`}
        confirmLabel="Gửi Zalo"
        isLoading={guiZaloMutation.isPending}
      />
    </div>
  );
};

export default Activities;
