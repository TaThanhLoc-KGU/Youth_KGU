import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Lock, User, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import newsService from '../../../services/newsService';
import useAuthStore from '../../../stores/authStore';
import GuestInfoModal from './GuestInfoModal';

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '';

/** Danh sách bình luận + form gửi bình luận (khách cần điền họ tên/sđt/email, tài khoản thì tự lấy tên). */
const CommentSection = ({ post }) => {
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [noiDung, setNoiDung] = useState('');
  const [showGuestModal, setShowGuestModal] = useState(false);

  const commentsKey = ['binh-luan', post.id];

  const { data: page, isLoading } = useQuery({
    queryKey: commentsKey,
    queryFn: () => newsService.getBinhLuan(post.id, { page: 0, size: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: (body) => newsService.postBinhLuan(post.id, body),
    onSuccess: () => {
      setNoiDung('');
      setShowGuestModal(false);
      queryClient.invalidateQueries({ queryKey: commentsKey });
      queryClient.invalidateQueries({ queryKey: ['reactions', post.id] });
      toast.success('Đã gửi bình luận!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Gửi bình luận thất bại, thử lại sau.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!noiDung.trim()) return;
    if (!isAuthenticated) {
      setShowGuestModal(true);
      return;
    }
    createMutation.mutate({ noiDung: noiDung.trim() });
  };

  const comments = page?.content || [];

  return (
    <section id="binh-luan" className="mt-8 pt-6 border-t border-gray-100 max-w-3xl mx-auto scroll-mt-20">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
        <span className="w-1 h-5 bg-primary rounded-full flex-shrink-0" />
        Bình luận{page?.totalElements > 0 ? ` (${page.totalElements})` : ''}
      </h2>

      {post.khoaBinhLuan ? (
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-4 py-3 text-sm mb-5">
          <Lock className="w-4 h-4 flex-shrink-0" />
          Bài viết này đã bị khóa bình luận.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              {isAuthenticated && (
                <p className="text-xs text-gray-500 mb-1">
                  Bình luận với tư cách <span className="font-medium text-gray-700">{user?.hoTen || user?.username}</span>
                </p>
              )}
              <textarea
                value={noiDung}
                onChange={(e) => setNoiDung(e.target.value)}
                rows={2}
                placeholder={isAuthenticated ? 'Viết bình luận...' : 'Viết bình luận... (cần điền thông tin liên hệ khi gửi)'}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!noiDung.trim() || (createMutation.isPending && !showGuestModal)}
                  className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {createMutation.isPending && !showGuestModal
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />}
                  Gửi
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400">Đang tải bình luận...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-gray-900">{c.hoTen}</span>
                  <span className="text-xs text-gray-400">{fmtDate(c.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap break-words">{c.noiDung}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showGuestModal && (
        <GuestInfoModal
          noiDung={noiDung}
          submitting={createMutation.isPending}
          onClose={() => setShowGuestModal(false)}
          onSubmit={(body) => createMutation.mutate(body)}
        />
      )}
    </section>
  );
};

export default CommentSection;
