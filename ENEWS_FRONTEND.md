# eNews — Frontend Implementation

> **Claude Code:** Tất cả file đặt trong `frontend-react/src/`.
> Dùng đúng tech stack hiện tại: React 18, Vite, Tailwind CSS, DaisyUI, React Query, Zustand, Axios, Lucide React.
> Xem các file hiện có (ví dụ `src/pages/student/Dashboard.jsx`) để viết cùng style và convention.

---

## Route Configuration

### Cập nhật `src/App.jsx`

Thêm public routes **trước** các protected routes hiện tại. Route `/*` phải đặt **cuối cùng**:

```jsx
// Thêm import
import NewsLayout from './components/layout/NewsLayout';

// Trong <Routes>:

{/* ── eNews PUBLIC — đặt trước protected routes ── */}
<Route path="/" element={<Navigate to="/news" replace />} />
<Route path="/news" element={<NewsLayout />}>
  <Route index element={<NewsHomePage />} />
  {/* Route động — resolve từ API */}
</Route>

{/* Route catch-all cho eNews — đặt CUỐI CÙNG */}
<Route path="/*" element={<NewsLayout />} />

{/* Các routes hiện tại giữ nguyên */}
<Route path="/login" element={<Login />} />
<Route path="/admin/*" element={<AdminLayout />} />
...
```

---

## Cấu trúc thư mục mới cần tạo

```
src/
├── pages/
│   └── news/
│       ├── NewsHomePage.jsx          ← Trang chủ eNews
│       ├── PostDetailPage.jsx        ← Chi tiết bài viết
│       ├── CategoryPage.jsx          ← Trang danh mục (list bài)
│       ├── VanBanListPage.jsx        ← Trang danh sách văn bản
│       └── NotFoundPage.jsx          ← 404
│
├── pages/
│   ├── admin/
│   │   ├── news/
│   │   │   ├── TinTucManage.jsx      ← CRUD bài đăng (Admin)
│   │   │   ├── VanBanManage.jsx      ← CRUD văn bản (Admin)
│   │   │   └── ChuyenMucManage.jsx   ← CRUD danh mục cây (Admin)
│   └── bch/
│       └── news/
│           ├── TinTucManage.jsx      ← Tạo/sửa bài đăng (BCH)
│           └── VanBanManage.jsx      ← Upload/quản lý văn bản (BCH)
│
├── components/
│   └── news/
│       ├── layout/
│       │   ├── NewsLayout.jsx        ← Layout tổng (Header + Outlet + Footer)
│       │   ├── NewsHeader.jsx        ← Header với mega menu danh mục
│       │   ├── NewsFooter.jsx
│       │   └── NewsSidebar.jsx       ← Sidebar phải (bài nổi bật, danh mục)
│       ├── public/
│       │   ├── NewsResolver.jsx      ← Gọi API resolve → render đúng component
│       │   ├── PostCard.jsx          ← Card bài viết trong danh sách
│       │   ├── PostCardFeatured.jsx  ← Card bài nổi bật (to hơn)
│       │   ├── Breadcrumb.jsx        ← Breadcrumb navigation
│       │   ├── VanBanCard.jsx        ← Row văn bản trong danh sách
│       │   ├── VanBanAttachment.jsx  ← Khối đính kèm trong bài viết
│       │   ├── ActivityRegisterBtn.jsx ← Nút đăng ký hoạt động + check JWT
│       │   └── CategoryTree.jsx      ← Menu cây danh mục
│       └── manage/
│           ├── TinTucForm.jsx        ← Form tạo/sửa bài đăng
│           ├── VanBanForm.jsx        ← Form tạo/sửa văn bản
│           ├── ChuyenMucForm.jsx     ← Form tạo/sửa danh mục
│           ├── TreePickerModal.jsx   ← Modal chọn danh mục dạng cây
│           ├── VanBanSearchBox.jsx   ← Ô search văn bản (autocomplete)
│           └── RichTextEditor.jsx    ← Editor nội dung (dùng react-quill hoặc tiptap)
│
└── services/
    ├── newsService.js                ← API calls cho tin tức
    ├── vanBanService.js              ← API calls cho văn bản
    └── chuyenMucService.js           ← API calls cho danh mục
```

---

## Component chi tiết

### `NewsResolver.jsx` — Trung tâm điều phối

```jsx
// Logic:
// 1. Lấy path từ URL (useParams với wildcard)
// 2. Gọi GET /api/public/resolve?path={path}
// 3. Render component tương ứng theo response.type

const NewsResolver = () => {
  const { "*": path } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["resolve", path],
    queryFn: () => newsService.resolve(path || ""),
    staleTime: 1000 * 60 * 5, // cache 5 phút
  });

  if (isLoading) return <NewsPageSkeleton />;
  if (isError)   return <NotFoundPage />;

  // Backend trả về type để biết render gì
  if (!data || data.type === "NOT_FOUND") return <NotFoundPage />;
  if (data.type === "REDIRECT") {
    return <Navigate to={"/" + data.redirectTo} replace />;
  }
  if (data.type === "POST")     return <PostDetailPage post={data.post} />;
  if (data.type === "CATEGORY") return <CategoryPage category={data.category} posts={data.posts} />;

  return <NewsHomePage />;
};
```

### `NewsHeader.jsx` — Mega Menu

```jsx
// Header có:
// - Logo + tên trường
// - Navigation: [Trang chủ] [Đoàn Thanh Niên ▼] [Hội Sinh Viên ▼] [Ban-Đội-CLB ▼] [Văn bản]
// - Hover vào mỗi mục → dropdown hiện danh mục cấp 2
// - Hover vào cấp 2 có con → flyout hiện cấp 3
// - Ô tìm kiếm bài viết
// - Nút [Đăng nhập] nếu chưa login, [Tên user] nếu đã login

// Lấy cây danh mục từ: GET /api/public/chuyen-muc/tree
// Cache dài hạn vì ít thay đổi (staleTime: 1000 * 60 * 30)
```

### `Breadcrumb.jsx`

```jsx
// Props: items = [{ ten, fullPathSlug }, ...]
// Render: Trang chủ > Đoàn Thanh Niên > Ba chương trình > Tên bài

// Cũng inject JSON-LD BreadcrumbList vào <head> qua react-helmet-async
const Breadcrumb = ({ items }) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Trang chủ", "item": BASE_URL },
      ...items.map((item, i) => ({
        "@type": "ListItem",
        "position": i + 2,
        "name": item.ten,
        "item": BASE_URL + "/" + item.fullPathSlug
      }))
    ]
  };
  // inject vào head và render visual
};
```

### `TreePickerModal.jsx` — Chọn danh mục

```jsx
// Hiển thị khi click vào ô "Chọn chuyên mục" trong form tạo bài
// Layout: Modal có 2 phần:
//   - Trái: Ô search tìm theo tên + kết quả
//   - Phải: Cây danh mục expand/collapse

// Logic chọn:
// - Click vào bất kỳ node nào (kể cả node cha) → select và đóng modal
// - Highlight node đang được chọn
// - Kết quả search highlight match text

// Sau khi chọn xong → hiển thị breadcrumb xác nhận trong form:
// "Đoàn Thanh Niên > Ba chương trình > Thanh niên tình nguyện  [✕]"
```

### `VanBanSearchBox.jsx` — Tìm văn bản khi tạo bài

```jsx
// Ô input với autocomplete
// Gọi GET /api/news/van-ban/search?keyword={input} (debounce 300ms)
// Hiển thị dropdown với mỗi kết quả:
//   [Icon loại] 12/KH-ĐTN — Kế hoạch TNTN Hè 2025 — 01/03/2025 — 2.3MB PDF
// Click → chọn, hiển thị confirmation card:
//   ✅ 12/KH-ĐTN — Kế hoạch TNTN Hè 2025 (01/03/2025)  [📎 ke-hoach.pdf 2.3MB]  [✕]
// [✕] → bỏ chọn và tìm lại

// Nếu không tìm thấy → "Không tìm thấy văn bản. Bạn có thể upload văn bản mới →"
//   (link mở tab mới đến /bch/news/van-ban/new)
```

### `ActivityRegisterBtn.jsx` — Nút đăng ký hoạt động

```jsx
// Props: hoatDongId, trangThaiHoatDong, hanDangKy, soChoConLai

const ActivityRegisterBtn = ({ hoatDongId, trangThaiHoatDong, hanDangKy, soChoConLai }) => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Nút disable nếu:
  // - trangThaiHoatDong = 'DA_HUY'   → hiện banner "Hoạt động đã bị hủy"
  // - trangThaiHoatDong = 'DONG_DANG_KY' hoặc đã qua hanDangKy → "Đã đóng đăng ký"
  // - soChoConLai = 0 → "Đã hết chỗ"

  const handleClick = () => {
    if (!isAuthenticated) {
      // Redirect đến login, sau khi login quay lại trang hiện tại
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    navigate(`/student/activities/${hoatDongId}/register`);
  };

  if (trangThaiHoatDong === 'DA_HUY') {
    return <div className="alert alert-error">⚠️ Hoạt động này đã bị hủy</div>;
  }
  // ... render button với trạng thái tương ứng
};
```

### `PostDetailPage.jsx` — Trang chi tiết bài viết

```jsx
// Cần inject SEO meta tags qua react-helmet-async:
// <title>{post.tieuDe} | {post.chuyenMuc.ten} | Youth KGU</title>
// <meta name="description" content={post.tomTat} />
// <link rel="canonical" href={BASE_URL + "/" + post.fullUrlPath} />
// <meta property="og:title" ... />
// <meta property="og:description" ... />
// <meta property="og:image" ... />
// JSON-LD BreadcrumbList (từ component Breadcrumb)
// JSON-LD Article

// Layout bài viết:
// [Breadcrumb]
// [Tiêu đề lớn]
// [Meta: ngày đăng | tác giả | lượt xem | chuyên mục]
// [Ảnh đại diện]
// [Nội dung HTML — render bằng dangerouslySetInnerHTML với sanitize]
// [Khối VanBanAttachment — nếu có văn bản đính kèm]
// [ActivityRegisterBtn — nếu có hoạt động liên kết]
// [Bài viết liên quan]
```

### `TinTucForm.jsx` — Form tạo/sửa bài đăng

```jsx
// Fields:
// - Tiêu đề (input, required) → tự động sinh slug preview bên dưới
// - Chuyên mục (TreePickerModal, required) → sau khi chọn hiện breadcrumb
// - Tóm tắt (textarea, max 300 ký tự, hiện counter)
// - Nội dung (RichTextEditor)
// - Ảnh đại diện (upload image)
// - Văn bản đính kèm (VanBanSearchBox, optional)
// - Hoạt động liên kết (search input tên/mã hoạt động, optional)
// - Ghim lên đầu (checkbox)
// - Đơn vị đăng (auto-fill từ thông tin BCH của user)
//
// Buttons:
// [Lưu nháp]  [Xem trước]  [Đăng bài]
//
// Slug preview:
// URL sẽ là: youth-kgu.edu.vn/{fullPathChuyenMuc}/{slug-tự-sinh}
```

---

## Services

### `newsService.js`

```js
import api from '../utils/axios'; // dùng instance axios hiện tại

export const newsService = {
  // Public
  resolve: (path) =>
    api.get(`/api/public/resolve?path=${encodeURIComponent(path)}`).then(r => r.data),

  getDanhSach: (params) =>
    api.get('/api/public/news', { params }).then(r => r.data),

  getCayDanhMuc: () =>
    api.get('/api/public/chuyen-muc/tree').then(r => r.data),

  // Manage (cần JWT — dùng api instance có interceptor)
  create: (data)      => api.post('/api/news', data).then(r => r.data),
  update: (id, data)  => api.put(`/api/news/${id}`, data).then(r => r.data),
  publish: (id)       => api.post(`/api/news/${id}/publish`).then(r => r.data),
  archive: (id)       => api.post(`/api/news/${id}/archive`).then(r => r.data),
  delete: (id)        => api.delete(`/api/news/${id}`).then(r => r.data),
  searchVanBan: (kw)  => api.get(`/api/news/van-ban/search?keyword=${kw}`).then(r => r.data),
};
```

### `vanBanService.js`

```js
export const vanBanService = {
  // Public
  getDanhSach: (params) =>
    api.get('/api/public/van-ban', { params }).then(r => r.data),

  taiVe: (id) =>
    api.get(`/api/public/van-ban/${id}/tai-ve`, { responseType: 'blob' }).then(r => r.data),

  // Manage
  create: (formData) =>   // multipart/form-data (kèm file)
    api.post('/api/van-ban', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),

  update: (id, data)   => api.put(`/api/van-ban/${id}`, data).then(r => r.data),
  publish: (id)        => api.post(`/api/van-ban/${id}/publish`).then(r => r.data),
  replaceFile: (id, f) => api.put(`/api/van-ban/${id}/file`, f, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data),
  delete: (id)         => api.delete(`/api/van-ban/${id}`).then(r => r.data),
};
```

---

## Thêm vào Sidebar hiện tại

### `src/components/layout/Sidebar.jsx` — thêm menu eNews cho Admin và BCH

```jsx
// Admin menu — thêm section mới:
{ icon: Newspaper, label: 'Tin tức eNews',   path: '/admin/news',       permission: PERMISSIONS.DANG_TIN_TUC },
{ icon: FileText,  label: 'Văn bản',         path: '/admin/van-ban',    permission: PERMISSIONS.QUAN_LY_VAN_BAN },
{ icon: FolderTree,label: 'Danh mục',        path: '/admin/chuyen-muc', permission: PERMISSIONS.QUAN_LY_CHUYEN_MUC },

// BCH menu — thêm:
{ icon: Newspaper, label: 'Đăng bài viết',  path: '/bch/news',         permission: PERMISSIONS.DANG_TIN_TUC },
{ icon: FileText,  label: 'Văn bản',        path: '/bch/van-ban',      permission: PERMISSIONS.QUAN_LY_VAN_BAN },
```

### `src/constants/permissions.js` — thêm constants mới

```js
// Thêm vào object PERMISSIONS:
DANG_TIN_TUC:        'DANG_TIN_TUC',
SUA_TIN_TUC:         'SUA_TIN_TUC',
XOA_TIN_TUC:         'XOA_TIN_TUC',
DUYET_TIN_TUC:       'DUYET_TIN_TUC',
QUAN_LY_CHUYEN_MUC:  'QUAN_LY_CHUYEN_MUC',
QUAN_LY_VAN_BAN:     'QUAN_LY_VAN_BAN',
XOA_VAN_BAN:         'XOA_VAN_BAN',
```

### `src/constants/routes.js` — thêm routes mới

```js
// Public eNews
NEWS_HOME:          '/news',

// Admin manage
ADMIN_NEWS:         '/admin/news',
ADMIN_VAN_BAN:      '/admin/van-ban',
ADMIN_CHUYEN_MUC:   '/admin/chuyen-muc',

// BCH manage
BCH_NEWS:           '/bch/news',
BCH_NEWS_CREATE:    '/bch/news/create',
BCH_VAN_BAN:        '/bch/van-ban',
BCH_VAN_BAN_CREATE: '/bch/van-ban/create',
```

---

## Dependency cần cài thêm

```bash
npm install react-helmet-async    # SEO meta tags
npm install react-quill           # Rich text editor (hoặc @tiptap/react)
npm install dompurify             # Sanitize HTML trước khi render nội dung bài viết
```

Thêm vào `main.jsx`:
```jsx
import { HelmetProvider } from 'react-helmet-async';

// Wrap <App /> với <HelmetProvider>
```

---

## Lưu ý quan trọng khi implement

| Vấn đề | Cách xử lý |
|---|---|
| Render HTML nội dung bài | Dùng `DOMPurify.sanitize(post.noiDung)` trước `dangerouslySetInnerHTML` |
| Ảnh trong bài viết | Đảm bảo ảnh responsive: thêm `max-width: 100%` cho img trong CSS |
| Cache danh mục | `staleTime: 30 phút` — ít thay đổi |
| Cache bài viết | `staleTime: 5 phút` |
| SEO trên SPA | Dùng `react-helmet-async` — inject `<title>` và meta vào `<head>` |
| URL tiếng Việt | Dùng `encodeURIComponent` khi truyền path vào API |
| Nút đăng ký + login redirect | Lưu `location.pathname` vào query param `redirect`, sau login navigate về đó |
