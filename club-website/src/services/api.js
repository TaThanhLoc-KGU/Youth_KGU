import axios from 'axios';

// Cấu hình URL Backend chung của trường
const API_URL = 'http://localhost:8080/api';

// ID của Câu lạc bộ Truyền thông & Máy tính (Mã CLB trong DB)
export const CLUB_ID = 'CLB001'; 

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add a request interceptor to add the JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const login = async (username, password) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    // Backend Youth_KGU bọc data trong ApiResponse { success, data, message }
    const result = response.data.data || response.data;
    
    let token = null;
    if (typeof result === 'string') {
      token = result; // Trường hợp data chính là token string
    } else if (result && (result.token || result.accessToken)) {
      token = result.token || result.accessToken;
    }

    if (token) {
      localStorage.setItem('token', token);
      // Trả về object có token để đồng bộ với logic ở Login.jsx
      return typeof result === 'string' ? { token } : result;
    }
    return result;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const getMe = async () => {
  try {
    const response = await api.get('/auth/me');
    // Unwrap data từ ApiResponse
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching user info", error);
    throw error;
  }
};

/**
 * Hàm kiểm tra quyền truy cập của User vào CLB (Bản vạn năng)
 */
export const checkUserAccess = (userData) => {
  if (!userData) return false;

  // Chuyển toàn bộ object thành chuỗi hoa để kiểm tra không phân biệt key/value
  const dataString = JSON.stringify(userData).toUpperCase();
  const clubIdUpper = CLUB_ID.toUpperCase();

  const hasClub = dataString.includes(clubIdUpper);
  const hasRole = dataString.includes('QUAN_LY') || dataString.includes('ADMIN');

  console.log("Checking access for:", clubIdUpper);
  console.log("Result - Has Club:", hasClub, "| Has Role:", hasRole);

  // Chỉ cần thỏa mãn 1 trong 2 là cho phép vào
  return hasClub || hasRole;
};

export const getClubNews = async () => {
  try {
    const response = await api.get(`/public/clb/${CLUB_ID}/news`);
    // Unwrap data từ ApiResponse
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching club news", error);
    return [];
  }
};

export const getClubMembers = async () => {
  try {
    const response = await api.get(`/public/clb/${CLUB_ID}/members`);
    // API backend bọc trong ApiResponse.success nên data thực nằm trong response.data.data
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching club members", error);
    return [];
  }
};

export const getRegularMembers = async () => {
  try {
    const response = await api.get(`/public/clb/${CLUB_ID}/thanh-vien`);
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching regular members", error);
    return [];
  }
};

// ==========================================
// ADMIN API (Yêu cầu có Token)
// ==========================================

export const getAdminNews = async () => {
  try {
    const response = await api.get(`/public/clb/${CLUB_ID}/news`);
    return response.data.data || response.data || [];
  } catch (error) {
    console.error("Lỗi lấy danh sách tin tức quản trị", error);
    return [];
  }
};

export const getAdminMembers = async () => {
  try {
    const response = await api.get(`/clb/${CLUB_ID}/thanh-vien`);
    return response.data.data || response.data || [];
  } catch (error) {
    console.error("Lỗi lấy danh sách thành viên", error);
    return [];
  }
};

export const getPendingRequests = async () => {
  try {
    const response = await api.get(`/clb/${CLUB_ID}/dang-ky`, { params: { trangThai: 'CHO_DUYET' } });
    return response.data.data || response.data || [];
  } catch (error) {
    console.error("Lỗi lấy danh sách đăng ký", error);
    return [];
  }
};

export const reviewRequest = async (requestId, isApproved) => {
  try {
    const endpoint = isApproved ? `/clb/${CLUB_ID}/dang-ky/${requestId}/duyet` : `/clb/${CLUB_ID}/dang-ky/${requestId}/tu-choi`;
    const response = await api.put(endpoint);
    return response.data;
  } catch (error) {
    console.error("Lỗi duyệt yêu cầu", error);
    throw error;
  }
};

export default api;
