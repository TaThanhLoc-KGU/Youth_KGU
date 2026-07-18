import { useState, useRef, useCallback } from 'react';
import { FileText, FileSpreadsheet, Presentation, Upload, Plus,
         FolderOpen, X, ExternalLink, Download } from 'lucide-react';
import BrowserOfficeViewer from '../../components/office/BrowserOfficeViewer';

const FILE_META = {
  docx: { label: 'Word',       icon: FileText,        color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   hover: 'hover:bg-blue-100' },
  doc:  { label: 'Word',       icon: FileText,        color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   hover: 'hover:bg-blue-100' },
  xlsx: { label: 'Excel',      icon: FileSpreadsheet, color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  hover: 'hover:bg-green-100' },
  xls:  { label: 'Excel',      icon: FileSpreadsheet, color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  hover: 'hover:bg-green-100' },
  pptx: { label: 'PowerPoint', icon: Presentation,    color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', hover: 'hover:bg-orange-100' },
  pdf:  { label: 'PDF',        icon: FileText,        color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    hover: 'hover:bg-red-100' },
};

function getExt(name = '') { return name.split('.').pop().toLowerCase(); }
function getMeta(name)     { return FILE_META[getExt(name)] || FILE_META.docx; }

const RECENT_KEY = 'vanphong_recent_v2';
function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecent(list) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch {}
}

export default function VanPhongPage() {
  const [openedFile,  setOpenedFile]  = useState(null); // { file: File, name: string }
  const [recentFiles, setRecentFiles] = useState(loadRecent);
  const [urlInput,    setUrlInput]    = useState('');
  const [showUrl,     setShowUrl]     = useState(false);
  const [urlLoading,  setUrlLoading]  = useState(false);
  const fileInputRef = useRef(null);

  const openFile = useCallback((file, name) => {
    setOpenedFile({ file, name: name || file.name });
    // Cập nhật recent list (lưu tên + objectURL hay blob reference — chỉ lưu tên)
    setRecentFiles(prev => {
      const entry = { name: name || file.name, openedAt: Date.now() };
      const updated = [entry, ...prev.filter(f => f.name !== entry.name)].slice(0, 15);
      saveRecent(updated);
      return updated;
    });
  }, []);

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) openFile(file, file.name);
    e.target.value = '';
  };

  const handleOpenUrl = async () => {
    if (!urlInput.trim()) return;
    setUrlLoading(true);
    try {
      const resp = await fetch(urlInput.trim());
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const name = urlInput.split('/').pop().split('?')[0] || 'document';
      openFile(new File([blob], name, { type: blob.type }), name);
      setUrlInput('');
      setShowUrl(false);
    } catch (err) {
      alert('Không thể tải file từ URL: ' + err.message);
    } finally {
      setUrlLoading(false);
    }
  };

  const clearRecent = (name, e) => {
    e.stopPropagation();
    setRecentFiles(prev => {
      const updated = prev.filter(f => f.name !== name);
      saveRecent(updated);
      return updated;
    });
  };

  /* ── Opened view ───────────────────────────────────────────────────────── */
  if (openedFile) {
    const meta = getMeta(openedFile.name);
    const Icon = meta.icon;
    return (
      <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
        {/* Topbar */}
        <div className="flex items-center gap-3 bg-white border-b px-4 py-2 flex-shrink-0 shadow-sm">
          <button onClick={() => setOpenedFile(null)}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors">
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Thư viện</span>
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded ${meta.bg} flex-shrink-0`}>
            <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
          </span>
          <span className="text-sm font-medium text-gray-800 truncate flex-1 min-w-0">
            {openedFile.name}
          </span>
        </div>

        {/* Editor */}
        <div className="flex-1 min-h-0">
          <BrowserOfficeViewer
            file={openedFile.file}
            fileName={openedFile.name}
            height="100%"
          />
        </div>
      </div>
    );
  }

  /* ── Library view ──────────────────────────────────────────────────────── */
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Văn phòng điện tử</h1>
        <p className="text-sm text-gray-500 mt-1">
          Xem và chỉnh sửa tài liệu Word, Excel, PDF trực tiếp trên trình duyệt — không cần cài thêm phần mềm.
        </p>
      </div>

      {/* Quick type buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { ext: 'docx', label: 'Tài liệu Word' },
          { ext: 'xlsx', label: 'Bảng tính' },
          { ext: 'pdf',  label: 'Tệp PDF' },
          { ext: 'pptx', label: 'Trình chiếu' },
        ].map(({ ext, label }) => {
          const meta = FILE_META[ext];
          const Icon = meta.icon;
          return (
            <button key={ext}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = `.${ext}`;
                  fileInputRef.current.click();
                }
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${meta.border} ${meta.bg} ${meta.hover} transition-colors group`}>
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:shadow transition-shadow">
                <Icon className={`w-5 h-5 ${meta.color}`} />
              </div>
              <span className="text-xs font-medium text-gray-700">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = '.docx,.doc,.xlsx,.xls,.pptx,.ppt,.pdf,.odt,.ods,.odp,.csv,.txt';
              fileInputRef.current.click();
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Upload className="w-4 h-4" />
          Mở tệp từ máy tính
        </button>
        <button onClick={() => setShowUrl(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold transition-colors">
          <ExternalLink className="w-4 h-4" />
          Mở từ URL
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInput}
          accept=".docx,.doc,.xlsx,.xls,.pptx,.ppt,.pdf,.odt,.ods,.odp,.csv,.txt" />
      </div>

      {/* URL input */}
      {showUrl && (
        <div className="flex gap-2 mb-6">
          <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleOpenUrl()}
            placeholder="https://example.com/document.docx"
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus />
          <button onClick={handleOpenUrl} disabled={urlLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
            {urlLoading ? 'Đang tải…' : 'Mở'}
          </button>
          <button onClick={() => { setShowUrl(false); setUrlInput(''); }}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Supported formats info */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-8 text-sm text-blue-700">
        <p className="font-semibold mb-1">Định dạng được hỗ trợ</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs">
          <span>📄 DOCX / DOC — Xem + Sửa</span>
          <span>📊 XLSX / XLS / CSV — Xem bảng tính</span>
          <span>📕 PDF — Xem (có zoom, chuyển trang)</span>
          <span>📝 ODT / ODS — Xem</span>
          <span>🗃️ TXT — Xem</span>
          <span>🚫 PPTX — Tải về để mở</span>
        </div>
      </div>

      {/* Recent files */}
      {recentFiles.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Đã mở gần đây</h2>
          <p className="text-xs text-gray-400 mb-3">
            Lịch sử chỉ lưu tên file. Để mở lại, kéo thả file vào trang hoặc dùng nút "Mở tệp".
          </p>
          <div className="grid gap-2">
            {recentFiles.map((f) => {
              const meta = getMeta(f.name);
              const Icon = meta.icon;
              return (
                <div key={f.name + f.openedAt}
                  className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-2xl group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(f.openedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <button onClick={(e) => clearRecent(f.name, e)}
                    className="p-1 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Drop zone hint */}
      {recentFiles.length === 0 && (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Chưa có tài liệu nào. Mở tệp từ máy tính để bắt đầu.</p>
        </div>
      )}
    </div>
  );
}
