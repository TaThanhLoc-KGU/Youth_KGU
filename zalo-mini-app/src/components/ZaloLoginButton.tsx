import React, { useState } from "react";
import { Modal, useSnackbar } from "zmp-ui";
import { loginWithZalo, linkZaloAccount, ZaloNotLinkedError, AppUser } from "../services/auth";

interface ZaloLoginButtonProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onSuccess?: (user: AppUser) => void;
}

/**
 * Nút "Liên kết tài khoản" (đăng nhập Zalo) dùng chung toàn app.
 * Nếu tài khoản Zalo chưa liên kết MSSV, tự hiện form nhập MSSV để liên kết rồi đăng nhập luôn —
 * không cần mỗi trang tự xử lý luồng ZaloNotLinkedError.
 */
export default function ZaloLoginButton({ className = "btn btn-zalo", style, children, onSuccess }: ZaloLoginButtonProps) {
  const { openSnackbar } = useSnackbar();
  const [busy, setBusy] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [maSv, setMaSv] = useState("");
  const [linking, setLinking] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      const user = await loginWithZalo();
      openSnackbar({ text: "Đăng nhập thành công!", type: "success", duration: 2000 });
      onSuccess?.(user);
    } catch (err: any) {
      if (err instanceof ZaloNotLinkedError) {
        setShowLinkForm(true);
      } else {
        openSnackbar({ text: err?.message || "Đăng nhập Zalo thất bại", type: "error", duration: 2500 });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleLink = async () => {
    if (!maSv.trim()) return;
    setLinking(true);
    try {
      const user = await linkZaloAccount(maSv.trim());
      openSnackbar({ text: "Liên kết tài khoản thành công!", type: "success", duration: 2500 });
      setShowLinkForm(false);
      setMaSv("");
      onSuccess?.(user);
    } catch (err: any) {
      openSnackbar({ text: err?.message || "Liên kết thất bại", type: "error", duration: 3000 });
    } finally {
      setLinking(false);
    }
  };

  return (
    <>
      <button className={className} style={style} onClick={handleClick} disabled={busy}>
        {busy ? "Đang xử lý..." : (children ?? "Liên kết tài khoản")}
      </button>

      <Modal
        visible={showLinkForm}
        title="Liên kết mã số sinh viên"
        onClose={() => { setShowLinkForm(false); setMaSv(""); }}
        actions={[
          { text: "Hủy", close: true },
          { text: linking ? "Đang liên kết..." : "Liên kết", onClick: handleLink, highLight: true, disabled: linking || !maSv.trim() },
        ]}
      >
        <div style={{ padding: "4px 0" }}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.6 }}>
            Tài khoản Zalo này chưa được liên kết với mã số sinh viên nào. Vui lòng nhập mã số sinh viên để liên kết.
          </p>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Mã số sinh viên</label>
            <input
              className="form-input"
              value={maSv}
              onChange={(e) => setMaSv(e.target.value)}
              placeholder="Nhập MSSV"
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
