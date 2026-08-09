import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Page, useSnackbar } from "zmp-ui";
import { Camera } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { isLoggedIn } from "../../services/auth";
import { useSelfScan } from "../../hooks/useSelfScan";

export default function SelfScanPage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const loggedIn = isLoggedIn();
  const { scanning, lastResult, scan } = useSelfScan();
  const [showScanner, setShowScanner] = useState(false);

  if (!loggedIn) {
    return (
      <Page>
        <Header title="Tự điểm danh QR" showBackIcon />
        <div className="login-wall">
          <div className="icon"><Camera size={44} /></div>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>Cần đăng nhập</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
            Đăng nhập để tự điểm danh bằng mã QR
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/profile")}>
            Đăng nhập
          </button>
        </div>
      </Page>
    );
  }

  const handleScanToken = async (token: string) => {
    setShowScanner(false);
    const result = await scan(token);
    openSnackbar({
      text: (result.success ? "✅ " : "❌ ") + result.message,
      type: result.success ? "success" : "error",
      duration: 3000,
    });
  };

  return (
    <Page>
      <Header title="Tự điểm danh QR" showBackIcon />
      <div className="page-content" style={{ textAlign: "center", paddingTop: 40 }}>
        {showScanner ? (
          <div style={{ maxWidth: 400, margin: "0 auto", borderRadius: 16, overflow: "hidden" }}>
            <Scanner
              onScan={(result) => {
                if (result && result.length > 0) {
                  handleScanToken(result[0].rawValue);
                }
              }}
            />
            <button className="btn btn-secondary" style={{ marginTop: 24, padding: "10px 30px", borderRadius: 50 }} onClick={() => setShowScanner(false)}>
              Đóng Camera
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, color: "var(--primary)" }}><Camera size={72} /></div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Quét mã QR điểm danh</h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6, padding: "0 20px" }}>
              Ban quản lý sẽ hiển thị mã QR tại sự kiện.{"\n"}
              Bấm nút bên dưới để mở camera và quét mã.
            </p>

            <button
              className="btn btn-primary"
              style={{ padding: "14px 40px", fontSize: 16, borderRadius: 50, margin: "0 auto", display: "block" }}
              disabled={scanning}
              onClick={() => setShowScanner(true)}
            >
              {scanning ? "Đang xử lý..." : <><Camera size={16} /> Mở camera quét QR</>}
            </button>
          </>
        )}

        {lastResult && (
          <div style={{
            marginTop: 24, padding: "16px 20px", borderRadius: "var(--radius-sm)",
            background: lastResult.success ? "var(--success-bg)" : "var(--danger-bg)",
            color: lastResult.success ? "var(--success)" : "var(--danger)",
          }}>
            <p style={{ fontWeight: 700, marginBottom: 4 }}>
              {lastResult.success ? "✅ Thành công!" : "❌ Thất bại"}
            </p>
            <p style={{ fontSize: 13 }}>{lastResult.message}</p>
          </div>
        )}

        <div className="card" style={{ marginTop: 40, padding: "16px", textAlign: "left" }}>
          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Hướng dẫn:</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>
            1. Đến địa điểm tổ chức hoạt động{"\n"}
            2. Tìm mã QR điểm danh được hiển thị{"\n"}
            3. Bấm "Mở camera quét QR" ở trên{"\n"}
            4. Hướng camera vào mã QR{"\n"}
            5. Hệ thống tự động ghi nhận điểm danh
          </p>
        </div>
      </div>
    </Page>
  );
}
