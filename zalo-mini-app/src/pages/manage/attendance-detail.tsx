import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header, Page, Spinner, Modal, useSnackbar } from "zmp-ui";
import { Wrench, Award, Plus, ClipboardList, CheckCircle2, Users } from "lucide-react";
import { manageService, chungNhanService } from "../../services/api";
import { isLoggedIn, getStoredUser, canManageActivities } from "../../services/auth";
import { getCheckInMethod, getCheckOutMethod } from "../../utils/attendance";

interface DiemDanhRecord {
  id: number;
  maSv: string;
  hoTenSinhVien: string;
  tenLop?: string;
  trangThai?: string;
  thoiGianCheckIn?: string;
  thoiGianCheckOut?: string;
  maQRDaQuet?: string;
  tenNguoiXacNhan?: string;
  tenNguoiCheckOut?: string;
}

interface ChungNhan {
  id: number;
  maChungNhan: string;
  maSv: string;
  hoTenSinhVien: string;
}

interface ChungNhanTemplate {
  id: number;
  ten: string;
}

export default function AttendanceDetailPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const loggedIn = isLoggedIn();
  const user = getStoredUser();
  const canManage = loggedIn && canManageActivities(user?.vaiTro);

  const [records, setRecords] = useState<DiemDanhRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [maSvInput, setMaSvInput] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [certificates, setCertificates] = useState<ChungNhan[]>([]);
  const [issuing, setIssuing] = useState(false);
  const [showConfirmIssue, setShowConfirmIssue] = useState(false);
  const [templates, setTemplates] = useState<ChungNhanTemplate[]>([]);
  const [templateId, setTemplateId] = useState<number | null>(null);

  const refresh = () => {
    if (!activityId) return;
    setLoading(true);
    manageService.getAttendanceByActivity(activityId)
      .then((res) => setRecords(res.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));

    chungNhanService.getByActivity(activityId)
      .then((res) => setCertificates(res.data?.data ?? []))
      .catch(() => {});
  };

  useEffect(() => {
    chungNhanService.getTemplates()
      .then((res) => {
        const list: ChungNhanTemplate[] = res.data?.data ?? [];
        setTemplates(list);
        if (list.length > 0) setTemplateId(list[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (canManage) refresh();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, canManage]);

  const handleManualCheckIn = async () => {
    if (!activityId || !maSvInput.trim()) {
      openSnackbar({ text: "Vui lòng nhập mã sinh viên", type: "warning", duration: 2000 });
      return;
    }
    setSubmitting(true);
    try {
      await manageService.manualCheckIn(activityId, maSvInput.trim(), ghiChu.trim() || undefined);
      openSnackbar({ text: "Điểm danh thủ công thành công! ✅", type: "success", duration: 2500 });
      setMaSvInput(""); setGhiChu("");
      refresh();
    } catch (err: any) {
      openSnackbar({ text: err.response?.data?.message ?? "Điểm danh thất bại", type: "error", duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueCertificates = async () => {
    if (!activityId || !templateId) return;
    setShowConfirmIssue(false);
    setIssuing(true);
    try {
      const res = await chungNhanService.issueBulk(activityId, templateId);
      const count = res.data?.data?.length ?? 0;
      openSnackbar({ text: res.data?.message ?? `Đã cấp ${count} chứng nhận`, type: "success", duration: 3000 });
      refresh();
    } catch (err: any) {
      openSnackbar({ text: err.response?.data?.message ?? "Cấp chứng nhận thất bại", type: "error", duration: 3000 });
    } finally {
      setIssuing(false);
    }
  };

  if (!loggedIn || !canManage) {
    return (
      <Page>
        <Header title="Điểm danh hoạt động" showBackIcon />
        <div className="login-wall">
          <div className="icon"><Wrench size={44} /></div>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>Không có quyền truy cập</p>
          {!loggedIn && (
            <button className="btn btn-primary" onClick={() => navigate("/profile")}>Đăng nhập</button>
          )}
        </div>
      </Page>
    );
  }

  const checkedIn = records.filter((r) => r.thoiGianCheckIn);
  const issuedSet = new Set(certificates.map((c) => c.maSv));

  return (
    <Page>
      <Header title="Điểm danh hoạt động" showBackIcon />
      <div className="page-content">
        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-icon" style={{ color: "var(--success)" }}><CheckCircle2 size={26} /></span>
            <div>
              <p className="stat-value" style={{ color: "var(--success)" }}>{checkedIn.length}</p>
              <p className="stat-label">Đã điểm danh</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon"><Users size={26} /></span>
            <div>
              <p className="stat-value">{records.length}</p>
              <p className="stat-label">Tổng lượt</p>
            </div>
          </div>
        </div>

        {/* Cấp chứng nhận */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><Award size={16} /> Cấp chứng nhận</p>
                <p className="subtle-text" style={{ marginTop: 3 }}>
                  {templates.length === 0
                    ? "Chưa có mẫu chứng nhận — tạo trên web admin trước"
                    : certificates.length > 0
                    ? `Đã cấp ${certificates.length}/${checkedIn.length} sinh viên đã điểm danh`
                    : "Cấp hàng loạt cho sinh viên đã điểm danh"}
                </p>
              </div>
              <button
                className="btn btn-primary btn-sm btn-auto"
                style={{ flexShrink: 0 }}
                disabled={checkedIn.length === 0 || issuing || templates.length === 0}
                onClick={() => setShowConfirmIssue(true)}
              >
                {issuing ? "Đang cấp..." : "Cấp chứng nhận"}
              </button>
            </div>
          </div>
        </div>

        {/* Điểm danh thủ công */}
        <div className="card">
          <div className="card-body">
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Plus size={16} /> Bổ sung điểm danh thủ công</p>
            <div className="form-group">
              <label className="form-label">Mã sinh viên</label>
              <input className="form-input" value={maSvInput} onChange={(e) => setMaSvInput(e.target.value)} placeholder="Nhập MSSV" />
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label className="form-label">Ghi chú (tùy chọn)</label>
              <input className="form-input" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} placeholder="Lý do bổ sung..." />
            </div>
            <button className="btn btn-primary btn-full" disabled={submitting} onClick={handleManualCheckIn}>
              {submitting ? "Đang xử lý..." : "Xác nhận điểm danh"}
            </button>
          </div>
        </div>

        <div className="section-header">
          <span className="section-title"><ClipboardList size={16} /> Danh sách điểm danh</span>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}><Spinner /></div>
        ) : records.length === 0 ? (
          <div className="empty-state"><div className="icon"><ClipboardList size={44} /></div><p>Chưa có ai điểm danh</p></div>
        ) : (
          records.map((r) => {
            const checkInMethod = getCheckInMethod(r);
            const checkOutMethod = getCheckOutMethod(r);
            return (
              <div key={r.id} className="card">
                <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
                  <div className="icon-tile" style={{ background: "var(--success-bg)", color: "var(--success)" }}><CheckCircle2 size={20} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <p style={{ fontWeight: 700, fontSize: 14 }}>{r.hoTenSinhVien}</p>
                      {issuedSet.has(r.maSv) && <span className="badge badge-blue" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Award size={11} /> Đã cấp CN</span>}
                    </div>
                    <p className="subtle-text" style={{ marginTop: 2 }}>{r.maSv}{r.tenLop ? ` · ${r.tenLop}` : ""}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {r.thoiGianCheckIn && (
                        <span className={`method-badge method-${checkInMethod.tone}`}>
                          <checkInMethod.icon size={11} /> {checkInMethod.label}
                        </span>
                      )}
                      {checkOutMethod && (
                        <span className={`method-badge method-${checkOutMethod.tone}`}>
                          <checkOutMethod.icon size={11} /> {checkOutMethod.label}
                        </span>
                      )}
                    </div>
                  </div>
                  {r.thoiGianCheckIn && <span className="subtle-text" style={{ flexShrink: 0 }}>{formatTime(r.thoiGianCheckIn)}</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal
        visible={showConfirmIssue}
        title="Cấp chứng nhận"
        actions={[
          { text: "Hủy", close: true },
          { text: "Cấp chứng nhận", onClick: handleIssueCertificates, highLight: true, disabled: !templateId },
        ]}
        onClose={() => setShowConfirmIssue(false)}
      >
        <div style={{ padding: "4px 0" }}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
            Cấp chứng nhận PDF cho {checkedIn.length} sinh viên đã điểm danh hoạt động này.
          </p>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Mẫu chứng nhận</label>
            <select
              className="form-input"
              value={templateId ?? ""}
              onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : null)}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.ten}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </Page>
  );
}

function formatTime(s: string) {
  const d = new Date(s);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")} ${d.getDate()}/${d.getMonth() + 1}`;
}
