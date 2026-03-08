import { useEditor, EditorContent, Extension, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';
import { Youtube } from '@tiptap/extension-youtube';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import UnderlineExt from '@tiptap/extension-underline';
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote,
  Table as TableIcon, Image as ImageIcon, Youtube as YoutubeIcon, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo, Redo, Plus, Trash2, Highlighter, Type, ChevronDown, Loader2
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import newsService from '../../../services/newsService';
import ImageCropModal from '../../common/ImageCropModal';

// ── Custom FontSize extension ─────────────────────────────────────────────────
const FontSizeExtension = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => el.style.fontSize?.replace(/['"]+/g, '') || null,
            renderHTML: (attrs) => {
              if (!attrs.fontSize) return {};
              return { style: `font-size: ${attrs.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (size) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

// ── ImageNodeView — double-click để chỉnh kích thước ────────────────────────
const SIZE_PRESETS = [
  { label: '100%', w: '100%', h: 'auto' },
  { label: '75%',  w: '75%',  h: 'auto' },
  { label: '50%',  w: '50%',  h: 'auto' },
  { label: '25%',  w: '25%',  h: 'auto' },
  { label: '300px', w: '300px', h: 'auto' },
  { label: '500px', w: '500px', h: 'auto' },
];

const ImageNodeView = ({ node, updateAttributes, selected }) => {
  const [open, setOpen]   = useState(false);
  const [w, setW]         = useState('');
  const [h, setH]         = useState('');
  const [alt, setAlt]     = useState('');
  const popRef            = useRef(null);

  const openPopover = (e) => {
    e.preventDefault();
    setW(node.attrs.width  || '');
    setH(node.attrs.height || '');
    setAlt(node.attrs.alt  || '');
    setOpen(true);
  };

  // Đóng khi click ra ngoài
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const apply = () => {
    updateAttributes({ width: w.trim() || null, height: h.trim() || null, alt: alt.trim() || null });
    setOpen(false);
  };

  const reset = () => {
    updateAttributes({ width: null, height: null, alt: null });
    setOpen(false);
  };

  const imgStyle = {
    maxWidth: '100%',
    height: node.attrs.height || 'auto',
    ...(node.attrs.width ? { width: node.attrs.width } : {}),
    cursor: 'pointer',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)',
    display: 'block',
    margin: '1rem auto',
  };

  return (
    <NodeViewWrapper style={{ position: 'relative', display: 'block', textAlign: 'center' }}>
      {/* Ảnh — double-click để mở popover */}
      <img
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        style={{
          ...imgStyle,
          outline: selected ? '2px solid #3b82f6' : 'none',
          outlineOffset: '2px',
        }}
        onDoubleClick={openPopover}
        title="Double-click để chỉnh kích thước & chú thích"
        draggable={false}
      />

      {/* Caption hiển thị bên dưới ảnh */}
      {node.attrs.alt && (
        <p
          style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.35rem', fontStyle: 'italic', textAlign: 'center' }}
          onDoubleClick={openPopover}
        >
          {node.attrs.alt}
        </p>
      )}

      {/* Tooltip nhỏ khi selected */}
      {selected && !open && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full pointer-events-none">
          Double-click để chỉnh kích thước & chú thích
        </div>
      )}

      {/* Popover chỉnh W / H */}
      {open && (
        <div
          ref={popRef}
          className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-72 text-left"
          style={{ top: '100%' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-800">Kích thước ảnh</span>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setOpen(false); }}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >×</button>
          </div>

          {/* Preset nhanh */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {SIZE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setW(p.w); setH(p.h); }}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  w === p.w ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 hover:bg-blue-50 hover:text-blue-600 border-gray-200 text-gray-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input W / H */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Chiều rộng (W)</label>
              <input
                type="text"
                value={w}
                onChange={(e) => setW(e.target.value)}
                placeholder="100%, 500px"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Chiều cao (H)</label>
              <input
                type="text"
                value={h}
                onChange={(e) => setH(e.target.value)}
                placeholder="auto, 300px"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-3">Dùng %, px hoặc "auto". VD: 100%, 500px, auto</p>

          {/* Chú thích ảnh */}
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1 font-medium">Chú thích ảnh</label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Nhập chú thích hiển thị bên dưới ảnh..."
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); apply(); }}
              className="flex-1 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Áp dụng
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); reset(); }}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
              title="Đặt lại kích thước mặc định"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
};

// ResizableImage — Image extension với width/height attrs + NodeView
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => el.style.width || null,
        renderHTML: (attrs) => {
          const parts = [
            attrs.width  && `width:${attrs.width}`,
            attrs.height && `height:${attrs.height}`,
          ].filter(Boolean);
          return parts.length ? { style: parts.join(';') } : {};
        },
      },
      height: {
        default: null,
        parseHTML: (el) => el.style.height || null,
        renderHTML: () => ({}), // style được xử lý ở width.renderHTML
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

// ── Constants ─────────────────────────────────────────────────────────────────
const FONT_FAMILIES = [
  { label: 'Mặc định',    value: '' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
  { label: 'Arial',       value: 'Arial, sans-serif' },
  { label: 'Georgia',     value: 'Georgia, serif' },
  { label: 'Verdana',     value: 'Verdana, sans-serif' },
  { label: 'Courier New', value: 'Courier New, monospace' },
  { label: 'Tahoma',      value: 'Tahoma, sans-serif' },
];

const FONT_SIZES = ['10px','11px','12px','13px','14px','16px','18px','20px','24px','28px','32px','36px','48px','72px'];

const PRESET_COLORS = [
  '#000000','#434343','#666666','#999999','#b7b7b7','#cccccc','#d9d9d9','#ffffff',
  '#ff0000','#ff4500','#ff9900','#ffff00','#00ff00','#00ffff','#4a86e8','#0000ff',
  '#9900ff','#ff00ff','#f4cccc','#fce5cd','#fff2cc','#d9ead3','#d0e4f7','#cfe2f3',
  '#ea9999','#f9cb9c','#ffe599','#b6d7a8','#9fc5e8','#76a5af','#e06666','#f6b26b',
  '#ffd966','#93c47d','#6d9eeb','#45818e','#cc0000','#e69138','#f1c232','#6aa84f',
];

const HIGHLIGHT_COLORS = [
  { label: 'Vàng',   color: '#fef08a' },
  { label: 'Xanh lá', color: '#bbf7d0' },
  { label: 'Xanh dương', color: '#bfdbfe' },
  { label: 'Hồng',   color: '#fbcfe8' },
  { label: 'Cam',    color: '#fed7aa' },
  { label: 'Tím',    color: '#e9d5ff' },
  { label: 'Đỏ',     color: '#fecaca' },
  { label: 'Trắng',  color: '#ffffff' },
];

// ── Small helpers ─────────────────────────────────────────────────────────────
const Divider = () => <div className="w-px h-5 bg-gray-300 mx-0.5 self-center flex-shrink-0" />;

const ToolBtn = ({ icon: Icon, onClick, active, title, disabled }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={title}
    disabled={disabled}
    className={`p-1.5 rounded transition-colors flex-shrink-0 ${
      active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-200'
    } disabled:opacity-40`}
  >
    <Icon className="w-3.5 h-3.5" />
  </button>
);

// Dropdown button used for font family / size
const DropBtn = ({ label, children, minW = 'min-w-[140px]' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-200 rounded hover:border-blue-400 bg-white text-gray-700 whitespace-nowrap"
      >
        <span className="truncate max-w-[90px]">{label}</span>
        <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
      </button>
      {open && (
        <div className={`absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 ${minW} max-h-52 overflow-y-auto`}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
};

// Color palette popup
const ColorPalette = ({ colors, onSelect, selected }) => (
  <div className="flex flex-wrap w-48 p-2 gap-1">
    {colors.map((c) => (
      <button
        key={c}
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onSelect(c); }}
        title={c}
        style={{ background: c }}
        className={`w-5 h-5 rounded border ${
          selected === c ? 'border-blue-500 scale-110' : 'border-gray-300 hover:scale-110'
        } transition-transform`}
      />
    ))}
  </div>
);

// ── Upload helper ─────────────────────────────────────────────────────────────
async function uploadFileAndInsert(file, editor, setUploading) {
  if (!file.type.startsWith('image/')) return;
  setUploading(true);
  try {
    const fd = new FormData();
    fd.append('file', file, file.name || 'paste-image.png');
    const res = await newsService.uploadImage(fd);
    const url = res?.url || (typeof res === 'string' ? res : null);
    if (url) editor.chain().focus().setImage({ src: url }).run();
  } catch (e) {
    console.error('Paste image upload failed:', e);
  } finally {
    setUploading(false);
  }
}

// ── MenuBar ───────────────────────────────────────────────────────────────────
const MenuBar = ({ editor, onOpenImageModal, uploading }) => {
  const [colorOpen, setColorOpen] = useState(false);
  const [hlOpen, setHlOpen] = useState(false);
  const colorRef = useRef(null);
  const hlRef    = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (colorRef.current && !colorRef.current.contains(e.target)) setColorOpen(false);
      if (hlRef.current    && !hlRef.current.contains(e.target))    setHlOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (!editor) return null;

  // Current font/size values
  const curFont = editor.getAttributes('textStyle')?.fontFamily || '';
  const curSize = editor.getAttributes('textStyle')?.fontSize  || '';
  const curColor = editor.getAttributes('textStyle')?.color    || '#000000';

  const fontLabel = FONT_FAMILIES.find((f) => f.value === curFont)?.label || 'Font';
  const sizeLabel = curSize || 'Cỡ';

  return (
    <div className="flex flex-col bg-gray-50 border-b border-gray-200 rounded-t-lg sticky top-0 z-10">
      {/* Row 1: Undo/Redo | Font | Size | Bold/Italic/Underline/Strike | Color/Highlight */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100">
        <ToolBtn icon={Undo} onClick={() => editor.chain().focus().undo().run()} title="Hoàn tác (Ctrl+Z)" />
        <ToolBtn icon={Redo} onClick={() => editor.chain().focus().redo().run()} title="Làm lại (Ctrl+Y)" />
        <Divider />

        {/* Font Family */}
        <DropBtn label={fontLabel} minW="min-w-[180px]">
          {(close) => FONT_FAMILIES.map((f) => (
            <button
              key={f.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                if (f.value) editor.chain().focus().setFontFamily(f.value).run();
                else editor.chain().focus().unsetFontFamily().run();
                close();
              }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 transition-colors ${curFont === f.value ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
              style={{ fontFamily: f.value || 'inherit' }}
            >
              {f.label}
            </button>
          ))}
        </DropBtn>

        {/* Font Size */}
        <DropBtn label={sizeLabel} minW="min-w-[90px]">
          {(close) => FONT_SIZES.map((sz) => (
            <button
              key={sz}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().setFontSize(sz).run();
                close();
              }}
              className={`w-full text-left px-3 py-1 text-sm hover:bg-blue-50 transition-colors ${curSize === sz ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
              style={{ fontSize: sz }}
            >
              {sz}
            </button>
          ))}
        </DropBtn>

        <Divider />
        <ToolBtn icon={Bold}          onClick={() => editor.chain().focus().toggleBold().run()}      active={editor.isActive('bold')}      title="Đậm (Ctrl+B)" />
        <ToolBtn icon={Italic}        onClick={() => editor.chain().focus().toggleItalic().run()}    active={editor.isActive('italic')}    title="Nghiêng (Ctrl+I)" />
        <ToolBtn icon={Underline}     onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Gạch chân (Ctrl+U)" />
        <ToolBtn icon={Strikethrough} onClick={() => editor.chain().focus().toggleStrike().run()}    active={editor.isActive('strike')}   title="Gạch ngang" />

        <Divider />

        {/* Text Color */}
        <div ref={colorRef} className="relative flex-shrink-0">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setColorOpen((o) => !o); setHlOpen(false); }}
            title="Màu chữ"
            className="flex flex-col items-center p-1.5 rounded hover:bg-gray-200 transition-colors"
          >
            <Type className="w-3.5 h-3.5 text-gray-600" />
            <div className="w-3.5 h-1 rounded-sm mt-0.5" style={{ background: curColor }} />
          </button>
          {colorOpen && (
            <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-1">
              <ColorPalette
                colors={PRESET_COLORS}
                selected={curColor}
                onSelect={(c) => { editor.chain().focus().setColor(c).run(); setColorOpen(false); }}
              />
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setColorOpen(false); }}
                className="w-full text-xs text-center text-gray-500 hover:text-red-500 py-1 border-t border-gray-100 mt-1"
              >
                Xóa màu
              </button>
            </div>
          )}
        </div>

        {/* Highlight */}
        <div ref={hlRef} className="relative flex-shrink-0">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setHlOpen((o) => !o); setColorOpen(false); }}
            title="Tô màu nền"
            className={`flex flex-col items-center p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('highlight') ? 'bg-yellow-100' : ''}`}
          >
            <Highlighter className="w-3.5 h-3.5 text-gray-600" />
            <div className="w-3.5 h-1 rounded-sm mt-0.5 bg-yellow-300" />
          </button>
          {hlOpen && (
            <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2 min-w-[160px]">
              <p className="text-xs text-gray-400 mb-2 font-medium">Tô màu nền</p>
              <div className="flex flex-wrap gap-1.5">
                {HIGHLIGHT_COLORS.map(({ label, color }) => (
                  <button
                    key={color}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().toggleHighlight({ color }).run();
                      setHlOpen(false);
                    }}
                    title={label}
                    style={{ background: color }}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                  />
                ))}
              </div>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); setHlOpen(false); }}
                className="w-full text-xs text-center text-gray-500 hover:text-red-500 py-1 border-t border-gray-100 mt-2"
              >
                Xóa tô màu
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Headings | Lists | Align | Blockquote | Table | Image | YouTube | Link */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
        <ToolBtn icon={Heading1} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Tiêu đề 1" />
        <ToolBtn icon={Heading2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Tiêu đề 2" />
        <ToolBtn icon={Heading3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Tiêu đề 3" />
        <Divider />
        <ToolBtn icon={List}        onClick={() => editor.chain().focus().toggleBulletList().run()}  active={editor.isActive('bulletList')}  title="Danh sách" />
        <ToolBtn icon={ListOrdered} onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Danh sách số" />
        <Divider />
        <ToolBtn icon={AlignLeft}    onClick={() => editor.chain().focus().setTextAlign('left').run()}    active={editor.isActive({ textAlign: 'left' })}    title="Căn trái" />
        <ToolBtn icon={AlignCenter}  onClick={() => editor.chain().focus().setTextAlign('center').run()}  active={editor.isActive({ textAlign: 'center' })}  title="Căn giữa" />
        <ToolBtn icon={AlignRight}   onClick={() => editor.chain().focus().setTextAlign('right').run()}   active={editor.isActive({ textAlign: 'right' })}   title="Căn phải" />
        <ToolBtn icon={AlignJustify} onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Căn đều" />
        <Divider />
        <ToolBtn icon={Quote} onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Trích dẫn" />
        <ToolBtn
          icon={TableIcon}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          active={editor.isActive('table')}
          title="Chèn bảng"
        />
        <ToolBtn icon={ImageIcon}  onClick={onOpenImageModal} title="Chèn ảnh" />
        <ToolBtn
          icon={YoutubeIcon}
          onClick={() => {
            const url = prompt('Nhập URL video YouTube:');
            if (url) editor.chain().focus().setYoutubeVideo({ src: url, width: 640, height: 480 }).run();
          }}
          title="Chèn video YouTube"
        />
        <ToolBtn
          icon={LinkIcon}
          onClick={() => {
            const prev = editor.getAttributes('link').href;
            const url = prompt('URL link:', prev);
            if (url === null) return;
            if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
          }}
          active={editor.isActive('link')}
          title="Gắn link"
        />

        {/* Table controls when inside table */}
        {editor.isActive('table') && (
          <>
            <Divider />
            <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnBefore().run(); }} className="p-1.5 hover:bg-gray-200 rounded text-gray-600 text-xs" title="Thêm cột trước">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteTable().run(); }} className="p-1.5 hover:bg-red-50 rounded text-red-500 text-xs" title="Xóa bảng">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {/* Upload spinner */}
        {uploading && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
            <Loader2 className="w-3 h-3 animate-spin" /> Đang tải ảnh...
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const RichTextEditor = ({ value, onChange, placeholder = 'Nhập nội dung bài viết...', height = 520 }) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen]   = useState(false);
  const [selectedImage, setSelectedImage]       = useState(null);
  const [imageTab, setImageTab]                 = useState('upload');
  const [imageUrl, setImageUrl]                 = useState('');
  const [uploading, setUploading]               = useState(false);

  // Keep a stable ref to setUploading so handlePaste closure stays stable
  const setUploadingRef = useRef(setUploading);
  useEffect(() => { setUploadingRef.current = setUploading; }, [setUploading]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExt,
      TextStyle,
      FontFamily,
      FontSizeExtension,
      Color,
      Highlight.configure({ multicolor: true }),
      ResizableImage,
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: 'editor-table border-collapse w-full my-6' },
      }),
      TableRow,
      TableHeader.configure({ HTMLAttributes: { class: 'bg-gray-100 font-bold border border-gray-300 p-2' } }),
      TableCell.configure({ HTMLAttributes: { class: 'border border-gray-300 p-2 min-w-[100px]' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-blue-600 underline hover:text-blue-800 transition-colors' },
      }),
      Youtube.configure({
        HTMLAttributes: { class: 'youtube-video mx-auto my-8 block rounded-xl shadow-lg' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => { onChange(editor.getHTML()); },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl m-5 focus:outline-none max-w-none',
      },
      // Strip file:// image URLs injected by Word/Office paste
      transformPastedHTML(html) {
        return html.replace(/<img[^>]+src=["']file:\/\/[^"']*["'][^>]*\/?>/gi, '');
      },
      // Upload actual clipboard image files
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              uploadFileAndInsert(file, view.__tiptap_editor || this.editor, setUploadingRef.current);
            }
            return true;
          }
        }
        return false;
      },
    },
  });

  // Store editor ref for handlePaste closure
  useEffect(() => {
    if (editor) {
      const view = editor.view;
      if (view) view.__tiptap_editor = editor;
    }
  }, [editor]);

  // Sync value from parent (only if differs to avoid cursor jump)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  // ── Image modal handlers ──────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedImage(ev.target.result);
        setIsCropModalOpen(true);
        setIsImageModalOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropConfirm = async (blob) => {
    try {
      const fd = new FormData();
      fd.append('file', blob, 'news-image.jpg');
      const response = await newsService.uploadImage(fd);
      const url = response?.url || (typeof response === 'string' ? response : null);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      } else {
        alert('Upload ảnh thất bại: không nhận được URL.');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload ảnh thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setSelectedImage(null);
    }
  };

  const insertImageUrl = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setIsImageModalOpen(false);
      setImageUrl('');
    }
  };

  return (
    <div className="editor-container border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
      <MenuBar editor={editor} onOpenImageModal={() => setIsImageModalOpen(true)} uploading={uploading} />

      {/* Scrollable content area */}
      <div className="editor-content bg-white overflow-y-auto" style={{ height }}>
        <EditorContent editor={editor} />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .editor-content .ProseMirror {
          padding: 1.25rem 1.75rem;
          min-height: ${height - 20}px;
          outline: none;
        }
        .editor-content .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .editor-content .ProseMirror h1 { font-size: 2em; font-weight: 700; margin: 1rem 0 0.5rem; }
        .editor-content .ProseMirror h2 { font-size: 1.5em; font-weight: 600; margin: 0.9rem 0 0.45rem; }
        .editor-content .ProseMirror h3 { font-size: 1.25em; font-weight: 600; margin: 0.8rem 0 0.4rem; }
        .editor-content .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .editor-content .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .editor-content .ProseMirror li { margin: 0.25rem 0; }
        .editor-content .ProseMirror blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          font-style: italic;
          background: #f0f7ff;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          border-radius: 0 0.5rem 0.5rem 0;
          margin: 1.5rem 0;
          color: #374151;
        }
        .editor-table th, .editor-table td { border: 1px solid #dee2e6; padding: 0.5rem; }
        .editor-table th { background: #f8f9fa; }
        .editor-content .ProseMirror a { color: #2563eb; text-decoration: underline; cursor: pointer; }
        .editor-content .ProseMirror img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem auto; display: block; }
        .editor-content .youtube-video { width: 100%; aspect-ratio: 16/9; border-radius: 0.75rem; }
        .editor-content .ProseMirror mark { border-radius: 0.2em; padding: 0.1em 0.2em; }
      `}} />

      {/* Image Modal */}
      <Modal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} title="Chèn ảnh vào bài viết" size="md">
        <div className="space-y-4 py-2">
          <div className="flex border-b border-gray-200">
            {['upload', 'url'].map((tab) => (
              <button
                key={tab}
                onClick={() => setImageTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  imageTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'upload' ? 'Upload từ máy' : 'Nhập URL ảnh'}
              </button>
            ))}
          </div>

          {imageTab === 'upload' ? (
            <div
              className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => document.getElementById('editor-file-upload').click()}
            >
              <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-600">Click để chọn ảnh hoặc kéo thả</p>
              <input id="editor-file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsImageModalOpen(false)}>Hủy</Button>
                <Button onClick={insertImageUrl} disabled={!imageUrl}>Chèn</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Crop Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageSrc={selectedImage}
        onConfirm={handleCropConfirm}
        defaultAspect={undefined}
      />
    </div>
  );
};

export default RichTextEditor;
