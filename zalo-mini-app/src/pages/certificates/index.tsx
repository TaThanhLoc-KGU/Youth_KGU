import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Page } from "zmp-ui";
import { Award, KeyRound, FileText } from "lucide-react";
import { chungNhanService } from "../../services/api";
import { isLoggedIn, getStoredUser } from "../../services/auth";
import { imgUrl } from "../../utils/url";
import ZaloLoginButton from "../../components/ZaloLoginButton";

interface ChungNhan {
  id: number;
  maChungNhan: string;
  tenHoatDong: string;
  ngayCap: string;
  filePath?: string;
}

export default function CertificatesPage() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [records, setRecords] = useState<ChungNhan[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    const maSv = getStoredUser()?.maSv;
    if (!maSv) return;
    setLoading(true);
    chungNhanService.getByStudent(maSv)
      .then((res) => setRecords(res.data?.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (loggedIn) refresh();
  }, [loggedIn]);

  if (!loggedIn) {
    return (
      <Page>
        <Header title="Chứng nhận của tôi" />
        <div className="login-wall">
          <div className="login-hero-icon"><Award size={40} /></div>
          <h3>Đăng nhập để xem chứng nhận</h3>
          <p>Chứng nhận tham gia hoạt động của bạn sẽ hiển thị ở đây</p>
          <ZaloLoginButton className="btn btn-primary" style={{ marginTop: 8 }} onSuccess={() => setLoggedIn(true)}>
            <KeyRound size={16} /> Liên kết tài khoản
          </ZaloLoginButton>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Header title="Chứng nhận của tôi" showBackIcon />
      <div className="page-content">
        {loading ? (
          <SkeletonList />
        ) : records.length === 0 ? (
          <div className="empty-state">
            <div className="icon"><Award size={44} /></div>
            <p>Bạn chưa có chứng nhận nào</p>
            <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => navigate("/activities")}>
              Xem hoạt động
            </button>
          </div>
        ) : (
          records.map((r) => (
            <div key={r.id} className="card">
              <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
                <div className="icon-tile" style={{ background: "var(--warning-bg)" }}><Award size={20} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35 }}>{r.tenHoatDong}</p>
                  <p className="subtle-text" style={{ marginTop: 3 }}>Mã: {r.maChungNhan}</p>
                  {r.ngayCap && <p className="subtle-text" style={{ marginTop: 2 }}>Cấp ngày {formatDate(r.ngayCap)}</p>}
                </div>
                {r.filePath && (
                  <a
                    href={imgUrl(r.filePath)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm btn-auto"
                    style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5 }}
                  >
                    <FileText size={14} /> Tải PDF
                  </a>
                )}
              </div>
            </div>
          ))
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

function formatDate(s: string): string {
  if (!s) return "";
  const d = new Date(s);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
