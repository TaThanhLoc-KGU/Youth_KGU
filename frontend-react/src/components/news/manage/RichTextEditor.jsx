import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    ['link', 'image'],
    ['blockquote', 'code-block'],
    ['clean'],
  ],
};

const FORMATS = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'bullet', 'indent',
  'align', 'link', 'image', 'blockquote', 'code-block',
];

/**
 * Rich text editor dùng react-quill.
 * Props: value, onChange, placeholder, readOnly, height
 */
const RichTextEditor = ({
  value = '',
  onChange,
  placeholder = 'Nhập nội dung bài viết...',
  readOnly = false,
  height = 400,
}) => (
  <div className="rich-text-editor">
    <style>{`
      .rich-text-editor .ql-container { font-size: 15px; min-height: ${height}px; }
      .rich-text-editor .ql-editor { min-height: ${height}px; }
      .rich-text-editor .ql-editor img { max-width: 100%; height: auto; border-radius: 8px; }
      .rich-text-editor .ql-toolbar { border-radius: 8px 8px 0 0; border-color: #e5e7eb; }
      .rich-text-editor .ql-container { border-radius: 0 0 8px 8px; border-color: #e5e7eb; }
    `}</style>
    <ReactQuill
      value={value}
      onChange={onChange}
      modules={readOnly ? {} : MODULES}
      formats={FORMATS}
      placeholder={placeholder}
      readOnly={readOnly}
      theme="snow"
    />
  </div>
);

export default RichTextEditor;
