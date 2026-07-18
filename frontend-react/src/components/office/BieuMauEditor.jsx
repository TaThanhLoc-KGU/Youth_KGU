/**
 * BieuMauEditor — Editor đầy đủ tính năng cho biểu mẫu DOCX.
 * Import DOCX → TipTap (có thể sửa font, size, màu, căn lề, table, header) → Export DOCX/HTML.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { Extension } from '@tiptap/core';
import {
  X, Loader2, AlertCircle, Save, Download,
  Bold, Italic, Underline as UIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent, Outdent,
  Heading1, Heading2, Heading3,
  Table as TableIcon, Minus, Undo, Redo,
  Type, Palette, Highlighter, Image as ImageIcon,
  ChevronDown, FileText,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../services/api';
import bieuMauService from '../../services/bieuMauService';

/* ── FontSize extension ──────────────────────────────────────────────────── */
const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [{
      types: ['textStyle'],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize?.replace('pt', '') || null,
          renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}pt` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (size) => ({ chain }) =>
        chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }) =>
        chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

/* ── PageMargin extension (inline style on doc) ──────────────────────────── */
const FONT_LIST = [
  'Arial', 'Times New Roman', 'Calibri', 'Cambria', 'Georgia',
  'Verdana', 'Tahoma', 'Courier New', 'Palatino', 'Garamond',
];
const SIZE_LIST = [8,9,10,11,12,13,14,16,18,20,22,24,28,32,36,48,72];

/* ── Toolbar helpers ─────────────────────────────────────────────────────── */
function Btn({ onClick, active, title, disabled, children }) {
  return (
    <button type="button" onMouseDown={e => { e.preventDefault(); onClick(); }}
      disabled={disabled} title={title}
      className={`p-1.5 rounded text-sm transition-colors flex-shrink-0 disabled:opacity-30
        ${active ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}>
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-gray-300 mx-1 flex-shrink-0" />;
}

function Select({ value, onChange, options, title, className = 'w-28' }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} title={title}
      className={`${className} border border-gray-200 rounded text-xs px-1.5 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400`}>
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  );
}

/* ── Color picker ─────────────────────────────────────────────────────────── */
const COLORS = ['#000000','#374151','#DC2626','#D97706','#16A34A','#2563EB','#7C3AED','#DB2777','#ffffff'];
function ColorPicker({ onSelect, icon: Icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button type="button" onMouseDown={e => { e.preventDefault(); setOpen(v => !v); }}
        className="p-1.5 rounded text-gray-700 hover:bg-gray-200 flex items-center gap-0.5">
        <Icon className="w-4 h-4" /><ChevronDown className="w-2.5 h-2.5" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-2">
          <div className="grid grid-cols-5 gap-1">
            {COLORS.map(c => (
              <button key={c} type="button"
                onMouseDown={e => { e.preventDefault(); onSelect(c); setOpen(false); }}
                className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                style={{ background: c }} />
            ))}
          </div>
          <input type="color" className="w-full mt-1 h-6 rounded cursor-pointer"
            onInput={e => { onSelect(e.target.value); setOpen(false); }} />
        </div>
      )}
    </div>
  );
}

/* ── Page settings bar ───────────────────────────────────────────────────── */
function PageSettings({ margins, onMarginChange }) {
  return (
    <div className="flex items-center gap-3 flex-wrap bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-800">
      <span className="font-semibold flex-shrink-0">Căn lề (mm):</span>
      {['Trên', 'Dưới', 'Trái', 'Phải'].map((label, i) => {
        const keys = ['top','bottom','left','right'];
        return (
          <label key={label} className="flex items-center gap-1 flex-shrink-0">
            {label}:
            <input type="number" min="0" max="50" value={margins[keys[i]]}
              onChange={e => onMarginChange(keys[i], Number(e.target.value))}
              className="w-12 border border-amber-300 rounded px-1 py-0.5 text-center bg-white focus:outline-none focus:ring-1 focus:ring-amber-400" />
          </label>
        );
      })}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function BieuMauEditor({ item, onClose, onSaved }) {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [fontSize, setFontSize] = useState('12');
  const [fontFam,  setFontFam]  = useState('Times New Roman');
  const [margins,  setMargins]  = useState({ top: 25, bottom: 25, left: 30, right: 20 });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontSize,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph', 'table'] }),
      Table.configure({ resizable: true }),
      TableRow, TableCell, TableHeader,
      Image,
    ],
    content: '',
    editorProps: {
      attributes: { class: 'focus:outline-none min-h-[600px]' },
    },
    onSelectionUpdate: ({ editor: ed }) => {
      const sz = ed.getAttributes('textStyle')?.fontSize;
      if (sz) setFontSize(String(sz));
      const ff = ed.getAttributes('textStyle')?.fontFamily;
      if (ff) setFontFam(ff);
    },
  });

  /* ── Load file ────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!item?.duongDan || !editor) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setError('');
      try {
        const url  = `${API_BASE_URL}${item.duongDan}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const buf  = await resp.arrayBuffer();
        const ext  = item.loaiFile?.toLowerCase();

        let html = '';
        if (ext === 'docx' || ext === 'doc') {
          const mammoth = (await import('mammoth')).default || await import('mammoth');
          const result  = await mammoth.convertToHtml({ arrayBuffer: buf }, {
            styleMap: [
              "p[style-name='Section Title'] => h1:fresh",
              "p[style-name='Subsection Title'] => h2:fresh",
            ],
          });
          html = result.value;
        } else if (ext === 'html' || ext === 'htm') {
          const dec = new TextDecoder('utf-8');
          html = dec.decode(buf).replace(/<html[\s\S]*?<body[^>]*>/i, '').replace(/<\/body[\s\S]*$/i, '');
        } else {
          throw new Error('Chỉ hỗ trợ chỉnh sửa file DOCX, DOC, HTML. Vui lòng tải về để sử dụng.');
        }

        if (!cancelled) {
          editor.commands.setContent(html);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) { setError(err.message); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [item, editor]);

  /* ── Save ─────────────────────────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    if (!editor || !item) return;
    setSaving(true);
    try {
      const content = editor.getHTML();
      const m_top    = margins.top;
      const m_bottom = margins.bottom;
      const m_left   = margins.left;
      const m_right  = margins.right;

      const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>${item.ten}</title>
<style>
  @page { margin: ${m_top}mm ${m_right}mm ${m_bottom}mm ${m_left}mm; }
  body {
    font-family: '${fontFam}', 'Times New Roman', serif;
    font-size: ${fontSize}pt;
    margin: ${m_top}mm ${m_right}mm ${m_bottom}mm ${m_left}mm;
    line-height: 1.5;
  }
  h1,h2,h3 { font-weight: bold; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #999; padding: 4px 8px; }
  p { margin: 0 0 6pt; }
</style>
</head>
<body>${content}</body>
</html>`;

      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const file = new File([blob], item.ten.replace(/\.[^.]+$/, '') + '_edited.html', { type: 'text/html' });

      await bieuMauService.replaceFile(item.id, file);
      toast.success('Đã lưu biểu mẫu');
      onSaved?.();
    } catch (err) {
      toast.error('Lỗi lưu: ' + (err?.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  }, [editor, item, margins, fontSize, fontFam, onSaved]);

  /* ── Download ─────────────────────────────────────────────────────────── */
  const handleDownload = useCallback(async () => {
    if (!editor) return;
    try {
      // Thử xuất DOCX nếu có thư viện, fallback về HTML
      let blob;
      try {
        const { asBlob } = await import('html-docx-js-typescript');
        const content = editor.getHTML();
        const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
          body{font-family:'${fontFam}';font-size:${fontSize}pt;}
          table{border-collapse:collapse;width:100%;}
          td,th{border:1px solid #999;padding:4px 8px;}
        </style></head><body>${content}</body></html>`;
        blob = await asBlob(fullHtml, {
          orientation: 'portrait',
          margins: { top: margins.top * 567, bottom: margins.bottom * 567,
                     left: margins.left * 567, right: margins.right * 567 },
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = item.ten.replace(/\.[^.]+$/, '') + '_edited.docx';
        a.click(); URL.revokeObjectURL(url);
        return;
      } catch { /* fallback */ }

      // Fallback: HTML download
      blob = new Blob([`<!DOCTYPE html><html><body>${editor.getHTML()}</body></html>`], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = item.ten.replace(/\.[^.]+$/, '') + '_edited.html';
      a.click(); URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Lỗi xuất file: ' + err.message);
    }
  }, [editor, item, margins, fontSize, fontFam]);

  /* ── Insert table ─────────────────────────────────────────────────────── */
  const insertTable = () => {
    editor?.chain().focus()
      .insertTable({ rows: 4, cols: 3, withHeaderRow: true })
      .run();
  };

  /* ── Margin helper ────────────────────────────────────────────────────── */
  const updateMargin = (key, val) => setMargins(m => ({ ...m, [key]: val }));

  /* ── Page style ───────────────────────────────────────────────────────── */
  const pageStyle = {
    fontFamily: `'${fontFam}', 'Times New Roman', serif`,
    fontSize: `${fontSize}pt`,
    paddingTop:    `${margins.top}mm`,
    paddingBottom: `${margins.bottom}mm`,
    paddingLeft:   `${margins.left}mm`,
    paddingRight:  `${margins.right}mm`,
  };

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b px-4 py-2.5 bg-white shadow-sm flex-shrink-0">
        <button onClick={onClose}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0">
          <X className="w-5 h-5" />
        </button>
        <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span className="text-sm font-semibold text-gray-800 truncate flex-1 min-w-0">{item?.ten}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold transition-colors">
            <Download className="w-3.5 h-3.5" /> Tải về DOCX
          </button>
          <button onClick={handleSave} disabled={saving || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Đang lưu…' : 'Lưu lên server'}
          </button>
        </div>
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      {!loading && !error && editor && (
        <>
          <div className="flex flex-wrap items-center gap-1 border-b px-3 py-1.5 bg-gray-50 flex-shrink-0 overflow-x-auto">
            {/* Undo / Redo */}
            <Btn onClick={() => editor.chain().focus().undo().run()} title="Hoàn tác (Ctrl+Z)"><Undo className="w-4 h-4" /></Btn>
            <Btn onClick={() => editor.chain().focus().redo().run()} title="Làm lại (Ctrl+Y)"><Redo className="w-4 h-4" /></Btn>
            <Sep />

            {/* Font family */}
            <Select value={fontFam} onChange={ff => { setFontFam(ff); editor.chain().focus().setFontFamily(ff).run(); }}
              options={FONT_LIST} title="Font chữ" className="w-36" />

            {/* Font size */}
            <Select value={fontSize}
              onChange={sz => { setFontSize(sz); editor.chain().focus().setFontSize(sz).run(); }}
              options={SIZE_LIST.map(s => ({ value: String(s), label: s }))}
              title="Cỡ chữ" className="w-14" />
            <Sep />

            {/* Bold / Italic / Underline / Strikethrough */}
            <Btn active={editor.isActive('bold')}         onClick={() => editor.chain().focus().toggleBold().run()} title="Đậm"><Bold className="w-4 h-4" /></Btn>
            <Btn active={editor.isActive('italic')}       onClick={() => editor.chain().focus().toggleItalic().run()} title="Nghiêng"><Italic className="w-4 h-4" /></Btn>
            <Btn active={editor.isActive('underline')}    onClick={() => editor.chain().focus().toggleUnderline().run()} title="Gạch chân"><UIcon className="w-4 h-4" /></Btn>
            <Btn active={editor.isActive('strike')}       onClick={() => editor.chain().focus().toggleStrike().run()} title="Gạch ngang"><Strikethrough className="w-4 h-4" /></Btn>
            <Sep />

            {/* Text color / Highlight */}
            <ColorPicker icon={Palette} onSelect={c => editor.chain().focus().setColor(c).run()} />
            <ColorPicker icon={Highlighter} onSelect={c => editor.chain().focus().toggleHighlight({ color: c }).run()} />
            <Sep />

            {/* Align */}
            <Btn active={editor.isActive({ textAlign: 'left' })}    onClick={() => editor.chain().focus().setTextAlign('left').run()}    title="Trái"><AlignLeft className="w-4 h-4" /></Btn>
            <Btn active={editor.isActive({ textAlign: 'center' })}  onClick={() => editor.chain().focus().setTextAlign('center').run()}  title="Giữa"><AlignCenter className="w-4 h-4" /></Btn>
            <Btn active={editor.isActive({ textAlign: 'right' })}   onClick={() => editor.chain().focus().setTextAlign('right').run()}   title="Phải"><AlignRight className="w-4 h-4" /></Btn>
            <Btn active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Đều 2 bên"><AlignJustify className="w-4 h-4" /></Btn>
            <Sep />

            {/* Headings */}
            <Btn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Tiêu đề 1"><Heading1 className="w-4 h-4" /></Btn>
            <Btn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Tiêu đề 2"><Heading2 className="w-4 h-4" /></Btn>
            <Btn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Tiêu đề 3"><Heading3 className="w-4 h-4" /></Btn>
            <Sep />

            {/* Lists */}
            <Btn active={editor.isActive('bulletList')}  onClick={() => editor.chain().focus().toggleBulletList().run()}  title="Danh sách"><List className="w-4 h-4" /></Btn>
            <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Đánh số"><ListOrdered className="w-4 h-4" /></Btn>
            <Btn onClick={() => editor.chain().focus().sinkListItem('listItem').run()}  title="Thụt vào"><Indent className="w-4 h-4" /></Btn>
            <Btn onClick={() => editor.chain().focus().liftListItem('listItem').run()}  title="Thụt ra"><Outdent className="w-4 h-4" /></Btn>
            <Sep />

            {/* Table / HR */}
            <Btn onClick={insertTable} title="Chèn bảng"><TableIcon className="w-4 h-4" /></Btn>
            <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Đường kẻ ngang"><Minus className="w-4 h-4" /></Btn>
          </div>

          {/* Page margin settings */}
          <PageSettings margins={margins} onMarginChange={updateMargin} />
        </>
      )}

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-gray-200 min-h-0">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-sm">Đang tải tài liệu…</span>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <div>
              <p className="font-semibold text-gray-700 mb-1">Không thể mở trong editor</p>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
            <a href={`${API_BASE_URL}${item?.duongDan}`} download
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">
              <Download className="w-4 h-4" /> Tải về để chỉnh sửa
            </a>
          </div>
        )}
        {!loading && !error && (
          <div className="py-8 px-4 flex justify-center">
            {/* A4 page */}
            <div className="bg-white shadow-xl w-full"
              style={{ maxWidth: '210mm', minHeight: '297mm', ...pageStyle }}>
              <EditorContent editor={editor} />
            </div>
          </div>
        )}
      </div>

      {/* ── Status bar ────────────────────────────────────────────────────── */}
      {!loading && !error && (
        <div className="flex items-center gap-4 border-t px-4 py-1.5 bg-gray-50 text-xs text-gray-400 flex-shrink-0">
          <span>Font: {fontFam} {fontSize}pt</span>
          <span>Lề: T{margins.top} D{margins.bottom} T{margins.left} P{margins.right} mm</span>
          <span className="ml-auto">
            Lưu = cập nhật file trên server dưới dạng HTML (mở được bằng Word/LibreOffice)
          </span>
        </div>
      )}
    </div>
  );
}
