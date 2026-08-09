import { PenLine, UserCog, UserCheck, LucideIcon } from "lucide-react";

export type AttendanceMethodTone = "self" | "staff" | "manual";

export interface AttendanceMethod {
  label: string;
  tone: AttendanceMethodTone;
  icon: LucideIcon;
}

interface CheckInFields {
  maQRDaQuet?: string | null;
  tenNguoiXacNhan?: string | null;
}

interface CheckOutFields {
  thoiGianCheckOut?: string | null;
  tenNguoiCheckOut?: string | null;
}

/** Xác định hình thức check-in: thủ công (BCH nhập tay, không quét) / BCH quét hộ / SV tự quét QR. */
export function getCheckInMethod(r: CheckInFields): AttendanceMethod {
  if (r.maQRDaQuet?.startsWith("MANUAL")) {
    return { label: "Điểm danh thủ công", tone: "manual", icon: PenLine };
  }
  if (r.tenNguoiXacNhan) {
    return { label: `BCH điểm danh: ${r.tenNguoiXacNhan}`, tone: "staff", icon: UserCog };
  }
  return { label: "Sinh viên tự quét QR", tone: "self", icon: UserCheck };
}

/** Xác định hình thức check-out — trả về null nếu chưa check-out. */
export function getCheckOutMethod(r: CheckOutFields): AttendanceMethod | null {
  if (!r.thoiGianCheckOut) return null;
  if (r.tenNguoiCheckOut) {
    return { label: `BCH check-out: ${r.tenNguoiCheckOut}`, tone: "staff", icon: UserCog };
  }
  return { label: "Sinh viên tự check-out", tone: "self", icon: UserCheck };
}
