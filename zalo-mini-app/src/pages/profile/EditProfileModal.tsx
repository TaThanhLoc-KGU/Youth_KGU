import React, { useEffect, useState } from "react";
import { Modal, useSnackbar } from "zmp-ui";
import { accountService, banService } from "../../services/api";
import { AppUser } from "../../services/auth";

interface Ban {
  maBan: string;
  tenBan: string;
}

export default function EditProfileModal({
  visible,
  user,
  onClose,
  onSaved,
}: {
  visible: boolean;
  user: AppUser | null;
  onClose: () => void;
  onSaved: (user: AppUser) => void;
}) {
  const { openSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bans, setBans] = useState<Ban[]>([]);
  const [form, setForm] = useState({
    hoTen: "",
    soDienThoai: "",
    ngaySinh: "",
    gioiTinh: "",
    emailPhu: "",
    banChuyenMon: "",
  });

  useEffect(() => {
    if (!visible || !user?.id) return;
    setLoading(true);
    Promise.all([
      accountService.getMyProfile(),
      banService.getAll().catch(() => ({ data: { data: [] } })),
    ])
      .then(([profileRes, banRes]) => {
        const p = profileRes.data?.data ?? {};
        setForm({
          hoTen: p.hoTen ?? "",
          soDienThoai: p.soDienThoai ?? "",
          ngaySinh: p.ngaySinh ?? "",
          gioiTinh: p.gioiTinh ?? "",
          emailPhu: p.emailPhu ?? "",
          banChuyenMon: p.banChuyenMon ?? "",
        });
        setBans(banRes.data?.data ?? []);
      })
      .catch(() => openSnackbar({ text: "Không thể tải hồ sơ", type: "error", duration: 2000 }))
      .finally(() => setLoading(false));
  }, [visible, user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const res = await accountService.updateProfile(user.id, form);
      const data = res.data?.data ?? {};
      onSaved({ ...user, hoTen: data.hoTen ?? form.hoTen, email: data.email ?? user.email });
      onClose();
    } catch (err: any) {
      openSnackbar({ text: err.response?.data?.message ?? "Cập nhật thất bại", type: "error", duration: 2500 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      title="Sửa hồ sơ cá nhân"
      onClose={onClose}
      actions={[
        { text: "Hủy", close: true },
        { text: saving ? "Đang lưu..." : "Lưu", onClick: handleSave, highLight: true, disabled: saving || loading },
      ]}
    >
      {loading ? (
        <p style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center", padding: "16px 0" }}>Đang tải...</p>
      ) : (
        <div style={{ padding: "4px 0" }}>
          <div className="form-group">
            <label className="form-label">Họ tên</label>
            <input className="form-input" value={form.hoTen} onChange={(e) => setForm({ ...form, hoTen: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Số điện thoại</label>
            <input className="form-input" value={form.soDienThoai} onChange={(e) => setForm({ ...form, soDienThoai: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Ngày sinh</label>
            <input className="form-input" type="date" value={form.ngaySinh ?? ""} onChange={(e) => setForm({ ...form, ngaySinh: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Giới tính</label>
            <select className="form-input" value={form.gioiTinh} onChange={(e) => setForm({ ...form, gioiTinh: e.target.value })}>
              <option value="">— Chọn —</option>
              <option value="NAM">Nam</option>
              <option value="NU">Nữ</option>
              <option value="KHAC">Khác</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Email phụ</label>
            <input className="form-input" type="email" value={form.emailPhu} onChange={(e) => setForm({ ...form, emailPhu: e.target.value })} />
          </div>
          {bans.length > 0 && (
            <div className="form-group">
              <label className="form-label">Ban chuyên môn</label>
              <select className="form-input" value={form.banChuyenMon} onChange={(e) => setForm({ ...form, banChuyenMon: e.target.value })}>
                <option value="">— Chọn —</option>
                {bans.map((b) => (
                  <option key={b.maBan} value={b.maBan}>{b.tenBan}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
