import React from "react";
import { useNavigate } from "react-router-dom";
import { Header, Page } from "zmp-ui";
import {
  Newspaper, Target, Calendar, BarChart3, Camera, CheckCircle2, Award,
  Trophy, Drama, ClipboardList, FileText, Info, Lock, FolderCog,
} from "lucide-react";
import { isLoggedIn, getStoredUser } from "../../services/auth";

const SERVICES = [
  { icon: Newspaper, label: "Tin tức", sub: "Tin tức mới nhất", bg: "var(--primary-bg)", to: "/" },
  { icon: Target, label: "Hoạt động", sub: "Đăng ký & xem chi tiết", bg: "var(--success-bg)", to: "/activities" },
  { icon: Calendar, label: "Đã đăng ký", sub: "Hoạt động của tôi", bg: "var(--primary-bg)", to: "/my-activities", auth: true },
  { icon: BarChart3, label: "Điểm rèn luyện", sub: "Xem điểm theo kỳ", bg: "var(--warning-bg)", to: "/training-points", auth: true },
  { icon: Camera, label: "Điểm danh QR", sub: "Tự quét mã tham gia", bg: "var(--success-bg)", to: "/self-scan", auth: true },
  { icon: CheckCircle2, label: "Lịch sử điểm danh", sub: "Kiểm tra đã điểm danh", bg: "var(--success-bg)", to: "/attendance", auth: true },
  { icon: Award, label: "Chứng nhận của tôi", sub: "Xem & tải chứng nhận", bg: "var(--warning-bg)", to: "/certificates", auth: true },
  { icon: Trophy, label: "Cuộc thi & Bình chọn", sub: "Tham gia bình chọn", bg: "var(--staff-bg)", to: "/voting" },
  { icon: Drama, label: "Câu lạc bộ", sub: "Đăng ký tham gia CLB", bg: "var(--warning-bg)", to: "/clubs", auth: true },
  { icon: ClipboardList, label: "Danh sách ban hành", sub: "Xem DS hoạt động đã ban hành", bg: "var(--warning-bg)", to: "/ban-hanh" },
  { icon: FileText, label: "Văn bản & Biểu mẫu", sub: "Tải văn bản, biểu mẫu", bg: "var(--bg)", to: "/documents" },
];

export default function ServicesPage() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const user = getStoredUser();
  const isBCH = user?.vaiTro === "BCH_KHOA" || user?.vaiTro === "BCH" || user?.vaiTro === "ADMIN";

  return (
    <Page>
      <Header title="Dịch vụ" />
      <div className="page-content">
        {!loggedIn && (
          <div style={{ background: "#eff6ff", borderRadius: "var(--radius)", padding: "12px 14px", marginBottom: 12, display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ display: "flex", color: "var(--primary)" }}><Info size={20} /></span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>Chưa đăng nhập</p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>Đăng nhập để dùng đầy đủ</p>
            </div>
            <button className="btn btn-primary btn-sm" style={{ width: "auto", flexShrink: 0 }} onClick={() => navigate("/profile")}>Đăng nhập</button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {SERVICES.map((item) => (
            <div
              key={item.label}
              onClick={() => { if (item.auth && !loggedIn) { navigate("/profile"); return; } navigate(item.to); }}
              style={{ background: "var(--card-bg)", borderRadius: "var(--radius)", padding: "14px 12px", boxShadow: "var(--shadow-sm)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}
            >
              <div className="icon-tile" style={{ background: item.bg }}><item.icon size={22} /></div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700 }}>{item.label}</p>
                <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{item.sub}</p>
              </div>
              {(item as any).auth && !loggedIn && <span style={{ fontSize: 10, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 3 }}><Lock size={10} /> Cần đăng nhập</span>}
            </div>
          ))}
        </div>

        {isBCH && (
          <div style={{ marginTop: 10 }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: "var(--primary)", marginBottom: 8 }}>Quản lý BCH</p>
            <div className="card" style={{ padding: 0 }}>
              <div className="list-item" onClick={() => navigate("/manage")}>
                <div className="icon-box" style={{ background: "#dbeafe" }}><FolderCog size={18} /></div>
                <div style={{ flex: 1 }}>
                  <p className="label">Quản lý hoạt động</p>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)" }}>Điểm danh, thống kê</p>
                </div>
                <span className="arrow">›</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
