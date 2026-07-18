/**
 * BrowserOfficeViewer — xem & chỉnh sửa tài liệu văn phòng hoàn toàn trong browser.
 * Không cần server ngoài, không cần Docker.
 *
 * DOCX  → docx-preview (view) + mammoth + TipTap (edit) + docx (export)
 * PDF   → pdfjs-dist (view, không sửa được)
 * XLSX  → SheetJS (view/edit bảng tính)
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, AlertCircle, Edit3, Eye, Download, Table, FileText,
         ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

/* ─── DOCX viewer ─────────────────────────────────────────────────────────── */
function DocxViewer({ file, onReady }) {
  const containerRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file || !containerRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const { renderAsync } = await import('docx-preview');
        const buf = await file.arrayBuffer();
        if (cancelled) return;
        await renderAsync(buf, containerRef.current, null, {
          className: 'docx-preview',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          useBase64URL: true,
          renderFootnotes: true,
          renderEndnotes: true,
        });
        if (!cancelled) onReady?.();
      } catch (err) {
        if (!cancelled) setError(err.message || 'Không thể hiển thị tài liệu');
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-red-500">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef}
      className="docx-preview-container bg-gray-200 min-h-full p-6 overflow-auto"
      style={{ fontFamily: 'inherit' }} />
  );
}

/* ─── DOCX editor (TipTap) ────────────────────────────────────────────────── */
function DocxEditor({ file, fileName, onExport }) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [EditorComp, setEditorComp] = useState(null);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const mammoth = (await import('mammoth')).default || (await import('mammoth'));
        const buf = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: buf });
        if (!cancelled) {
          setHtml(result.value);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) { setError(err.message); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  // Lazy-load TipTap editor để tránh bundle nặng
  useEffect(() => {
    import('./TipTapDocEditor').then(m => setEditorComp(() => m.default)).catch(() => {});
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-blue-500" /></div>;
  if (error) return <div className="p-6 text-red-500 text-sm">{error}</div>;
  if (!EditorComp) return <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-blue-500" /></div>;

  return <EditorComp initialHtml={html} fileName={fileName} onExport={onExport} />;
}

/* ─── PDF viewer ──────────────────────────────────────────────────────────── */
function PdfViewer({ file }) {
  const canvasRef  = useRef(null);
  const [pdfDoc,   setPdfDoc]   = useState(null);
  const [page,     setPage]     = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale,    setScale]    = useState(1.2);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const renderTask = useRef(null);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const pdfjsLib = await import('pdfjs-dist');
        // Dùng CDN worker để tránh cấu hình bundler phức tạp
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        const buf = await file.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: buf }).promise;
        if (!cancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setPage(1);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) { setError(err.message); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        if (renderTask.current) { renderTask.current.cancel(); }
        const pdfPage = await pdfDoc.getPage(page);
        const viewport = pdfPage.getViewport({ scale });
        const canvas = canvasRef.current;
        canvas.width  = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        const task = pdfPage.render({ canvasContext: ctx, viewport });
        renderTask.current = task;
        await task.promise;
      } catch (err) {
        if (!cancelled && err?.name !== 'RenderingCancelledException') {
          console.error('PDF render error:', err);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, page, scale]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-blue-500" /></div>;
  if (error) return <div className="p-6 text-red-500 text-sm">{error}</div>;

  return (
    <div className="flex flex-col items-center gap-4 py-4 bg-gray-200 min-h-full">
      {/* Controls */}
      <div className="flex items-center gap-2 bg-white shadow rounded-full px-3 py-1.5 sticky top-2 z-10">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
          className="p-1.5 hover:bg-gray-100 rounded-full disabled:opacity-40">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-600 min-w-[70px] text-center">{page} / {numPages}</span>
        <button onClick={() => setPage(p => Math.min(numPages, p + 1))} disabled={page >= numPages}
          className="p-1.5 hover:bg-gray-100 rounded-full disabled:opacity-40">
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
          className="p-1.5 hover:bg-gray-100 rounded-full">
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500 w-10 text-center">{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => Math.min(3, s + 0.2))}
          className="p-1.5 hover:bg-gray-100 rounded-full">
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
      <canvas ref={canvasRef} className="shadow-2xl bg-white" />
    </div>
  );
}

/* ─── XLSX viewer ─────────────────────────────────────────────────────────── */
function XlsxViewer({ file }) {
  const [sheets,       setSheets]       = useState([]);
  const [activeSheet,  setActiveSheet]  = useState(0);
  const [workbook,     setWorkbook]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const XLSX = await import('xlsx');
        const buf  = await file.arrayBuffer();
        const wb   = XLSX.read(buf, { type: 'array', cellStyles: true });
        if (cancelled) return;
        setWorkbook(wb);
        const sheetNames = wb.SheetNames;
        const parsed = sheetNames.map(name => {
          const ws   = wb.Sheets[name];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          return { name, data };
        });
        setSheets(parsed);
        setLoading(false);
      } catch (err) {
        if (!cancelled) { setError(err.message); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-blue-500" /></div>;
  if (error) return <div className="p-6 text-red-500 text-sm">{error}</div>;
  if (!sheets.length) return null;

  const current = sheets[activeSheet];
  const colCount = Math.max(...(current.data.map(r => r.length)), 0);
  const headers  = current.data[0] || [];

  return (
    <div className="flex flex-col h-full">
      {/* Sheet tabs */}
      {sheets.length > 1 && (
        <div className="flex gap-1 border-b px-3 pt-2 bg-gray-50 flex-shrink-0 overflow-x-auto">
          {sheets.map((s, i) => (
            <button key={s.name} onClick={() => setActiveSheet(i)}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-md whitespace-nowrap border-b-2 transition-colors
                ${i === activeSheet ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
              <Table className="w-3 h-3 inline mr-1" />{s.name}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="text-xs border-collapse w-max min-w-full">
          <thead>
            <tr className="bg-gray-100 sticky top-0 z-10">
              <th className="border border-gray-300 px-2 py-1 text-center text-gray-400 font-normal w-8 min-w-[2rem]">#</th>
              {Array.from({ length: colCount }, (_, i) => (
                <th key={i} className="border border-gray-300 px-2 py-1 text-center text-gray-500 font-semibold min-w-[80px] max-w-[200px]">
                  {String.fromCharCode(65 + i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.data.map((row, ri) => (
              <tr key={ri} className={ri === 0 ? 'bg-blue-50 font-medium' : ri % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="border border-gray-200 px-2 py-1 text-center text-gray-400 text-[10px]">{ri + 1}</td>
                {Array.from({ length: colCount }, (_, ci) => (
                  <td key={ci} className="border border-gray-200 px-2 py-1 whitespace-nowrap max-w-[200px] truncate"
                    title={String(row[ci] ?? '')}>
                    {String(row[ci] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────────────────── */
function getExt(name = '') { return name.split('.').pop().toLowerCase(); }

function getFileType(ext) {
  if (['doc', 'docx', 'odt'].includes(ext))  return 'word';
  if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) return 'cell';
  if (['pdf'].includes(ext))                  return 'pdf';
  return 'other';
}

export default function BrowserOfficeViewer({
  file,          // File object (từ input hoặc fetch)
  fileName,
  height = '100%',
  className = '',
}) {
  const [mode, setMode] = useState('view'); // view | edit
  const [ready, setReady] = useState(false);
  const ext      = getExt(fileName || file?.name || '');
  const fileType = getFileType(ext);
  const canEdit  = fileType === 'word';

  const handleDownload = useCallback(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a   = document.createElement('a');
    a.href = url; a.download = fileName || file.name;
    a.click();
    URL.revokeObjectURL(url);
  }, [file, fileName]);

  if (!file) return null;

  return (
    <div className={`flex flex-col bg-white ${className}`} style={{ height }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b px-3 py-2 bg-gray-50 flex-shrink-0">
        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-700 truncate flex-1 min-w-0">
          {fileName || file.name}
        </span>

        {canEdit && (
          <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setMode('view')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors
                ${mode === 'view' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
              <Eye className="w-3.5 h-3.5" /> Xem
            </button>
            <button onClick={() => setMode('edit')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors
                ${mode === 'edit' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
              <Edit3 className="w-3.5 h-3.5" /> Sửa
            </button>
          </div>
        )}

        <button onClick={handleDownload}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
          <Download className="w-3.5 h-3.5" /> Tải về
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {fileType === 'word' && mode === 'view' && (
          <div className="h-full overflow-auto">
            <DocxViewer file={file} onReady={() => setReady(true)} />
          </div>
        )}
        {fileType === 'word' && mode === 'edit' && (
          <div className="h-full overflow-auto">
            <DocxEditor file={file} fileName={fileName || file.name} onExport={handleDownload} />
          </div>
        )}
        {fileType === 'pdf' && (
          <div className="h-full overflow-auto">
            <PdfViewer file={file} />
          </div>
        )}
        {fileType === 'cell' && (
          <div className="h-full overflow-hidden flex flex-col">
            <XlsxViewer file={file} />
          </div>
        )}
        {fileType === 'other' && (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">Định dạng này chưa được hỗ trợ xem trực tiếp.</p>
            <button onClick={handleDownload}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              <Download className="w-4 h-4" /> Tải về để mở
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
