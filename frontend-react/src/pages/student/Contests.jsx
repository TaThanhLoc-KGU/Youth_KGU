import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy, Camera, Heart, Clock, Upload, X, Loader2, Check,
} from 'lucide-react';
import { toast } from 'react-toastify';
import cuocThiService from '../../services/cuocThiService';
import uploadService  from '../../services/uploadService';
import useAuthStore   from '../../stores/authStore';
import BlockEditor    from '../../components/common/BlockEditor';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deadline(hanNop) {
  if (!hanNop) return null;
  const diff = new Date(hanNop) - new Date();
  if (diff <= 0) return { expired: true, label: 'Đã hết hạn' };
  const days  = Math.floor(diff / 86400000);
  if (days > 0) return { expired: false, label: `Còn ${days} ngày` };
  const hours = Math.floor(diff / 3600000);
  return { expired: false, label: `Còn ${hours} giờ` };
}

const CATEGORY_META = {
  CUOC_THI_HAT: { emoji: '🎤', gradient: 'from-pink-500 to-rose-600'     },
  ANH_DEP:      { emoji: '📸', gradient: 'from-blue-500 to-indigo-600'   },
  Y_TUONG:      { emoji: '💡', gradient: 'from-yellow-400 to-amber-500'  },
  TRANG_PHUC:   { emoji: '👗', gradient: 'from-purple-500 to-violet-600' },
  BAI_VIET:     { emoji: '✍️', gradient: 'from-teal-500 to-cyan-600'    },
  NHAT_KY:      { emoji: '📔', gradient: 'from-emerald-500 to-green-600' },
  ANH_VIDEO:    { emoji: '📷', gradient: 'from-violet-500 to-purple-600' },
  TONG_HOP:     { emoji: '🏆', gradient: 'from-orange-500 to-amber-600'  },
};
function catMeta(loai) {
  return CATEGORY_META[loai] || { emoji: '🏆', gradient: 'from-orange-400 to-amber-500' };
}

// ─── Registration / submission form ───────────────────────────────────────────

function DangKyForm({ ct, onSuccess }) {
  const [ten, setTen]               = useState('');
  const [moTa, setMoTa]             = useState('');
  const [anhDaiDien, setAnhDaiDien] = useState('');
  const [urlMedia, setUrlMedia]     = useState('');
  const [blocks, setBlocks]         = useState([]);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const thumbRef = useRef();
  const dl = deadline(ct.hanNop);

  const handleThumb = async (file) => {
    if (!file) return;
    setUploadingThumb(true);
    try {
      const url = await uploadService.studentUpload(file);
      setAnhDaiDien(url);
    } catch { toast.error('Upload ảnh thất bại'); }
    finally { setUploadingThumb(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ten.trim()) { toast.error('Vui lòng nhập tiêu đề'); return; }
    setSubmitting(true);
    try {
      const validBlocks = blocks.filter(b =>
        (b.type === 'image' && b.url) || (b.type === 'text' && b.content?.trim())
      );
      await cuocThiService.dangKyNopBai(ct.id, {
        ten: ten.trim(),
        moTa: moTa.trim(),
        anhDaiDien,
        urlMedia: urlMedia.trim(),
        loaiNopBai: 'ANH_VIDEO',
        noiDung: validBlocks.length ? JSON.stringify(validBlocks) : null,
      });
      toast.success('Đăng ký thành công! Ban tổ chức sẽ xét duyệt sớm.');
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Đăng ký thất bại');
    } finally { setSubmitting(false); }
  };

  if (dl?.expired) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
      <p className="text-red-700 font-semibold text-sm">Đã hết hạn nộp bài</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {ct.hanNop && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          ⏰ Hạn nộp: <strong>{new Date(ct.hanNop).toLocaleString('vi-VN')}</strong>
        </div>
      )}

      {/* Tiêu đề */}
      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1.5">
          Tiêu đề / Tên thí sinh <span className="text-red-500">*</span>
        </label>
        <input value={ten} onChange={e => setTen(e.target.value)} required
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          placeholder="VD: Nguyễn Văn A – Bức ảnh mùa hè..." />
      </div>

      {/* Ảnh thumbnail */}
      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1.5">
          Ảnh thumbnail <span className="text-gray-400 font-normal">— hiển thị trên danh sách bình chọn</span>
        </label>
        {anhDaiDien ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ height: 140 }}>
            <img src={anhDaiDien} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => setAnhDaiDien('')}
              className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow">
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        ) : (
          <div onClick={() => thumbRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
            {uploadingThumb
              ? <Loader2 className="w-7 h-7 animate-spin text-orange-500 mx-auto" />
              : <><Camera className="w-7 h-7 text-gray-300 mx-auto mb-1.5" />
                <p className="text-sm text-gray-400">Nhấn để tải ảnh thumbnail</p></>}
          </div>
        )}
        <input ref={thumbRef} type="file" accept="image/*" className="hidden"
          onChange={e => handleThumb(e.target.files?.[0])} />
      </div>

      {/* Block editor */}
      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1.5">
          Nội dung bài dự thi <span className="text-gray-400 font-normal">— thêm ảnh, chú thích, đoạn văn...</span>
        </label>
        <BlockEditor blocks={blocks} onChange={setBlocks} />
      </div>

      {/* Video URL */}
      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1.5">URL Video (tùy chọn)</label>
        <input value={urlMedia} onChange={e => setUrlMedia(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          placeholder="https://youtu.be/..." />
      </div>

      {/* Mô tả ngắn */}
      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Mô tả ngắn (tùy chọn)</label>
        <textarea value={moTa} onChange={e => setMoTa(e.target.value)} rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          placeholder="Giới thiệu về bài dự thi..." />
      </div>

      <button type="submit" disabled={submitting || uploadingThumb}
        className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-md">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        Nộp bài tham dự
      </button>
    </form>
  );
}

// ─── Contest row (desktop table-like) ─────────────────────────────────────────

function ContestRow({ ct }) {
  const [expanded, setExpanded] = useState(false);
  const [done, setDone]         = useState(false);
  const dl       = deadline(ct.hanNop);
  const canReg   = ct.choPhepNopBai && !dl?.expired;
  const meta     = catMeta(ct.loaiCuocThi);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Thumbnail or gradient */}
        <div className={`w-20 h-20 lg:w-24 lg:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}>
          {ct.anhBia
            ? <img src={ct.anhBia} alt="" className="w-full h-full object-cover" />
            : <span className="text-3xl">{meta.emoji}</span>}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            {canReg && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                <Camera className="w-3 h-3" /> Nhận bài
              </span>
            )}
            {dl && !dl.expired && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" /> {dl.label}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
              <Heart className="w-3 h-3" /> {ct.tongVote ?? 0} bình chọn
            </span>
          </div>

          <h3 className="font-bold text-gray-900 text-sm leading-snug">{ct.tieuDe}</h3>
          {ct.moTa && <p className="text-xs text-gray-500 line-clamp-2">{ct.moTa}</p>}

          {/* Actions */}
          <div className="flex gap-2 mt-1 flex-wrap">
            <Link to={`/binh-chon/${ct.slug}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors">
              <Heart className="w-3.5 h-3.5" /> Xem & bình chọn
            </Link>
            {canReg && !done && (
              <button type="button" onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-3 py-1.5 rounded-xl transition-colors">
                <Camera className="w-3.5 h-3.5" />
                {expanded ? 'Thu gọn' : 'Đăng ký dự thi'}
              </button>
            )}
            {done && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl">
                <Check className="w-3.5 h-3.5" /> Đã nộp bài
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline form */}
      {expanded && !done && (
        <div className="border-t border-gray-100 p-4 lg:p-5">
          <DangKyForm ct={ct} onSuccess={() => { setDone(true); setExpanded(false); }} />
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function StudentContests() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const { data: contests = [], isLoading } = useQuery({
    queryKey: ['cuoc-thi-tat-ca'],
    queryFn: () => cuocThiService.getTatCa(),
    staleTime: 2 * 60 * 1000,
  });

  const active = contests.filter(c =>
    ['DANG_MO', 'DONG_BINH_CHON', 'DA_CONG_BO'].includes(c.trangThai)
  );
  const nhanBai = active.filter(c => c.choPhepNopBai);
  const binhChon = active.filter(c => !c.choPhepNopBai);

  if (isLoading) return (
    <div className="py-5 px-4 lg:px-6 space-y-4 max-w-4xl mx-auto">
      {[1,2,3].map(i => <div key={i} className="animate-pulse bg-gray-200 rounded-2xl h-28" />)}
    </div>
  );

  return (
    <div className="py-5 px-4 lg:px-6 space-y-6 max-w-4xl mx-auto w-full">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" /> Cuộc thi
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Tham gia & bình chọn các cuộc thi của Đoàn – Hội</p>
        </div>
        <Link to="/binh-chon"
          className="text-sm font-semibold text-orange-600 hover:text-orange-700 border border-orange-200 hover:border-orange-300 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-xl transition-colors">
          Trang bình chọn →
        </Link>
      </div>

      {/* Auth nudge */}
      {!isAuthenticated && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-xl">🔐</span>
          <p className="text-sm text-amber-800 flex-1">
            <Link to="/login" className="font-semibold underline">Đăng nhập</Link> để đăng ký tham dự cuộc thi.
          </p>
        </div>
      )}

      {/* ── Đang nhận bài ────────────────────────────────────────────────── */}
      {nhanBai.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wide">
            <Camera className="w-4 h-4 text-orange-500" /> Đang nhận bài dự thi
            <span className="text-[11px] font-semibold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full normal-case tracking-normal">{nhanBai.length}</span>
          </h2>
          <div className="space-y-3">
            {nhanBai.map(ct => <ContestRow key={ct.id} ct={ct} />)}
          </div>
        </section>
      )}

      {/* ── Bình chọn ────────────────────────────────────────────────────── */}
      {binhChon.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wide">
            <Heart className="w-4 h-4 text-red-400" /> Bình chọn
            <span className="text-[11px] font-semibold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full normal-case tracking-normal">{binhChon.length}</span>
          </h2>
          <div className="space-y-3">
            {binhChon.map(ct => <ContestRow key={ct.id} ct={ct} />)}
          </div>
        </section>
      )}

      {/* Empty */}
      {active.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">Chưa có cuộc thi nào đang diễn ra</p>
          <p className="text-sm text-gray-400 mt-1">Hãy theo dõi để không bỏ lỡ!</p>
          <Link to="/binh-chon"
            className="inline-block mt-4 text-sm font-semibold text-orange-600 hover:underline">
            Xem trang bình chọn →
          </Link>
        </div>
      )}
    </div>
  );
}
