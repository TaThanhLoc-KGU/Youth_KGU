import React, { useEffect, useState } from "react";
import { Modal, Spinner } from "zmp-ui";
import { dangKyService } from "../services/api";

export default function QrTicketModal({
  visible,
  maSv,
  maHoatDong,
  tenHoatDong,
  onClose,
}: {
  visible: boolean;
  maSv: string;
  maHoatDong: string;
  tenHoatDong?: string;
  onClose: () => void;
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setError(null);
    setImgSrc(null);
    dangKyService.getQrCode(maSv, maHoatDong)
      .then((res) => {
        const data = res.data;
        if (data && data.success && data.data) {
          const base64 = data.data;
          setImgSrc(base64.startsWith("data:image") ? base64 : "data:image/png;base64," + base64);
        } else {
          setError(data?.message || "Không thể tải mã QR");
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Không thể tải mã QR. Vui lòng thử lại.");
      })
      .finally(() => setLoading(false));

    return () => {
      // Cleanup if needed (not needed for base64 but keeping for consistency)
      setImgSrc(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, maSv, maHoatDong]);

  return (
    <Modal visible={visible} title="Mã QR điểm danh" onClose={onClose} actions={[{ text: "Đóng", close: true }]}>
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        {tenHoatDong && <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{tenHoatDong}</p>}
        {loading ? (
          <div style={{ padding: "24px 0" }}><Spinner /></div>
        ) : error ? (
          <p style={{ fontSize: 13, color: "var(--danger)" }}>{error}</p>
        ) : imgSrc ? (
          <img src={imgSrc} alt="QR" style={{ width: 220, height: 220, margin: "0 auto", borderRadius: 8 }} />
        ) : null}
        {!error && (
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 12 }}>
            Xuất trình mã này cho BCH để điểm danh khi tham gia hoạt động.
          </p>
        )}
      </div>
    </Modal>
  );
}
