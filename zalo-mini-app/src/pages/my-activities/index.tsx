import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Page, Spinner, useSnackbar } from "zmp-ui";
import { Lock, CalendarDays, CheckCircle2, Hourglass, Ticket, Calendar, MapPin } from "lucide-react";
import { dangKyService, activityService } from "../../services/api";
import { isLoggedIn, getStoredUser } from "../../services/auth";
import QrTicketModal from "../../components/QrTicketModal";

interface Registration {
  maSv: string;
  maHoatDong: string;
  tenHoatDong: string;
  ngayToChuc: string;
  diaDiem: string;
  daDiemDanh: boolean;
  diemRenLuyen?: number;
  trangThaiHoatDong?: string;
}

export default function MyActivitiesPage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const loggedIn = isLoggedIn();
  const user = getStoredUser();

  const [list, setList] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [qrReg, setQrReg] = useState<Registration | null>(null);

  useEffect(() => {
    if (!loggedIn || !user?.maSv) {
      setLoading(false);
      return;
    }
    dangKyService.getMyRegistrations(user.maSv)
      .then((res) => {
        setList(res.data?.data ?? res.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (reg: Registration) => {
    const ma = reg.maHoatDong;
    setCancelling(ma);
    try {
      await activityService.cancelRegister(ma);
      setList((prev) => prev.filter((r) => r.maHoatDong !== ma));
      openSnackbar({ text: "Đã hủy đăng ký", type: "warning", duration: 2000 });
    } catch (err: any) {
      openSnackbar({ text: err.response?.data?.message ?? "Không thể hủy", type: "error", duration: 2000 });
    } finally {
      setCancelling(null);
    }
  };

  if (!loggedIn) {
    return (
      <Page>
        <Header title="Hoạt động của tôi" showBackIcon />
        <div className="empty-state">
          <div className="icon"><Lock size={44} /></div>
          <p>Vui lòng đăng nhập để xem</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("/profile")}>
            Đăng nhập
          </button>
        </div>
      </Page>
    );
  }

  const attended = list.filter((r) => r.daDiemDanh);
  const pending  = list.filter((r) => !r.daDiemDanh);

  return (
    <Page>
      <Header title="Hoạt động của tôi" showBackIcon />
      <div className="page-content">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}><Spinner /></div>
        ) : list.length === 0 ? (
          <div className="empty-state">
            <div className="icon"><CalendarDays size={44} /></div>
            <p>Bạn chưa đăng ký hoạt động nào</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("/activities")}>
              Xem hoạt động
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="stat-grid">
              <div className="stat-card">
                <span className="stat-icon"><CalendarDays size={26} /></span>
                <div>
                  <p className="stat-value">{list.length}</p>
                  <p className="stat-label">Đã đăng ký</p>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon" style={{ color: "var(--success)" }}><CheckCircle2 size={26} /></span>
                <div>
                  <p className="stat-value" style={{ color: "var(--success)" }}>{attended.length}</p>
                  <p className="stat-label">Đã tham gia</p>
                </div>
              </div>
            </div>

            {/* Chờ tham gia */}
            {pending.length > 0 && (
              <>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Hourglass size={14} /> Chờ tham gia ({pending.length})</p>
                {pending.map((reg) => (
                  <RegCard
                    key={reg.maHoatDong}
                    reg={reg}
                    cancelling={cancelling === reg.maHoatDong}
                    onCancel={() => handleCancel(reg)}
                    onViewDetail={() => navigate(`/activities/${reg.maHoatDong}`)}
                    onShowQr={() => setQrReg(reg)}
                  />
                ))}
              </>
            )}

            {/* Đã tham gia */}
            {attended.length > 0 && (
              <>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}><CheckCircle2 size={14} color="var(--success)" /> Đã tham gia ({attended.length})</p>
                {attended.map((reg) => (
                  <RegCard
                    key={reg.maHoatDong}
                    reg={reg}
                    attended
                    onViewDetail={() => navigate(`/activities/${reg.maHoatDong}`)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {qrReg && (
        <QrTicketModal
          visible={!!qrReg}
          maSv={user?.maSv ?? ""}
          maHoatDong={qrReg.maHoatDong}
          tenHoatDong={qrReg.tenHoatDong}
          onClose={() => setQrReg(null)}
        />
      )}
    </Page>
  );
}

function RegCard({ reg, attended = false, cancelling = false, onCancel, onViewDetail, onShowQr }: {
  reg: Registration;
  attended?: boolean;
  cancelling?: boolean;
  onCancel?: () => void;
  onViewDetail?: () => void;
  onShowQr?: () => void;
}) {
  const canCancel = !attended && reg.trangThaiHoatDong === "DANG_MO_DANG_KY";
  return (
    <div className="card" style={{ borderLeft: `3px solid ${attended ? "var(--success)" : "var(--primary)"}` }}>
      <div className="card-body">
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ color: attended ? "var(--success)" : "var(--warning)", flexShrink: 0 }}>{attended ? <CheckCircle2 size={22} /> : <Hourglass size={22} />}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{reg.tenHoatDong}</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{reg.maHoatDong}</p>
            <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12, color: "var(--text-secondary)", flexWrap: "wrap" }}>
              {reg.ngayToChuc && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> {formatDate(reg.ngayToChuc)}</span>}
              {reg.diaDiem && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {reg.diaDiem}</span>}
              {attended && reg.diemRenLuyen && <span style={{ color: "var(--success)", fontWeight: 700 }}>+{reg.diemRenLuyen} điểm RL</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={onViewDetail}>Chi tiết</button>
          {!attended && onShowQr && (
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={onShowQr}><Ticket size={14} /> Xem QR</button>
          )}
          {canCancel && (
            <button className="btn btn-outline-danger btn-sm" style={{ flex: 1 }} disabled={cancelling} onClick={onCancel}>
              {cancelling ? "Đang hủy..." : "Hủy ĐK"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(s: string): string {
  if (!s) return "";
  const d = new Date(s);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
