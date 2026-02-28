import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Home, ChevronRight } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://youth-kgu.edu.vn';

/**
 * Breadcrumb navigation + JSON-LD BreadcrumbList injection.
 * @param {Array} items - [{ ten, fullPathSlug }, ...]
 * @param {string} currentTitle - Tiêu đề trang hiện tại (bài viết / danh mục)
 */
const Breadcrumb = ({ items = [], currentTitle }) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: BASE_URL + '/news' },
      ...items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: item.ten,
        item: BASE_URL + '/' + item.fullPathSlug,
      })),
      ...(currentTitle
        ? [{ '@type': 'ListItem', position: items.length + 2, name: currentTitle }]
        : []),
    ],
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
        <Link to="/news" className="flex items-center gap-1 hover:text-red-600 transition-colors">
          <Home className="w-3.5 h-3.5" />
          <span>Trang chủ</span>
        </Link>
        {items.map((item) => (
          <span key={item.fullPathSlug || item.ten} className="flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <Link
              to={`/${item.fullPathSlug}`}
              className="hover:text-red-600 transition-colors"
            >
              {item.ten}
            </Link>
          </span>
        ))}
        {currentTitle && (
          <span className="flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-gray-700 font-medium line-clamp-1">{currentTitle}</span>
          </span>
        )}
      </nav>
    </>
  );
};

export default Breadcrumb;
