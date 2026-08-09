import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Page } from "zmp-ui";
import { Hand, KeyRound, Camera, ClipboardList, CheckCircle2 } from "lucide-react";
import { attendanceService } from "../../services/api";
import { isLoggedIn, getStoredUser } from "../../services/auth";
import { getCheckInMethod, getCheckOutMethod } from "../../utils/attendance";
import ZaloLoginButton from "../../components/ZaloLoginButton";

interface AttendanceRecord {
  id: number;
  tenHoatDong: string;
  thoiGianCheckIn: string;
  thoiGianCheckOut?: string;
  trangThai: string;
  maQRDaQuet?: string;
  tenNguoiXacNhan?: string;
  tenNguoiCheckOut?: string;
}

export default function AttendancePage() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshHistory = () => {
    const maSv = getStoredUser()?.maSv;
    if (!maSv) return;
    setLoading(true);
    // GET /api/diem-danh/student/{maSv} → ApiResponse<List<DiemDanhHoatDongDTO>>
    attendanceService.getMyHistory(maSv)
      .then((res) => setRecords(res.data?.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (loggedIn) refreshHistory();
  }, [loggedIn]);

  if (!loggedIn) {
    return (
      <Page>
        <Header title="Điểm danh" />
        <div className="login-wall">
          <div className="login-hero-icon"><Hand size={40} /></div>
          <h3>Đăng nhập để điểm danh</h3>
          <p>Bạn cần đăng nhập bằng Zalo để sử dụng tính năng điểm danh</p>
          <ZaloLoginButton className="btn btn-primary" style={{ marginTop: 8 }} onSuccess={() => setLoggedIn(true)}>
            <KeyRound size={16} /> Liên kết tài khoản
          </ZaloLoginButton>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Header title="Điểm danh" />
      <div className="page-content">

        {/* QR Scan */}
        <div className="card">
          <div className="card-body">
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Camera size={16} /> Quét mã QR điểm danh</p>
            <p className="subtle-text" style={{ marginBottom: 14, lineHeight: 1.6 }}>
              Ban tổ chức sẽ hiển thị mã QR động. Mở camera và quét mã để tự điểm danh — hệ thống sẽ ghi nhận đây là hình thức "sinh viên tự quét".
            </p>
            <button
              className="btn btn-primary btn-full"
              onClick={() => navigate("/self-scan")}
            >
              <Camera size={16} /> Mở camera quét QR
            </button>
          </div>
        </div>

        {/* Lịch sử */}
        <div className="section-header" style={{ marginTop: 4 }}>
          <span className="section-title"><ClipboardList size={16} /> Lịch sử điểm danh</span>
        </div>

        {loading ? (
          <SkeletonList />
        ) : records.length === 0 ? (
          <div className="empty-state">
            <div className="icon"><ClipboardList size={44} /></div>
            <p>Chưa có lịch sử điểm danh</p>
          </div>
        ) : (
          records.map((r) => {
            const checkInMethod = getCheckInMethod(r);
            const checkOutMethod = getCheckOutMethod(r);
            return (
              <div key={r.id} className="card">
                <div className="card-body" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px" }}>
                  <div className="icon-tile" style={{ background: "var(--success-bg)", color: "var(--success)" }}><CheckCircle2 size={20} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35 }}>{r.tenHoatDong}</p>
                      <span className="badge badge-green" style={{ flexShrink: 0 }}>{r.trangThai ?? "Đã điểm danh"}</span>
                    </div>
                    <p className="subtle-text" style={{ marginTop: 4 }}>
                      Check-in {formatDateTime(r.thoiGianCheckIn)}
                    </p>
                    {r.thoiGianCheckOut && (
                      <p className="subtle-text" style={{ marginTop: 2 }}>
                        Check-out {formatDateTime(r.thoiGianCheckOut)}
                      </p>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      <span className={`method-badge method-${checkInMethod.tone}`}>
                        <checkInMethod.icon size={11} /> {checkInMethod.label}
                      </span>
                      {checkOutMethod && (
                        <span className={`method-badge method-${checkOutMethod.tone}`}>
                          <checkOutMethod.icon size={11} /> {checkOutMethod.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Page>
  );
}

function SkeletonList() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="card" style={{ padding: "14px 16px", display: "flex", gap: 12 }}>
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 14, width: "70%", marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 11, width: "45%" }} />
          </div>
        </div>
      ))}
    </>
  );
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")} - ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
