import { Link } from 'react-router-dom';
import { Calendar, Eye, Tag } from 'lucide-react';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const PostCard = ({ post }) => {
  if (!post) return null;
  return (
    <article className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      <Link to={`/${post.fullUrlPath}`}>
        {post.anhDaiDien ? (
          <img
            src={post.anhDaiDien}
            alt={post.tieuDe}
            className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-44 bg-gradient-to-br from-enews-100 to-enews-200 flex items-center justify-center">
            <Tag className="w-10 h-10 text-enews-300" />
          </div>
        )}
      </Link>
      <div className="p-4">
        {post.chuyenMuc && (
          <Link
            to={`/${post.chuyenMuc.fullPathSlug}`}
            className="text-xs font-semibold text-enews-600 uppercase tracking-wide hover:text-enews-700"
          >
            {post.chuyenMuc.ten}
          </Link>
        )}
        <Link to={`/${post.fullUrlPath}`}>
          <h3 className="mt-1 font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-enews-700 transition-colors">
            {post.tieuDe}
          </h3>
        </Link>
        {post.tomTat && (
          <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">{post.tomTat}</p>
        )}
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(post.ngayXuatBan)}
          </span>
          {post.luotXem != null && (
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {post.luotXem}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default PostCard;
