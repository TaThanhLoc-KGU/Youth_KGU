/**
 * OnlyOfficeEditor — tích hợp OnlyOffice Document Server qua JavaScript SDK.
 *
 * Để sử dụng, cần cài OnlyOffice Community Server:
 *   docker run -i -t -d -p 8081:80 --restart=always onlyoffice/documentserver
 *
 * Props:
 *   documentUrl  – URL file cần mở (DOCX/XLSX/PPTX/PDF trên server của bạn)
 *   documentKey  – Unique key cho version (thay đổi khi file thay đổi)
 *   fileName     – Tên file hiển thị
 *   fileType     – "docx" | "xlsx" | "pptx" | "pdf"
 *   mode         – "edit" | "view" (mặc định "edit")
 *   callbackUrl  – URL backend nhận file sau khi save (POST, multipart)
 *   onSaved      – callback khi save thành công
 *   height       – CSS height (mặc định "100%")
 */
import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const ONLYOFFICE_SERVER = import.meta.env.VITE_ONLYOFFICE_URL || 'http://localhost:8081';

// Load OnlyOffice API script 1 lần
let scriptPromise = null;
function loadScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.DocsAPI) { resolve(); return; }
    const s = document.createElement('script');
    s.src = `${ONLYOFFICE_SERVER}/web-apps/apps/api/documents/api.js`;
    s.async = true;
    s.onload  = resolve;
    s.onerror = () => {
      scriptPromise = null; // cho phép retry
      reject(new Error('Không thể kết nối OnlyOffice Server tại ' + ONLYOFFICE_SERVER));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

let editorCounter = 0;

export default function OnlyOfficeEditor({
  documentUrl,
  documentKey,
  fileName = 'document.docx',
  fileType = 'docx',
  mode = 'edit',
  callbackUrl,
  onSaved,
  height = '100%',
  className = '',
}) {
  const containerRef = useRef(null);
  const editorRef    = useRef(null);
  const editorId     = useRef(`onlyoffice-editor-${++editorCounter}`);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError]   = useState('');

  useEffect(() => {
    if (!documentUrl) return;

    let destroyed = false;

    const init = async () => {
      setStatus('loading');
      setError('');

      try {
        await loadScript();
        if (destroyed) return;

        if (!window.DocsAPI) throw new Error('DocsAPI không khả dụng');

        // Hủy editor cũ nếu có
        if (editorRef.current) {
          try { editorRef.current.destroyEditor(); } catch {}
          editorRef.current = null;
        }

        const config = {
          document: {
            fileType,
            key:   documentKey || `doc-${Date.now()}`,
            title: fileName,
            url:   documentUrl,
            permissions: {
              edit:     mode === 'edit',
              download: true,
              print:    true,
              review:   false,
            },
          },
          documentType: getDocumentType(fileType),
          editorConfig: {
            mode,
            lang: 'vi',
            callbackUrl: callbackUrl || undefined,
            customization: {
              autosave:    true,
              compactMode: false,
              feedback:    { visible: false },
              logo:        { image: '', imageLight: '' },
              close:       { visible: false },
            },
          },
          events: {
            onDocumentReady: () => {
              if (!destroyed) setStatus('ready');
            },
            onDocumentStateChange: (e) => {
              // e.data = true khi có thay đổi chưa save
            },
            onError: (e) => {
              if (!destroyed) {
                setError(e?.data?.description || 'Lỗi editor');
                setStatus('error');
              }
            },
            onSave: (e) => {
              onSaved?.(e);
            },
          },
          height:  '100%',
          width:   '100%',
          type:    'desktop',
        };

        editorRef.current = new window.DocsAPI.DocEditor(editorId.current, config);
        if (!destroyed) setStatus('ready');
      } catch (err) {
        if (!destroyed) {
          setError(err.message || 'Không thể khởi tạo editor');
          setStatus('error');
        }
      }
    };

    init();

    return () => {
      destroyed = true;
      if (editorRef.current) {
        try { editorRef.current.destroyEditor(); } catch {}
        editorRef.current = null;
      }
    };
  }, [documentUrl, documentKey, mode]);

  return (
    <div className={`relative flex flex-col ${className}`} style={{ height }}>
      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 z-10 bg-white flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-500">Đang tải trình soạn thảo...</p>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="absolute inset-0 z-10 bg-white flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">Không thể mở trình soạn thảo</p>
            <p className="text-sm text-gray-500 max-w-sm">{error}</p>
            <p className="text-xs text-gray-400 mt-2">
              Kiểm tra OnlyOffice Server tại <code className="bg-gray-100 px-1 rounded">{ONLYOFFICE_SERVER}</code>
            </p>
          </div>
          <button onClick={() => { scriptPromise = null; setStatus('loading'); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold">
            <RefreshCw className="w-4 h-4" /> Thử lại
          </button>
          <OnlyOfficeSetupGuide />
        </div>
      )}

      {/* Editor container */}
      <div id={editorId.current} ref={containerRef} className="flex-1 w-full" />
    </div>
  );
}

// Fallback: hướng dẫn cài đặt khi chưa có server
function OnlyOfficeSetupGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full max-w-md">
      <button onClick={() => setOpen(v => !v)}
        className="text-xs text-blue-500 hover:underline">
        {open ? 'Ẩn hướng dẫn' : 'Xem hướng dẫn cài đặt OnlyOffice'}
      </button>
      {open && (
        <div className="mt-3 text-left bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs space-y-2">
          <p className="font-semibold text-gray-700">Cài đặt OnlyOffice Community Server:</p>
          <pre className="bg-gray-900 text-green-400 rounded-lg p-3 overflow-x-auto leading-relaxed text-[11px]">{
`# 1. Cài Docker (nếu chưa có)
# 2. Chạy OnlyOffice Document Server:
docker run -i -t -d \\
  -p 8081:80 \\
  --restart=always \\
  -e JWT_ENABLED=false \\
  onlyoffice/documentserver

# 3. Kiểm tra: http://localhost:8081

# 4. Thêm vào .env frontend:
VITE_ONLYOFFICE_URL=http://localhost:8081`
          }</pre>
          <p className="text-gray-500">
            Lưu ý: OnlyOffice cần truy cập được file qua URL công khai.
            Đảm bảo CORS được cấu hình đúng.
          </p>
        </div>
      )}
    </div>
  );
}

// Xác định loại document từ fileType
function getDocumentType(fileType) {
  const ext = fileType.toLowerCase();
  if (['doc', 'docx', 'odt', 'txt', 'rtf'].includes(ext)) return 'word';
  if (['xls', 'xlsx', 'ods', 'csv'].includes(ext))        return 'cell';
  if (['ppt', 'pptx', 'odp'].includes(ext))               return 'slide';
  if (['pdf'].includes(ext))                               return 'pdf';
  return 'word';
}
