import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  ArrowLeft, Save, Send, Image as ImageIcon, Pin, X,
  ChevronRight, FileText, Loader2, Upload,
} from 'lucide-react';
import newsService from '../../services/newsService';
import RichTextEditor from '../../components/news/manage/RichTextEditor';
import TreePickerModal from '../../components/news/manage/TreePickerModal';
import VanBanSearchBox from '../../components/news/manage/VanBanSearchBox';

// Slug preview (client-side only)
const toSlugPreview = (str) =>
  str.toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-');

/**
 * Full-page editor cho Tin tức — Create & Edit.
 *
 * Props:
 *   backPath  – path để quay lại sau khi save (vd: '/admin/news')
 *   basePath  – prefix dùng để redirect sau create (vd: '/admin/news')
 */
const TinTucEditorPage = ({ backPath = '/admin/news', basePath = '/admin/news' }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { id } = useParams();           // undefined for create
  const [searchParams] = useSearchParams();
  const isEdit = !!id;

  // ── Load existing post when editing ──
  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['tin-tuc-detail', id],
    queryFn: () => newsService.getById(id),
    enabled: isEdit,
    staleTime: 0,
  });

  // ── Form state ──
  const [form, setForm] = useState({
    tieuDe: '',
    tomTat: '',
    noiDung: '',
    anhDaiDien: '',
    isGhim: false,
    chuyenMucId: null,
    vanBanId: null,
    hoatDongId: '',
  });
  const [chuyenMuc, setChuyenMuc] = useState(null);
  const [vanBan, setVanBan] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  // ── Thumbnail upload state ──
  const [thumbFile, setThumbFile]       = useState(null);    // File object
  const [thumbPreview, setThumbPreview] = useState(null);    // blob URL
  const thumbInputRef = useRef(null);

  // ── Article ID tracking (for image uploads in create mode) ──
  const [articleId, setArticleId] = useState(id ? Number(id) : null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ── Populate from existing post ──
  useEffect(() => {
    if (existing) {
      setForm({
        tieuDe:      existing.tieuDe      || '',
        tomTat:      existing.tomTat      || '',
        noiDung:     existing.noiDung     || '',
        anhDaiDien:  existing.anhDaiDien  || '',
        isGhim:      existing.isGhim      || false,
        chuyenMucId: existing.chuyenMuc?.id || null,
        vanBanId:    existing.vanBan?.id  || null,
        hoatDongId:  existing.hoatDongId  || '',
      });
      setChuyenMuc(existing.chuyenMuc  || null);
      setVanBan   (existing.vanBan     || null);
      setArticleId(existing.id);
    }
  }, [existing]);

  // Sync chuyenMucId / vanBanId into form
  useEffect(() => { set('chuyenMucId', chuyenMuc?.id || null); }, [chuyenMuc]);
  useEffect(() => { set('vanBanId',    vanBan?.id    || null); }, [vanBan]);

  // ── Thumbnail file picker ──
  const onThumbChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (thumbPreview) URL.revokeObjectURL(thumbPreview);
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };
  const clearThumb = () => {
    if (thumbPreview) URL.revokeObjectURL(thumbPreview);
    setThumbFile(null);
    setThumbPreview(null);
    set('anhDaiDien', '');
    if (thumbInputRef.current) thumbInputRef.current.value = '';
  };

  // ── Inline image upload handler for RichTextEditor ──
  const handleInlineImageUpload = useCallback(async (file) => {
    try {
      let useId = articleId;
      // If no article ID yet, auto-create a draft first
      if (!useId) {
        const draft = await newsService.create({
          tieuDe:      form.tieuDe || 'Bài viết mới',
          tomTat:      form.tomTat,
          noiDung:     '',
          anhDaiDien:  '',
          isGhim:      false,
          chuyenMucId: form.chuyenMucId,
        });
        useId = draft.id;
        setArticleId(useId);
        toast.info('Đã tự động tạo nháp để upload ảnh');
      }
      const url = await newsService.uploadAnh(useId, file);
      return url;
    } catch (err) {
      toast.error('Lỗi upload ảnh: ' + (err.response?.data?.message || err.message));
      throw err;
    }
  }, [articleId, form.tieuDe, form.tomTat, form.chuyenMucId]);

  // ── Save mutation ──
  const saveMutation = useMutation({
    mutationFn: async ({ action }) => {
      if (!form.tieuDe.trim()) throw new Error('Vui lòng nhập tiêu đề');
      if (!form.chuyenMucId)   throw new Error('Vui lòng chọn chuyên mục');

      const payload = { ...form };
      let useId = articleId;

      // Step 1: Create or update article
      let result;
      if (useId) {
        result = await newsService.update(useId, payload);
      } else {
        result = await newsService.create(payload);
        useId = result.id;
        setArticleId(useId);
      }

      // Step 2: Upload thumbnail if a new file was selected
      if (thumbFile) {
        const url = await newsService.uploadAnhDaiDien(useId, thumbFile);
        // Update anhDaiDien with the returned URL
        await newsService.update(useId, { ...payload, anhDaiDien: url });
        set('anhDaiDien', url);
        setThumbFile(null);
        if (thumbPreview) URL.revokeObjectURL(thumbPreview);
        setThumbPreview(null);
      }

      // Step 3: Publish if requested
      if (action === 'publish') {
        await newsService.publish(useId);
      }

      return { id: useId, action };
    },
    onSuccess: ({ id: savedId, action }) => {
      qc.invalidateQueries({ queryKey: ['admin-tin-tuc'] });
      qc.invalidateQueries({ queryKey: ['bch-tin-tuc'] });
      qc.invalidateQueries({ queryKey: ['tin-tuc-detail', String(savedId)] });
      toast.success(action === 'publish' ? 'Đã đăng bài viết!' : 'Đã lưu nháp');
      navigate(backPath);
    },
    onError: (err) => {
      toast.error(err.message || 'Lỗi khi lưu bài viết');
    },
  });

  const handleSave   = () => saveMutation.mutate({ action: 'draft' });
  const handlePublish = () => saveMutation.mutate({ action: 'publish' });

  const slugPreview = chuyenMuc
    ? `${chuyenMuc.fullPathSlug}/${toSlugPreview(form.tieuDe)}`
    : toSlugPreview(form.tieuDe);

  const thumbSrc = thumbPreview || form.anhDaiDien;

  if (isEdit && loadingExisting) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={() => navigate(backPath)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Bài viết</span>
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500 flex-1 min-w-0">
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            <span className="truncate font-medium text-gray-800">
              {isEdit ? 'Sửa bài viết' : 'Tạo bài viết mới'}
            </span>
            {form.tieuDe && (
              <>
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
                <span className="truncate text-gray-400">{form.tieuDe}</span>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {saveMutation.isPending && saveMutation.variables?.action === 'draft'
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline">Lưu nháp</span>
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-enews-600 hover:bg-enews-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saveMutation.isPending && saveMutation.variables?.action === 'publish'
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
              <span className="hidden sm:inline">Đăng bài</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col xl:flex-row gap-6">

          {/* ═══ Left — main editor ═══ */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Title */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <input
                value={form.tieuDe}
                onChange={(e) => set('tieuDe', e.target.value)}
                placeholder="Tiêu đề bài viết..."
                className="w-full text-2xl font-bold text-gray-900 placeholder-gray-300 border-none outline-none resize-none"
              />
              {form.tieuDe && (
                <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                  <span className="font-medium text-gray-500">🔗 URL:</span>
                  <span className="font-mono">{slugPreview}</span>
                </p>
              )}
            </div>

            {/* Category */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Chuyên mục <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-left hover:border-enews-400 transition-colors bg-gray-50 hover:bg-white"
              >
                {chuyenMuc ? (
                  <span className="flex items-center gap-1 text-enews-700 flex-wrap">
                    <span>Trang chủ</span>
                    {chuyenMuc.fullPathSlug?.split('/').map((part, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" />{part}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-gray-400">Chọn chuyên mục...</span>
                )}
              </button>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tóm tắt
                <span className="ml-2 text-xs text-gray-400 font-normal">{form.tomTat.length}/300</span>
              </label>
              <textarea
                value={form.tomTat}
                onChange={(e) => set('tomTat', e.target.value.slice(0, 300))}
                rows={3}
                maxLength={300}
                placeholder="Tóm tắt ngắn gọn hiển thị trên trang danh sách bài viết..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-enews-400 resize-none bg-gray-50 focus:bg-white transition-colors"
              />
            </div>

            {/* Rich text content */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Nội dung bài viết
              </label>
              <RichTextEditor
                value={form.noiDung}
                onChange={(v) => set('noiDung', v)}
                onImageUpload={handleInlineImageUpload}
                height={500}
              />
            </div>

            {/* VanBan + HoatDong (optional) */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Thông tin bổ sung</h3>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  <FileText className="w-3.5 h-3.5 inline mr-1" />
                  Văn bản đính kèm (tuỳ chọn)
                </label>
                <VanBanSearchBox value={vanBan} onChange={setVanBan} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Mã hoạt động liên kết (tuỳ chọn)
                </label>
                <input
                  value={form.hoatDongId}
                  onChange={(e) => set('hoatDongId', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-enews-400 bg-gray-50 focus:bg-white"
                  placeholder="Nhập mã hoạt động (để trống nếu không liên quan)"
                />
              </div>
            </div>
          </div>

          {/* ═══ Right — sidebar settings ═══ */}
          <div className="xl:w-80 space-y-4 flex-shrink-0">

            {/* Thumbnail upload */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-gray-500" />
                Ảnh đại diện
              </label>

              {/* Preview */}
              {thumbSrc ? (
                <div className="relative mb-3">
                  <img
                    src={thumbSrc}
                    alt="Ảnh đại diện"
                    className="w-full aspect-video object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={clearThumb}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow"
                    title="Xóa ảnh"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  className="w-full aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-enews-300 transition-colors mb-3"
                  onClick={() => thumbInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400">Click để chọn ảnh</p>
                  <p className="text-xs text-gray-300">JPG, PNG, WebP</p>
                </div>
              )}

              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onThumbChange}
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => thumbInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {thumbSrc ? 'Đổi ảnh' : 'Chọn ảnh'}
                </button>
              </div>

              {/* URL input fallback */}
              <div className="mt-3">
                <label className="block text-xs text-gray-400 mb-1">Hoặc nhập URL ảnh</label>
                <input
                  value={form.anhDaiDien}
                  onChange={(e) => {
                    set('anhDaiDien', e.target.value);
                    if (thumbPreview) { URL.revokeObjectURL(thumbPreview); setThumbPreview(null); }
                    setThumbFile(null);
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-enews-400 bg-gray-50"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Options */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Tùy chọn</h3>
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.isGhim}
                    onChange={(e) => set('isGhim', e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-checked:bg-enews-500 rounded-full transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </div>
                <Pin className="w-4 h-4 text-gray-400 group-hover:text-enews-500 transition-colors" />
                <span className="text-sm text-gray-700">Ghim bài lên đầu</span>
              </label>
            </div>

            {/* Quick actions (duplicated for sidebar convenience) */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Xuất bản</h3>
              <button
                type="button"
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
              >
                <Save className="w-4 h-4" />
                Lưu nháp
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={saveMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-enews-600 hover:bg-enews-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
              >
                <Send className="w-4 h-4" />
                Đăng bài ngay
              </button>
              <button
                type="button"
                onClick={() => navigate(backPath)}
                className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Hủy thay đổi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TreePicker modal */}
      {showPicker && (
        <TreePickerModal
          value={chuyenMuc}
          onChange={setChuyenMuc}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};

export default TinTucEditorPage;
