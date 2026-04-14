import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Search, FileText, Download, FileArchive, FileCode, FileSpreadsheet, FileVideo, FileAudio, FileQuestion } from 'lucide-react';
import bieuMauService from '../../services/bieuMauService';
import { API_BASE_URL } from '../../services/api';

const getFileIcon = (ext) => {
  const e = ext?.toLowerCase() || '';
  if (['doc', 'docx', 'pdf', 'txt'].includes(e)) return <FileText className="w-5 h-5 text-blue-500" />;
  if (['xls', 'xlsx', 'csv'].includes(e)) return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
  if (['zip', 'rar', '7z'].includes(e)) return <FileArchive className="w-5 h-5 text-purple-500" />;
  if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(e)) return <FileCode className="w-5 h-5 text-pink-500" />;
  if (['mp4', 'mov', 'avi'].includes(e)) return <FileVideo className="w-5 h-5 text-red-500" />;
  if (['mp3', 'wav'].includes(e)) return <FileAudio className="w-5 h-5 text-orange-500" />;
  return <FileQuestion className="w-5 h-5 text-gray-400" />;
};

const BieuMauListPage = () => {
  const [keyword, setKeyword] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['bieu-mau-public'],
    queryFn: bieuMauService.getActive,
    staleTime: 5 * 60 * 1000,
  });

  const filteredItems = items.filter(item => 
    item.ten?.toLowerCase().includes(keyword.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Biểu mẫu – Tài liệu | Youth KGU</title>
        <meta name="description" content="Danh sách các biểu mẫu, đơn từ, tài liệu hướng dẫn dành cho sinh viên KGU" />
      </Helmet>

      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Biểu mẫu – Tài liệu</h1>
        <p className="text-gray-500">Tổng hợp các biểu mẫu, đơn từ và tài liệu hướng dẫn cần thiết</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm kiếm biểu mẫu..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-enews-400"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-24" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Không tìm thấy biểu mẫu nào khớp với tìm kiếm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <a
              key={item.id}
              href={`${API_BASE_URL}${item.duongDan}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-enews-200 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-enews-50 transition-colors">
                {getFileIcon(item.loaiFile)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 text-sm mb-0.5 line-clamp-1 group-hover:text-enews-700 transition-colors">
                  {item.ten}
                </h3>
                <p className="text-xs text-gray-400 uppercase font-medium">
                  {item.loaiFile || 'FILE'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 group-hover:text-enews-600 group-hover:bg-enews-50 transition-all">
                <Download className="w-4 h-4" />
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Help Card */}
      <div className="mt-12 p-6 bg-enews-50 rounded-2xl border border-enews-100 flex flex-col sm:flex-row items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-enews-100 flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-enews-600" />
        </div>
        <div className="text-center md:text-left">
          <h4 className="font-bold text-enews-900 text-sm">Không tìm thấy biểu mẫu bạn cần?</h4>
          <p className="text-enews-700 text-xs">Vui lòng liên hệ Văn phòng Đoàn – Hội tại tầng trệt nhà A để được hỗ trợ trực tiếp.</p>
        </div>
      </div>
    </>
  );
};

export default BieuMauListPage;
