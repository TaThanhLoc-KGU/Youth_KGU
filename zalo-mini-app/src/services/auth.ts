import zmpSdk from "zmp-sdk";
import { authService } from "./api";

export interface ZaloUser {
  id: string;
  name: string;
  avatar: string;
}

export interface AppUser {
  id?: number;
  username?: string;
  maSv: string;
  hoTen: string;
  email: string;
  vaiTro: string;
  avatar?: string;
}

const ZALO_NOT_LINKED_CODE = 4041;

export class ZaloNotLinkedError extends Error {
  constructor() {
    super("Tài khoản Zalo chưa được liên kết mã số sinh viên");
  }
}

function buildAppUserFromAuth(user: any): AppUser {
  return {
    id: user.id,
    username: user.username,
    maSv: user.linkedEntityId ?? "",
    hoTen: user.hoTen ?? "",
    email: user.email ?? "",
    vaiTro: user.vaiTro?.name ?? user.vaiTro ?? "",
  };
}

function persistSession(data: { accessToken: string; refreshToken?: string; user: any }, avatar?: string) {
  localStorage.setItem("jwt_token", data.accessToken);
  if (data.refreshToken) localStorage.setItem("refresh_token", data.refreshToken);
  const appUser = buildAppUserFromAuth(data.user);
  if (avatar) appUser.avatar = avatar;
  localStorage.setItem("user_info", JSON.stringify(appUser));
  window.dispatchEvent(new Event("auth-changed"));
  return appUser;
}

/**
 * Đăng nhập bằng Zalo. Nếu tài khoản Zalo chưa liên kết MSSV nào, ném ZaloNotLinkedError —
 * gọi lại linkZaloAccount(maSv) để liên kết rồi đăng nhập luôn.
 */
export async function loginWithZalo(): Promise<AppUser> {
  // 1. Trigger Zalo login
  await zmpSdk.login({});

  // 2. Lấy access token từ Zalo
  const accessToken = await zmpSdk.getAccessToken({});

  // 3. Lấy user info từ Zalo (để có avatar, tên)
  const userInfo = await zmpSdk.getUserInfo({});

  // 4. Gửi lên backend → nhận JWT (hoặc báo chưa liên kết)
  const res = await authService.loginWithZalo(accessToken ?? "");
  const body = res.data;

  if (!body.success) {
    if (body.errorCode === ZALO_NOT_LINKED_CODE) {
      throw new ZaloNotLinkedError();
    }
    throw new Error(body.message || "Đăng nhập Zalo thất bại");
  }

  return persistSession(body.data, (userInfo as any)?.userInfo?.avatar);
}

/**
 * Liên kết mã số sinh viên với tài khoản Zalo rồi đăng nhập.
 * Luôn lấy accessToken MỚI ngay lúc gọi (không tái dùng token đã lấy trước đó) — token Zalo cấp
 * qua getAccessToken() sống rất ngắn, dùng lại sau khi người dùng đã gõ MSSV xong sẽ bị từ chối.
 */
export async function linkZaloAccount(maSv: string): Promise<AppUser> {
  const accessToken = await zmpSdk.getAccessToken({});
  const res = await authService.linkZalo(accessToken ?? "", maSv);
  const body = res.data;
  if (!body.success) {
    throw new Error(body.message || "Liên kết tài khoản thất bại");
  }
  return persistSession(body.data);
}

export function getStoredUser(): AppUser | null {
  const raw = localStorage.getItem("user_info");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function loginWithPassword(taiKhoan: string, matKhau: string): Promise<AppUser> {
  const res = await authService.loginWithPassword(taiKhoan, matKhau);
  const appUser = persistSession(res.data.data);
  if (!appUser.hoTen) appUser.hoTen = taiKhoan;
  if (!appUser.username) appUser.username = taiKhoan;
  return appUser;
}

export function logout() {
  localStorage.removeItem("jwt_token");
  localStorage.removeItem("user_info");
  localStorage.removeItem("refresh_token");
  window.dispatchEvent(new Event("auth-changed"));
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem("jwt_token");
}

// Các vai trò được phép truy cập trang Quản lý BCH (quét QR, điểm danh thủ công, thống kê).
// So khớp CHÍNH XÁC — không dùng .includes() vì "QUAN_LY_CLB" (chủ nhiệm CLB, không có quyền BCH)
// sẽ vô tình khớp với "QUAN_LY" theo kiểu substring, dẫn tới hiển thị nhầm chức năng rồi lỗi 403 khi bấm.
const MANAGE_ROLES = ["QUAN_LY", "BCH", "ADMIN", "GIAO_VU"];

export function canManageActivities(vaiTro?: string): boolean {
  return !!vaiTro && MANAGE_ROLES.includes(vaiTro);
}
