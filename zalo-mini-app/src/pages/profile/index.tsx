import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Page, Spinner, Modal, useSnackbar } from "zmp-ui";
import {
  User, Eye, EyeOff, LogIn, Pencil, Lock, Calendar, CheckCircle2, Award,
  BarChart3, Camera, Trophy, Drama, ClipboardList, FileText, ScrollText, FolderCog,
} from "lucide-react";
import { authService } from "../../services/api";
import { isLoggedIn, loginWithPassword, logout, getStoredUser, AppUser, canManageActivities } from "../../services/auth";
import { imgUrl } from "../../utils/url";
import EditProfileModal from "./EditProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";
import ZaloLoginButton from "../../components/ZaloLoginButton";

const VAI_TRO_LABELS: Record<string, string> = {
  SINH_VIEN: "Sinh viên",
  DOAN_VIEN: "Đoàn viên",
  CAN_BO_LOP: "Cán bộ lớp",
  ADMIN: "Quản trị viên",
  BCH_KHOA: "BCH Khoa",
  BCH: "BCH",
};

const isBCH = canManageActivities;

export default function ProfilePage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [user, setUser] = useState<AppUser | null>(getStoredUser());
  const [loading, setLoading] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [loginMode, setLoginMode] = useState<"zalo" | "password">("password");
  const [taiKhoan, setTaiKhoan] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loggedIn) return;
    setLoading(true);
    authService.getMe().then((res) => {
      const data = res.data?.data;
      if (!data) return;
      const mapped: AppUser = {
        id: data.id,
        username: data.username,
        maSv: data.linkedEntityId ?? "",
        hoTen: data.hoTen ?? "",
        email: data.email ?? "",
        vaiTro: data.vaiTro?.name ?? data.vaiTro ?? "",
        avatar: data.avatar,
      };
      setUser(mapped);
      localStorage.setItem("user_info", JSON.stringify(mapped));
    }).finally(() => setLoading(false));
  }, [loggedIn]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taiKhoan.trim() || !matKhau.trim()) return;
    setSubmitting(true);
    try {
      const u = await loginWithPassword(taiKhoan.trim(), matKhau);
      setUser(u); setLoggedIn(true);
      openSnackbar({ text: "Đăng nhập thành công!", type: "success", duration: 2000 });
    } catch (err: any) {
      openSnackbar({
        text: err.response?.data?.message ?? "Tài khoản hoặc mật khẩu không đúng",
        type: "error",
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout(); setLoggedIn(false); setUser(null);
    setShowLogout(false); setTaiKhoan(""); setMatKhau("");
  };

  if (!loggedIn) {
    return (
      <Page>
        <Header title="Tài khoản" />
        <div className="login-wall">
          <div className="login-hero-icon"><User size={40} /></div>
          <h3>Chào mừng!</h3>
          <p>Đăng nhập để xem thông tin cá nhân, đăng ký hoạt động và điểm danh</p>
          <div className="login-card">
            <div className="tab-switch">
              <button className={`tab-switch-btn ${loginMode === "password" ? "active" : ""}`} onClick={() => setLoginMode("password")}>Mật khẩu</button>
              <button className={`tab-switch-btn ${loginMode === "zalo" ? "active" : ""}`} onClick={() => setLoginMode("zalo")}>Zalo</button>
            </div>

            {loginMode === "password" ? (
              <form onSubmit={handlePasswordLogin}>
                <div className="form-group">
                  <label className="form-label">Tài khoản / MSSV</label>
                  <input className="form-input" type="text" placeholder="Nhập tài khoản" value={taiKhoan} onChange={(e) => setTaiKhoan(e.target.value)} autoComplete="username" />
                </div>
                <div className="form-group">
                  <label className="form-label">Mật khẩu</label>
                  <div style={{ position: "relative" }}>
                    <input className="form-input" type={showPass ? "text" : "password"} placeholder="Nhập mật khẩu" value={matKhau} onChange={(e) => setMatKhau(e.target.value)} autoComplete="current-password" style={{ paddingRight: 44 }} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", display: "flex", color: "var(--text-secondary)" }}>
                      {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting || !taiKhoan || !matKhau} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {submitting ? "Đang đăng nhập..." : <><LogIn size={16} /> Đăng nhập</>}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>Liên kết nhanh bằng tài khoản Zalo của bạn</p>
                <ZaloLoginButton className="btn btn-zalo" onSuccess={(u) => { setUser(u); setLoggedIn(true); }}>
                  <svg width="18" height="18" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="16" cy="16" r="16" fill="#0068FF"/>
                    <text x="16" y="21" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Z</text>
                  </svg>
                  Liên kết tài khoản
                </ZaloLoginButton>
              </div>
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 18, textAlign: "center" }}>
            Tiếp tục sử dụng đồng nghĩa bạn đồng ý với{" "}
            <span style={{ color: "var(--primary)", fontWeight: 600, cursor: "pointer" }} onClick={() => navigate("/terms")}>
              Điều khoản sử dụng
            </span>
          </p>
        </div>
      </Page>
    );
  }

  if (loading) {
    return (
      <Page>
        <Header title="Tài khoản" />
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}><Spinner /></div>
      </Page>
    );
  }

  const avatarUrl = user?.avatar
    ? imgUrl(user.avatar)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.hoTen ?? "U")}&background=1e40af&color=fff&size=80`;

  return (
    <Page>
      <Header title="Tài khoản" />
      <div className="page-content">

        {/* Hero */}
        <div className="hero-banner">
          <img src={avatarUrl} alt="" className="hero-avatar" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff&size=80`; }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.3 }}>{user?.hoTen || "—"}</p>
            {user?.maSv && <p style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>{user.maSv}</p>}
            <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 99, padding: "2px 10px", fontSize: 11, marginTop: 6, display: "inline-block" }}>
              {VAI_TRO_LABELS[user?.vaiTro ?? ""] ?? user?.vaiTro}
            </span>
          </div>
        </div>

        {/* Thông tin cá nhân */}
        <div className="card">
          <div className="card-body" style={{ padding: "4px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0 6px" }}>
              <p style={{ fontWeight: 700, fontSize: 14 }}>Thông tin cá nhân</p>
              <button style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }} onClick={() => setShowEdit(true)}><Pencil size={12} /> Sửa</button>
            </div>
            <div className="info-row"><span className="label">Mã SV</span><span className="value">{user?.maSv || "—"}</span></div>
            <div className="info-row"><span className="label">Họ tên</span><span className="value">{user?.hoTen || "—"}</span></div>
            <div className="info-row"><span className="label">Email</span><span className="value">{user?.email || "—"}</span></div>
            <div className="info-row"><span className="label">Vai trò</span><span className="value">{VAI_TRO_LABELS[user?.vaiTro ?? ""] ?? user?.vaiTro}</span></div>
          </div>
        </div>

        <div className="card" style={{ padding: 0, marginBottom: 10 }}>
          <div className="list-item" onClick={() => setShowChangePass(true)}>
            <div className="icon-box" style={{ background: "var(--staff-bg)" }}><Lock size={18} /></div>
            <span className="label">Đổi mật khẩu</span>
            <span className="arrow">›</span>
          </div>
        </div>

        {/* Menu sinh viên */}
        <div className="card" style={{ padding: 0, marginBottom: 10 }}>
          {[
            { icon: Calendar, bg: "var(--primary-bg)", label: "Hoạt động đã đăng ký", to: "/my-activities" },
            { icon: CheckCircle2, bg: "var(--success-bg)", label: "Lịch sử điểm danh", to: "/attendance" },
            { icon: Award, bg: "var(--warning-bg)", label: "Chứng nhận của tôi", to: "/certificates" },
            { icon: BarChart3, bg: "var(--warning-bg)", label: "Điểm rèn luyện", to: "/training-points" },
            { icon: Camera, bg: "var(--success-bg)", label: "Điểm danh QR (tự quét)", to: "/self-scan" },
            { icon: Trophy, bg: "var(--staff-bg)", label: "Cuộc thi & Bình chọn", to: "/voting" },
            { icon: Drama, bg: "var(--warning-bg)", label: "Câu lạc bộ", to: "/clubs" },
            { icon: ClipboardList, bg: "var(--warning-bg)", label: "Danh sách ban hành", to: "/ban-hanh" },
            { icon: FileText, bg: "var(--bg)", label: "Văn bản & Biểu mẫu", to: "/documents" },
            { icon: ScrollText, bg: "var(--bg)", label: "Điều khoản sử dụng", to: "/terms" },
          ].map((item) => (
            <div key={item.to} className="list-item" onClick={() => navigate(item.to)}>
              <div className="icon-box" style={{ background: item.bg }}><item.icon size={18} /></div>
              <span className="label">{item.label}</span>
              <span className="arrow">›</span>
            </div>
          ))}
        </div>

        {/* Menu BCH */}
        {isBCH(user?.vaiTro) && (
          <div className="card" style={{ padding: 0, marginBottom: 10 }}>
            <div style={{ padding: "10px 14px 6px", fontWeight: 700, fontSize: 13, color: "var(--primary)" }}>Quản lý BCH</div>
            {[
              { icon: FolderCog, bg: "var(--primary-bg)", label: "Quản lý hoạt động", to: "/manage" },
              { icon: Camera, bg: "var(--success-bg)", label: "Quét QR điểm danh", to: "/manage" },
            ].map((item) => (
              <div key={item.label} className="list-item" onClick={() => navigate(item.to)}>
                <div className="icon-box" style={{ background: item.bg }}><item.icon size={18} /></div>
                <span className="label">{item.label}</span>
                <span className="arrow">›</span>
              </div>
            ))}
          </div>
        )}

        <button className="btn btn-outline-danger" style={{ marginTop: 4 }} onClick={() => setShowLogout(true)}>
          Đăng xuất
        </button>

        <Modal
          visible={showLogout}
          title="Đăng xuất"
          description="Bạn có chắc chắn muốn đăng xuất?"
          actions={[
            { text: "Hủy", close: true },
            { text: "Đăng xuất", onClick: handleLogout, danger: true },
          ]}
          onClose={() => setShowLogout(false)}
        />

        <EditProfileModal
          visible={showEdit}
          user={user}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { setUser(updated); openSnackbar({ text: "Cập nhật hồ sơ thành công!", type: "success", duration: 2000 }); }}
        />

        <ChangePasswordModal
          visible={showChangePass}
          username={user?.username ?? ""}
          onClose={() => setShowChangePass(false)}
          onSuccess={() => openSnackbar({ text: "Đổi mật khẩu thành công!", type: "success", duration: 2000 })}
        />
      </div>
    </Page>
  );
}
