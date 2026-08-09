import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Page, Spinner, useSnackbar } from "zmp-ui";
import { Search, Target, Calendar, MapPin, Users, X, Check } from "lucide-react";
import { activityService, dangKyService } from "../../services/api";
import { isLoggedIn, getStoredUser } from "../../services/auth";
import { imgUrl } from "../../utils/url";

interface Activity {
  maHoatDong: string;
  tenHoatDong: string;
  hinhAnhPoster: string;
  moTa: string;
  ngayToChuc: string;
  ngayKetThuc: string;
  diaDiem: string;
  soNguoiDangKy: number;
  soLuongToiDa: number;
  trangThai: string;
  diemRenLuyen: number;
  loaiHoatDong: string;
}

const STATUS_FILTER = [
  { value: "all", label: "Tất cả" },
  { value: "DANG_MO_DANG_KY", label: "Đang mở ĐK" },
  { value: "SAP_DIEN_RA", label: "Sắp diễn ra" },
  { value: "DANG_DIEN_RA", label: "Đang diễn ra" },
  { value: "DA_KET_THUC", label: "Đã kết thúc" },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  DANG_MO_DANG_KY: { label: "Đang mở ĐK", cls: "badge-green" },
  SAP_DIEN_RA:     { label: "Sắp diễn ra", cls: "badge-blue" },
  DANG_DIEN_RA:    { label: "Đang diễn ra", cls: "badge-yellow" },
  DA_KET_THUC:     { label: "Đã kết thúc", cls: "badge-gray" },
  DA_HOAN_THANH:   { label: "Hoàn thành",  cls: "badge-gray" },
  DA_HUY:          { label: "Đã hủy",      cls: "badge-red" },
};

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const loggedIn = isLoggedIn();

  const [list, setList] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("DANG_MO_DANG_KY");
  const [registering, setRegistering] = useState<Record<string, boolean>>({});
  const [registered, setRegistered] = useState<Set<string>>(new Set());

  useEffect(() => {
    activityService.getPublic()
      .then((res) => {
        const data: Activity[] = res.data?.data ?? [];
        setList(data);
        const hasOpen = data.some((a) => a.trangThai === "DANG_MO_DANG_KY");
        if (!hasOpen) setStatusFilter("all");
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const maSv = getStoredUser()?.maSv;
    if (loggedIn && maSv) {
      dangKyService.getMyRegistrations(maSv)
        .then((res) => {
          const regs: any[] = res.data?.data ?? res.data ?? [];
          setRegistered(new Set(regs.map((r) => r.maHoatDong)));
        })
        .catch(() => {});
    }
  }, []);

  const filtered = useMemo(() => list.filter((a) => {
    if (statusFilter !== "all" && a.trangThai !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (a.tenHoatDong?.toLowerCase().includes(q) || a.maHoatDong?.toLowerCase().includes(q));
    }
    return true;
  }), [list, statusFilter, search]);

  const handleRegister = async (act: Activity) => {
    if (!loggedIn) {
      openSnackbar({ text: "Vui lòng đăng nhập để đăng ký", type: "warning", duration: 2000 });
      navigate("/profile");
      return;
    }
    const ma = act.maHoatDong;
    setRegistering((p) => ({ ...p, [ma]: true }));
    try {
      await activityService.register(ma);
      setRegistered((p) => new Set([...p, ma]));
      setList((prev) => prev.map((a) => a.maHoatDong === ma ? { ...a, soNguoiDangKy: (a.soNguoiDangKy ?? 0) + 1 } : a));
      openSnackbar({ text: "Đăng ký thành công! 🎉", type: "success", duration: 3000 });
    } catch (err: any) {
      openSnackbar({ text: err.response?.data?.message ?? "Đăng ký thất bại", type: "error", duration: 3000 });
    } finally {
      setRegistering((p) => ({ ...p, [ma]: false }));
    }
  };

  const handleCancel = async (ma: string) => {
    setRegistering((p) => ({ ...p, [ma]: true }));
    try {
      await activityService.cancelRegister(ma);
      setRegistered((p) => { const s = new Set(p); s.delete(ma); return s; });
      setList((prev) => prev.map((a) => a.maHoatDong === ma ? { ...a, soNguoiDangKy: Math.max(0, (a.soNguoiDangKy ?? 1) - 1) } : a));
      openSnackbar({ text: "Đã hủy đăng ký", type: "warning", duration: 2000 });
    } catch (err: any) {
      openSnackbar({ text: err.response?.data?.message ?? "Không thể hủy", type: "error", duration: 2000 });
    } finally {
      setRegistering((p) => ({ ...p, [ma]: false }));
    }
  };

  return (
    <Page>
      <Header title="Hoạt động" showBackIcon />
      <div className="page-content">
        <div className="search-bar">
          <span className="search-icon"><Search size={16} /></span>
          <input
            placeholder="Tìm kiếm hoạt động..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-row">
          {STATUS_FILTER.map((f) => (
            <button
              key={f.value}
              className={`filter-chip ${statusFilter === f.value ? "active" : ""}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon"><Target size={44} /></div>
            <p>Không có hoạt động nào{search ? ` khớp "${search}"` : ""}</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>{filtered.length} hoạt động</p>
            {filtered.map((act) => {
              const badge = STATUS_BADGE[act.trangThai] ?? { label: act.trangThai, cls: "badge-gray" };
              const canReg = act.trangThai === "DANG_MO_DANG_KY"
                && (!act.soLuongToiDa || (act.soNguoiDangKy ?? 0) < act.soLuongToiDa);
              const isReg = registered.has(act.maHoatDong);
              const isBusy = !!registering[act.maHoatDong];
              const isFull = act.soLuongToiDa > 0 && (act.soNguoiDangKy ?? 0) >= act.soLuongToiDa;

              return (
                <div key={act.maHoatDong} className="activity-item">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    {act.diemRenLuyen > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--success)", background: "var(--success-bg)", padding: "2px 8px", borderRadius: 99 }}>
                        +{act.diemRenLuyen} điểm RL
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                    {imgUrl(act.hinhAnhPoster) ? (
                      <img src={imgUrl(act.hinhAnhPoster)} alt="" style={{ width: 72, height: 54, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div style={{ width: 72, height: 54, borderRadius: 8, background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Target size={22} color="#fff" /></div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="activity-item-title">{act.tenHoatDong}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{act.maHoatDong}</p>
                    </div>
                  </div>

                  <div className="activity-item-meta">
                    {act.ngayToChuc && <span><Calendar size={12} /> {formatDate(act.ngayToChuc)}</span>}
                    {act.diaDiem && <span><MapPin size={12} /> {act.diaDiem}</span>}
                    {act.soLuongToiDa > 0 && (
                      <span style={{ color: isFull ? "var(--danger)" : undefined }}>
                        <Users size={12} /> {act.soNguoiDangKy ?? 0}/{act.soLuongToiDa}{isFull ? " · Hết chỗ" : ""}
                      </span>
                    )}
                  </div>

                  <div className="activity-item-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => navigate(`/activities/${act.maHoatDong}`, { state: act })}
                    >
                      Xem chi tiết
                    </button>
                    {isReg ? (
                      <button className="btn btn-outline-danger btn-sm" style={{ flex: 1 }} disabled={isBusy} onClick={() => handleCancel(act.maHoatDong)}>
                        {isBusy ? "..." : <><X size={14} /> Hủy ĐK</>}
                      </button>
                    ) : canReg ? (
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled={isBusy} onClick={() => handleRegister(act)}>
                        {isBusy ? "Đang ĐK..." : <><Check size={14} /> Đăng ký</>}
                      </button>
                    ) : (
                      <button className="btn btn-sm" disabled style={{ flex: 1, background: "var(--border)", color: "var(--text-muted)" }}>
                        {isFull ? "Hết chỗ" : "Không ĐK"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
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
