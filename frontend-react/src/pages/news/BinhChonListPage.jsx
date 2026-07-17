import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy, Heart, Clock, Users, ChevronRight,
  Star, Music, Camera, Lightbulb, Award, Sparkles, CheckCircle, Loader2,
} from 'lucide-react';
import cuocThiService from '../../services/cuocThiService';

// ─── Category metadata ─────────────────────────────────────────────────────────

const CATEGORY_META = {
  CUOC_THI_HAT:  { emoji: '🎤', label: 'Hát hay',    gradient: 'from-pink-500 to-rose-600' },
  ANH_DEP:       { emoji: '📸', label: 'Ảnh đẹp',    gradient: 'from-blue-500 to-indigo-600' },
  Y_TUONG:       { emoji: '💡', label: 'Ý tưởng',    gradient: 'from-yellow-400 to-amber-500' },
  TRANG_PHUC:    { emoji: '👗', label: 'Trang phục',  gradient: 'from-purple-500 to-violet-600' },
  BAI_VIET:      { emoji: '✍️', label: 'Bài viết',   gradient: 'from-teal-500 to-cyan-600' },
  NHAT_KY:       { emoji: '📔', label: 'Nhật ký',    gradient: 'from-emerald-500 to-green-600' },
  ANH_VIDEO:     { emoji: '📷', label: 'Ảnh/Video',  gradient: 'from-violet-500 to-purple-600' },
  TONG_HOP:      { emoji: '🏆', label: 'Tổng hợp',   gradient: 'from-orange-500 to-amber-600' },
};

function getCategoryMeta(loai) {
  return CATEGORY_META[loai] || { emoji: '🏆', label: loai || 'Cuộc thi', gradient: 'from-orange-400 to-amber-500' };
}

// ─── Status metadata ───────────────────────────────────────────────────────────

const STATUS_META = {
  CHUAN_BI:       { label: 'Sắp diễn ra',      cls: 'bg-gray-100 text-gray-600 border border-gray-200',     pulse: false },
  DANG_MO:        { label: 'Đang mở',           cls: 'bg-green-100 text-green-700 border border-green-200',  pulse: true  },
  DONG_BINH_CHON: { label: 'Đã đóng BCS',      cls: 'bg-orange-100 text-orange-700 border border-orange-200', pulse: false },
  DA_CONG_BO:     { label: 'Đã công bố',        cls: 'bg-purple-100 text-purple-700 border border-purple-200', pulse: false },
  DA_HUY:         { label: 'Đã hủy',            cls: 'bg-red-100 text-red-600 border border-red-200',        pulse: false },
};

function getStatusMeta(trangThai) {
  return STATUS_META[trangThai] || { label: trangThai, cls: 'bg-gray-100 text-gray-600 border border-gray-200', pulse: false };
}

// ─── Countdown (one-shot for card, no interval needed) ────────────────────────

function calcTimeLeft(targetDate) {
  if (!targetDate) return null;
  const diff = new Date(targetDate) - new Date();
  if (diff <= 0) return null;
  return {
    days:  Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins:  Math.floor((diff % 3600000) / 60000),
  };
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ trangThai }) {
  const meta = getStatusMeta(trangThai);
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-0.5 ${meta.cls}`}>
      {meta.pulse && (
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
      )}
      {meta.label}
    </span>
  );
}

// ─── Competition Card ──────────────────────────────────────────────────────────

function CompetitionCard({ ct }) {
  const catMeta        = getCategoryMeta(ct.loaiCuocThi);
  const thiSinhCount   = ct.danhSachThiSinh?.length ?? 0;
  const isOpen         = ct.trangThai === 'DANG_MO';
  const isCongBo       = ct.trangThai === 'DA_CONG_BO';
  const isChuanBi      = ct.trangThai === 'CHUAN_BI';
  const isDaHuy        = ct.trangThai === 'DA_HUY';
  const timeLeft       = isOpen ? calcTimeLeft(ct.thoiGianDongVote) : null;

  const buttonLabel = isCongBo  ? 'Xem kết quả'
    : isOpen       ? 'Bình chọn ngay'
    : isChuanBi    ? 'Sắp diễn ra'
    : isDaHuy      ? 'Đã hủy'
    : 'Xem chi tiết';

  const buttonActive = !isChuanBi && !isDaHuy;

  const buttonCls = isCongBo
    ? 'bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 text-white shadow-sm'
    : isOpen
    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-sm'
    : 'bg-gray-100 text-gray-400 cursor-not-allowed';

  const CardContent = (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
      {/* Cover image */}
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        {ct.anhBia ? (
          <img
            src={ct.anhBia}
            alt={ct.tieuDe}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${catMeta.gradient} flex items-center justify-center`}>
            <span className="text-7xl opacity-90 select-none drop-shadow-lg">{catMeta.emoji}</span>
          </div>
        )}
        {ct.anhBia && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
        )}

        {/* Category badge — top left */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-bold rounded-full px-2.5 py-1 shadow-sm">
            <span>{catMeta.emoji}</span>
            <span>{catMeta.label}</span>
          </span>
        </div>

        {/* Status badge — top right */}
        <div className="absolute top-3 right-3 z-10">
          <StatusBadge trangThai={ct.trangThai} />
        </div>

        {/* Vote counter — bottom right */}
        <div className="absolute bottom-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold rounded-full px-2.5 py-1">
            <Heart className="w-3 h-3 fill-current text-red-400 flex-shrink-0" />
            {(ct.tongSoVote ?? 0).toLocaleString('vi-VN')}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors duration-200">
          {ct.tieuDe}
        </h3>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            {thiSinhCount} thí sinh
          </span>
          {isOpen && timeLeft && (
            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 font-semibold">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {timeLeft.days > 0
                ? `Còn ${timeLeft.days} ngày ${timeLeft.hours}h`
                : `Còn ${timeLeft.hours}h ${timeLeft.mins}m`}
            </span>
          )}
          {isCongBo && (
            <span className="inline-flex items-center gap-1 text-purple-600 font-semibold">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Đã công bố
            </span>
          )}
        </div>

        {/* Activity tag */}
        {ct.tenHoatDong && (
          <p className="text-xs text-gray-400 truncate">
            📅 {ct.tenHoatDong}
          </p>
        )}

        <div className="flex-1" />

        {/* CTA button */}
        <div
          className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 ${buttonCls}`}
        >
          {buttonLabel}
          {buttonActive && <ChevronRight className="w-4 h-4" />}
        </div>
      </div>
    </div>
  );

  if (!buttonActive) {
    return <div className="flex flex-col">{CardContent}</div>;
  }

  return (
    <Link to={`/binh-chon/${ct.slug}`} className="flex flex-col">
      {CardContent}
    </Link>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ tab }) {
  const msgs = {
    tat_ca:   { icon: '🏆', title: 'Chưa có cuộc thi nào', sub: 'Các cuộc thi sẽ được công bố sớm.' },
    dang_mo:  { icon: '🗳️', title: 'Không có cuộc thi đang mở bình chọn', sub: 'Hiện tại chưa có cuộc thi nào đang nhận bình chọn. Hãy quay lại sau!' },
    ket_thuc: { icon: '📋', title: 'Chưa có cuộc thi kết thúc', sub: 'Kết quả sẽ xuất hiện sau khi ban tổ chức công bố.' },
  };
  const m = msgs[tab] || msgs.tat_ca;
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="text-6xl mb-5 select-none">{m.icon}</div>
      <p className="text-lg font-semibold text-gray-700 mb-1">{m.title}</p>
      <p className="text-sm text-gray-400 max-w-xs">{m.sub}</p>
    </div>
  );
}

// ─── Tabs config ───────────────────────────────────────────────────────────────

const TABS = [
  { key: 'tat_ca',   label: 'Tất cả' },
  { key: 'dang_mo',  label: 'Đang mở' },
  { key: 'ket_thuc', label: 'Đã kết thúc & công bố' },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BinhChonListPage() {
  const [activeTab, setActiveTab] = useState('tat_ca');

  // Fetch all — admin endpoint (falls back to getDangMo if 403)
  const {
    data: tatCaList = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['cuoc-thi', 'tat-ca'],
    queryFn: () =>
      cuocThiService.getTatCa().catch(() => cuocThiService.getDangMo()),
    staleTime: 60_000,
  });

  // Fetch specifically open competitions for Đang mở tab accuracy
  const { data: dangMoList = [] } = useQuery({
    queryKey: ['cuoc-thi', 'dang-mo'],
    queryFn: cuocThiService.getDangMo,
    staleTime: 30_000,
  });

  const displayList = useMemo(() => {
    if (activeTab === 'dang_mo')  return dangMoList;
    if (activeTab === 'ket_thuc')
      return tatCaList.filter(
        (ct) => ct.trangThai === 'DONG_BINH_CHON' || ct.trangThai === 'DA_CONG_BO',
      );
    return tatCaList;
  }, [activeTab, tatCaList, dangMoList]);

  const tabCounts = useMemo(() => ({
    tat_ca:   tatCaList.length,
    dang_mo:  dangMoList.length,
    ket_thuc: tatCaList.filter(
      (ct) => ct.trangThai === 'DONG_BINH_CHON' || ct.trangThai === 'DA_CONG_BO',
    ).length,
  }), [tatCaList, dangMoList]);

  return (
    <>
      <Helmet>
        <title>Cuộc thi &amp; Bình chọn | Youth KGU</title>
        <meta
          name="description"
          content="Tham gia bình chọn và theo dõi kết quả các cuộc thi của Đoàn trường KGU."
        />
      </Helmet>

      <div className="space-y-6">
        {/* ── Hero banner ────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 to-rose-500 p-6 sm:p-10 shadow-lg">
          {/* Decorative blobs */}
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          {/* Big trophy watermark */}
          <div className="absolute top-3 right-6 opacity-20 pointer-events-none select-none">
            <Trophy className="w-28 h-28 text-white" />
          </div>

          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-white/80" />
              <span className="text-white/80 text-sm font-semibold tracking-widest uppercase">
                Youth KGU
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight drop-shadow-md">
              🏆 Cuộc thi &amp; Bình chọn
            </h1>
            <p className="text-white/90 text-sm sm:text-base max-w-xl leading-relaxed">
              Ủng hộ thí sinh yêu thích, theo dõi kết quả và tham gia các cuộc thi đầy sôi động của Đoàn trường.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-3 mt-1">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm">
                  {tabCounts.tat_ca} cuộc thi
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
                </span>
                <span className="text-white font-bold text-sm">
                  {tabCounts.dang_mo} đang mở
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <Star className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm">
                  {tabCounts.ket_thuc} đã kết thúc
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab bar ────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="truncate">{tab.label}</span>
                <span
                  className={`flex-shrink-0 text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[20px] text-center leading-none ${
                    isActive
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {tabCounts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Grid / loading / empty ─────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            <p className="text-gray-400 text-sm">Đang tải danh sách cuộc thi...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <span className="text-5xl">⚠️</span>
            <p className="text-gray-600 font-semibold">Không thể tải danh sách</p>
            <p className="text-sm text-gray-400">Vui lòng thử lại sau</p>
          </div>
        ) : displayList.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {displayList.map((ct) => (
              <CompetitionCard key={ct.id} ct={ct} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
