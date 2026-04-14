import { Link } from 'react-router-dom';
import { Calendar, Eye } from 'lucide-react';
import { formatDate } from '../../../utils/dateFormat';

const PostCardFeatured = ({ post }) => {
  if (!post) return null;

  return (
    <Link
      to={`/${post.fullUrlPath}`}
      className="relative rounded-2xl overflow-hidden group cursor-pointer h-72 sm:h-80 md:h-96 block"
    >
      {/* Background image or gradient fallback */}
      {post.anhDaiDien ? (
        <img
          src={post.anhDaiDien}
          alt={post.tieuDe}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #1c6681 0%, #00b0f0 100%)' }}
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain opacity-10"
          />
        </div>
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Category badge top-left */}
      {post.chuyenMuc && (
        <div className="absolute top-0 left-0 m-3">
          <span className="inline-block bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            {post.chuyenMuc.ten}
          </span>
        </div>
      )}

      {/* Content bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
        <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight line-clamp-2 mb-1.5 group-hover:text-enews-200 transition-colors drop-shadow-sm">
          {post.tieuDe}
        </h2>

        {post.tomTat && (
          <p className="text-sm text-white/75 line-clamp-2 mb-2 leading-relaxed hidden sm:block">
            {post.tomTat}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-white/60">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(post.ngayXuatBan)}
          </span>
          {post.luotXem != null && (
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {post.luotXem} lượt xem
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default PostCardFeatured;
