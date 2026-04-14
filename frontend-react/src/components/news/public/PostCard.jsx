import { Link } from 'react-router-dom';
import { Calendar, Eye } from 'lucide-react';
import { formatDate } from '../../../utils/dateFormat';

// Fallback logo gradient when no image
const FallbackThumb = () => (
  <div
    className="w-full h-full flex items-center justify-center"
    style={{ background: 'linear-gradient(135deg, #1c6681 0%, #00b0f0 100%)' }}
  >
    <img
      src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
      alt=""
      className="w-12 h-12 opacity-30 object-contain"
    />
  </div>
);

const PostCard = ({ post, horizontal = false, compact = false, index }) => {
  if (!post) return null;

  // ── Compact variant: numbered list (no image) ──────────────────────────────
  if (compact) {
    return (
      <Link
        to={`/${post.fullUrlPath}`}
        className="flex items-start gap-3 py-2.5 group hover:bg-gray-50 rounded-xl px-2 transition-colors"
      >
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
          {typeof index === 'number' ? index + 1 : '•'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {post.tieuDe}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(post.ngayXuatBan)}</p>
        </div>
      </Link>
    );
  }

  // ── Horizontal variant: sidebar list item ────────────────────────────────────
  if (horizontal) {
    return (
      <Link
        to={`/${post.fullUrlPath}`}
        className="flex gap-3 group hover:bg-gray-50 rounded-xl p-2 transition-colors"
      >
        <div className="relative w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          {post.anhDaiDien ? (
            <img
              src={post.anhDaiDien}
              alt={post.tieuDe}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <FallbackThumb />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {post.tieuDe}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">{formatDate(post.ngayXuatBan)}</p>
        </div>
      </Link>
    );
  }

  // ── Default vertical card ─────────────────────────────────────────────────────
  return (
    <article className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col">
      <Link to={`/${post.fullUrlPath}`} className="relative aspect-[16/9] overflow-hidden bg-gray-100 block flex-shrink-0">
        {post.anhDaiDien ? (
          <img
            src={post.anhDaiDien}
            alt={post.tieuDe}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <FallbackThumb />
        )}
        {post.chuyenMuc && (
          <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-semibold px-2 py-0.5 rounded-full z-10">
            {post.chuyenMuc.ten}
          </span>
        )}
      </Link>

      <div className="p-3 flex flex-col flex-1">
        <Link to={`/${post.fullUrlPath}`}>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-auto group-hover:text-primary transition-colors">
            {post.tieuDe}
          </h3>
        </Link>

        <div className="flex items-center gap-2.5 text-[11px] text-gray-400 mt-2 pt-2 border-t border-gray-50">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            {formatDate(post.ngayXuatBan)}
          </span>
          {post.luotXem != null && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3 flex-shrink-0" />
              {post.luotXem}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default PostCard;
