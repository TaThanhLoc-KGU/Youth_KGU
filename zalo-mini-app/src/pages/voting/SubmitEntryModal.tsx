import React, { useState } from "react";
import { Modal, useSnackbar } from "zmp-ui";
import { cuocThiService, uploadService } from "../../services/api";
import { getStoredUser } from "../../services/auth";

export default function SubmitEntryModal({
  visible,
  cuocThiId,
  onClose,
  onSubmitted,
}: {
  visible: boolean;
  cuocThiId: number;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { openSnackbar } = useSnackbar();
  const [ten, setTen] = useState("");
  const [moTa, setMoTa] = useState("");
  const [urlMedia, setUrlMedia] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setTen(""); setMoTa(""); setUrlMedia(""); setFile(null); };

  const handleSubmit = async () => {
    if (!ten.trim()) {
      openSnackbar({ text: "Vui lòng nhập tiêu đề bài dự thi", type: "warning", duration: 2000 });
      return;
    }
    setSubmitting(true);
    try {
      let anhDaiDien = "";
      if (file) {
        const uploadRes = await uploadService.studentUpload(file);
        anhDaiDien = uploadRes.data?.data?.url ?? "";
      }
      await cuocThiService.dangKyNopBai(cuocThiId, {
        ten: ten.trim(),
        moTa: moTa.trim(),
        urlMedia: urlMedia.trim(),
        anhDaiDien,
        hoTen: getStoredUser()?.hoTen ?? "",
      });
      openSnackbar({ text: "Nộp bài dự thi thành công! 🎉", type: "success", duration: 3000 });
      reset();
      onSubmitted();
      onClose();
    } catch (err: any) {
      openSnackbar({ text: err.response?.data?.message ?? "Nộp bài thất bại", type: "error", duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      title="Nộp bài dự thi"
      onClose={() => { reset(); onClose(); }}
      actions={[
        { text: "Hủy", close: true, onClick: reset },
        { text: submitting ? "Đang gửi..." : "Nộp bài", onClick: handleSubmit, highLight: true, disabled: submitting },
      ]}
    >
      <div style={{ padding: "4px 0" }}>
        <div className="form-group">
          <label className="form-label">Tiêu đề bài dự thi *</label>
          <input className="form-input" value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Nhập tiêu đề" />
        </div>
        <div className="form-group">
          <label className="form-label">Ảnh dự thi</label>
          <input
            className="form-input"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Video URL (tùy chọn)</label>
          <input className="form-input" value={urlMedia} onChange={(e) => setUrlMedia(e.target.value)} placeholder="https://..." />
        </div>
        <div className="form-group">
          <label className="form-label">Mô tả</label>
          <textarea
            className="form-input"
            rows={4}
            style={{ resize: "vertical" }}
            value={moTa}
            onChange={(e) => setMoTa(e.target.value)}
            placeholder="Giới thiệu ngắn về bài dự thi..."
          />
        </div>
      </div>
    </Modal>
  );
}
