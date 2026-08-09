import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Page, Spinner, useSnackbar } from "zmp-ui";
import zmpSdk from "zmp-sdk";
import { Wrench, Target, Circle, CheckCircle2, Camera, ClipboardList, Calendar } from "lucide-react";
import { manageService, attendanceService } from "../../services/api";
import { isLoggedIn, getStoredUser, canManageActivities } from "../../services/auth";

interface Activity {
  maHoatDong: string;
  tenHoatDong: string;
  ngayToChuc: string;
  trangThai: string;
  soNguoiDaDiemDanh?: number;
}

interface DashboardStats {
  tongHoatDong?: number;
  hoatDongDangDienRa?: number;
  hoatDongSapDienRa?: number;
  hoatDongDaHoanThanh?: number;
  tongSinhVienThamGia?: number;
}

import { Scanner } from "@yudiel/react-qr-scanner";

export default function ManagePage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const loggedIn = isLoggedIn();
  const user = getStoredUser();
  const canManage = loggedIn && canManageActivities(user?.vaiTro);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (!canManage) { setLoading(false); return; }
    manageService.getActivities()
      .then((res) => {
        const data = res.data?.data ?? res.data?.content ?? res.data ?? [];
        setActivities(Array.isArray(data) ? data.slice(0, 20) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    manageService.getStats()
      .then((res) => setStats(res.data?.data ?? null))
      .catch(() => {});
  }, [canManage]);

  const handleBCHScanToken = async (token: string) => {
    setShowScanner(false);
    setScanning(true);
    try {
      const res = await attendanceService.bchScan(token);
      const msg = res.data?.message ?? "Điểm danh thành công!";
      openSnackbar({ text: "✅ " + msg, type: "success", duration: 3000 });
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.message ?? "Thất bại";
      openSnackbar({ text: "❌ " + msg, type: "error", duration: 3000 });
    } finally {
      setScanning(false);
    }
  };

  if (!loggedIn || !canManage) {
    return (
      <Page>
        <Header title="Quản lý" showBackIcon />
        <div className="login-wall">
          <div className="icon"><Wrench size={44} /></div>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>Không có quyền truy cập</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
            Tính năng này chỉ dành cho BCH và Ban quản lý
          </p>
          {!loggedIn && (
            <button className="btn btn-primary" onClick={() => navigate("/profile")}>Đăng nhập</button>
          )}
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Header title="Quản lý" showBackIcon />
      <div className="page-content">
        {/* Thống kê tổng quan */}
        {stats && (
          <div className="stat-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 12 }}>
            <div className="stat-card">
              <span className="stat-icon"><Target size={26} /></span>
              <div>
                <p className="stat-value">{stats.tongHoatDong ?? 0}</p>
                <p className="stat-label">Tổng hoạt động</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon" style={{ color: "var(--success)" }}><Circle size={22} fill="currentColor" /></span>
              <div>
                <p className="stat-value" style={{ color: "var(--success)" }}>{stats.hoatDongDangDienRa ?? 0}</p>
                <p className="stat-label">Đang diễn ra</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon" style={{ color: "var(--primary)" }}><Circle size={22} fill="currentColor" /></span>
              <div>
                <p className="stat-value" style={{ color: "var(--primary)" }}>{stats.hoatDongSapDienRa ?? 0}</p>
                <p className="stat-label">Sắp diễn ra</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon" style={{ color: "var(--success)" }}><CheckCircle2 size={26} /></span>
              <div>
                <p className="stat-value">{stats.tongSinhVienThamGia ?? 0}</p>
                <p className="stat-label">Lượt điểm danh</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <button
            onClick={() => setShowScanner(true)}
            disabled={scanning}
            style={{ background: "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: "var(--radius)", padding: "18px 10px", cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, boxShadow: "var(--shadow-primary)" }}
          >
            <Camera size={28} />
            {scanning ? "Đang quét..." : "Quét điểm danh"}
          </button>
          <button
            onClick={() => navigate("/activities")}
            style={{ background: "var(--card-bg)", boxShadow: "var(--shadow-sm)", border: "none", borderRadius: "var(--radius)", padding: "18px 10px", cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "var(--text)" }}
          >
            <ClipboardList size={28} />
            DS Hoạt động
          </button>
        </div>

        {showScanner && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#000", zIndex: 9999, display: "flex", flexDirection: "column" }}>
            <Header title="Quét QR Điểm danh" showBackIcon={false} />
            <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <Scanner onScan={(result) => { if (result && result.length > 0) handleBCHScanToken(result[0].rawValue); }} />
              <button style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", padding: "12px 40px", background: "#ef4444", color: "#fff", borderRadius: 50, border: "none", fontWeight: "bold", fontSize: 16 }} onClick={() => setShowScanner(false)}>
                Hủy Quét
              </button>
            </div>
          </div>
        )}

        <div className="section-header">
          <span className="section-title"><Target size={16} /> Hoạt động gần đây</span>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}><Spinner /></div>
        ) : activities.length === 0 ? (
          <div className="empty-state"><div className="icon"><ClipboardList size={44} /></div><p>Không có hoạt động</p></div>
        ) : (
          activities.map((act) => (
            <div key={act.maHoatDong} className="card" style={{ marginBottom: 10 }}>
              <div className="card-body" style={{ cursor: "pointer" }} onClick={() => navigate(`/manage/${act.maHoatDong}/attendance`)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <p style={{ fontWeight: 700, fontSize: 14, flex: 1, paddingRight: 8 }}>{act.tenHoatDong}</p>
                  <span className={`badge ${act.trangThai === "DANG_DIEN_RA" ? "badge-green" : act.trangThai === "SAP_DIEN_RA" ? "badge-blue" : "badge-yellow"}`} style={{ fontSize: 11, flexShrink: 0 }}>
                    {statusLabel(act.trangThai)}
                  </span>
                </div>
                {act.ngayToChuc && <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> {formatDate(act.ngayToChuc)}</p>}
                {act.soNguoiDaDiemDanh != null && <p style={{ fontSize: 12, color: "var(--success)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={12} /> {act.soNguoiDaDiemDanh} đã điểm danh</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </Page>
  );
}

function statusLabel(s: string) {
  const m: Record<string, string> = { SAP_DIEN_RA: "Sắp diễn ra", DANG_DIEN_RA: "Đang diễn ra", DA_KET_THUC: "Đã kết thúc", DA_HOAN_THANH: "Hoàn thành", DA_HUY: "Đã hủy" };
  return m[s] ?? s;
}
function formatDate(s: string) {
  if (!s) return "";
  const d = new Date(s);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
