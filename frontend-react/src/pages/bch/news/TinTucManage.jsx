import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Eye, Send, Archive, RotateCcw } from 'lucide-react';
import useAuthStore from '../../../stores/authStore';
import { PERMISSIONS } from '../../../utils/constants';
import newsService from '../../../services/newsService';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import SearchInput from '../../../components/common/SearchInput';
import Select from '../../../components/common/Select';

const STATUS_BADGE = {
  DRAFT:     { label: 'Nháp',     color: 'gray' },
  PUBLISHED: { label: 'Đã đăng',  color: 'green' },
  ARCHIVED:  { label: 'Lưu trữ', color: 'red' },
};

const TRANG_THAI_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'PUBLISHED', label: 'Đã đăng' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
];

const PAGE_SIZE = 10;

const BCHTinTucManage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();

  const canCreate  = hasPermission(PERMISSIONS.DANG_TIN_TUC);
  const canEdit    = hasPermission(PERMISSIONS.SUA_TIN_TUC);
  const canDelete  = hasPermission(PERMISSIONS.XOA_TIN_TUC);
  const canPublish = hasPermission(PERMISSIONS.DUYET_TIN_TUC) || hasPermission(PERMISSIONS.DANG_TIN_TUC);

  const [page, setPage]           = useState(0);
  const [search, setSearch]       = useState('');
  const [keyword, setKeyword]     = useState('');
  const [trangThai, setTrangThai] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['bch-tin-tuc', page, keyword, trangThai],
    queryFn: () => newsService.getDanhSachManage({
      page, size: PAGE_SIZE,
      keyword: keyword || undefined,
      trangThai: trangThai || undefined,
    }),
    keepPreviousData: true,
    staleTime: 30 * 1000,
  });

  const posts = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['bch-tin-tuc'] });

  const publishMutation = useMutation({
    mutationFn: (id) => newsService.publish(id),
    onSuccess: () => { toast.success('Đã đăng bài'); invalidate(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi khi đăng bài'),
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => newsService.archive(id),
    onSuccess: () => { toast.success('Đã lưu trữ'); invalidate(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi khi lưu trữ'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => newsService.delete(id),
    onSuccess: () => { toast.success('Đã xóa bài viết'); setConfirmDelete(null); invalidate(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xóa thất bại'),
  });

  const handleSearch = () => { setKeyword(search); setPage(0); };
  const openCreate = () => navigate('/bch/news/create');
  const openEdit   = (id) => navigate(`/bch/news/${id}/edit`);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Đăng bài viết</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý tin tức do đơn vị đăng tải</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Viết bài mới
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
          className="sm:w-44"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-gray-200 h-16 rounded-xl" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100 shadow-sm">
          Không có bài viết nào.
          {canCreate && (
            <div className="mt-3">
              <Button onClick={openCreate}>Viết bài đầu tiên</Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => {
            const s = STATUS_BADGE[post.trangThai] || { label: post.trangThai, color: 'gray' };
            return (
              <div key={post.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-start gap-3">
                {/* Thumbnail */}
                {post.anhDaiDien ? (
                  <img src={post.anhDaiDien} alt={post.tieuDe}
                    className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-16 h-12 bg-gray-100 rounded-lg flex-shrink-0" />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm line-clamp-1 flex-1">{post.tieuDe}</span>
                    <Badge variant={s.color}>{s.label}</Badge>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {post.chuyenMuc?.ten || '—'}
                    {post.ngayXuatBan && ` · ${new Date(post.ngayXuatBan).toLocaleDateString('vi-VN')}`}
                    {post.luotXem != null && ` · ${post.luotXem} lượt xem`}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {post.fullUrlPath && (
                    <a href={`/${post.fullUrlPath}`} target="_blank" rel="noreferrer"
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Xem bài">
                      <Eye className="w-4 h-4" />
                    </a>
                  )}
                  {canEdit && (
                    <button onClick={() => openEdit(post.id)}
                      className="p-1.5 text-gray-400 hover:text-yellow-600 rounded" title="Sửa">
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {canPublish && post.trangThai === 'DRAFT' && (
                    <button onClick={() => publishMutation.mutate(post.id)}
                      className="p-1.5 text-gray-400 hover:text-green-600 rounded" title="Đăng bài">
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                  {canPublish && post.trangThai === 'PUBLISHED' && (
                    <button onClick={() => archiveMutation.mutate(post.id)}
                      className="p-1.5 text-gray-400 hover:text-orange-500 rounded" title="Lưu trữ">
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                  {canPublish && post.trangThai === 'ARCHIVED' && (
                    <button onClick={() => publishMutation.mutate(post.id)}
                      className="p-1.5 text-gray-400 hover:text-green-600 rounded" title="Đăng lại">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => setConfirmDelete(post)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Xóa">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
};

export default BCHTinTucManage;
