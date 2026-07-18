/**
 * TipTapDocEditor — rich text editor cho tài liệu DOCX, lazy-loaded.
 * Sử dụng TipTap (đã cài sẵn) để chỉnh sửa HTML được convert từ DOCX.
 * Export về lại HTML (có thể copy ra Word).
 */
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { useState, useCallback } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Heading1, Heading2, Heading3,
  Undo, Redo, Download,
} from 'lucide-react';

function ToolbarBtn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors disabled:opacity-30
        ${active
          ? 'bg-blue-600 text-white'
          : 'text-gray-700 hover:bg-gray-100'}`}>
      {children}
    </button>
  );
}

export default function TipTapDocEditor({ initialHtml, fileName, onExport }) {
  const [saved, setSaved] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow, TableCell, TableHeader,
      Image,
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-6',
      },
    },
  });

  const handleExportHtml = useCallback(() => {
    if (!editor) return;
    const content = editor.getHTML();
    const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileName}</title>
      <style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:32px}
      table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px 10px}
      </style></head><body>${content}</body></html>`], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/\.[^.]+$/, '') + '_edited.html';
    a.click();
    URL.revokeObjectURL(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [editor, fileName]);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b px-3 py-1.5 bg-gray-50 flex-shrink-0">
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Hoàn tác">
          <Undo className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Làm lại">
          <Redo className="w-4 h-4" />
        </ToolbarBtn>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <ToolbarBtn active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()} title="Đậm">
          <Bold className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()} title="Nghiêng">
          <Italic className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()} title="Gạch chân">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarBtn>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <ToolbarBtn active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Tiêu đề 1">
          <Heading1 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Tiêu đề 2">
          <Heading2 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Tiêu đề 3">
          <Heading3 className="w-4 h-4" />
        </ToolbarBtn>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <ToolbarBtn active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Trái">
          <AlignLeft className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Giữa">
          <AlignCenter className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Phải">
          <AlignRight className="w-4 h-4" />
        </ToolbarBtn>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <ToolbarBtn active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()} title="Danh sách">
          <List className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Đánh số">
          <ListOrdered className="w-4 h-4" />
        </ToolbarBtn>
        <div className="flex-1" />
        <button onClick={handleExportHtml}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
            ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
          <Download className="w-3.5 h-3.5" />
          {saved ? 'Đã lưu!' : 'Xuất HTML'}
        </button>
      </div>

      {/* Note */}
      <div className="px-4 py-1.5 text-[11px] text-amber-700 bg-amber-50 border-b flex-shrink-0">
        Chế độ chỉnh sửa: một số định dạng phức tạp từ DOCX có thể bị đơn giản hóa. Xuất file dưới dạng HTML để mở lại bằng Word/LibreOffice.
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-auto bg-gray-100 py-6">
        <div className="mx-auto bg-white shadow-md"
          style={{ width: '210mm', minHeight: '297mm', padding: '25mm 20mm' }}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
