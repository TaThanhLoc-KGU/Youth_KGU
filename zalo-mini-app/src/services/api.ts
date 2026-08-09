import axios from "axios";

const BASE_URL = "https://tuoitre.vnkgu.edu.vn/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url ?? "";
    // Không redirect khi đang login (để hiển thị lỗi sai mật khẩu)
    if (err.response?.status === 401 && !url.includes("/auth/login") && !url.includes("/auth/zalo-login")) {
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("user_info");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  loginWithZalo: (zaloAccessToken: string) =>
    api.post("/auth/zalo-login", { accessToken: zaloAccessToken }),
  linkZalo: (zaloAccessToken: string, maSv: string) =>
    api.post("/auth/zalo-link", { accessToken: zaloAccessToken, maSv }),
  loginWithPassword: (taiKhoan: string, matKhau: string) =>
    api.post("/auth/login", { username: taiKhoan, password: matKhau }),
  getMe: () => api.get("/auth/me"),
  // body: { username, oldPassword, newPassword, confirmPassword }
  changePassword: (data: { username: string; oldPassword: string; newPassword: string; confirmPassword: string }) =>
    api.post("/auth/change-password", data),
};

// ── Tin tức (Public) ─────────────────────────────────────────────────────────
export const newsService = {
  getList: (params?: { page?: number; size?: number; chuyenMucId?: number; keyword?: string }) =>
    api.get("/public/news", { params: { page: 0, size: 10, ...params } }),
  getDetail: (id: number) => api.get(`/public/news/${id}`),
};

// ── Banner chạy ngang + Tin chạy chữ (Public) ─────────────────────────────────
export const contentService = {
  // GET /api/public/slider → List<SliderItemDTO> { id, tieuDe, moTa, hinhAnh, duongDan, thuTu }
  getSlider: () => api.get("/public/slider"),
  // GET /api/public/ticker → List<TickerItemDTO> { id, noiDung, duongDan, thuTu }
  getTicker: () => api.get("/public/ticker"),
};

// ── Hoạt động (Public) ───────────────────────────────────────────────────────
export const activityService = {
  getPublic: () => api.get("/public/hoat-dong"),
  checkRegistration: (ma: string) =>
    api.get("/public/hoat-dong/trang-thai-dang-ky", { params: { ma } }),
  register: (ma: string) =>
    api.post("/public/hoat-dong/dang-ky", null, { params: { ma } }),
  cancelRegister: (ma: string) =>
    api.delete("/public/hoat-dong/huy-dang-ky", { params: { ma } }),
  getThamGia: (ma: string) =>
    api.get("/public/hoat-dong/tham-gia", { params: { ma } }),
};

// ── Đăng ký của sinh viên ────────────────────────────────────────────────────
export const dangKyService = {
  getMyRegistrations: (maSv: string) => api.get(`/dang-ky/student/${maSv}`),
  getQrCode: (maSv: string, maHoatDong: string) => api.get("/dang-ky/qrcode-image", { params: { maSv, maHoatDong } }),
};

// ── Điểm danh ────────────────────────────────────────────────────────────────
export const attendanceService = {
  selfScan: (token: string, zaloLocationToken?: string, zaloAccessToken?: string, latitude?: number, longitude?: number) =>
    api.post("/diem-danh/self-scan", { token, zaloLocationToken, zaloAccessToken, latitude, longitude }),
  getMyHistory: (maSv: string) => api.get(`/diem-danh/student/${maSv}`),
  // BCH: quét QR và ghi nhận điểm danh cho sinh viên
  bchScan: (token: string) => api.post("/diem-danh/bch-scan", { token }),
  // GET /api/diem-danh/activity/{maHoatDong} — cần quyền XEM_DIEM_DANH
  getActivityAttendance: (maHoatDong: string) => api.get(`/diem-danh/activity/${maHoatDong}`),
};

// ── Điểm rèn luyện ───────────────────────────────────────────────────────────
export const drlService = {
  getMy: () => api.get("/diem-ren-luyen/my"),
  getByMaSv: (maSv: string) => api.get(`/diem-ren-luyen/student/${maSv}`),
};

// ── Bình chọn / Cuộc thi (Public) ────────────────────────────────────────────
export const votingService = {
  getList: () => api.get("/public/cuoc-thi/tat-ca"),
  getDetail: (slug: string) => api.get(`/public/cuoc-thi/slug/${slug}`),
  // ThiSinh nằm trong CuocThiDTO.danhSachThiSinh — không cần endpoint riêng
  vote: (cuocThiId: number, thiSinhId: number) =>
    api.post("/binh-chon", { cuocThiId, thiSinhId }),
};

// ── Ban hành (Public) ────────────────────────────────────────────────────────
export const banHanhService = {
  getList: (params?: { page?: number; size?: number; search?: string }) =>
    api.get("/public/ban-hanh/tat-ca", { params: { page: 0, size: 20, ...params } }),
  getByHoatDong: (maHoatDong: string) =>
    api.get(`/public/ban-hanh/all/${maHoatDong}`),
  download: (id: number) =>
    api.get(`/public/ban-hanh/${id}/download`, { responseType: "blob" }),
};

// ── Văn bản (Public) ─────────────────────────────────────────────────────────
export const vanBanService = {
  getList: (params?: { page?: number; size?: number; keyword?: string }) =>
    api.get("/public/van-ban", { params: { page: 0, size: 20, ...params } }),
};

// ── Biểu mẫu (Public) ────────────────────────────────────────────────────────
export const bieuMauService = {
  getList: (params?: { keyword?: string }) =>
    api.get("/public/bieu-mau", { params }),
};

// ── Câu lạc bộ ───────────────────────────────────────────────────────────────
export const clbService = {
  getList: () => api.get("/clb"),                         // requires auth
  getMyMembership: () => api.get("/clb/my-membership"),   // danh sách CLB đang là thành viên
  // Lưu ý: backend chưa có endpoint tự đăng ký tham gia CLB (POST /clb/{ma}/dang-ky)
  // nên mini app chỉ hiển thị trạng thái, chưa có nút "Tham gia" thật.
};

// ── Tài khoản / Hồ sơ cá nhân ─────────────────────────────────────────────────
export const accountService = {
  getMyProfile: () => api.get("/accounts/me"),
  updateProfile: (accountId: number, data: Record<string, any>) =>
    api.put(`/accounts/${accountId}/profile`, data),
};

// ── Ban chuyên môn ───────────────────────────────────────────────────────────
export const banService = {
  getAll: () => api.get("/ban"),
};

// ── Cuộc thi (Public + nộp bài) ────────────────────────────────────────────────
export const cuocThiService = {
  getDangMo: () => api.get("/public/cuoc-thi"),
  getTatCa: () => api.get("/public/cuoc-thi/tat-ca"),
  getBySlug: (slug: string) => api.get(`/public/cuoc-thi/slug/${slug}`),
  // ThiSinhDTO: { ten, moTa, anhDaiDien, urlMedia, noiDung, hoTen }
  dangKyNopBai: (id: number, data: Record<string, any>) =>
    api.post(`/cuoc-thi/${id}/dang-ky-nop-bai`, data),
};

// ── Upload ảnh (sinh viên) ───────────────────────────────────────────────────
export const uploadService = {
  studentUpload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/student/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ── Chứng nhận ───────────────────────────────────────────────────────────────
export const chungNhanService = {
  // POST /api/chung-nhan/issue/bulk/{maHoatDong}?templateId= — cần quyền QUAN_LY_DANG_KY
  issueBulk: (maHoatDong: string, templateId: number) =>
    api.post(`/chung-nhan/issue/bulk/${maHoatDong}`, null, { params: { templateId } }),
  // GET /api/chung-nhan/activity/{maHoatDong} — cần quyền XEM_LICH_SU_THAM_GIA
  getByActivity: (maHoatDong: string) => api.get(`/chung-nhan/activity/${maHoatDong}`),
  // GET /api/chung-nhan/student/{maSv} — sinh viên luôn xem được chứng nhận của chính mình
  getByStudent: (maSv: string) => api.get(`/chung-nhan/student/${maSv}`),
  // GET /api/chung-nhan-mau — danh sách mẫu chứng nhận đã thiết kế sẵn (trên web admin)
  getTemplates: () => api.get("/chung-nhan-mau"),
};

// ── BCH: Quản lý ─────────────────────────────────────────────────────────────
export const manageService = {
  getActivities: () => api.get("/hoat-dong"),
  // GET /api/thong-ke/dashboard — cần đăng nhập
  getStats: () => api.get("/thong-ke/dashboard"),
  // GET /api/diem-danh/activity/{maHoatDong} — cần quyền XEM_DIEM_DANH
  getAttendanceByActivity: (maHoatDong: string) =>
    api.get(`/diem-danh/activity/${maHoatDong}`),
  // POST /api/diem-danh/manual — cần quyền CHINH_SUA_DIEM_DANH
  // body: { maHoatDong, maSvList: string[], ghiChu? }
  manualCheckIn: (maHoatDong: string, maSv: string, ghiChu?: string) =>
    api.post("/diem-danh/manual", { maHoatDong, maSvList: [maSv], ghiChu }),
};
