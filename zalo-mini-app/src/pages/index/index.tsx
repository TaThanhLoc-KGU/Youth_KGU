import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Page, Spinner } from "zmp-ui";
import { Newspaper, Target, Calendar, Hand, GraduationCap } from "lucide-react";
import { newsService, activityService } from "../../services/api";
import { imgUrl } from "../../utils/url";
import { useAuth } from "../../hooks/useAuth";
import BannerSlider from "../../components/BannerSlider";
import NewsTicker from "../../components/NewsTicker";

interface NewsItem {
  id: number;
  tieuDe: string;
  tomTat: string;
  anhDaiDien: string;
  ngayXuatBan: string;
}

interface ActivityItem {
  maHoatDong: string;
  tenHoatDong: string;
  hinhAnhPoster: string;
  ngayToChuc: string;
  diaDiem: string;
  trangThai: string;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export default function HomePage() {
  const navigate = useNavigate();
  const { loggedIn, user } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([newsService.getList({ size: 8 }), activityService.getPublic()])
      .then(([newsRes, actRes]) => {
        setNews(newsRes.data?.content ?? []);
        const all: ActivityItem[] = actRes.data?.data ?? [];
        setActivities(all.slice(0, 4));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <Page>
        <Header title="Trang chủ" />
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
          <Spinner />
        </div>
      </Page>
    );

  return (
    <Page>
      <Header title="Youth KGU" />
      <div className="page-content">
        {/* Brand header — đồng bộ tên/logo tổ chức với website */}
        <div className="brand-header">
          <img
            className="brand-header-logo"
            src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
            alt="Logo Đoàn"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div style={{ minWidth: 0 }}>
            <p className="brand-header-eyebrow">Trang thông tin điện tử</p>
            <p className="brand-header-title">Đoàn Thanh niên – Hội Sinh viên<br />Trường Đại học Kiên Giang</p>
          </div>
        </div>
        {/* Hero chào mừng */}
        <div className="hero-banner" onClick={() => navigate("/profile")} style={{ cursor: "pointer" }}>
          <div
              style={{
                width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                background: "rgba(255,255,255,0.18)", display: "flex",
                alignItems: "center", justifyContent: "center", color: "#fff",
                position: "relative", zIndex: 1,
              }}
          >
            {loggedIn ? <Hand size={26} /> : <GraduationCap size={26} />}
          </div>
          <div style={{ position: "relative", zIndex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, opacity: 0.9 }}>{greeting()}{loggedIn ? "," : "!"}</p>
            <p style={{ fontSize: 17, fontWeight: 800, marginTop: 2, letterSpacing: "-0.3px" }}>
              {loggedIn ? (user?.hoTen || "Bạn") : "Chào mừng đến Youth KGU"}
            </p>
            {!loggedIn && (
                <p style={{ fontSize: 12, opacity: 0.9, marginTop: 3 }}>Đăng nhập để đăng ký hoạt động &amp; điểm danh →</p>
            )}
          </div>
        </div>
        <NewsTicker />
        <BannerSlider />



        {/* Tin tức */}
        <div className="section-header">
          <span className="section-title"><Newspaper size={16} /> Tin tức mới nhất</span>
        </div>

        {news.length === 0 ? (
          <div className="empty-state">
            <div className="icon"><Newspaper size={44} /></div>
            <p>Chưa có tin tức</p>
          </div>
        ) : (
          news.map((item) => (
            <div
              key={item.id}
              className="card"
              onClick={() => navigate(`/news/${item.id}`)}
              style={{ cursor: "pointer", overflow: "hidden" }}
            >
              {imgUrl(item.anhDaiDien) ? (
                <img
                  src={imgUrl(item.anhDaiDien)}
                  alt=""
                  style={{ width: "100%", height: 160, objectFit: "cover" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : null}
              <div className="card-body">
                <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>{item.tieuDe}</p>
                {item.tomTat && (
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {item.tomTat}
                  </p>
                )}
                {item.ngayXuatBan && (
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={12} /> {formatDate(item.ngayXuatBan)}
                  </p>
                )}
              </div>
            </div>
          ))
        )}

        {/* Hoạt động */}
        <div className="section-header" style={{ marginTop: 6 }}>
          <span className="section-title"><Target size={16} /> Hoạt động</span>
          <span style={{ fontSize: 13, color: "var(--primary)", cursor: "pointer" }} onClick={() => navigate("/activities")}>
            Xem tất cả ›
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="empty-state">
            <div className="icon"><Target size={44} /></div>
            <p>Chưa có hoạt động</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, marginBottom: 10 }}>
            {activities.map((act) => (
              <div key={act.maHoatDong} className="list-item" onClick={() => navigate(`/activities/${act.maHoatDong}`, { state: act })}>
                <div className="icon-tile" style={{ background: "var(--primary-bg)", color: "var(--primary)" }}>
                  <Target size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {act.tenHoatDong}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    {act.ngayToChuc && <><Calendar size={11} /> {formatDate(act.ngayToChuc)}</>}
                    {act.diaDiem && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>· {act.diaDiem}</span>}
                  </p>
                </div>
                <span className="arrow">›</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}

function formatDate(s: string): string {
  if (!s) return "";
  const d = new Date(s);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
