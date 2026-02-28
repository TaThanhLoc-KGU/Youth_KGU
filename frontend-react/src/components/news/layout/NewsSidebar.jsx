import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, TrendingUp, Folder } from 'lucide-react';
import newsService from '../../../services/newsService';

const NewsSidebar = () => {
  // Bài viết nổi bật (featured — ghim lên đầu)
  const { data: featuredData } = useQuery({
    queryKey: ['news-featured-sidebar'],
    queryFn: () => newsService.getDanhSach({ size: 5, page: 0 }),
    staleTime: 5 * 60 * 1000,
  });

  // Cây danh mục
  const { data: tree = [] } = useQuery({
    queryKey: ['chuyen-muc-tree'],
    queryFn: () => newsService.getCayDanhMuc(),
    staleTime: 30 * 60 * 1000,
  });

  const featured = featuredData?.content || [];

  return (
    <aside className="space-y-6">
      {/* Bài viết nổi bật */}
      {featured.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-enews-50">
            <TrendingUp className="w-4 h-4 text-enews-500" />
            <h3 className="font-semibold text-sm text-gray-800">Tin nổi bật</h3>
          </div>
          <ul className="divide-y divide-gray-50">
            {featured.map((post) => (
              <li key={post.id}>
                <Link
                  to={`/${post.fullUrlPath}`}
                  className="flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  {post.anhDaiDien && (
                    <img
                      src={post.anhDaiDien}
                      alt={post.tieuDe}
                      className="w-16 h-12 object-cover rounded-md flex-shrink-0"
                    />
                  )}
                  <p className="text-sm text-gray-700 line-clamp-2 leading-snug">{post.tieuDe}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Danh mục */}
      {tree.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-blue-50">
            <Folder className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-sm text-gray-800">Danh mục</h3>
          </div>
          <ul className="divide-y divide-gray-50">
            {tree.map((cat) => (
              <li key={cat.id}>
                <Link
                  to={`/${cat.fullPathSlug}`}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-gray-700">{cat.ten}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                {cat.children?.length > 0 && (
                  <ul>
                    {cat.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          to={`/${child.fullPathSlug}`}
                          className="flex items-center gap-2 pl-8 pr-4 py-2 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                        >
                          <span className="w-1 h-1 bg-gray-300 rounded-full flex-shrink-0" />
                          {child.ten}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
};

export default NewsSidebar;
