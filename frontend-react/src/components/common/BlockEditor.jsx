/**
 * BlockEditor — dàn trang bài dự thi kiểu block.
 * Mỗi block là { type: 'image'|'text', url?, caption?, content? }
 * Props:
 *   blocks      – mảng blocks hiện tại
 *   onChange    – fn(blocks)
 *   uploadFn    – async fn(File) => url   (mặc định uploadService.studentUpload)
 */
import { useRef, useState } from 'react';
import { Image as ImageIcon, Type, X, ChevronUp, ChevronDown, Plus, Loader2, Upload } from 'lucide-react';
import uploadService from '../../services/uploadService';

const DEFAULT_UPLOAD = (file) => uploadService.studentUpload(file);

// ── Image block ──────────────────────────────────────────────────────────────

function ImageBlock({ block, onUpdate, onRemove, onMoveUp, onMoveDown, uploadFn, isFirst, isLast }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFn(file);
      onUpdate({ ...block, url });
    } catch { /* silent — uploadFn shows toast */ }
    finally { setUploading(false); }
  };

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white group">
      {/* Image area */}
      {block.url ? (
        <div className="relative">
          <img src={block.url} alt={block.caption || ''} className="w-full object-cover max-h-72" />
          <button type="button" onClick={() => onUpdate({ ...block, url: '' })}
            className="absolute top-2 right-2 w-7 h-7 bg-red-500/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      ) : (
        <div onClick={() => ref.current?.click()}
          className="h-40 flex flex-col items-center justify-center gap-2 cursor-pointer bg-gray-50 hover:bg-orange-50 hover:border-orange-300 border-b border-dashed border-gray-300 transition-colors">
          {uploading
            ? <Loader2 className="w-7 h-7 animate-spin text-orange-400" />
            : <><Upload className="w-7 h-7 text-gray-400" /><span className="text-sm text-gray-500">Nhấn để tải ảnh lên</span></>}
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => handleFile(e.target.files?.[0])} />

      {/* Caption */}
      <div className="px-3 py-2 flex items-center gap-2">
        <input
          value={block.caption || ''}
          onChange={e => onUpdate({ ...block, caption: e.target.value })}
          className="flex-1 text-sm text-gray-600 italic bg-transparent outline-none border-b border-dashed border-gray-300 focus:border-orange-400 py-0.5"
          placeholder="Chú thích ảnh (tùy chọn)..." />
        <BlockControls onRemove={onRemove} onMoveUp={onMoveUp} onMoveDown={onMoveDown} isFirst={isFirst} isLast={isLast} />
      </div>
    </div>
  );
}

// ── Text block ───────────────────────────────────────────────────────────────

function TextBlock({ block, onUpdate, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <div className="border border-gray-200 rounded-2xl bg-white group">
      <div className="px-3 py-2 flex items-start gap-2">
        <textarea
          value={block.content || ''}
          onChange={e => onUpdate({ ...block, content: e.target.value })}
          rows={4}
          className="flex-1 text-sm text-gray-800 leading-relaxed bg-transparent outline-none resize-none py-1"
          placeholder="Nhập nội dung bài viết, mô tả, câu chuyện của bạn..." />
        <BlockControls onRemove={onRemove} onMoveUp={onMoveUp} onMoveDown={onMoveDown} isFirst={isFirst} isLast={isLast} />
      </div>
    </div>
  );
}

// ── Block controls (move up/down + delete) ───────────────────────────────────

function BlockControls({ onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <div className="flex flex-col gap-0.5 flex-shrink-0">
      <button type="button" onClick={onMoveUp} disabled={isFirst}
        className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 disabled:opacity-30">
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={onMoveDown} disabled={isLast}
        className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 disabled:opacity-30">
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={onRemove}
        className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Main editor ──────────────────────────────────────────────────────────────

export default function BlockEditor({ blocks = [], onChange, uploadFn = DEFAULT_UPLOAD }) {
  const update = (i, data) => onChange(blocks.map((b, j) => j === i ? data : b));
  const remove = (i)       => onChange(blocks.filter((_, j) => j !== i));
  const moveUp = (i)       => { if (i === 0) return; const a = [...blocks]; [a[i-1], a[i]] = [a[i], a[i-1]]; onChange(a); };
  const moveDown = (i)     => { if (i === blocks.length - 1) return; const a = [...blocks]; [a[i], a[i+1]] = [a[i+1], a[i]]; onChange(a); };
  const addImage = ()      => onChange([...blocks, { type: 'image', url: '', caption: '' }]);
  const addText  = ()      => onChange([...blocks, { type: 'text', content: '' }]);

  return (
    <div className="space-y-3">
      {/* Block list */}
      {blocks.map((block, i) => (
        block.type === 'image' ? (
          <ImageBlock key={i} block={block}
            onUpdate={d => update(i, d)} onRemove={() => remove(i)}
            onMoveUp={() => moveUp(i)} onMoveDown={() => moveDown(i)}
            uploadFn={uploadFn} isFirst={i === 0} isLast={i === blocks.length - 1} />
        ) : (
          <TextBlock key={i} block={block}
            onUpdate={d => update(i, d)} onRemove={() => remove(i)}
            onMoveUp={() => moveUp(i)} onMoveDown={() => moveDown(i)}
            isFirst={i === 0} isLast={i === blocks.length - 1} />
        )
      ))}

      {/* Add block buttons */}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={addImage}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-colors">
          <ImageIcon className="w-4 h-4" />
          Thêm ảnh
        </button>
        <button type="button" onClick={addText}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
          <Type className="w-4 h-4" />
          Thêm văn bản
        </button>
      </div>

      {blocks.length === 0 && (
        <p className="text-center text-xs text-gray-400 py-2">
          Thêm ảnh và văn bản để trình bày bài dự thi của bạn
        </p>
      )}
    </div>
  );
}

// ── Block renderer (display mode) ────────────────────────────────────────────

export function BlockRenderer({ noiDung, className = '' }) {
  let blocks = [];
  try { blocks = noiDung ? JSON.parse(noiDung) : []; } catch { blocks = []; }
  if (!blocks.length) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {blocks.map((block, i) => (
        block.type === 'image' && block.url ? (
          <figure key={i} className="m-0">
            <img src={block.url} alt={block.caption || ''} className="w-full rounded-xl object-cover" loading="lazy" />
            {block.caption && (
              <figcaption className="text-xs text-center text-gray-500 italic mt-1.5 px-2">{block.caption}</figcaption>
            )}
          </figure>
        ) : block.type === 'text' && block.content ? (
          <p key={i} className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{block.content}</p>
        ) : null
      ))}
    </div>
  );
}
