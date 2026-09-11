import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Clock, Flag, CheckCircle2, AlertTriangle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import tnService from '../../../services/tnService';
import useTnCountdown from '../../../hooks/useTnCountdown';
import { ROUTES } from '../../../utils/constants';
import Loading from '../../../components/common/Loading';
import Button from '../../../components/common/Button';

/**
 * Màn hình làm bài. Route: /student/tn/lam-bai/:deThiId
 * - Gọi batDau(deThiId) khi mount → server tự trả lại lượt đang dở nếu có (F5-safe).
 * - Auto-save từng câu (debounce + khi chuyển câu) + đồng hồ đếm ngược do server quyết.
 */
export default function TnLamBaiPage() {
  const { deThiId } = useParams();
  const navigate = useNavigate();

  const { data: bai, isLoading, isError, error } = useQuery({
    queryKey: ['tn-bat-dau', deThiId],
    queryFn: () => tnService.thi.batDau(deThiId),
    staleTime: Infinity,
    retry: false,
  });

  const [answers, setAnswers] = useState({});      // { cauHoiId: [answerId,...] }
  const [marked, setMarked] = useState({});        // { cauHoiId: bool }
  const [cur, setCur] = useState(0);
  const [saving, setSaving] = useState({});        // { cauHoiId: 'saving'|'saved' }
  const [submitting, setSubmitting] = useState(false);
  const dirtyRef = useRef(new Set());
  const debTimers = useRef({});

  // nạp state ban đầu từ payload (khôi phục lượt dở)
  useEffect(() => {
    if (!bai) return;
    if (bai.trangThai !== 'DANG_LAM') {
      navigate(`${ROUTES.STUDENT_TN_KET_QUA}/${bai.luotThiId}`, { replace: true });
      return;
    }
    const a = {}, m = {};
    bai.cauHois.forEach((q) => {
      a[q.cauHoiId] = q.traLoi || [];
      m[q.cauHoiId] = !!q.danhDau;
    });
    setAnswers(a);
    setMarked(m);
  }, [bai, navigate]);

  const luotThiId = bai?.luotThiId;
  const cauHois = bai?.cauHois || [];
  const q = cauHois[cur];

  // ---- auto-save 1 câu ----
  const flush = useCallback(async (cauHoiId) => {
    if (!luotThiId || !dirtyRef.current.has(cauHoiId)) return;
    dirtyRef.current.delete(cauHoiId);
    setSaving((s) => ({ ...s, [cauHoiId]: 'saving' }));
    try {
      await tnService.thi.autoSave(luotThiId, cauHoiId, answers[cauHoiId] || [], !!marked[cauHoiId]);
      setSaving((s) => ({ ...s, [cauHoiId]: 'saved' }));
    } catch (e) {
      const msg = e?.response?.data?.message || 'Lưu thất bại';
      if (e?.response?.data?.errorCode === 400 && /hết giờ/i.test(msg)) {
        toast.warning('Đã hết giờ — hệ thống tự nộp bài');
        navigate(`${ROUTES.STUDENT_TN_KET_QUA}/${luotThiId}`, { replace: true });
      } else {
        dirtyRef.current.add(cauHoiId);   // thử lại lần sau
        setSaving((s) => ({ ...s, [cauHoiId]: undefined }));
      }
    }
  }, [luotThiId, answers, marked, navigate]);

  const markDirty = (cauHoiId) => {
    dirtyRef.current.add(cauHoiId);
    clearTimeout(debTimers.current[cauHoiId]);
    debTimers.current[cauHoiId] = setTimeout(() => flush(cauHoiId), 600);
  };

  const chon = (cauHoiId, answerId, loai) => {
    setAnswers((prev) => {
      const cur = prev[cauHoiId] || [];
      let next;
      if (loai === 'NHIEU_DAP_AN') {
        next = cur.includes(answerId) ? cur.filter((x) => x !== answerId) : [...cur, answerId];
      } else {
        next = cur[0] === answerId ? [] : [answerId];
      }
      return { ...prev, [cauHoiId]: next };
    });
    markDirty(cauHoiId);
  };

  const toggleMark = (cauHoiId) => {
    setMarked((m) => ({ ...m, [cauHoiId]: !m[cauHoiId] }));
    markDirty(cauHoiId);
  };

  const goTo = async (idx) => {
    if (q) await flush(q.cauHoiId);     // lưu câu hiện tại trước khi chuyển
    setCur(Math.max(0, Math.min(cauHois.length - 1, idx)));
  };

  // ---- nộp bài ----
  const nopBai = useCallback(async (tuDong = false) => {
    if (submitting || !luotThiId) return;
    setSubmitting(true);
    try {
      await Promise.allSettled([...dirtyRef.current].map((id) => flush(id)));
      await tnService.thi.nop(luotThiId);
      if (!tuDong) toast.success('Đã nộp bài');
      navigate(`${ROUTES.STUDENT_TN_KET_QUA}/${luotThiId}`, { replace: true });
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Nộp bài thất bại');
      setSubmitting(false);
    }
  }, [submitting, luotThiId, flush, navigate]);

  const { dinhDang, conLai } = useTnCountdown(
    bai?.thoiGianHanNop, bai?.serverTime,
    useCallback(() => nopBai(true), [nopBai])
  );

  // cảnh báo khi rời trang
  useEffect(() => {
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, []);

  const soDaLam = useMemo(
    () => cauHois.filter((c) => (answers[c.cauHoiId] || []).length > 0).length,
    [cauHois, answers]
  );

  if (isLoading) return <Loading />;
  if (isError) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <p className="text-slate-700 font-medium">
          {error?.response?.data?.message || 'Không thể bắt đầu bài thi'}
        </p>
        <Button variant="outline" onClick={() => navigate(ROUTES.STUDENT_TN)}>Về danh sách</Button>
      </div>
    );
  }

  const sapHetGio = conLai !== null && conLai <= 60;

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-5">
      {/* Thanh trên: tiêu đề + đồng hồ */}
      <div className="sticky top-0 z-20 -mx-3 sm:mx-0 px-3 sm:px-0 pb-3 bg-slate-50/95 backdrop-blur">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white ring-1 ring-slate-200 px-4 py-3">
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate">{bai.tieuDe}</p>
            <p className="text-xs text-slate-500">
              Lần {bai.lanThu} · Đã làm {soDaLam}/{cauHois.length} câu
              {bai.tiepTuc && <span className="ml-1 text-amber-600">· khôi phục bài đang dở</span>}
            </p>
          </div>
          <div className={`flex items-center gap-1.5 font-mono font-bold text-lg tabular-nums px-3 py-1.5 rounded-lg ${
            sapHetGio ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'
          }`}>
            <Clock className="w-4 h-4" /> {dinhDang}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_240px] gap-4 mt-3">
        {/* Câu hỏi */}
        <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 sm:p-6">
          {q && (
            <>
              <div className="flex items-start justify-between gap-3 mb-4">
                <span className="text-sm font-bold text-primary">Câu {cur + 1}/{cauHois.length}</span>
                <button
                  onClick={() => toggleMark(q.cauHoiId)}
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md ${
                    marked[q.cauHoiId] ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" /> {marked[q.cauHoiId] ? 'Đã đánh dấu' : 'Đánh dấu'}
                </button>
              </div>

              <div className="prose prose-sm max-w-none text-slate-800 mb-2"
                   dangerouslySetInnerHTML={{ __html: q.noiDung }} />
              {q.hinhAnh && <img src={q.hinhAnh} alt="" className="rounded-lg my-3 max-h-72" />}
              <p className="text-xs text-slate-400 mb-4">
                {q.loai === 'NHIEU_DAP_AN' ? 'Chọn nhiều đáp án' : 'Chọn một đáp án'}
              </p>

              <div className="space-y-2.5">
                {q.dapAns.map((da, i) => {
                  const picked = (answers[q.cauHoiId] || []).includes(da.id);
                  return (
                    <button
                      key={da.id}
                      onClick={() => chon(q.cauHoiId, da.id, q.loai)}
                      className={`w-full text-left flex items-start gap-3 rounded-lg border px-3.5 py-3 transition-colors ${
                        picked ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`flex-shrink-0 w-6 h-6 rounded-${q.loai === 'NHIEU_DAP_AN' ? 'md' : 'full'} border flex items-center justify-center text-xs font-bold ${
                        picked ? 'bg-primary border-primary text-white' : 'border-slate-300 text-slate-400'
                      }`}>
                        {picked ? <CheckCircle2 className="w-4 h-4" /> : String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-sm text-slate-700 pt-0.5">{da.noiDung}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                <Button variant="outline" size="sm" icon={ChevronLeft}
                        disabled={cur === 0} onClick={() => goTo(cur - 1)}>Câu trước</Button>
                <SaveHint state={saving[q.cauHoiId]} />
                <Button variant="outline" size="sm" icon={ChevronRight} iconPosition="right"
                        disabled={cur === cauHois.length - 1} onClick={() => goTo(cur + 1)}>Câu sau</Button>
              </div>
            </>
          )}
        </div>

        {/* Bảng điều hướng câu hỏi */}
        <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 h-max lg:sticky lg:top-24">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Danh sách câu</p>
          <div className="grid grid-cols-6 lg:grid-cols-5 gap-1.5">
            {cauHois.map((c, i) => {
              const done = (answers[c.cauHoiId] || []).length > 0;
              const mk = marked[c.cauHoiId];
              return (
                <button key={c.id} onClick={() => goTo(i)}
                  className={`relative h-9 rounded-md text-xs font-semibold transition-colors ${
                    i === cur ? 'ring-2 ring-primary ring-offset-1 ' : ''
                  }${done ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {i + 1}
                  {mk && <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1 text-[11px] text-slate-500">
            <p><span className="inline-block w-3 h-3 rounded-sm bg-primary align-middle mr-1.5" />Đã trả lời</p>
            <p><span className="inline-block w-3 h-3 rounded-sm bg-slate-200 align-middle mr-1.5" />Chưa trả lời</p>
            <p><span className="inline-block w-2 h-2 rounded-full bg-amber-400 align-middle mr-2" />Đánh dấu xem lại</p>
          </div>
          <Button fullWidth variant="success" className="mt-4" isLoading={submitting}
                  onClick={() => {
                    if (window.confirm(`Nộp bài? Bạn đã trả lời ${soDaLam}/${cauHois.length} câu.`)) nopBai(false);
                  }}>
            Nộp bài
          </Button>
        </div>
      </div>
    </div>
  );
}

function SaveHint({ state }) {
  if (state === 'saving') return <span className="text-xs text-slate-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Đang lưu</span>;
  if (state === 'saved') return <span className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Đã lưu</span>;
  return <span className="text-xs text-slate-300">Tự động lưu</span>;
}
