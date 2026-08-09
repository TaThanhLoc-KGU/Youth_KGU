import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Header, Page, Spinner, Modal, useSnackbar } from "zmp-ui";
import { Frown, MapPin, Calendar, Users, Ticket, Check, X, KeyRound } from "lucide-react";
import { activityService } from "../../services/api";
import { isLoggedIn, loginWithZalo, getStoredUser } from "../../services/auth";
import { imgUrl, rewriteHtmlImageSrc } from "../../utils/url";
import QrTicketModal from "../../components/QrTicketModal";

interface ActivityDetail {
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
}

interface ThamGia {
  hoTen: string;
  tenLop: string;
  daDiemDanh: boolean;
}

export default function ActivityDetailPage() {
  const { id: maHoatDong } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { openSnackbar } = useSnackbar();

  // Dữ liệu được truyền từ list page qua navigate state
  const [activity, setActivity] = useState<ActivityDetail | null>(
    (location.state as ActivityDetail) ?? null
  );
  const [loading, setLoading] = useState(!activity);
  const [registering, setRegistering] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  // Trạng thái đăng ký
  const [daDangKy, setDaDangKy] = useState(false);
  const [thamGia, setThamGia] = useState<ThamGia[]>([]);
  const [showThamGia, setShowThamGia] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const loggedIn = isLoggedIn();

  // Kiểm tra trạng thái đăng ký nếu đã login
  const fetchRegistrationStatus = () => {
    if (!loggedIn || !maHoatDong) return;
    activityService.checkRegistration(maHoatDong)
      .then((res) => {
        setDaDangKy(res.data?.data?.daDangKy === true);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (activity) {
      setLoading(false);
      fetchRegistrationStatus();
    } else if (maHoatDong) {
      // Nếu không có state (user mở trực tiếp từ link), tải từ API
      activityService.getPublic()
        .then((res) => {
          const all = res.data?.data ?? [];
          const found = all.find((a: any) => a.maHoatDong === maHoatDong);
          if (found) setActivity(found);
        })
        .finally(() => {
          setLoading(false);
          fetchRegistrationStatus();
        });
    } else {
      setLoading(false);
    }

    if (maHoatDong) {
      activityService.getThamGia(maHoatDong)
        .then((res) => setThamGia(res.data?.data ?? []))
        .catch(() => {});
    }
  }, [maHoatDong]);

  const handleRegister = async () => {
    if (!loggedIn) {
      try {
        await loginWithZalo();
        openSnackbar({ text: "Đăng nhập thành công!", type: "success", duration: 2000 });
        fetchRegistrationStatus();
      } catch {
        openSnackbar({ text: "Đăng nhập thất bại", type: "error", duration: 2000 });
      }
      return;
    }
    setShowConfirm(true);
  };

  const confirmRegister = async () => {
    if (!maHoatDong) return;
    setRegistering(true);
    setShowConfirm(false);
    try {
      // POST /api/public/hoat-dong/dang-ky?ma={maHoatDong}
      await activityService.register(maHoatDong);
      openSnackbar({ text: "Đăng ký thành công! 🎉", type: "success", duration: 3000 });
      setDaDangKy(true);
    } catch (err: any) {
      openSnackbar({
        text: err.response?.data?.message ?? "Đăng ký thất bại",
        type: "error",
        duration: 3000,
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleCancel = async () => {
    if (!maHoatDong) return;
    setRegistering(true);
    try {
      // DELETE /api/public/hoat-dong/huy-dang-ky?ma={maHoatDong}
      await activityService.cancelRegister(maHoatDong);
      openSnackbar({ text: "Đã hủy đăng ký", type: "warning", duration: 2000 });
      setDaDangKy(false);
    } catch (err: any) {
      openSnackbar({
        text: err.response?.data?.message ?? "Không thể hủy",
        type: "error",
        duration: 2000,
      });
    } finally {
      setRegistering(false);
    }
  };

  const canRegister = activity && (
    activity.trangThai === "DANG_MO_DANG_KY" || activity.trangThai === "SAP_DIEN_RA"
  ) && (!activity.soLuongToiDa || activity.soNguoiDangKy < activity.soLuongToiDa);

  if (loading)
    return (
      <Page>
        <Header title="Chi tiết hoạt động" showBackIcon />
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
          <Spinner />
        </div>
      </Page>
    );

  if (!activity)
    return (
      <Page>
        <Header title="Chi tiết hoạt động" showBackIcon />
        <div className="empty-state">
          <div className="icon"><Frown size={44} /></div>
          <p>Không tìm thấy hoạt động</p>
          <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ marginTop: 12 }}>
            Quay lại
          </button>
        </div>
      </Page>
    );

  return (
    <Page>
      <Header title="Chi tiết hoạt động" showBackIcon />
      <>
        <div style={{ paddingTop: "var(--header-height)", paddingBottom: "calc(140px + env(safe-area-inset-bottom, 0px))" }}>
          <div
            style={{
              height: 200,
              background: imgUrl(activity.hinhAnhPoster)
                ? `url(${imgUrl(activity.hinhAnhPoster)}) center/cover`
                : "var(--gradient-primary)",
            }}
          />
          <div style={{ padding: "16px 14px" }}>
            <h1 className="page-title" style={{ lineHeight: 1.35, marginBottom: 12 }}>
              {activity.tenHoatDong}
            </h1>

            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-body">
                {activity.diaDiem && <InfoRow icon={<MapPin size={16} />} text={activity.diaDiem} />}
                {activity.ngayToChuc && (
                  <InfoRow
                    icon={<Calendar size={16} />}
                    text={
                      activity.ngayKetThuc && activity.ngayKetThuc !== activity.ngayToChuc
                        ? `${formatDate(activity.ngayToChuc)} – ${formatDate(activity.ngayKetThuc)}`
                        : formatDate(activity.ngayToChuc)
                    }
                  />
                )}
                {activity.soLuongToiDa > 0 && (
                  <InfoRow
                    icon={<Users size={16} />}
                    text={`${activity.soNguoiDangKy ?? 0}/${activity.soLuongToiDa} người đã đăng ký`}
                  />
                )}
              </div>
            </div>

            {activity.moTa && (
              <>
                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Mô tả</p>
                <div
                  style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text)" }}
                  dangerouslySetInnerHTML={{ __html: rewriteHtmlImageSrc(activity.moTa) }}
                />
              </>
            )}

            {daDangKy && loggedIn && (
              <button className="btn btn-secondary" style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => setShowQr(true)}>
                <Ticket size={16} /> Xem mã QR điểm danh
              </button>
            )}

            {thamGia.length > 0 && (
              <div className="card" style={{ marginTop: 16 }}>
                <div className="card-body" style={{ cursor: "pointer" }} onClick={() => setShowThamGia((v) => !v)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><Users size={15} /> Đã tham gia ({thamGia.length})</p>
                    <span style={{ fontSize: 12, color: "var(--primary)" }}>{showThamGia ? "Thu gọn ▲" : "Xem ▼"}</span>
                  </div>
                  {showThamGia && (
                    <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                      {thamGia.map((t, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0" }}>
                          <span>{t.hoTen} <span style={{ color: "var(--text-muted)" }}>· {t.tenLop}</span></span>
                          {t.daDiemDanh && <span style={{ color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 3 }}><Check size={13} /> Đã điểm danh</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA button */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "12px 14px calc(50px + env(safe-area-inset-bottom, 0px))",
            background: "var(--card-bg)",
            boxShadow: "0 -2px 8px rgba(0,0,0,0.08)",
          }}
        >
          {daDangKy ? (
            <button
              className="btn btn-outline btn-full"
              onClick={handleCancel}
              disabled={registering}
              style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
            >
              {registering ? "Đang xử lý..." : <><X size={16} /> Hủy đăng ký</>}
            </button>
          ) : canRegister ? (
            <button
              className="btn btn-primary btn-full"
              onClick={handleRegister}
              disabled={registering}
            >
              {registering
                ? "Đang đăng ký..."
                : loggedIn
                ? <><Check size={16} /> Đăng ký tham gia</>
                : <><KeyRound size={16} /> Đăng nhập để đăng ký</>}
            </button>
          ) : (
            <button
              className="btn btn-full"
              disabled
              style={{ background: "var(--border)", color: "var(--text-secondary)" }}
            >
              {activity.trangThai === "DA_KET_THUC" || activity.trangThai === "DA_HOAN_THANH"
                ? "Hoạt động đã kết thúc"
                : activity.trangThai === "DA_HUY"
                ? "Hoạt động đã hủy"
                : "Hết chỗ"}
            </button>
          )}
        </div>

        <Modal
          visible={showConfirm}
          title="Xác nhận đăng ký"
          description={`Bạn muốn đăng ký tham gia "${activity.tenHoatDong}"?`}
          actions={[
            { text: "Hủy", close: true },
            { text: "Đăng ký", onClick: confirmRegister, highLight: true },
          ]}
          onClose={() => setShowConfirm(false)}
        />

        {maHoatDong && (
          <QrTicketModal
            visible={showQr}
            maSv={getStoredUser()?.maSv ?? ""}
            maHoatDong={maHoatDong}
            tenHoatDong={activity.tenHoatDong}
            onClose={() => setShowQr(false)}
          />
        )}
      </>
    </Page>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, paddingBlock: 6, fontSize: 14 }}>
      <span>{icon}</span>
      <span style={{ flex: 1 }}>{text}</span>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
