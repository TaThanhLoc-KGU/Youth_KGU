/**
 * ThiSinhDetailPage — xem bài dự thi của 1 thí sinh dạng bài báo
 * Route: /binh-chon/:slug/thi-sinh/:thiSinhId
 */
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Heart, Check, Loader2, Users, Award } from 'lucide-react';
import { toast } from 'react-toastify';
import cuocThiService from '../../services/cuocThiService';
import useAuthStore from '../../stores/authStore';
import { BlockRenderer } from '../../components/common/BlockEditor';

// ── Device fingerprint (same as BinhChonDetailPage) ───────────────────────────

function getDeviceId() {
  let id = localStorage.getItem('_vote_device_id');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('_vote_device_id', id);
  }
  return id;
}

// ── Image gallery fallback (when no noiDung blocks) ───────────────────────────

function ImageGallery({ anhDaiDien, dsHinhAnh }) {
  let extra = [];
  try { extra = dsHinhAnh ? JSON.parse(dsHinhAnh) : []; } catch { extra = []; }
  const all = [anhDaiDien, ...extra].filter(Boolean);
  if (!all.length) return null;

  return (
    <div className="space-y-3">
      {/* Main image */}
      <img src={all[0]} alt="" className="w-full rounded-2xl object-cover max-h-[480px]" loading="lazy" />
      {/* Extra grid */}
      {all.length > 1 && (
        <div className={`grid gap-2 ${all.length === 2 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {all.slice(1).map((url, i) => (
            <img key={i} src={url} alt="" className="w-full rounded-xl object-cover aspect-square" loading="lazy" />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Vote button ───────────────────────────────────────────────────────────────

function VoteButton({ isOpen, hasVoted, isMyVote, voting, onVote }) {
  if (!isOpen) return null;
  return (
    <button
      onClick={() => !hasVoted && onVote()}
      disabled={hasVoted || voting}
      className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md ${
        isMyVote
          ? 'bg-green-50 text-green-600 border-2 border-green-300 cursor-default shadow-none'
          : hasVoted
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
          : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white active:scale-95'
      }`}
    >
      {voting ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</>
      ) : isMyVote ? (
        <><Check className="w-5 h-5" /> Đã bình chọn</>
      ) : (
        <><Heart className="w-5 h-5" /> Bình chọn cho thí sinh này</>
      )}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ThiSinhDetailPage() {
  const { slug, thiSinhId }      = useParams();
  const navigate                 = useNavigate();
  const queryClient              = useQueryClient();
  const { isAuthenticated }      = useAuthStore();
  const [errorMsg, setErrorMsg]  = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Fetch competition ──────────────────────────────────────────────────────
  const { data: ct, isLoading, isError } = useQuery({
    queryKey: ['cuoc-thi', 'slug', slug],
    queryFn: () => cuocThiService.getBySlug(slug),
    enabled: !!slug,
    staleTime: 30_000,
  });

  // ── Check existing vote ────────────────────────────────────────────────────
  const { data: voteStatus } = useQuery({
    queryKey: ['binh-chon', 'kiem-tra', ct?.id],
    queryFn:  () => cuocThiService.kiemTraVote(ct.id),
    enabled:  !!ct?.id && isAuthenticated,
    staleTime: 10_000,
  });

  const hasVoted = voteStatus?.daVote ?? false;
  const myVoteId = voteStatus?.thiSinhId ?? null;

  // ── Vote mutation ──────────────────────────────────────────────────────────
  const [voting, setVoting] = useState(false);
  const voteMutation = useMutation({
    mutationFn: () => cuocThiService.vote(ct.id, Number(thiSinhId), getDeviceId()),
    onMutate: () => { setVoting(true); setErrorMsg(''); setSuccessMsg(''); },
    onSuccess: () => {
      setVoting(false);
      setSuccessMsg('Bình chọn thành công! Cảm ơn bạn đã tham gia 🎉');
      queryClient.invalidateQueries({ queryKey: ['binh-chon', 'kiem-tra', ct?.id] });
      queryClient.invalidateQueries({ queryKey: ['cuoc-thi', 'slug', slug] });
    },
    onError: (err) => {
      setVoting(false);
      setErrorMsg(err?.response?.data?.message || 'Bình chọn thất bại, vui lòng thử lại.');
    },
  });

  const handleVote = useCallback(() => {
    if (!ct) return;
    if (ct.dieuKienVote === 'DANG_NHAP' && !isAuthenticated) {
      setErrorMsg('Bạn cần đăng nhập để bình chọn.');
      return;
    }
    voteMutation.mutate();
  }, [ct, isAuthenticated, voteMutation]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const ts = ct?.danhSachThiSinh?.find(t => String(t.id) === String(thiSinhId));
  const isOpen = ct?.trangThai === 'DANG_MO';
  const isMyVote = myVoteId === ts?.id;
  const hasBlocks = (() => {
    try { return ts?.noiDung ? JSON.parse(ts.noiDung).length > 0 : false; } catch { return false; }
  })();

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
    </div>
  );

  if (isError || !ct || !ts) return (
    <div className="flex flex-col items-center justify-center py-28 text-center gap-4 px-4">
      <span className="text-5xl">😕</span>
      <p className="text-xl font-bold text-gray-700">Không tìm thấy bài dự thi</p>
      <button onClick={() => navigate(`/binh-chon/${slug}`)}
        className="mt-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-colors">
        Quay lại cuộc thi
      </button>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{ts.ten} — {ct.tieuDe} | Youth KGU</title>
      </Helmet>

      <div className="space-y-5 pb-6">
        {/* Back button */}
        <button onClick={() => navigate(`/binh-chon/${slug}`)}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-orange-500 font-semibold transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Quay lại {ct.tieuDe}
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Contest label */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-amber-100 px-5 py-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-700">{ct.tieuDe}</span>
          </div>

          <div className="p-5">
            <h1 className="text-xl font-extrabold text-gray-900 leading-snug mb-1">{ts.ten}</h1>
            {ts.moTa && (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mt-2">{ts.moTa}</p>
            )}

            {/* Vote count */}
            {ts.soVote != null && (
              <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-500">
                <Heart className="w-4 h-4 text-red-400 fill-current" />
                <span className="font-bold text-gray-800">{ts.soVote.toLocaleString('vi-VN')}</span>
                <span>lượt bình chọn</span>
              </div>
            )}
          </div>
        </div>

        {/* Vote button (top) */}
        <VoteButton isOpen={isOpen} hasVoted={hasVoted} isMyVote={isMyVote} voting={voting} onVote={handleVote} />

        {/* Alerts */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-xl">🎉</span>
            <p className="text-green-700 font-semibold text-sm">{successMsg}</p>
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p className="text-red-700 text-sm font-medium">{errorMsg}</p>
            {ct.dieuKienVote === 'DANG_NHAP' && !isAuthenticated && (
              <button onClick={() => navigate('/login')}
                className="ml-auto px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold">
                Đăng nhập
              </button>
            )}
          </div>
        )}

        {/* Main content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          {hasBlocks ? (
            <BlockRenderer noiDung={ts.noiDung} />
          ) : (
            <ImageGallery anhDaiDien={ts.anhDaiDien} dsHinhAnh={ts.dsHinhAnh} />
          )}

          {/* Video */}
          {ts.urlMedia && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Video dự thi</p>
              <a href={ts.urlMedia} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-xl text-sm font-semibold text-orange-700 hover:bg-orange-100 transition-colors">
                🎬 Xem video
              </a>
            </div>
          )}
        </div>

        {/* Vote button (bottom) */}
        <VoteButton isOpen={isOpen} hasVoted={hasVoted} isMyVote={isMyVote} voting={voting} onVote={handleVote} />

        {/* Auth nudge */}
        {isOpen && ct.dieuKienVote === 'DANG_NHAP' && !isAuthenticated && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🔐</span>
            <div>
              <p className="font-bold text-blue-800 text-sm">Cần đăng nhập để bình chọn</p>
              <button onClick={() => navigate('/login')}
                className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">
                Đăng nhập ngay
              </button>
            </div>
          </div>
        )}

        {/* Other contestants */}
        <OtherContestants ct={ct} currentId={ts.id} slug={slug} />
      </div>
    </>
  );
}

// ── Other contestants strip ────────────────────────────────────────────────────

function OtherContestants({ ct, currentId, slug }) {
  const others = (ct?.danhSachThiSinh ?? [])
    .filter(t => t.isActive !== false && t.id !== currentId)
    .slice(0, 6);
  if (!others.length) return null;
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Users className="w-4 h-4 text-blue-500" />
        <h2 className="font-bold text-gray-800 text-sm">Thí sinh khác</h2>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {others.map(t => (
          <button key={t.id} onClick={() => navigate(`/binh-chon/${slug}/thi-sinh/${t.id}`)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-all text-left">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-amber-100 to-orange-200 flex-shrink-0">
              {t.anhDaiDien
                ? <img src={t.anhDaiDien} alt={t.ten} className="w-full h-full object-cover" loading="lazy" />
                : <div className="w-full h-full flex items-center justify-center text-orange-500 font-bold text-xl">{t.ten?.charAt(0)}</div>}
            </div>
            <p className="text-xs font-semibold text-gray-800 text-center line-clamp-2 leading-snug">{t.ten}</p>
            {t.soVote != null && (
              <span className="text-xs text-gray-500 flex items-center gap-0.5">
                <Heart className="w-3 h-3 text-red-400 fill-current" />
                {t.soVote.toLocaleString('vi-VN')}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
