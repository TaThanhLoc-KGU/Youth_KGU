import { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Calendar, Eye, User, Tag } from 'lucide-react';
import DOMPurify from 'dompurify';
import Breadcrumb from '../../components/news/public/Breadcrumb';
import VanBanAttachment from '../../components/news/public/VanBanAttachment';
import ActivityRegisterBtn from '../../components/news/public/ActivityRegisterBtn';
import PostCard from '../../components/news/public/PostCard';
import { useQuery } from '@tanstack/react-query';
import newsService from '../../services/newsService';

const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://youth-kgu.edu.vn';

const PostDetailPage = ({ post }) => {
  if (!post) return null;

  // Scroll to top on post change
  useEffect(() => { window.scrollTo(0, 0); }, [post.id]);

  const safeHtml = useMemo(() => {
    const raw = DOMPurify.sanitize(post.noiDung || '', {
      ADD_TAGS: ['iframe', 'figure', 'figcaption'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
    });
    // Wrap images that have alt text into <figure><figcaption>
    try {
      const doc = new DOMParser().parseFromString(raw, 'text/html');
      doc.querySelectorAll('img[alt]').forEach((img) => {
        const alt = img.getAttribute('alt');
        if (alt && alt.trim() && !img.closest('figure')) {
          const figure = doc.createElement('figure');
          figure.style.cssText = 'text-align:center;margin:1rem 0';
          img.parentNode.insertBefore(figure, img);
          figure.appendChild(img);
          const cap = doc.createElement('figcaption');
          cap.style.cssText = 'font-size:0.8rem;color:#6b7280;margin-top:0.4rem;font-style:italic;text-align:center';
          cap.textContent = alt;
          figure.appendChild(cap);
        }
      });
      return doc.body.innerHTML;
    } catch {
      return raw;
    }
  }, [post.noiDung]);

  const jsonLdArticle = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.tieuDe,
    description: post.tomTat,
    image: post.anhDaiDien,
    datePublished: post.ngayXuatBan,
    author: { '@type': 'Organization', name: post.donViDang || 'Youth KGU' },
    publisher: { '@type': 'Organization', name: 'Youth KGU' },
    url: BASE_URL + '/' + post.fullUrlPath,
  };

  // Related articles (same category)
  const { data: relatedData } = useQuery({
    queryKey: ['news-related', post.chuyenMuc?.id, post.id],
    queryFn: () => newsService.getDanhSach({ chuyenMucId: post.chuyenMuc?.id, size: 4, page: 0 }),
    enabled: !!post.chuyenMuc?.id,
    staleTime: 5 * 60 * 1000,
  });
  const related = (relatedData?.content || []).filter((p) => p.id !== post.id).slice(0, 3);

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '';

  return (
    <>
      <Helmet>
        <title>{post.tieuDe} | {post.chuyenMuc?.ten || 'eNews'} | Youth KGU</title>
        <meta name="description" content={post.tomTat || post.tieuDe} />
        <link rel="canonical" href={`${BASE_URL}/${post.fullUrlPath}`} />
        <meta property="og:title" content={post.tieuDe} />
        <meta property="og:description" content={post.tomTat || ''} />
        {post.anhDaiDien && <meta property="og:image" content={post.anhDaiDien} />}
        <meta property="og:url" content={`${BASE_URL}/${post.fullUrlPath}`} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify(jsonLdArticle)}</script>
      </Helmet>

      <article className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Breadcrumb items={post.breadcrumb || []} currentTitle={post.tieuDe} />
        </div>

        {/* Category tag */}
        {post.chuyenMuc && (
          <a
            href={`/${post.chuyenMuc.fullPathSlug}`}
            className="inline-block bg-primary text-white text-xs font-bold px-3 py-1 rounded-full mb-3 hover:bg-primary-700 transition-colors"
          >
            {post.chuyenMuc.ten}
          </a>
        )}

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-4 break-words">
          {post.tieuDe}
        </h1>

        {/* Meta bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500 mb-5 pb-4 border-b border-gray-100">
          {post.ngayXuatBan && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              {fmtDate(post.ngayXuatBan)}
            </span>
          )}
          {post.donViDang && (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 flex-shrink-0" />
              {post.donViDang}
            </span>
          )}
          {post.luotXem != null && (
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 flex-shrink-0" />
              {post.luotXem} lượt xem
            </span>
          )}
        </div>

        {/* Hero image */}
        {post.anhDaiDien && (
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-6 bg-gray-100">
            <img
              src={post.anhDaiDien}
              alt={post.tieuDe}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        )}

        {/* Summary — styled as blockquote */}
        {post.tomTat && (
          <p className="text-base text-gray-700 italic leading-relaxed mb-6 pl-4 border-l-4 border-primary/30 bg-primary/5 py-3 pr-3 rounded-r-xl">
            {post.tomTat}
          </p>
        )}

        {/* Article content */}
        {safeHtml && (
          <div
            className="enews-article-content prose prose-lg max-w-none break-words"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        )}

        {/* Additional images */}
        {post.anhList?.length > 0 && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {post.anhList.map((anh) => (
              <img
                key={anh.id}
                src={anh.duongDan}
                alt={anh.moTa || ''}
                className="rounded-xl object-cover w-full aspect-[4/3]"
              />
            ))}
          </div>
        )}

        {/* Document attachment */}
        {post.vanBan && <VanBanAttachment vanBan={post.vanBan} />}

        {/* Activity register button */}
        {post.hoatDongId && (
          <div className="mt-6">
            <ActivityRegisterBtn
              hoatDongId={post.hoatDongId}
              trangThaiHoatDong={post.trangThaiHoatDong}
              hanDangKy={post.hanDangKy}
              soChoConLai={post.soChoConLai}
            />
          </div>
        )}

        {/* Breadcrumb tags */}
        {post.chuyenMuc && (
          <div className="mt-8 pt-5 border-t border-gray-100 flex items-center gap-2 flex-wrap">
            <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-400">Chuyên mục:</span>
            {(post.breadcrumb || []).map((b) => (
              <a
                key={b.fullPathSlug}
                href={`/${b.fullPathSlug}`}
                className="text-sm bg-gray-100 hover:bg-primary/10 hover:text-primary text-gray-600 px-2.5 py-1 rounded-full transition-colors"
              >
                {b.ten}
              </a>
            ))}
          </div>
        )}
      </article>

      {/* Related articles */}
      {related.length > 0 && (
        <section className="mt-10 pt-8 border-t border-gray-100 max-w-3xl mx-auto">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
            <span className="w-1 h-5 bg-primary rounded-full flex-shrink-0" />
            Bài viết liên quan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </section>
      )}
    </>
  );
};

export default PostDetailPage;
