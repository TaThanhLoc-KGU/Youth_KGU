import { Link } from 'react-router-dom';
import { Calendar, Eye } from 'lucide-react';
import { formatDate } from '../../../utils/dateFormat';

const FallbackThumb = () => (
  <div
    className="w-full h-full flex items-center justify-center"
    style={{ background: 'linear-gradient(135deg, #c0001a 0%, #7f0000 100%)' }}
  >
    <img
      src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
      alt=""
      className="w-12 h-12 opacity-25 object-contain"
    />
  </div>
);

const PostCard = ({ post, horizontal = false, compact = false, index }) => {
  if (!post) return null;

  // ── Compact variant: numbered list ────────────────────────────────────────
  if (compact) {
    return (
      <Link
        to={`/${post.fullUrlPath}`}
        className="flex items-start gap-2 py-2.5 group border-b border-gray-100 last:border-0"
      >
        <span className="flex-shrink-0 w-5 h-5 text-white text-[10px] font-bold flex items-center justify-center mt-0.5 flex-none" style={{ backgroundColor: '#1a3868' }}>
          {typeof index === 'number' ? index + 1 : '·'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-blue-800 transition-colors">
            {post.tieuDe}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(post.ngayXuatBan)}</p>
        </div>
      </Link>
    );
  }

  // ── Horizontal variant: thumbnail + title ─────────────────────────────────
  if (horizontal) {
    return (
      <Link
        to={`/${post.fullUrlPath}`}
        className="flex gap-3 group border-b border-gray-100 last:border-0 py-3"
      >
        <div className="relative w-20 h-14 flex-shrink-0 overflow-hidden bg-gray-100">
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
          <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-blue-800 transition-colors">
            {post.tieuDe}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">{formatDate(post.ngayXuatBan)}</p>
        </div>
      </Link>
    );
  }

  // ── Default: newspaper vertical card ─────────────────────────────────────
  return (
    <article className="group">
      <Link to={`/${post.fullUrlPath}`} className="relative block aspect-[3/2] overflow-hidden bg-gray-100 mb-2">
        {post.anhDaiDien ? (
          <img
            src={post.anhDaiDien}
            alt={post.tieuDe}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <FallbackThumb />
        )}
      </Link>
      <div className="pb-3 border-b border-gray-100">
        {post.chuyenMuc && (
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">
            {post.chuyenMuc.ten}
          </span>
        )}
        <Link to={`/${post.fullUrlPath}`}>
          <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mt-0.5 group-hover:text-blue-800 transition-colors">
            {post.tieuDe}
          </h3>
        </Link>
        <div className="flex items-center gap-2.5 text-[11px] text-gray-400 mt-1.5">
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
