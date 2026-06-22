import { Link } from 'react-router-dom';
import { Calendar, Eye } from 'lucide-react';
import { formatDate } from '../../../utils/dateFormat';

const PostCardFeatured = ({ post }) => {
  if (!post) return null;

  return (
    <div className="group">
      {/* Title above image */}
      <Link to={`/${post.fullUrlPath}`}>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug line-clamp-2 mb-2 group-hover:text-blue-800 transition-colors">
          {post.tieuDe}
        </h2>
      </Link>

      {post.tomTat && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
          {post.tomTat}
        </p>
      )}

      {/* Big image below */}
      <Link to={`/${post.fullUrlPath}`} className="relative block aspect-[16/10] overflow-hidden bg-gray-100">
        {post.anhDaiDien ? (
          <img
            src={post.anhDaiDien}
            alt={post.tieuDe}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1a3868 0%, #2563eb 100%)' }}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
              alt=""
              className="w-24 h-24 opacity-20 object-contain"
            />
          </div>
        )}
        {/* Badge */}
        <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-3 py-1 shadow">
          {post.chuyenMuc?.ten || 'Tin nổi bật'}
        </span>
      </Link>

      <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(post.ngayXuatBan)}
        </span>
        {post.luotXem != null && (
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {post.luotXem} lượt xem
          </span>
        )}
      </div>
    </div>
  );
};

export default PostCardFeatured;
