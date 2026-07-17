/**
 * BieuMauManagePage.jsx - Admin quan ly Bieu mau (form files).
 * Upload file + dat ten hien thi. Hien thi ra trang tin tuc public.
 */
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ArrowLeft, Save, X,
  FileText, Download, Upload, RefreshCw, File, PenLine,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bieuMauService from '../../services/bieuMauService';
import { API_BASE_URL } from '../../services/api';
import BieuMauEditor from '../../components/office/BieuMauEditor';

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmtSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const EXT_COLOR = {
  pdf:  'text-red-500 bg-red-50',
  docx: 'text-blue-500 bg-blue-50',
  doc:  'text-blue-500 bg-blue-50',
  xlsx: 'text-green-500 bg-green-50',
  xls:  'text-green-500 bg-green-50',
  pptx: 'text-orange-500 bg-orange-50',
  ppt:  'text-orange-500 bg-orange-50',
};

// ── Form ──────────────────────────────────────────────────────────────────────

const BieuMauForm = ({ initial, onSave, onCancel, loading }) => {
  const [ten, setTen]         = useState(initial?.ten || '');
  const [thuTu, setThuTu]     = useState(initial?.thuTu ?? 0);
  const [isActive, setActive] = useState(initial?.isActive !== false);
  const [file, setFile]       = useState(null);
  const [doReplace, setDoReplace] = useState(false);
  const fileRef = useRef();
  const isEdit  = !!initial?.id;

  const submit = (e) => {
    e.preventDefault();
    if (!ten.trim()) { toast.error('Vui long nhap ten hien thi'); return; }
    if (!isEdit && !file) { toast.error('Vui long chon file'); return; }
    onSave({ ten: ten.trim(), thuTu: Number(thuTu), isActive, file: file || undefined, replaceFile: doReplace });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ten hien thi <span className="text-red-500">*</span>
        </label>
        <input value={ten} onChange={(e) => setTen(e.target.value)}
          placeholder="Vi du: Don xin tham gia hoat dong"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          File {!isEdit ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal ml-1">(bo trong = giu file cu)</span>}
        </label>
        {isEdit && initial?.duongDan && !doReplace && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-600 truncate flex-1">{initial.ten}.{initial.loaiFile}</span>
            <button type="button" onClick={() => setDoReplace(true)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 flex-shrink-0">
              <RefreshCw className="w-3 h-3" /> Thay file
            </button>
          </div>
        )}
        {(!isEdit || doReplace) && (
          <>
            <div onClick={() => fileRef.current.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors">
              <Upload className="w-6 h-6 text-gray-400" />
              <p className="text-sm text-gray-500">{file ? file.name : 'Click de chon file'}</p>
              <p className="text-xs text-gray-400">PDF, Word, Excel, PowerPoint - toi da 50 MB</p>
            </div>
            <input ref={fileRef} type="file" className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              onChange={(e) => setFile(e.target.files[0] || null)} />
            {file && (
              <div className="flex items-center gap-2 mt-1 text-xs text-green-600">
                <File className="w-3.5 h-3.5" /> {file.name} ({fmtSize(file.size)})
                <button type="button" onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500 ml-auto">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Thu tu hien thi</label>
        <input type="number" min="0" value={thuTu} onChange={(e) => setThuTu(e.target.value)}
          className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <p className="text-xs text-gray-400 mt-1">So nho hon hien thi truoc. Mac dinh 0.</p>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={isActive} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 accent-blue-600" />
        <span className="text-sm font-medium text-gray-700">Hien thi ra trang cong khai</span>
      </label>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Huy</button>
        <button type="submit" disabled={loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
          <Save className="w-4 h-4" /> {loading ? 'Dang luu...' : 'Luu'}
        </button>
      </div>
    </form>
  );
};

// ── Row ───────────────────────────────────────────────────────────────────────

const EDITABLE_EXTS = ['docx', 'doc', 'html', 'htm'];

const BieuMauRow = ({ item, onEdit, onDelete, onToggle, onOpenEditor, toggling }) => {
  const color = EXT_COLOR[item.loaiFile?.toLowerCase()] || 'text-gray-500 bg-gray-100';
  const canEdit = EDITABLE_EXTS.includes(item.loaiFile?.toLowerCase());
  return (
    <div className={`group flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
      item.isActive ? 'border-gray-200 bg-white hover:border-gray-300' : 'border-dashed border-gray-200 bg-gray-50 opacity-60'
    }`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <FileText className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-800 truncate">{item.ten}</p>
          {item.loaiFile && (
            <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-gray-100 text-gray-500">
              {item.loaiFile}
            </span>
          )}
          {!item.isActive && (
            <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">Ẩn</span>
          )}
        </div>
        {item.kichThuoc && <p className="text-xs text-gray-400 mt-0.5">{fmtSize(item.kichThuoc)}</p>}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {canEdit && (
          <button onClick={() => onOpenEditor(item)} title="Mở editor chỉnh sửa nội dung"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors sm:opacity-0 sm:group-hover:opacity-100">
            <PenLine className="w-3.5 h-3.5" /> Sửa
          </button>
        )}
        {item.duongDan && (
          <a href={`${API_BASE_URL}${item.duongDan}`} target="_blank" rel="noreferrer"
            title="Tải xuống" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
            <Download className="w-4 h-4" />
          </a>
        )}
        <button onClick={() => onToggle(item)} disabled={toggling}
          title={item.isActive ? 'Ẩn' : 'Hiện'}
          className={`p-1.5 rounded-lg transition-colors ${item.isActive ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
          {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <button onClick={() => onEdit(item)} title="Chỉnh sửa thông tin"
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(item.id)} title="Xóa"
          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const BieuMauManagePage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showForm,     setShowForm]     = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [editorItem,   setEditorItem]   = useState(null); // item đang mở trong editor

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['bieu-mau-admin'],
    queryFn: bieuMauService.getAll,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['bieu-mau-admin'] });
    qc.invalidateQueries({ queryKey: ['bieu-mau-public'] });
  };

  const createMut = useMutation({
    mutationFn: bieuMauService.create,
    onSuccess: () => { toast.success('Da them bieu mau'); invalidate(); setShowForm(false); },
    onError: (err) => toast.error(err.response?.data?.message || 'Loi tao bieu mau'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data, file }) => {
      const meta = bieuMauService.updateMeta(id, data);
      if (file) return meta.then(() => bieuMauService.replaceFile(id, file));
      return meta;
    },
    onSuccess: () => { toast.success('Da cap nhat bieu mau'); invalidate(); setEditing(null); setShowForm(false); },
    onError: (err) => toast.error(err.response?.data?.message || 'Loi cap nhat'),
  });

  const deleteMut = useMutation({
    mutationFn: bieuMauService.delete,
    onSuccess: () => { toast.success('Da xoa bieu mau'); invalidate(); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, ten, thuTu, isActive }) => bieuMauService.updateMeta(id, { ten, thuTu, isActive }),
    onSuccess: invalidate,
  });

  const handleSave = ({ ten, thuTu, isActive, file, replaceFile }) => {
    if (editing) {
      updateMut.mutate({ id: editing.id, data: { ten, thuTu, isActive }, file: (replaceFile && file) ? file : undefined });
    } else {
      createMut.mutate({ ten, thuTu, isActive, file });
    }
  };

  const closeForm = () => { setShowForm(false); setEditing(null); };

  // Editor full-screen
  if (editorItem) {
    return (
      <BieuMauEditor
        item={editorItem}
        onClose={() => setEditorItem(null)}
        onSaved={() => { invalidate(); setEditorItem(null); }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Quan ly Bieu mau</h1>
            <p className="text-sm text-gray-500 mt-0.5">Upload file va dat ten hien thi de nguoi dung tai ve</p>
          </div>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Them bieu mau
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editing ? 'Chinh sua bieu mau' : 'Them bieu mau moi'}</h2>
              <button onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <BieuMauForm initial={editing} onSave={handleSave} onCancel={closeForm}
                loading={createMut.isPending || updateMut.isPending} />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Danh sach bieu mau ({items.length})</span>
          <span className="text-xs text-gray-400">{items.filter(b => b.isActive).length} dang hien thi</span>
        </div>
        <div className="p-4 space-y-2 min-h-[200px]">
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <FileText className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Chua co bieu mau nao. Nhan them bieu mau de bat dau.</p>
            </div>
          ) : (
            items.map(item => (
              <BieuMauRow
                key={item.id}
                item={item}
                onEdit={(i) => { setEditing(i); setShowForm(true); }}
                onDelete={(id) => { if (window.confirm('Xóa biểu mẫu này? File vật lý cũng sẽ bị xóa.')) deleteMut.mutate(id); }}
                onToggle={(i) => toggleMut.mutate({ id: i.id, ten: i.ten, thuTu: i.thuTu, isActive: !i.isActive })}
                onOpenEditor={(i) => setEditorItem(i)}
                toggling={toggleMut.isPending}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BieuMauManagePage;
