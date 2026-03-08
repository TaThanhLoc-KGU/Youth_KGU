import { Helmet } from 'react-helmet-async';
import { BLOCK_REGISTRY } from '../../components/news/public/NewsBlocks';
import useNewsLayoutStore from '../../stores/newsLayoutStore';

/**
 * NewsHomePage — trang chủ eNews.
 * Bố cục mainBlocks được điều khiển bởi newsLayoutStore (tuỳ chỉnh qua Layout Editor).
 * Sidebar phải (danh mục, tin nổi bật, banner) được render bởi NewsSidebar trong NewsLayout.
 */
const NewsHomePage = () => {
  const { mainBlocks } = useNewsLayoutStore();

  return (
    <>
      <Helmet>
        <title>Tin tức Đoàn – Hội | Youth KGU</title>
        <meta
          name="description"
          content="Tin tức, sự kiện và hoạt động của Đoàn Thanh niên – Hội Sinh viên Trường Đại học Kiên Giang"
        />
      </Helmet>

      {/* Grid 12 cột để hỗ trợ colSpan từng block — mobile luôn full width */}
      <div className="grid grid-cols-12 gap-4">
        {mainBlocks.map((block) => {
          const Component = BLOCK_REGISTRY[block.type];
          if (!Component) return null;
          const span = block.colSpan || 12;
          // Mobile: always full-width (col-span-12), md+: use configured span
          const spanClass =
            span === 12 ? 'col-span-12' :
            span === 8  ? 'col-span-12 md:col-span-8' :
            span === 6  ? 'col-span-12 md:col-span-6' :
            span === 4  ? 'col-span-12 md:col-span-4' :
                          'col-span-12';
          return (
            <div key={block.id} className={spanClass}>
              <Component config={block.config || {}} />
            </div>
          );
        })}
      </div>
    </>
  );
};

export default NewsHomePage;
