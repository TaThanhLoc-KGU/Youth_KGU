import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Send, Download, ExternalLink, FileText, Bell } from 'lucide-react';
import useAuthStore from '../../../stores/authStore';
import { PERMISSIONS } from '../../../utils/constants';
import vanBanService from '../../../services/vanBanService';
import newsService from '../../../services/newsService';
import VanBanForm from '../../../components/news/manage/VanBanForm';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import SearchInput from '../../../components/common/SearchInput';
import Select from '../../../components/common/Select';
import Modal from '../../../components/common/Modal';

const LOAI_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: 'KE_HOACH', label: 'Kế hoạch' },
  { value: 'CONG_VAN', label: 'Công văn' },
  { value: 'QUYET_DINH', label: 'Quyết định' },
  { value: 'THONG_BAO', label: 'Thông báo' },
  { value: 'BAO_CAO', label: 'Báo cáo' },
  { value: 'HUONG_DAN', label: 'Hướng dẫn' },
  { value: 'BIEN_BAN', label: 'Biên bản' },
  { value: 'TO_TRINH', label: 'Tờ trình' },
  { value: 'KHAC', label: 'Khác' },
];

const STATUS_BADGE = {
  DRAFT:     { label: 'Nháp',     color: 'gray' },
  PUBLISHED: { label: 'Đã đăng',  color: 'green' },
  ARCHIVED:  { label: 'Lưu trữ', color: 'red' },
};

const LOAI_LABEL = {
  KE_HOACH: 'Kế hoạch', CONG_VAN: 'Công văn', QUYET_DINH: 'Quyết định',
  THONG_BAO: 'Thông báo', BAO_CAO: 'Báo cáo', HUONG_DAN: 'Hướng dẫn',
  BIEN_BAN: 'Biên bản', TO_TRINH: 'Tờ trình', KHAC: 'Khác',
};

const PAGE_SIZE = 10;

const BCHVanBanManage = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();

  const canManage = hasPermission(PERMISSIONS.QUAN_LY_VAN_BAN);
  const canDelete = hasPermission(PERMISSIONS.XOA_VAN_BAN);

  const [page, setPage]     = useState(0);
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loai, setLoai]       = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [selectedId, setSelectedId]   = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['bch-van-ban', page, keyword, loai],
    queryFn: () => vanBanService.getDanhSachManage({
      page, size: PAGE_SIZE,
      keyword: keyword || undefined,
      loai: loai || undefined,
    }),
    keepPreviousData: true,
    staleTime: 30 * 1000,
  });

  const items = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['bch-van-ban'] });

  const publishMutation = useMutation({
    mutationFn: (id) => vanBanService.publish(id),
    onSuccess: () => { toast.success('Đã đăng văn bản'); invalidate(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi khi đăng'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => vanBanService.delete(id),
    onSuccess: () => { toast.success('Đã xóa văn bản'); setConfirmDelete(null); invalidate(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xóa thất bại'),
  });

  const broadcastMutation = useMutation({
    mutationFn: (vb) => newsService.broadcastNotification({
      title: `📄 Văn bản mới: ${vb.soHieu || vb.trichYeu}`,
      message: vb.trichYeu,
      type: 'VAN_BAN',
      relatedId: vb.id,
    }),
    onSuccess: (count) => toast.success(`Đã gửi thông báo đến ${count} người dùng`),
    onError: (e) => toast.error(e.response?.data?.message || 'Gửi thông báo thất bại'),
  });

  const handleDownload = async (id, soHieu) => {
    try {
      const blob = await vanBanService.taiVe(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = soHieu || `van-ban-${id}`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Không thể tải văn bản');
    }
  };

  const handleSearch = () => { setKeyword(search); setPage(0); };
  const openCreate = () => { setSelectedId(null); setModalOpen(true); };
  const openEdit   = (id) => { setSelectedId(id); setModalOpen(true); };
  const handleSaved = () => { setModalOpen(false); invalidate(); };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Văn bản – Tài liệu</h1>
          <p className="text-sm text-gray-500 mt-0.5">Đăng tải văn bản, kế hoạch, công văn</p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tải văn bản lên
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
            placeholder="Tìm theo số hiệu hoặc trích yếu..."
            className="flex-1"
          />
          <Button variant="secondary" onClick={handleSearch}>Tìm</Button>
        </div>
        <Select
          value={loai}
          onChange={(e) => { setLoai(e.target.value); setPage(0); }}
          options={LOAI_OPTIONS}
          className="sm:w-44"
        />
      </div>

      {/* Cards list */}
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-gray-200 h-20 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100 shadow-sm">
          Không có văn bản nào.
          {canManage && (
            <div className="mt-3">
              <Button onClick={openCreate}>Tải lên văn bản đầu tiên</Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((vb) => {
            const s = STATUS_BADGE[vb.trangThai] || { label: vb.trangThai, color: 'gray' };
            return (
              <div key={vb.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-start gap-3">
                {/* Icon */}
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    {vb.soHieu && (
                      <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{vb.soHieu}</span>
                    )}
                    <span className="font-medium text-gray-900 text-sm line-clamp-1 flex-1">{vb.trichYeu}</span>
                    <Badge variant={s.color}>{s.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                    <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">{LOAI_LABEL[vb.loaiVanBan] || vb.loaiVanBan}</span>
                    {vb.coQuanBanHanh && <span>{vb.coQuanBanHanh}</span>}
                    {vb.ngayBanHanh && <span>{new Date(vb.ngayBanHanh).toLocaleDateString('vi-VN')}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {vb.trangThai === 'PUBLISHED' && (
                    <>
                      <button onClick={() => handleDownload(vb.id, vb.soHieu)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Tải về">
                        <Download className="w-4 h-4" />
                      </button>
                      <a href={vanBanService.getXemUrl(vb.id)} target="_blank" rel="noreferrer"
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Xem trực tuyến">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </>
                  )}
                  {canManage && (
                    <button onClick={() => openEdit(vb.id)}
                      className="p-1.5 text-gray-400 hover:text-yellow-600 rounded" title="Sửa">
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {canManage && vb.trangThai === 'DRAFT' && (
                    <button onClick={() => publishMutation.mutate(vb.id)}
                      className="p-1.5 text-gray-400 hover:text-green-600 rounded" title="Đăng">
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                  {canManage && vb.trangThai === 'PUBLISHED' && (
                    <button
                      onClick={() => broadcastMutation.mutate(vb)}
                      disabled={broadcastMutation.isPending}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 rounded disabled:opacity-50"
                      title="Gửi thông báo đến tất cả người dùng"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => setConfirmDelete(vb)}
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

      {/* Form modal */}
      {modalOpen && (
        <VanBanForm
          vanBanId={selectedId}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal
          isOpen
          onClose={() => setConfirmDelete(null)}
          title="Xác nhận xóa văn bản"
          size="sm"
        >
          <p className="text-sm text-gray-600 mb-4">
            Bạn có chắc muốn xóa văn bản <strong>"{confirmDelete.trichYeu}"</strong>?
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

export default BCHVanBanManage;
