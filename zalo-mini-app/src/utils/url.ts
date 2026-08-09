export const BASE = "https://tuoitre.vnkgu.edu.vn";

/** Chuyển path tương đối thành URL đầy đủ */
export function imgUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return BASE + (path.startsWith("/") ? path : "/" + path);
}

/**
 * Nội dung HTML từ CMS (tin tức, mô tả hoạt động...) chứa <img src="/uploads/..."> với path tương đối,
 * resolve theo domain backend. Mini app chạy trên domain khác (Zalo host) nên phải rewrite thành URL tuyệt đối
 * trước khi dangerouslySetInnerHTML, nếu không ảnh sẽ không hiển thị.
 */
export function rewriteHtmlImageSrc(html?: string | null): string {
  if (!html) return "";
  return html.replace(/(<img[^>]*\ssrc=["'])(\/[^"']*)(["'])/gi, (_m, pre, path, post) => `${pre}${BASE}${path}${post}`);
}
