import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Header, Page, Spinner } from "zmp-ui";
import { Frown, PenLine, Calendar } from "lucide-react";
import { newsService } from "../../services/api";
import { imgUrl, rewriteHtmlImageSrc } from "../../utils/url";

interface NewsDetail {
  id: number;
  tieuDe: string;
  noiDung: string;
  anhDaiDien: string;
  ngayDang: string;
  loaiTin: string;
  tacGia: string;
}

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    newsService
      .getDetail(Number(id))
      .then((res) => setNews(res.data.data))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Page>
      <Header title="Chi tiết tin tức" showBackIcon />
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
          <Spinner />
        </div>
      ) : !news ? (
        <div className="empty-state">
          <div className="icon"><Frown size={44} /></div>
          <p>Không tìm thấy tin tức</p>
        </div>
      ) : (
        <div style={{ paddingTop: "var(--header-height)", paddingBottom: 32 }}>
          {imgUrl(news.anhDaiDien) && (
            <img
              src={imgUrl(news.anhDaiDien)}
              alt={news.tieuDe}
              style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <div style={{ padding: "16px 14px" }}>
            <span className="badge badge-blue" style={{ marginBottom: 10 }}>
              {news.loaiTin}
            </span>
            <h1
              style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4, margin: "8px 0" }}
            >
              {news.tieuDe}
            </h1>
            <div
              style={{
                display: "flex",
                gap: 12,
                fontSize: 12,
                color: "var(--text-secondary)",
                marginBottom: 16,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><PenLine size={12} /> {news.tacGia || "Ban biên tập"}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> {formatDate(news.ngayDang)}</span>
            </div>
            <div
              style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text)" }}
              dangerouslySetInnerHTML={{ __html: rewriteHtmlImageSrc(news.noiDung) }}
            />
          </div>
        </div>
      )}
    </Page>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
