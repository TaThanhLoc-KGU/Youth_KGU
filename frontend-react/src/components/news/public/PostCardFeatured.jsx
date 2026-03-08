import { Link } from 'react-router-dom';
import { Calendar, Eye } from 'lucide-react';
import { formatDate } from '../../../utils/dateFormat';

const PostCardFeatured = ({ post }) => {
  if (!post) return null;
  return (
    <article className="relative rounded-2xl overflow-hidden shadow-lg group h-72 md:h-80">
      {post.anhDaiDien ? (
        <img
          src={post.anhDaiDien}
          alt={post.tieuDe}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-enews-600 to-enews-900" />
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
        {post.chuyenMuc && (
          <span className="inline-block bg-enews-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
            {post.chuyenMuc.ten}
          </span>
        )}
        <Link to={`/${post.fullUrlPath}`}>
          <h2 className="text-lg md:text-xl font-bold leading-tight line-clamp-2 hover:text-enews-200 transition-colors">
            {post.tieuDe}
          </h2>
        </Link>
        {post.tomTat && (
          <p className="mt-1 text-sm text-gray-300 line-clamp-2">{post.tomTat}</p>
        )}
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(post.ngayXuatBan)}
          </span>
          {post.luotXem != null && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {post.luotXem} lượt xem
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default PostCardFeatured;
