import { useEffect } from 'react';
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

  const safeHtml = DOMPurify.sanitize(post.noiDung || '', {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
  });

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

  // Bài viết liên quan (cùng chuyên mục)
  const { data: relatedData } = useQuery({
    queryKey: ['news-related', post.chuyenMuc?.id, post.id],
    queryFn: () => newsService.getDanhSach({ chuyenMucId: post.chuyenMuc?.id, size: 4, page: 0 }),
    enabled: !!post.chuyenMuc?.id,
    staleTime: 5 * 60 * 1000,
  });
  const related = (relatedData?.content || []).filter((p) => p.id !== post.id).slice(0, 3);

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

      <article>
        {/* Breadcrumb */}
        <div className="mb-4">
          <Breadcrumb items={post.breadcrumb || []} currentTitle={post.tieuDe} />
        </div>

        {/* Category tag */}
        {post.chuyenMuc && (
          <span className="inline-block bg-enews-100 text-enews-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
            {post.chuyenMuc.ten}
          </span>
        )}

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-4">
          {post.tieuDe}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-5 pb-5 border-b border-gray-100">
          {post.ngayXuatBan && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(post.ngayXuatBan).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          )}
          {post.donViDang && (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />{post.donViDang}
            </span>
          )}
          {post.luotXem != null && (
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />{post.luotXem} lượt xem
            </span>
          )}
        </div>

        {/* Tóm tắt */}
        {post.tomTat && (
          <p className="text-base text-gray-600 italic leading-relaxed mb-5 bg-gray-50 border-l-4 border-enews-400 px-4 py-3 rounded-r-xl">
            {post.tomTat}
          </p>
        )}

        {/* Ảnh đại diện */}
        {post.anhDaiDien && (
          <img src={post.anhDaiDien} alt={post.tieuDe}
            className="w-full max-h-96 object-cover rounded-xl mb-6 shadow-sm" />
        )}

        {/* Nội dung */}
        {safeHtml && (
          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-enews-600 prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        )}

        {/* Ảnh thêm */}
        {post.anhList?.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {post.anhList.map((anh) => (
              <img key={anh.id} src={anh.duongDan} alt={anh.moTa || ''} className="rounded-xl object-cover w-full h-40" />
            ))}
          </div>
        )}

        {/* Văn bản đính kèm */}
        {post.vanBan && <VanBanAttachment vanBan={post.vanBan} />}

        {/* Nút đăng ký hoạt động */}
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

        {/* Tags / chuyên mục */}
        {post.chuyenMuc && (
          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-2 flex-wrap">
            <Tag className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Chuyên mục:</span>
            {(post.breadcrumb || []).map((b) => (
              <a key={b.fullPathSlug} href={`/${b.fullPathSlug}`}
                className="text-sm bg-gray-100 text-gray-600 hover:bg-enews-50 hover:text-enews-700 px-2.5 py-1 rounded-full transition-colors">
                {b.ten}
              </a>
            ))}
          </div>
        )}
      </article>

      {/* Bài viết liên quan */}
      {related.length > 0 && (
        <section className="mt-10 pt-8 border-t border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 border-l-4 border-enews-600 pl-3 mb-5">Bài viết liên quan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </section>
      )}
    </>
  );
};

export default PostDetailPage;
