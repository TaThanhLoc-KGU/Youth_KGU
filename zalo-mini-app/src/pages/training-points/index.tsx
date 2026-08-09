import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Page, Spinner, useSnackbar } from "zmp-ui";
import { Star } from "lucide-react";
import { drlService } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import ZaloLoginButton from "../../components/ZaloLoginButton";

interface DrlRecord {
  hocKy: string;
  namHoc: string;
  tongDiem: number;
  xepLoai: string;
  chiTiet?: { hangMuc: string; diem: number }[];
}

const XEP_LOAI_COLOR: Record<string, string> = {
  "Xuất sắc": "#15803d",
  "Tốt": "#4f46e5",
  "Khá": "#7c3aed",
  "Trung bình": "#c2660a",
  "Yếu": "#dc2626",
  "Kém": "#991b1b",
};

export default function TrainingPointsPage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { loggedIn } = useAuth();
  const [records, setRecords] = useState<DrlRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DrlRecord | null>(null);

  useEffect(() => {
    if (!loggedIn) { setLoading(false); return; }
    drlService.getMy()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        setRecords(Array.isArray(data) ? data : [data]);
      })
      .catch(() => {
        openSnackbar({ text: "Không thể tải điểm rèn luyện", type: "error", duration: 2000 });
      })
      .finally(() => setLoading(false));
  }, [loggedIn]);

  if (!loggedIn) {
    return (
      <Page>
        <Header title="Điểm rèn luyện" showBackIcon />
        <div className="login-wall">
          <div className="icon"><Star size={44} /></div>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>Cần đăng nhập</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
            Đăng nhập để xem điểm rèn luyện của bạn
          </p>
          <ZaloLoginButton className="btn btn-zalo" />
          <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={() => navigate("/profile")}>
            Đăng nhập tài khoản
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Header title="Điểm rèn luyện" showBackIcon />
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
          <Spinner />
        </div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="icon"><Star size={44} /></div>
          <p>Chưa có dữ liệu điểm rèn luyện</p>
        </div>
      ) : (
        <div className="page-content">
          <div style={{ background: "var(--gradient-primary)", borderRadius: "var(--radius)", padding: "18px 16px", marginBottom: 14, color: "#fff", boxShadow: "var(--shadow-primary)" }}>
            <p style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>Học kỳ gần nhất</p>
            <p style={{ fontSize: 28, fontWeight: 800 }}>{records[0]?.tongDiem ?? "—"} điểm</p>
            <p style={{ fontSize: 14, marginTop: 4, fontWeight: 600, opacity: 0.9 }}>
              {records[0]?.xepLoai ?? ""}
            </p>
          </div>

          {records.map((r, i) => (
            <div key={i} className="card" onClick={() => setSelected(selected === r ? null : r)}>
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>
                      {r.hocKy} — {r.namHoc}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                      Tổng điểm: <b>{r.tongDiem}</b>
                    </p>
                  </div>
                  <span style={{
                    padding: "4px 10px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fff",
                    background: XEP_LOAI_COLOR[r.xepLoai] ?? "#6b7280",
                  }}>
                    {r.xepLoai}
                  </span>
                </div>

                {selected === r && r.chiTiet && r.chiTiet.length > 0 && (
                  <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                    {r.chiTiet.map((c, j) => (
                      <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingBottom: 6, borderBottom: j < r.chiTiet!.length - 1 ? "1px dashed var(--border)" : "none", marginBottom: 6 }}>
                        <span style={{ color: "var(--text-secondary)", flex: 1, paddingRight: 8 }}>{c.hangMuc}</span>
                        <span style={{ fontWeight: 700, color: "var(--primary)" }}>{c.diem}</span>
                      </div>
                    ))}
                  </div>
                )}

                {r.chiTiet && r.chiTiet.length > 0 && (
                  <p style={{ fontSize: 12, color: "var(--primary)", marginTop: 8, textAlign: "center" }}>
                    {selected === r ? "Thu gọn ▲" : "Xem chi tiết ▼"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
