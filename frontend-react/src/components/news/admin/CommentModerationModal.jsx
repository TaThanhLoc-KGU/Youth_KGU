import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { MessageSquare, Lock, Unlock, Ban, RotateCcw, Trash2, Phone, Mail, User } from 'lucide-react';
import newsService from '../../../services/newsService';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import Badge from '../../common/Badge';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

const TRANG_THAI_BADGE = {
  HIEN: { label: 'Hiển thị', variant: 'success' },
  CHAN: { label: 'Đã chặn', variant: 'warning' },
  DA_XOA: { label: 'Đã xóa', variant: 'gray' },
};

/** Modal kiểm duyệt bình luận: khóa bình luận cả bài + chặn/bỏ chặn/xóa từng bình luận. */
const CommentModerationModal = ({ tinTucId, tieuDe, onClose }) => {
  const queryClient = useQueryClient();

  const { data: post } = useQuery({
    queryKey: ['admin-tin-tuc-detail', tinTucId],
    queryFn: () => newsService.getById(tinTucId),
  });

  const { data: page, isLoading } = useQuery({
    queryKey: ['admin-binh-luan', tinTucId],
    queryFn: () => newsService.getBinhLuanManage(tinTucId, { page: 0, size: 100 }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-binh-luan', tinTucId] });
    queryClient.invalidateQueries({ queryKey: ['admin-tin-tuc-detail', tinTucId] });
    queryClient.invalidateQueries({ queryKey: ['admin-tin-tuc'] });
  };

  const khoaMutation = useMutation({
    mutationFn: (khoa) => newsService.khoaBinhLuan(tinTucId, khoa),
    onSuccess: (_, khoa) => { toast.success(khoa ? 'Đã khóa bình luận' : 'Đã mở khóa bình luận'); invalidate(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Thao tác thất bại'),
  });

  const chanMutation = useMutation({
    mutationFn: (id) => newsService.chanBinhLuan(id),
    onSuccess: () => { toast.success('Đã chặn bình luận'); invalidate(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Thao tác thất bại'),
  });

  const boChanMutation = useMutation({
    mutationFn: (id) => newsService.boChanBinhLuan(id),
    onSuccess: () => { toast.success('Đã bỏ chặn bình luận'); invalidate(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Thao tác thất bại'),
  });

  const xoaMutation = useMutation({
    mutationFn: (id) => newsService.xoaBinhLuan(id),
    onSuccess: () => { toast.success('Đã xóa bình luận'); invalidate(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Thao tác thất bại'),
  });

  const comments = page?.content || [];
  const khoaBinhLuan = !!post?.khoaBinhLuan;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Kiểm duyệt bình luận"
      subtitle={tieuDe}
      icon={MessageSquare}
      size="lg"
    >
      <div className="mb-4 flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-700">Khóa bình luận bài viết này</p>
          <p className="text-xs text-slate-400">Khi khóa, độc giả không thể gửi bình luận mới (bình luận cũ vẫn hiển thị).</p>
        </div>
        <Button
          variant={khoaBinhLuan ? 'outline' : 'warning'}
          size="sm"
          icon={khoaBinhLuan ? Unlock : Lock}
          isLoading={khoaMutation.isPending}
          onClick={() => khoaMutation.mutate(!khoaBinhLuan)}
        >
          {khoaBinhLuan ? 'Mở khóa' : 'Khóa bình luận'}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400 text-center py-8">Đang tải bình luận...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">Bài viết chưa có bình luận nào.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const badge = TRANG_THAI_BADGE[c.trangThai] || { label: c.trangThai, variant: 'gray' };
            return (
              <li key={c.id} className="border border-slate-100 rounded-xl p-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" /> {c.hoTen}
                      </span>
                      <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
                      {!c.username && <Badge variant="gray" size="sm">Khách</Badge>}
                    </div>
                    <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap break-words">{c.noiDung}</p>
                    <div className="flex items-center gap-3 flex-wrap mt-1.5 text-xs text-slate-400">
                      <span>{fmtDate(c.createdAt)}</span>
                      {c.soDienThoai && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.soDienThoai}</span>}
                      {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>}
                      {c.ipAddress && <span>IP: {c.ipAddress}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {c.trangThai === 'HIEN' && (
                      <button
                        onClick={() => chanMutation.mutate(c.id)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                        title="Chặn bình luận"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                    {c.trangThai === 'CHAN' && (
                      <button
                        onClick={() => boChanMutation.mutate(c.id)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                        title="Bỏ chặn bình luận"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    {c.trangThai !== 'DA_XOA' && (
                      <button
                        onClick={() => xoaMutation.mutate(c.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Xóa bình luận"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
};

export default CommentModerationModal;
