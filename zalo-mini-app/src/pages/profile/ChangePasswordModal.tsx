import React, { useState } from "react";
import { Modal, useSnackbar } from "zmp-ui";
import { authService } from "../../services/api";

export default function ChangePasswordModal({
  visible,
  username,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  username: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { openSnackbar } = useSnackbar();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setOldPassword(""); setNewPassword(""); setConfirmPassword("");
  };

  const handleSubmit = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      openSnackbar({ text: "Vui lòng nhập đầy đủ thông tin", type: "warning", duration: 2000 });
      return;
    }
    if (newPassword.length < 6) {
      openSnackbar({ text: "Mật khẩu mới phải từ 6 ký tự", type: "warning", duration: 2000 });
      return;
    }
    if (newPassword !== confirmPassword) {
      openSnackbar({ text: "Xác nhận mật khẩu không khớp", type: "warning", duration: 2000 });
      return;
    }
    setSubmitting(true);
    try {
      await authService.changePassword({ username, oldPassword, newPassword, confirmPassword });
      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      openSnackbar({ text: err.response?.data?.message ?? "Đổi mật khẩu thất bại", type: "error", duration: 2500 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      title="Đổi mật khẩu"
      onClose={() => { reset(); onClose(); }}
      actions={[
        { text: "Hủy", close: true, onClick: reset },
        { text: submitting ? "Đang xử lý..." : "Xác nhận", onClick: handleSubmit, highLight: true, disabled: submitting },
      ]}
    >
      <div style={{ padding: "4px 0" }}>
        <div className="form-group">
          <label className="form-label">Mật khẩu hiện tại</label>
          <input className="form-input" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <div className="form-group">
          <label className="form-label">Mật khẩu mới</label>
          <input className="form-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
        </div>
        <div className="form-group">
          <label className="form-label">Xác nhận mật khẩu mới</label>
          <input className="form-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
        </div>
      </div>
    </Modal>
  );
}
