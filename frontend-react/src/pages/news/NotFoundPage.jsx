import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SearchX } from 'lucide-react';

const NotFoundPage = () => (
  <>
    <Helmet>
      <title>404 — Không tìm thấy trang | Youth KGU</title>
    </Helmet>
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <SearchX className="w-20 h-20 text-gray-200 mb-6" />
      <h1 className="text-5xl font-bold text-gray-300 mb-2">404</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy trang</h2>
      <p className="text-gray-500 max-w-sm mb-8">
        Trang bạn tìm kiếm có thể đã bị xóa, đổi địa chỉ hoặc chưa tồn tại.
      </p>
      <Link to="/news" className="bg-enews-600 hover:bg-enews-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors">
        Về trang chủ
      </Link>
    </div>
  </>
);

export default NotFoundPage;
