import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Trophy, Heart, Check, Loader2, ChevronLeft, Users, Star,
  Eye, EyeOff, Clock, Music, Award, Share2, Medal, Camera, Upload, X as XIcon,
} from 'lucide-react';
import { toast } from 'react-toastify';
import cuocThiService from '../../services/cuocThiService';
import uploadService from '../../services/uploadService';
import useAuthStore from '../../stores/authStore';
import BlockEditor from '../../components/common/BlockEditor';

// ─── Device fingerprint ────────────────────────────────────────────────────────

function getDeviceId() {
  let id = localStorage.getItem('_vote_device_id');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('_vote_device_id', id);
  }
  return id;
}

// ─── Countdown hook ────────────────────────────────────────────────────────────

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({});
  useEffect(() => {
    if (!targetDate) return;
    const calc = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) { setTimeLeft({ expired: true }); return; }
      const days  = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins  = Math.floor((diff % 3600000) / 60000);
      const secs  = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ days, hours, mins, secs, expired: false });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [targetDate]);
  return timeLeft;
}

// ─── Shared upload slot cho nhóm ảnh ──────────────────────────────────────────

function GroupSlot({ value, onChange, onRemove, label }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try { onChange(await uploadService.studentUpload(file)); }
    catch { toast.error('Upload thất bại'); }
    finally { setUploading(false); }
  };
  if (value) return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{height:90}}>
      <img src={value} alt="" className="w-full h-full object-cover" />
      <button type="button" onClick={onRemove}
        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
        <XIcon className="w-3 h-3 text-white" />
      </button>
    </div>
  );
  return (
    <>
      <button type="button" onClick={() => ref.current?.click()}
        className="w-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-orange-400 hover:bg-orange-50 transition-colors"
        style={{height:90}}>
        {uploading ? <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
          : <><Upload className="w-4 h-4 text-gray-400" /><span className="text-[10px] text-gray-400">{label}</span></>}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => handleFile(e.target.files?.[0])} />
    </>
  );
}

// ─── Đăng ký nộp bài form ──────────────────────────────────────────────────────

function DangKyNopBaiForm({ cuocThiId, hanNop, onSuccess }) {
  const [ten, setTen]           = useState('');
  const [moTa, setMoTa]         = useState('');
  const [anhDaiDien, setAnhDaiDien] = useState('');
  const [urlMedia, setUrlMedia] = useState('');
  const [blocks, setBlocks]     = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const mainFileRef = useRef();

  const hanNopExpired = hanNop && new Date() > new Date(hanNop);

  const handleMainUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadService.studentUpload(file);
      setAnhDaiDien(url);
    } catch { toast.error('Upload ảnh thất bại'); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ten.trim()) { toast.error('Vui lòng nhập tên/tiêu đề'); return; }
    setSubmitting(true);
    try {
      const validBlocks = blocks.filter(b =>
        (b.type === 'image' && b.url) || (b.type === 'text' && b.content?.trim())
      );
      await cuocThiService.dangKyNopBai(cuocThiId, {
        ten: ten.trim(),
        moTa: moTa.trim(),
        anhDaiDien,
        urlMedia: urlMedia.trim(),
        loaiNopBai: 'ANH_VIDEO',
        noiDung: validBlocks.length ? JSON.stringify(validBlocks) : null,
      });
      toast.success('Đăng ký nộp bài thành công! Ban tổ chức sẽ xét duyệt sớm.');
      onSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Đăng ký thất bại');
    } finally { setSubmitting(false); }
  };

  if (hanNopExpired) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
        <p className="text-red-700 font-semibold">⏰ Đã hết hạn nộp bài</p>
        <p className="text-red-600 text-sm mt-1">Hạn nộp: {new Date(hanNop).toLocaleString('vi-VN')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {hanNop && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⏰ Hạn nộp bài: <strong>{new Date(hanNop).toLocaleString('vi-VN')}</strong>
        </div>
      )}

      {/* Tên / tiêu đề */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Tiêu đề / Tên thí sinh <span className="text-red-500">*</span></label>
        <input value={ten} onChange={e => setTen(e.target.value)} required
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          placeholder="VD: Nguyễn Văn A — Bức ảnh mùa xuân..." />
      </div>

      {/* Ảnh đại diện (thumbnail) */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          Ảnh đại diện (thumbnail) <span className="text-gray-400 font-normal">— hiển thị trên danh sách bình chọn</span>
        </label>
        {anhDaiDien ? (
          <div className="relative rounded-xl overflow-hidden border" style={{height: 160}}>
            <img src={anhDaiDien} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => setAnhDaiDien('')}
              className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow">
              <XIcon className="w-4 h-4 text-red-500" />
            </button>
          </div>
        ) : (
          <div onClick={() => mainFileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
            {uploading ? <Loader2 className="w-7 h-7 animate-spin text-orange-500 mx-auto" />
              : <><Camera className="w-7 h-7 text-gray-400 mx-auto mb-1.5" />
                <p className="text-sm text-gray-500">Nhấn để tải ảnh thumbnail</p></>}
          </div>
        )}
        <input ref={mainFileRef} type="file" accept="image/*" className="hidden"
          onChange={e => handleMainUpload(e.target.files?.[0])} />
      </div>

      {/* Block editor — dàn trang bài dự thi */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Nội dung bài dự thi <span className="text-gray-400 font-normal">— thêm ảnh, chú thích, bài viết...</span>
        </label>
        <BlockEditor blocks={blocks} onChange={setBlocks} />
      </div>

      {/* Video URL */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">URL Video (tùy chọn — YouTube, Drive...)</label>
        <input value={urlMedia} onChange={e => setUrlMedia(e.target.value)}
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          placeholder="https://youtu.be/..." />
      </div>

      {/* Mô tả ngắn */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Mô tả ngắn (tùy chọn)</label>
        <textarea value={moTa} onChange={e => setMoTa(e.target.value)} rows={2}
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          placeholder="Mô tả tóm tắt bài dự thi của bạn..." />
      </div>

      <button type="submit" disabled={submitting || uploading}
        className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        Nộp bài tham dự
      </button>
    </form>
  );
}

// ─── Category / Status helpers ─────────────────────────────────────────────────

const CATEGORY_META = {
  CUOC_THI_HAT:  { emoji: '🎤', label: 'Hát hay',    gradient: 'from-pink-500 to-rose-600'     },
  ANH_DEP:       { emoji: '📸', label: 'Ảnh đẹp',    gradient: 'from-blue-500 to-indigo-600'   },
  Y_TUONG:       { emoji: '💡', label: 'Ý tưởng',    gradient: 'from-yellow-400 to-amber-500'  },
  TRANG_PHUC:    { emoji: '👗', label: 'Trang phục',  gradient: 'from-purple-500 to-violet-600' },
  BAI_VIET:      { emoji: '✍️', label: 'Bài viết',   gradient: 'from-teal-500 to-cyan-600'     },
  NHAT_KY:       { emoji: '📔', label: 'Nhật ký',    gradient: 'from-emerald-500 to-green-600'  },
  ANH_VIDEO:     { emoji: '📷', label: 'Ảnh/Video',  gradient: 'from-violet-500 to-purple-600'  },
  TONG_HOP:      { emoji: '🏆', label: 'Tổng hợp',   gradient: 'from-orange-500 to-amber-600'  },
};

function getCatMeta(loai) {
  return CATEGORY_META[loai] || { emoji: '🏆', label: loai || 'Cuộc thi', gradient: 'from-orange-400 to-amber-500' };
}

const STATUS_META = {
  CHUAN_BI:       { label: 'Sắp diễn ra',  cls: 'bg-gray-100 text-gray-700 border border-gray-200'          },
  DANG_MO:        { label: 'Đang mở',       cls: 'bg-green-100 text-green-700 border border-green-200',  pulse: true },
  DONG_BINH_CHON: { label: 'Đã đóng BCS',  cls: 'bg-orange-100 text-orange-700 border border-orange-200'    },
  DA_CONG_BO:     { label: 'Đã công bố',   cls: 'bg-purple-100 text-purple-700 border border-purple-200'    },
  DA_HUY:         { label: 'Đã hủy',        cls: 'bg-red-100 text-red-600 border border-red-200'             },
};

function getStatusMeta(s) {
  return STATUS_META[s] || { label: s, cls: 'bg-gray-100 text-gray-600' };
}

function StatusBadge({ trangThai, size = 'sm' }) {
  const meta = getStatusMeta(trangThai);
  const sz   = size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2.5 py-0.5';
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${sz} ${meta.cls}`}>
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

// ─── Vote rule labels ──────────────────────────────────────────────────────────

function ruleLabel(quyTac, soLuotToiDa) {
  if (quyTac === 'MOT_LAN')   return 'Mỗi người chỉ được bình chọn 1 lần cho toàn bộ cuộc thi.';
  if (quyTac === 'MOI_NGAY')  return 'Bạn có thể bình chọn lại mỗi ngày.';
  if (quyTac === 'N_LUOT')    return `Tối đa ${soLuotToiDa ?? '?'} lượt bình chọn.`;
  return 'Xem quy tắc bình chọn tại trang cuộc thi.';
}

function dieuKienLabel(dk) {
  if (dk === 'MO_HOANTOAN') return 'Mở hoàn toàn — không cần đăng nhập';
  if (dk === 'DANG_NHAP')   return 'Yêu cầu đăng nhập tài khoản';
  if (dk === 'CHECK_IN')    return 'Yêu cầu check-in hoạt động';
  return dk;
}

// ─── Countdown display ────────────────────────────────────────────────────────

function CountdownDisplay({ thoiGianDongVote }) {
  const t = useCountdown(thoiGianDongVote);
  if (!thoiGianDongVote) return null;
  if (t.expired) return (
    <span className="text-orange-600 font-semibold text-sm">Đã hết hạn bình chọn</span>
  );
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {[
        { v: t.days,  u: 'ngày' },
        { v: t.hours, u: 'giờ'  },
        { v: t.mins,  u: 'phút' },
        { v: t.secs,  u: 'giây' },
      ].map(({ v, u }) => (
        <div key={u} className="flex flex-col items-center bg-gradient-to-b from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-3 py-1.5 min-w-[48px]">
          <span className="text-lg font-extrabold text-orange-600 leading-none tabular-nums">
            {String(v ?? 0).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-gray-500 font-medium mt-0.5">{u}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Contestant card ───────────────────────────────────────────────────────────

function ThiSinhCard({ ts, isOpen, hasVoted, myVoteId, onVote, voting, showVoteCount, rank, slug }) {
  const isMyVote   = myVoteId === ts.id;
  const isVoting   = voting === ts.id;
  const canVote    = isOpen && !hasVoted;
  const hasContent = !!ts.noiDung || !!ts.anhDaiDien;

  return (
    <div
      className={`relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border-2 transition-all duration-300 ${
        isMyVote
          ? 'border-green-400 shadow-green-100 shadow-md'
          : 'border-gray-100 hover:border-orange-200 hover:shadow-md'
      }`}
    >
      {/* Rank badge */}
      {rank != null && (
        <div className="absolute top-2 left-2 z-10">
          <span className={`text-xs font-extrabold rounded-full w-7 h-7 flex items-center justify-center shadow ${
            rank === 1 ? 'bg-amber-400 text-white'
            : rank === 2 ? 'bg-gray-300 text-gray-700'
            : rank === 3 ? 'bg-amber-700 text-white'
            : 'bg-white/90 text-gray-600 border border-gray-200'
          }`}>
            {rank}
          </span>
        </div>
      )}

      {/* Voted badge */}
      {isMyVote && (
        <div className="absolute top-2 right-2 z-10">
          <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow">
            <Check className="w-3 h-3" />
            Đã chọn
          </span>
        </div>
      )}

      {/* Avatar / image */}
      <div className="h-44 bg-gradient-to-br from-amber-50 to-orange-100 flex-shrink-0 overflow-hidden">
        {ts.anhDaiDien ? (
          <img
            src={ts.anhDaiDien}
            alt={ts.ten}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-inner">
              <span className="text-white font-extrabold text-2xl select-none">
                {ts.ten?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <span className="text-xs text-gray-400 font-medium">Thí sinh #{ts.soThuTu}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <p className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{ts.ten}</p>
        {ts.moTa && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{ts.moTa}</p>
        )}

        {/* Vote count */}
        {showVoteCount && ts.soVote != null && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-auto">
            <Heart className="w-3.5 h-3.5 text-red-400 fill-current flex-shrink-0" />
            <span className="font-semibold text-gray-700">{ts.soVote.toLocaleString('vi-VN')}</span>
            <span>lượt bình chọn</span>
          </div>
        )}

        {/* View entry link */}
        {hasContent && slug && (
          <a href={`/binh-chon/${slug}/thi-sinh/${ts.id}`}
            className="mt-1 w-full py-1.5 rounded-xl text-xs font-semibold border border-orange-200 text-orange-600 hover:bg-orange-50 flex items-center justify-center gap-1 transition-colors">
            📖 Xem bài dự thi
          </a>
        )}

        {/* Vote button */}
        {isOpen && (
          <button
            onClick={() => !hasVoted && onVote(ts.id)}
            disabled={hasVoted || isVoting}
            className={`mt-1 w-full py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 ${
              isMyVote
                ? 'bg-green-50 text-green-600 border-2 border-green-300 cursor-default'
                : hasVoted
                ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-sm active:scale-95'
            }`}
          >
            {isVoting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</>
            ) : isMyVote ? (
              <><Check className="w-4 h-4" /> Đã bình chọn</>
            ) : (
              <><Heart className="w-4 h-4" /> Bình chọn</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Podium ────────────────────────────────────────────────────────────────────

function Podium({ top3 }) {
  const [second, first, third] = [top3[1], top3[0], top3[2]];

  const PodiumSlot = ({ ts, position, height, medalColor, labelGradient }) => {
    if (!ts) return <div style={{ flex: 1 }} />;
    return (
      <div className="flex flex-col items-center gap-2" style={{ flex: 1 }}>
        {/* Avatar */}
        <div className={`relative w-20 h-20 rounded-full overflow-hidden border-4 shadow-lg ${medalColor}`}>
          {ts.anhDaiDien ? (
            <img src={ts.anhDaiDien} alt={ts.ten} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${labelGradient} flex items-center justify-center`}>
              <span className="text-white font-extrabold text-2xl">{ts.ten?.charAt(0) || '?'}</span>
            </div>
          )}
          {/* Position badge */}
          <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-extrabold shadow ${
            position === 1 ? 'bg-amber-400 text-white'
            : position === 2 ? 'bg-gray-300 text-gray-700'
            : 'bg-amber-700 text-white'
          }`}>
            {position}
          </div>
        </div>

        {/* Name */}
        <p className="text-sm font-bold text-gray-900 text-center line-clamp-2 px-1">{ts.ten}</p>

        {/* Votes */}
        {ts.soVote != null && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600">
            <Heart className="w-3 h-3 text-red-400 fill-current" />
            {ts.soVote.toLocaleString('vi-VN')}
          </span>
        )}

        {/* Podium block */}
        <div
          className={`w-full rounded-t-xl flex items-end justify-center pb-3 ${
            position === 1 ? 'bg-gradient-to-t from-amber-400 to-yellow-300'
            : position === 2 ? 'bg-gradient-to-t from-gray-400 to-gray-300'
            : 'bg-gradient-to-t from-amber-800 to-amber-600'
          }`}
          style={{ height }}
        >
          <span className="text-white font-black text-2xl opacity-60 select-none">
            {position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-end gap-3 px-4 pt-6">
      <PodiumSlot ts={second} position={2} height="80px"  medalColor="border-gray-300"  labelGradient="from-gray-400 to-gray-500" />
      <PodiumSlot ts={first}  position={1} height="120px" medalColor="border-amber-400" labelGradient="from-amber-400 to-yellow-500" />
      <PodiumSlot ts={third}  position={3} height="60px"  medalColor="border-amber-700" labelGradient="from-amber-700 to-amber-800" />
    </div>
  );
}

// ─── Ranking table ─────────────────────────────────────────────────────────────

function RankingTable({ sorted, totalVotes }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
            <th className="text-left py-3 px-4 font-bold text-gray-700 w-10">#</th>
            <th className="text-left py-3 px-4 font-bold text-gray-700">Thí sinh</th>
            <th className="text-right py-3 px-4 font-bold text-gray-700">Bình chọn</th>
            <th className="text-left py-3 px-4 font-bold text-gray-700 w-32 hidden sm:table-cell">Tỉ lệ</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((ts, idx) => {
            const rank    = idx + 1;
            const pct     = totalVotes > 0 && ts.soVote != null
              ? ((ts.soVote / totalVotes) * 100).toFixed(1)
              : '0.0';
            const isTop3  = rank <= 3;
            return (
              <tr
                key={ts.id}
                className={`border-b border-gray-50 ${isTop3 ? 'bg-amber-50/40' : 'hover:bg-gray-50'} transition-colors`}
              >
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${
                    rank === 1 ? 'bg-amber-400 text-white'
                    : rank === 2 ? 'bg-gray-300 text-gray-700'
                    : rank === 3 ? 'bg-amber-700 text-white'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                    {rank}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    {ts.anhDaiDien ? (
                      <img
                        src={ts.anhDaiDien}
                        alt={ts.ten}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{ts.ten?.charAt(0) || '?'}</span>
                      </div>
                    )}
                    <span className="font-semibold text-gray-800 line-clamp-1">{ts.ten}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="font-bold text-gray-900">
                    {ts.soVote != null ? ts.soVote.toLocaleString('vi-VN') : '—'}
                  </span>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 tabular-nums w-10 text-right">{pct}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BinhChonDetailPage() {
  const { slug }                       = useParams();
  const navigate                       = useNavigate();
  const queryClient                    = useQueryClient();
  const { isAuthenticated }            = useAuthStore();
  const [votingId, setVotingId]        = useState(null);
  const [successMsg, setSuccessMsg]    = useState('');
  const [errorMsg, setErrorMsg]        = useState('');
  const [shareMsg, setShareMsg]        = useState('');
  const [activeTab, setActiveTab]      = useState('binh-chon');
  const [daNop, setDaNop]              = useState(false);

  // ── Fetch competition ──────────────────────────────────────────────────────
  const {
    data: ct,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['cuoc-thi', 'slug', slug],
    queryFn: () => cuocThiService.getBySlug(slug),
    enabled: !!slug,
    staleTime: 30_000,
  });

  // ── Check existing vote (logged-in users only) ─────────────────────────────
  const { data: voteStatus } = useQuery({
    queryKey: ['binh-chon', 'kiem-tra', ct?.id],
    queryFn:  () => cuocThiService.kiemTraVote(ct.id),
    enabled:  !!ct?.id && isAuthenticated,
    staleTime: 10_000,
  });

  // voteStatus shape: { daVote: boolean, thiSinhId: number | null }
  const hasVoted  = voteStatus?.daVote ?? false;
  const myVoteId  = voteStatus?.thiSinhId ?? null;

  // ── Vote mutation ──────────────────────────────────────────────────────────
  const voteMutation = useMutation({
    mutationFn: ({ thiSinhId }) =>
      cuocThiService.vote(ct.id, thiSinhId, getDeviceId()),
    onMutate: ({ thiSinhId }) => {
      setVotingId(thiSinhId);
      setSuccessMsg('');
      setErrorMsg('');
    },
    onSuccess: () => {
      setVotingId(null);
      setSuccessMsg('Bình chọn thành công! Cảm ơn bạn đã tham gia 🎉');
      queryClient.invalidateQueries({ queryKey: ['binh-chon', 'kiem-tra', ct?.id] });
      queryClient.invalidateQueries({ queryKey: ['cuoc-thi', 'slug', slug] });
    },
    onError: (err) => {
      setVotingId(null);
      const msg = err?.response?.data?.message || err?.message || 'Bình chọn thất bại, vui lòng thử lại.';
      setErrorMsg(msg);
    },
  });

  const handleVote = useCallback((thiSinhId) => {
    if (!ct) return;

    // Auth gate
    if (ct.dieuKienVote === 'DANG_NHAP' && !isAuthenticated) {
      setErrorMsg('Bạn cần đăng nhập để bình chọn.');
      return;
    }

    voteMutation.mutate({ thiSinhId });
  }, [ct, isAuthenticated, voteMutation]);

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareMsg('Đã sao chép đường dẫn!');
      setTimeout(() => setShareMsg(''), 2500);
    }).catch(() => {});
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const catMeta       = getCatMeta(ct?.loaiCuocThi);
  const trangThai     = ct?.trangThai;
  const isOpen        = trangThai === 'DANG_MO';
  const isCongBo      = trangThai === 'DA_CONG_BO';
  const isDong        = trangThai === 'DONG_BINH_CHON';
  const isHidden      = ct?.hienThiKetQua === 'AN_DEN_CUOI' && !isCongBo;

  const thiSinhList   = ct?.danhSachThiSinh?.filter((t) => t.isActive !== false) ?? [];
  const totalVotes    = ct?.tongSoVote ?? 0;

  // Sorted for ranking (only when visible)
  const sorted = [...thiSinhList].sort((a, b) => (b.soVote ?? 0) - (a.soVote ?? 0));
  const top3   = sorted.slice(0, 3);

  // ── Countdown ─────────────────────────────────────────────────────────────
  const countdown = useCountdown(ct?.thoiGianDongVote);

  // ── Loading / error ────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      <p className="text-gray-400">Đang tải cuộc thi...</p>
    </div>
  );

  if (isError || !ct) return (
    <div className="flex flex-col items-center justify-center py-28 text-center gap-4 px-4">
      <span className="text-6xl">😕</span>
      <p className="text-xl font-bold text-gray-700">Không tìm thấy cuộc thi</p>
      <p className="text-sm text-gray-400">Cuộc thi không tồn tại hoặc đã bị gỡ.</p>
      <button
        onClick={() => navigate('/binh-chon')}
        className="mt-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-colors"
      >
        Quay lại danh sách
      </button>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{ct.tieuDe} | Bình chọn Youth KGU</title>
        <meta name="description" content={ct.moTa || `Tham gia bình chọn: ${ct.tieuDe}`} />
      </Helmet>

      <div className="space-y-5">
        {/* ── Hero section ──────────────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ minHeight: '320px' }}>
          {/* Background */}
          {ct.anhBia ? (
            <img
              src={ct.anhBia}
              alt={ct.tieuDe}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${catMeta.gradient}`} />
          )}

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

          {/* Back button */}
          <div className="absolute top-4 left-4 z-20">
            <button
              onClick={() => navigate('/binh-chon')}
              className="flex items-center gap-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white text-sm font-semibold rounded-xl px-3 py-2 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Quay lại
            </button>
          </div>

          {/* Share button */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white text-sm font-semibold rounded-xl px-3 py-2 transition-all"
            >
              <Share2 className="w-4 h-4" />
              {shareMsg || 'Chia sẻ'}
            </button>
          </div>

          {/* Content overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-5 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-bold rounded-full px-3 py-1 border border-white/20">
                <span>{catMeta.emoji}</span>
                <span>{catMeta.label}</span>
              </span>
              <StatusBadge trangThai={trangThai} size="lg" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight drop-shadow-lg">
              {ct.tieuDe}
            </h1>
            {ct.tenHoatDong && (
              <p className="text-white/70 text-sm mt-1.5">
                📅 {ct.tenHoatDong}
              </p>
            )}
          </div>
        </div>

        {/* ── Info bar ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex flex-wrap gap-6">
            {/* Total votes */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-red-500 fill-current" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Tổng bình chọn</p>
                <p className="text-lg font-extrabold text-gray-900 leading-none">
                  {totalVotes.toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            {/* Contestant count */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Thí sinh</p>
                <p className="text-lg font-extrabold text-gray-900 leading-none">
                  {thiSinhList.length}
                </p>
              </div>
            </div>

            {/* Visibility indicator */}
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isHidden ? 'bg-gray-50' : 'bg-green-50'}`}>
                {isHidden
                  ? <EyeOff className="w-5 h-5 text-gray-400" />
                  : <Eye className="w-5 h-5 text-green-500" />
                }
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Kết quả</p>
                <p className="text-sm font-semibold text-gray-700 leading-none mt-0.5">
                  {isHidden ? 'Ẩn đến cuối' : 'Hiển thị thực tế'}
                </p>
              </div>
            </div>

            {/* Countdown — only when open */}
            {isOpen && ct.thoiGianDongVote && !countdown.expired && (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Thời gian còn lại
                </p>
                <CountdownDisplay thoiGianDongVote={ct.thoiGianDongVote} />
              </div>
            )}
          </div>

          {/* Vote rule */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-600">
            <span>
              <span className="font-semibold text-gray-800">Điều kiện: </span>
              {dieuKienLabel(ct.dieuKienVote)}
            </span>
            <span>
              <span className="font-semibold text-gray-800">Quy tắc: </span>
              {ruleLabel(ct.quyTacVote, ct.soLuotToiDa)}
            </span>
          </div>
        </div>

        {/* ── Description ───────────────────────────────────────────────── */}
        {ct.moTa && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              Giới thiệu
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{ct.moTa}</p>
          </div>
        )}

        {/* ── Vote rule banner ───────────────────────────────────────────── */}
        {isOpen && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">📋</span>
            <div>
              <p className="font-bold text-amber-800 text-sm">Quy tắc bình chọn</p>
              <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
                {ruleLabel(ct.quyTacVote, ct.soLuotToiDa)}
                {ct.dieuKienVote === 'DANG_NHAP' && ' · Yêu cầu đăng nhập tài khoản.'}
              </p>
            </div>
          </div>
        )}

        {/* ── Auth warning ───────────────────────────────────────────────── */}
        {isOpen && ct.dieuKienVote === 'DANG_NHAP' && !isAuthenticated && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🔐</span>
            <div>
              <p className="font-bold text-blue-800 text-sm">Cần đăng nhập để bình chọn</p>
              <p className="text-blue-600 text-xs mt-0.5">
                Bạn cần đăng nhập tài khoản Youth KGU để tham gia bình chọn cho cuộc thi này.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Đăng nhập ngay
              </button>
            </div>
          </div>
        )}

        {/* ── Success alert ──────────────────────────────────────────────── */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-xl flex-shrink-0">🎉</span>
            <p className="text-green-700 font-semibold text-sm">{successMsg}</p>
          </div>
        )}

        {/* ── Error alert ────────────────────────────────────────────────── */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <p className="text-red-700 font-semibold text-sm">{errorMsg}</p>
          </div>
        )}

        {/* ── Tabs (only for ANH_VIDEO contests) ────────────────────────── */}
        {ct.loaiCuocThi === 'ANH_VIDEO' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab('binh-chon')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'binh-chon'
                    ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Heart className="w-4 h-4" /> Bình chọn
              </button>
              {ct.choPhepNopBai && (
                <button
                  onClick={() => setActiveTab('dang-ky')}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === 'dang-ky'
                      ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Camera className="w-4 h-4" /> Đăng ký tham dự
                </button>
              )}
            </div>

            {/* Đăng ký tab content */}
            {activeTab === 'dang-ky' && ct.choPhepNopBai && (
              <div className="p-5">
                {daNop ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="font-bold text-gray-800 text-lg">Đã nộp bài thành công!</p>
                    <p className="text-gray-500 text-sm mt-1">Ban tổ chức sẽ xét duyệt và thêm bài dự thi của bạn vào danh sách bình chọn.</p>
                  </div>
                ) : !isAuthenticated ? (
                  <div className="text-center py-8">
                    <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-semibold text-gray-700">Cần đăng nhập để nộp bài</p>
                    <button
                      onClick={() => navigate('/login')}
                      className="mt-3 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold"
                    >
                      Đăng nhập ngay
                    </button>
                  </div>
                ) : (
                  <DangKyNopBaiForm
                    cuocThiId={ct.id}
                    hanNop={ct.hanNop}
                    onSuccess={() => setDaNop(true)}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Closed banner ──────────────────────────────────────────────── */}
        {isDong && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5 flex items-center gap-4">
            <span className="text-3xl flex-shrink-0">🔒</span>
            <div>
              <p className="font-bold text-orange-800">Bình chọn đã đóng</p>
              <p className="text-orange-600 text-sm mt-0.5">Kết quả sẽ được công bố sớm. Hãy theo dõi trang này!</p>
            </div>
          </div>
        )}

        {/* ── Results announcement (DA_CONG_BO) ────────────────────────── */}
        {isCongBo && (
          <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 rounded-2xl p-5 text-center shadow-lg">
            <div className="text-4xl mb-2">🏆</div>
            <p className="text-white font-extrabold text-xl drop-shadow">Kết quả đã được công bố!</p>
            <p className="text-white/85 text-sm mt-1">
              Chúc mừng các thí sinh xuất sắc của cuộc thi <span className="font-bold">{ct.tieuDe}</span>
            </p>
          </div>
        )}

        {/* ── Podium (DA_CONG_BO) ───────────────────────────────────────── */}
        {isCongBo && top3.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-5 py-4 border-b border-amber-100">
              <h2 className="font-extrabold text-amber-800 flex items-center gap-2">
                <Medal className="w-5 h-5 text-amber-500" />
                Bảng vinh danh
              </h2>
            </div>
            <div className="p-4 pb-6">
              <Podium top3={top3} />
            </div>
          </div>
        )}

        {/* ── Full ranking table (DA_CONG_BO) ──────────────────────────── */}
        {isCongBo && sorted.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-500" />
              <h2 className="font-bold text-gray-800">Bảng xếp hạng đầy đủ</h2>
            </div>
            <div className="p-4">
              <RankingTable sorted={sorted} totalVotes={totalVotes} />
            </div>
          </div>
        )}

        {/* ── Contestant grid ───────────────────────────────────────────── */}
        {thiSinhList.length > 0 && activeTab !== 'dang-ky' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <h2 className="font-bold text-gray-800">
                  {isCongBo ? 'Danh sách thí sinh' : 'Các thí sinh tham gia'}
                </h2>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2.5 py-1 font-semibold">
                {thiSinhList.length} thí sinh
              </span>
            </div>

            <div className="p-4 sm:p-5">
              {isHidden && isOpen && (
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl p-3 mb-4 border border-gray-200">
                  <EyeOff className="w-4 h-4 flex-shrink-0" />
                  Số lượng bình chọn đang được ẩn — kết quả sẽ hiển thị sau khi kết thúc.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(isCongBo ? sorted : thiSinhList).map((ts, idx) => (
                  <ThiSinhCard
                    key={ts.id}
                    ts={ts}
                    isOpen={isOpen}
                    hasVoted={hasVoted}
                    myVoteId={myVoteId}
                    onVote={handleVote}
                    voting={votingId}
                    showVoteCount={!isHidden || isCongBo}
                    rank={isCongBo ? idx + 1 : null}
                    slug={slug}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Empty contestant list ─────────────────────────────────────── */}
        {thiSinhList.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="text-5xl mb-4 select-none">👥</div>
            <p className="font-semibold text-gray-600">Chưa có thí sinh nào</p>
            <p className="text-sm text-gray-400 mt-1">Danh sách thí sinh sẽ được cập nhật sớm.</p>
          </div>
        )}
      </div>
    </>
  );
}
