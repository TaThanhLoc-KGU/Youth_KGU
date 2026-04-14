import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  ArrowLeft, Save, Send, ChevronRight, FileText, Loader2, Pin, User
} from 'lucide-react';
import newsService from '../../services/newsService';
import RichTextEditor from '../../components/news/manage/RichTextEditor';
import TreePickerModal from '../../components/news/manage/TreePickerModal';
import VanBanSearchBox from '../../components/news/manage/VanBanSearchBox';
import HoatDongSearchBox from '../../components/news/manage/HoatDongSearchBox';
import AvatarUploader from '../../components/news/manage/AvatarUploader';

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
 */
const TinTucEditorPage = ({ backPath = '/admin/news', basePath = '/admin/news' }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { id } = useParams();
  const isEdit = !!id;

  // ── Load existing post ──
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
    donViDang: '',
    tacGia: '',
  });
  const [chuyenMuc, setChuyenMuc] = useState(null);
  const [vanBan,    setVanBan]    = useState(null);
  const [hoatDong,  setHoatDong]  = useState(null); // object đầy đủ từ HoatDongSearchBox
  const [showPicker, setShowPicker] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ── Populate from existing ──
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
        donViDang:   existing.donViDang   || '',
        tacGia:      existing.tacGia      || '',
      });
      setChuyenMuc(existing.chuyenMuc || null);
      setVanBan(existing.vanBan || null);
      // Khôi phục hoạt động liên kết (chỉ có maHoatDong — hiển thị minimal card)
      if (existing.hoatDongId) {
        setHoatDong({ maHoatDong: existing.hoatDongId, tenHoatDong: existing.tenHoatDong || '' });
      }
    }
  }, [existing]);

  useEffect(() => { set('chuyenMucId', chuyenMuc?.id || null); }, [chuyenMuc]);
  useEffect(() => { set('vanBanId',    vanBan?.id    || null); }, [vanBan]);
  useEffect(() => { set('hoatDongId',  hoatDong?.maHoatDong || ''); }, [hoatDong]);

  // ── Save mutation ──
  const saveMutation = useMutation({
    mutationFn: async ({ action }) => {
      if (!form.tieuDe.trim()) throw new Error('Vui lòng nhập tiêu đề');
      if (!form.chuyenMucId) throw new Error('Vui lòng chọn chuyên mục');

      const payload = { ...form };
      let saved;
      if (isEdit) {
        saved = await newsService.update(id, payload);
      } else {
        saved = await newsService.create(payload);
      }

      if (action === 'publish') {
        await newsService.publish(saved.id);
      }
      return { id: saved.id, action };
    },
    onSuccess: ({ id: savedId, action }) => {
      qc.invalidateQueries({ queryKey: ['admin-tin-tuc'] });
      qc.invalidateQueries({ queryKey: ['tin-tuc-detail', String(savedId)] });
      toast.success(action === 'publish' ? 'Đã đăng bài viết!' : 'Đã lưu nháp');
      navigate(backPath);
    },
    onError: (err) => {
      toast.error(err.message || 'Lỗi khi lưu bài viết');
    },
  });

  const slugPreview = chuyenMuc
    ? `${chuyenMuc.fullPathSlug}/${toSlugPreview(form.tieuDe)}`
    : toSlugPreview(form.tieuDe);

  if (isEdit && loadingExisting) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(backPath)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Quay lại</span>
          </button>

          <div className="flex items-center gap-1.5 text-sm text-gray-500 flex-1 min-w-0">
            <span className="truncate font-medium text-gray-800">
              {isEdit ? 'Sửa bài viết' : 'Tạo bài viết mới'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => saveMutation.mutate({ action: 'draft' })}
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Lưu nháp</span>
            </button>
            <button
              onClick={() => saveMutation.mutate({ action: 'publish' })}
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng bài</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Column */}
          <div className="flex-1 space-y-6">
            {/* Title */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <input
                value={form.tieuDe}
                onChange={(e) => set('tieuDe', e.target.value)}
                placeholder="Tiêu đề bài viết..."
                className="w-full text-3xl font-bold text-gray-900 placeholder-gray-200 border-none outline-none focus:ring-0"
              />
              {form.tieuDe && (
                <div className="mt-3 py-1 px-3 bg-gray-50 rounded text-xs text-gray-500 flex items-center gap-2">
                  <span className="font-semibold text-gray-400">URL:</span>
                  <span className="font-mono truncate">{slugPreview}</span>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Tóm tắt ngắn</label>
              <textarea
                value={form.tomTat}
                onChange={(e) => set('tomTat', e.target.value)}
                rows={3}
                placeholder="Nhập tóm tắt ngắn gọn hiển thị trên trang danh sách..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            {/* Content Editor */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Nội dung chi tiết</h3>
              </div>
              <RichTextEditor
                value={form.noiDung}
                onChange={(v) => set('noiDung', v)}
                placeholder="Bắt đầu viết nội dung bài viết của bạn tại đây..."
                height={560}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-96 space-y-6">
            {/* Category selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Chuyên mục *</label>
              <button
                onClick={() => setShowPicker(true)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-400 transition-colors text-sm"
              >
                {chuyenMuc ? (
                  <span className="text-blue-700 font-medium">{chuyenMuc.ten}</span>
                ) : (
                  <span className="text-gray-400">Chọn chuyên mục bài viết</span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Avatar Uploader */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <AvatarUploader
                value={form.anhDaiDien}
                onChange={(url) => set('anhDaiDien', url)}
                label="Ảnh đại diện bài viết"
              />
            </div>

            {/* Additional Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 border-b pb-2">Cài đặt bổ sung</h3>

              {/* Tác giả */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <User className="w-3 h-3" /> Tác giả hiển thị
                </label>
                <input
                  type="text"
                  value={form.tacGia}
                  onChange={(e) => set('tacGia', e.target.value)}
                  placeholder="Ví dụ: Ban Học thuật KGU, Đoàn Trường..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <p className="text-[11px] text-gray-400 mt-1">Tên tác giả / đơn vị hiển thị trên bài viết</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Văn bản liên quan
                </label>
                <VanBanSearchBox value={vanBan} onChange={setVanBan} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Hoạt động liên kết</label>
                <HoatDongSearchBox value={hoatDong} onChange={setHoatDong} />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={form.isGhim}
                      onChange={(e) => set('isGhim', e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-checked:bg-blue-600 rounded-full transition-colors" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Pin className={`w-4 h-4 ${form.isGhim ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium text-gray-700">Ghim bài lên đầu</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

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
