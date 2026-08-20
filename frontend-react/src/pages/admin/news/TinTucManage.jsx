import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Eye, Archive, Send, RotateCcw, Pin, Bell, MessageSquare } from 'lucide-react';
import useAuthStore from '../../../stores/authStore';
import { PERMISSIONS } from '../../../utils/constants';
import newsService from '../../../services/newsService';
import Table from '../../../components/common/Table';
import Button from '../../../components/common/Button';
import SearchInput from '../../../components/common/SearchInput';
import Select from '../../../components/common/Select';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import CommentModerationModal from '../../../components/news/admin/CommentModerationModal';

const TRANG_THAI_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'PUBLISHED', label: 'Đã đăng' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
];

const STATUS_BADGE = {
  DRAFT:     { label: 'Nháp',      color: 'gray' },
  PUBLISHED: { label: 'Đã đăng',   color: 'green' },
  ARCHIVED:  { label: 'Lưu trữ',  color: 'red' },
};

const PAGE_SIZE = 15;

const TinTucManage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();

  const canCreate  = hasPermission(PERMISSIONS.DANG_TIN_TUC);
  const canEdit    = hasPermission(PERMISSIONS.SUA_TIN_TUC);
  const canDelete  = hasPermission(PERMISSIONS.XOA_TIN_TUC);
  const canPublish = hasPermission(PERMISSIONS.DUYET_TIN_TUC);
  const canModerateComments = hasPermission(PERMISSIONS.KIEM_DUYET_BINH_LUAN);

  const [page, setPage]       = useState(0);
  const [search, setSearch]   = useState('');
  const [keyword, setKeyword] = useState('');
  const [trangThai, setTrangThai] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [moderatingPost, setModeratingPost] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tin-tuc', page, keyword, trangThai],
    queryFn: () => newsService.getDanhSachManage({ page, size: PAGE_SIZE, keyword: keyword || undefined, trangThai: trangThai || undefined }),
    keepPreviousData: true,
    staleTime: 30 * 1000,
  });

  const items = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-tin-tuc'] });

  const publishMutation = useMutation({
    mutationFn: (id) => newsService.publish(id),
    onSuccess: () => { toast.success('Đã đăng bài viết'); invalidate(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi khi đăng bài'),
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => newsService.archive(id),
    onSuccess: () => { toast.success('Đã lưu trữ bài viết'); invalidate(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi khi lưu trữ'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => newsService.delete(id),
    onSuccess: () => { toast.success('Đã xóa bài viết'); setConfirmDelete(null); invalidate(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xóa thất bại'),
  });

  const broadcastMutation = useMutation({
    mutationFn: (row) => newsService.broadcastNotification({
      title: `📰 Tin tức mới: ${row.tieuDe}`,
      message: row.tomTat || row.tieuDe,
      type: 'TIN_TUC',
      relatedId: row.id,
    }),
    onSuccess: (count) => toast.success(`Đã gửi thông báo đến ${count} người dùng`),
    onError: (e) => toast.error(e.response?.data?.message || 'Gửi thông báo thất bại'),
  });

  const handleSearch = () => { setKeyword(search); setPage(0); };

  const openCreate = () => navigate('/admin/news/create');
  const openEdit   = (id) => navigate(`/admin/news/${id}/edit`);

  const columns = [
    {
      header: '#',
      accessor: 'id',
      width: '60px',
      render: (v) => <span className="text-xs text-gray-400">{v}</span>,
    },
    {
      header: 'Tiêu đề',
      accessor: 'tieuDe',
      render: (v, row) => (
        <div>
          <div className="font-medium text-gray-900 line-clamp-2 text-sm">{v}</div>
          <div className="text-xs text-gray-400 mt-0.5">{row.chuyenMuc?.ten || '—'}</div>
          {row.isGhim && <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 mt-0.5"><Pin className="w-3 h-3" />Ghim</span>}
        </div>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: 'trangThai',
      width: '110px',
      render: (v) => {
        const s = STATUS_BADGE[v] || { label: v, color: 'gray' };
        return <Badge variant={s.color}>{s.label}</Badge>;
      },
    },
    {
      header: 'Ngày đăng',
      accessor: 'ngayXuatBan',
      width: '110px',
      className: 'hidden sm:table-cell',
      render: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
    },
    {
      header: 'Lượt xem',
      accessor: 'luotXem',
      width: '80px',
      className: 'hidden sm:table-cell',
      render: (v) => <span className="text-sm">{v ?? 0}</span>,
    },
    {
      header: 'Thao tác',
      accessor: 'id',
      width: '180px',
      render: (id, row) => (
        <div className="flex items-center gap-1">
          {row.fullUrlPath && (
            <a href={`/${row.fullUrlPath}`} target="_blank" rel="noreferrer"
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Xem bài">
              <Eye className="w-4 h-4" />
            </a>
          )}
          {canEdit && (
            <button onClick={() => openEdit(id)}
              className="p-1.5 text-gray-400 hover:text-yellow-600 rounded" title="Sửa">
              <Edit className="w-4 h-4" />
            </button>
          )}
          {canPublish && row.trangThai === 'DRAFT' && (
            <button onClick={() => publishMutation.mutate(id)}
              className="p-1.5 text-gray-400 hover:text-green-600 rounded" title="Đăng bài">
              <Send className="w-4 h-4" />
            </button>
          )}
          {canPublish && row.trangThai === 'PUBLISHED' && (
            <button onClick={() => archiveMutation.mutate(id)}
              className="p-1.5 text-gray-400 hover:text-orange-500 rounded" title="Lưu trữ">
              <Archive className="w-4 h-4" />
            </button>
          )}
          {canPublish && row.trangThai === 'ARCHIVED' && (
            <button onClick={() => publishMutation.mutate(id)}
              className="p-1.5 text-gray-400 hover:text-green-600 rounded" title="Đăng lại">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          {canPublish && row.trangThai === 'PUBLISHED' && (
            <button
              onClick={() => broadcastMutation.mutate(row)}
              disabled={broadcastMutation.isPending}
              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded disabled:opacity-50"
              title="Gửi thông báo đến tất cả người dùng"
            >
              <Bell className="w-4 h-4" />
            </button>
          )}
          {canModerateComments && (
            <button onClick={() => setModeratingPost(row)}
              className="p-1.5 text-gray-400 hover:text-primary rounded" title="Kiểm duyệt bình luận">
              <MessageSquare className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button onClick={() => setConfirmDelete(row)}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Xóa">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý Tin tức</h1>
          <p className="text-sm text-gray-500 mt-0.5">Danh sách bài viết tin tức – Đoàn Hội KGU</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Thêm bài viết
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex-1 flex gap-2">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Tìm theo tiêu đề..."
            className="flex-1"
          />
          <Button variant="secondary" onClick={handleSearch}>Tìm</Button>
        </div>
        <Select
          value={trangThai}
          onChange={(e) => { setTrangThai(e.target.value); setPage(0); }}
          options={TRANG_THAI_OPTIONS}
          className="w-full sm:w-48"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <Table
          columns={columns}
          data={items}
          isLoading={isLoading}
          emptyMessage="Không có bài viết nào."
        />
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Trang {page + 1} / {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Trước</Button>
            <Button variant="secondary" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Sau</Button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal
          isOpen
          onClose={() => setConfirmDelete(null)}
          title="Xác nhận xóa bài viết"
          size="sm"
        >
          <p className="text-sm text-gray-600 mb-4">
            Bạn có chắc muốn xóa bài viết <strong>"{confirmDelete.tieuDe}"</strong>?
            Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Hủy</Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate(confirmDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Kiểm duyệt bình luận */}
      {moderatingPost && (
        <CommentModerationModal
          tinTucId={moderatingPost.id}
          tieuDe={moderatingPost.tieuDe}
          onClose={() => setModeratingPost(null)}
        />
      )}
    </div>
  );
};

export default TinTucManage;
