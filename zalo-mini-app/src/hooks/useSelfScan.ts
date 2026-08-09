import { useState } from "react";
import zmpSdk from "zmp-sdk";
import { attendanceService } from "../services/api";

export interface ScanResult {
  success: boolean;
  message: string;
}

/** Logic dùng chung: quét QR camera → lấy vị trí GPS (best-effort) → gọi self-scan điểm danh. */
export function useSelfScan() {
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);

  const getLocation = async (): Promise<{ zaloLocationToken?: string; zaloAccessToken?: string; lat?: number; lng?: number }> => {
    try {
      const loc = await zmpSdk.getLocation({});
      const zaloLocationToken = (loc as any).token;
      if (zaloLocationToken) {
        const zaloAccessToken = await zmpSdk.getAccessToken({});
        return { zaloLocationToken, zaloAccessToken: zaloAccessToken ?? undefined };
      }
      return { lat: parseFloat(loc.latitude), lng: parseFloat(loc.longitude) };
    } catch {
      // Vị trí là best-effort — không chặn điểm danh nếu user từ chối quyền truy cập vị trí
      return {};
    }
  };

  const scan = async (token: string): Promise<ScanResult> => {
    setScanning(true);
    setLastResult(null);
    try {
      if (!token) throw new Error("Không đọc được mã QR");

      const { zaloLocationToken, zaloAccessToken, lat, lng } = await getLocation();
      const res = await attendanceService.selfScan(token, zaloLocationToken, zaloAccessToken, lat, lng);
      const message = res.data?.message ?? "Điểm danh thành công!";
      const result = { success: true, message };
      setLastResult(result);
      return result;
    } catch (err: any) {
      const message = err.response?.data?.message ?? err.message ?? "Điểm danh thất bại";
      const result = { success: false, message };
      setLastResult(result);
      return result;
    } finally {
      setScanning(false);
    }
  };

  return { scanning, lastResult, scan };
}
