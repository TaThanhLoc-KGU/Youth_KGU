import { useRef, useCallback, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const FORMATS = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'bullet', 'indent',
  'align', 'link', 'image', 'blockquote', 'code-block', 'table',
];

const TOOLBAR_CONTAINER = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['link', 'image'],
  ['blockquote', 'code-block'],
  ['clean'],
];

/**
 * Rich text editor dùng react-quill.
 *
 * Props:
 *   value        – HTML string
 *   onChange     – (html) => void
 *   onImageUpload– async (File) => string (URL) — khi có, toolbar ảnh sẽ mở file picker
 *   placeholder  – string
 *   readOnly     – boolean
 *   height       – number (px, mặc định 400)
 */
const RichTextEditor = ({
  value = '',
  onChange,
  onImageUpload,
  placeholder = 'Nhập nội dung bài viết...',
  readOnly = false,
  height = 400,
}) => {
  const quillRef = useRef(null);

  // Custom image handler: open file picker → upload → insert URL
  const imageHandler = useCallback(() => {
    if (!onImageUpload) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const url = await onImageUpload(file);
        if (url && quillRef.current) {
          const editor = quillRef.current.getEditor();
          const range = editor.getSelection(true) || { index: 0 };
          editor.insertEmbed(range.index, 'image', url);
          editor.setSelection(range.index + 1);
          editor.focus();
        }
      } catch (err) {
        console.error('Lỗi upload ảnh:', err);
      }
    };
  }, [onImageUpload]);

  // Build modules — recreated only when imageHandler changes
  const modules = useMemo(() => {
    if (readOnly) return {};
    return {
      toolbar: {
        container: TOOLBAR_CONTAINER,
        handlers: {
          // Override image handler only if onImageUpload provided
          ...(onImageUpload ? { image: imageHandler } : {}),
        },
      },
    };
  }, [readOnly, onImageUpload, imageHandler]);

  return (
    <div className="rich-text-editor">
      <style>{`
        .rich-text-editor .ql-container { font-size: 15px; min-height: ${height}px; }
        .rich-text-editor .ql-editor   { min-height: ${height}px; line-height: 1.7; }
        .rich-text-editor .ql-editor img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; }
        .rich-text-editor .ql-editor blockquote {
          border-left: 4px solid #00b0f0;
          padding: 8px 16px;
          color: #4b5563;
          background: #f0f9ff;
          border-radius: 0 8px 8px 0;
          margin: 12px 0;
        }
        .rich-text-editor .ql-toolbar { border-radius: 8px 8px 0 0; border-color: #e5e7eb; background: #f9fafb; }
        .rich-text-editor .ql-container { border-radius: 0 0 8px 8px; border-color: #e5e7eb; }
        .rich-text-editor .ql-toolbar .ql-stroke { stroke: #374151; }
        .rich-text-editor .ql-toolbar .ql-fill   { fill: #374151; }
        .rich-text-editor .ql-toolbar button:hover .ql-stroke { stroke: #00b0f0; }
        .rich-text-editor .ql-toolbar button:hover .ql-fill   { fill: #00b0f0; }
      `}</style>
      <ReactQuill
        ref={quillRef}
        value={value}
        onChange={onChange}
        modules={modules}
        formats={FORMATS}
        placeholder={placeholder}
        readOnly={readOnly}
        theme="snow"
      />
    </div>
  );
};

export default RichTextEditor;
