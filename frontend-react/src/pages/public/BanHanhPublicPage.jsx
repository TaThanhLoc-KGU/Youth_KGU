import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileCheck, Download, Calendar, Users, User, Stamp, Clock, AlertCircle, Loader2 } from 'lucide-react';
import banHanhService from '../../services/banHanhService';

export default function BanHanhPublicPage() {
  const { maHoatDong } = useParams();

  const { data: list = [], isLoading, isError } = useQuery({
    queryKey: ['ban-hanh-public', maHoatDong],
    queryFn: () => banHanhService.getAllPublic(maHoatDong),
    enabled: !!maHoatDong,
  });

  const latest = list[0] ?? null;

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p>Đang tải thông tin ban hành…</p>
      </div>
    </div>
  );

  if (isError || (!isLoading && list.length === 0)) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Chưa có danh sách ban hành</h2>
        <p className="text-gray-500">Hoạt động <strong>{maHoatDong}</strong> chưa có danh sách điểm danh được ban hành chính thức.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <FileCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Danh sách điểm danh đã ban hành</h1>
            <p className="text-sm text-gray-500">Đoàn Trường Đại học Kiên Giang</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Latest published info */}
        {latest && (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Bản ban hành mới nhất</p>
                  <h2 className="text-white text-xl font-bold mt-1">{latest.tenHoatDong || maHoatDong}</h2>
                </div>
                <a
                  href={latest.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white text-emerald-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors shadow"
                >
                  <Download className="w-4 h-4" />
                  Tải về PDF
                </a>
              </div>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoCard icon={<Users className="w-4 h-4 text-emerald-500" />} label="Số sinh viên" value={latest.tongSv + ' SV'} />
              <InfoCard icon={<User className="w-4 h-4 text-blue-500" />} label="Người ký" value={latest.tenNguoiKy || '—'} />
              <InfoCard icon={<User className="w-4 h-4 text-purple-500" />} label="Người lập" value={latest.tenNguoiLap || '—'} />
              <InfoCard icon={<Stamp className="w-4 h-4 text-orange-500" />} label="Con dấu" value={latest.coConDau ? 'Có đóng dấu' : 'Không đóng dấu'} />
            </div>
            <div className="px-6 pb-4 flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              Ban hành lúc: {latest.createdAt ? new Date(latest.createdAt).toLocaleString('vi-VN') : '—'}
              {latest.nguoiBanHanh && <span className="ml-2">bởi <strong className="text-gray-600">{latest.nguoiBanHanh}</strong></span>}
            </div>
          </div>
        )}

        {/* All versions */}
        {list.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              Lịch sử ban hành ({list.length} phiên bản)
            </h3>
            <div className="space-y-2">
              {list.map((item, idx) => (
                <div key={item.id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${idx === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    {idx === 0 && (
                      <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-medium">Mới nhất</span>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.tenFile}</p>
                      <p className="text-xs text-gray-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '—'}
                        {' · '}{item.tongSv} SV
                        {' · '}{item.tenNguoiKy}
                      </p>
                    </div>
                  </div>
                  <a
                    href={item.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-emerald-600 font-medium hover:text-emerald-700"
                  >
                    <Download className="w-4 h-4" />
                    Tải về
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification note */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-3">
          <FileCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Tài liệu có chữ ký số</p>
            <p className="text-blue-600">File PDF này được ký số bằng chứng chỉ điện tử. Mở bằng Adobe Acrobat Reader để xác minh tính hợp lệ của chữ ký.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
