import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Share2, Link as LinkIcon, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import newsService from '../../../services/newsService';
import { getOrCreateDeviceId } from '../../../utils/deviceId';

/**
 * Thanh Thích / Bình luận / Chia sẻ dưới bài viết eNews.
 * Thích hoạt động cho cả khách (dedup theo deviceId) lẫn tài khoản đã đăng nhập.
 */
const LikeShareBar = ({ post }) => {
  const queryClient = useQueryClient();
  const deviceId = getOrCreateDeviceId();
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef(null);

  const queryKey = ['reactions', post.id];

  const { data } = useQuery({
    queryKey,
    queryFn: () => newsService.getReactions(post.id, deviceId),
    initialData: {
      luotThich: post.luotThich || 0,
      luotBinhLuan: post.luotBinhLuan || 0,
      luotChiaSe: post.luotChiaSe || 0,
      daThich: false,
      khoaBinhLuan: !!post.khoaBinhLuan,
    },
    staleTime: 30 * 1000,
  });

  const likeMutation = useMutation({
    mutationFn: () => newsService.thich(post.id, deviceId),
    onSuccess: (summary) => queryClient.setQueryData(queryKey, summary),
    onError: () => toast.error('Không thể cập nhật lượt thích, thử lại sau.'),
  });

  useEffect(() => {
    const handler = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const shareUrl = `${window.location.origin}/${post.fullUrlPath}`;

  const recordShare = async () => {
    try {
      const total = await newsService.chiaSe(post.id);
      queryClient.setQueryData(queryKey, (prev) => (prev ? { ...prev, luotChiaSe: total } : prev));
    } catch {
      /* không chặn hành động chia sẻ của người dùng nếu ghi nhận thất bại */
    }
  };

  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: post.tieuDe, url: shareUrl });
        recordShare();
      } catch {
        /* người dùng hủy hộp thoại chia sẻ — không báo lỗi */
      }
    } else {
      setShareOpen((v) => !v);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    recordShare();
    setShareOpen(false);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToComments = () => {
    document.getElementById('binh-luan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div ref={shareRef} className="relative mt-6 flex items-center gap-2 border-y border-gray-100 py-3">
      <button
        onClick={() => likeMutation.mutate()}
        disabled={likeMutation.isPending}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
          data.daThich
            ? 'bg-red-50 text-red-600 border border-red-200'
            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
        }`}
      >
        <Heart className={`w-4 h-4 ${data.daThich ? 'fill-red-500 text-red-500' : ''}`} />
        Thích{data.luotThich > 0 ? ` (${data.luotThich})` : ''}
      </button>

      <button
        onClick={scrollToComments}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        Bình luận{data.luotBinhLuan > 0 ? ` (${data.luotBinhLuan})` : ''}
      </button>

      <button
        onClick={handleShareClick}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors ml-auto"
      >
        <Share2 className="w-4 h-4" />
        Chia sẻ{data.luotChiaSe > 0 ? ` (${data.luotChiaSe})` : ''}
      </button>

      {shareOpen && (
        <div className="absolute right-0 top-full mt-2 z-20 bg-white shadow-xl border border-gray-100 rounded-xl py-1 min-w-[220px]">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <LinkIcon className="w-4 h-4 text-gray-400" />}
            {copied ? 'Đã sao chép liên kết' : 'Sao chép liên kết'}
          </button>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { recordShare(); setShareOpen(false); }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-4 h-4 text-blue-600" /> Chia sẻ lên Facebook
          </a>
          <a
            href={`https://zalo.me/share?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { recordShare(); setShareOpen(false); }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-4 h-4 text-sky-500" /> Chia sẻ lên Zalo
          </a>
        </div>
      )}
    </div>
  );
};

export default LikeShareBar;
