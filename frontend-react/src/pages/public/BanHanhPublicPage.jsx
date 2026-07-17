import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileCheck, Download, Calendar, Users, User, Stamp, Clock,
  AlertCircle, Loader2, Eye, X, Ban, CheckCircle2,
} from 'lucide-react';
import banHanhService from '../../services/banHanhService';

export default function BanHanhPublicPage() {
  const { maHoatDong } = useParams();
  const [pdfViewUrl, setPdfViewUrl] = useState(null);

  const { data: list = [], isLoading, isError } = useQuery({
    queryKey: ['ban-hanh-public', maHoatDong],
    queryFn: () => banHanhService.getAllPublic(maHoatDong),
    enabled: !!maHoatDong,
  });

  const activeList  = list.filter(i => i.trangThai !== 'DA_HUY');
  const revokedList = list.filter(i => i.trangThai === 'DA_HUY');
  const latest      = activeList[0] ?? null;

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p>Đang tải thông tin ban hành…</p>
      </div>
    </div>
  );

  if (isError || (!isLoading && activeList.length === 0)) return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Chưa có danh sách ban hành</h2>
        <p className="text-gray-500">Hoạt động <strong>{maHoatDong}</strong> chưa có danh sách điểm danh được ban hành chính thức.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-white">
      {/* Page header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <FileCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Danh sách điểm danh đã ban hành</h1>
            <p className="text-sm text-gray-500">Đoàn Trường Đại học Kiên Giang</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ── Latest published card ── */}
        {latest && (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 px-6 py-5">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span className="text-emerald-200 text-xs font-medium uppercase tracking-wider">Bản ban hành hiện hành</span>
                  </div>
                  <h2 className="text-white text-xl font-bold leading-snug">
                    {latest.tenHoatDong || maHoatDong}
                  </h2>
                  <p className="text-emerald-200 text-sm mt-1">
                    {latest.loaiKy} · {latest.tongSv} sinh viên
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <a href={latest.downloadUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white text-emerald-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors shadow text-sm">
                    <Download className="w-4 h-4" /> Tải về PDF
                  </a>
                  <button
                    onClick={() => setPdfViewUrl(latest.downloadUrl)}
                    className="flex items-center gap-2 bg-emerald-600/50 text-white border border-emerald-300/50 px-5 py-2 rounded-xl hover:bg-emerald-600/70 transition-colors text-sm">
                    <Eye className="w-4 h-4" /> Xem trực tuyến
                  </button>
                </div>
              </div>
            </div>

            {/* Meta info grid */}
            <div className="px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gray-100">
              <InfoCard icon={<Users className="w-4 h-4 text-emerald-500" />}
                label="Số sinh viên" value={`${latest.tongSv} SV`} />
              <InfoCard icon={<User className="w-4 h-4 text-blue-500" />}
                label={latest.loaiKy} value={latest.tenNguoiKy || '—'} />
              <InfoCard icon={<User className="w-4 h-4 text-purple-500" />}
                label="Người lập" value={latest.tenNguoiLap || '—'} />
              <InfoCard icon={<Stamp className="w-4 h-4 text-orange-500" />}
                label="Con dấu" value={latest.coConDau ? 'Có đóng dấu' : 'Không'} />
            </div>

            <div className="px-6 py-3 flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              Ban hành: {latest.createdAt ? new Date(latest.createdAt).toLocaleString('vi-VN') : '—'}
              {latest.nguoiBanHanh && (
                <span>· bởi <strong className="text-gray-600">{latest.nguoiBanHanh}</strong></span>
              )}
            </div>
          </div>
        )}

        {/* ── Lịch sử các phiên bản ── */}
        {(activeList.length > 1 || revokedList.length > 0) && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              Lịch sử ban hành
              <span className="text-xs text-gray-400 font-normal">({list.length} phiên bản)</span>
            </h3>
            <div className="space-y-2">
              {activeList.map((item, idx) => (
                <VersionRow key={item.id} item={item} isLatest={idx === 0}
                  onView={() => setPdfViewUrl(item.downloadUrl)} />
              ))}
              {revokedList.map(item => (
                <VersionRow key={item.id} item={item} isLatest={false} revoked />
              ))}
            </div>
          </div>
        )}

        {/* ── Signature note ── */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-3">
          <FileCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-0.5">Tài liệu được ký số</p>
            <p className="text-blue-600 text-xs">
              File PDF được ký số bằng chứng chỉ điện tử RSA-2048. Mở bằng Adobe Acrobat Reader để xác minh tính hợp lệ của chữ ký.
            </p>
          </div>
        </div>
      </div>

      {/* ── Inline PDF viewer modal ── */}
      {pdfViewUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm flex-shrink-0">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              Xem trực tuyến — {latest?.tenHoatDong || maHoatDong}
            </div>
            <div className="flex items-center gap-2">
              <a href={pdfViewUrl} target="_blank" rel="noopener noreferrer" download
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                <Download className="w-4 h-4" /> Tải về
              </a>
              <button onClick={() => setPdfViewUrl(null)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe src={pdfViewUrl} title="PDF Viewer"
              className="w-full h-full border-0" />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-800 leading-snug">{value}</p>
      </div>
    </div>
  );
}

function VersionRow({ item, isLatest, revoked, onView }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border gap-3 ${
      revoked    ? 'border-red-100 bg-red-50/50 opacity-60'
      : isLatest ? 'border-emerald-200 bg-emerald-50'
                 : 'border-gray-100 bg-gray-50'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        {isLatest && <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-medium flex-shrink-0">Mới nhất</span>}
        {revoked  && (
          <span className="text-xs bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium flex-shrink-0 flex items-center gap-1">
            <Ban className="w-3 h-3" />Đã hủy
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-700 truncate">{item.tenFile}</p>
          <p className="text-xs text-gray-400">
            {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '—'}
            {' · '}{item.tongSv} SV{' · '}{item.tenNguoiKy}
          </p>
        </div>
      </div>
      {!revoked && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {onView && (
            <button onClick={onView}
              className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
              <Eye className="w-3.5 h-3.5" />Xem
            </button>
          )}
          <a href={item.downloadUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50 transition-colors">
            <Download className="w-3.5 h-3.5" />Tải về
          </a>
        </div>
      )}
    </div>
  );
}
