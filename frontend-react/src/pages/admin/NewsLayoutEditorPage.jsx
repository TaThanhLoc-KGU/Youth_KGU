/**
 * NewsLayoutEditorPage.jsx
 * Visual page builder — lego 2 cột: Nội dung chính (trái) + Sidebar (phải).
 *
 * ┌─ Palette ─┐  ┌── Nội dung chính (12 cột) ──┬─ Sidebar ─┐  ┌─ Preview ─┐
 * │ main blks │  │  [bloc] [bloc][bloc]          │ [block]   │  │ (scaled)  │
 * │ ──────    │  │  [    bloc    ]               │ [block]   │  │           │
 * │ sidebar   │  │                               │ [block]   │  │           │
 * │   blks    │  └───────────────────────────────┴───────────┘  └───────────┘
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  ArrowLeft, Save, RotateCcw, GripVertical, X, Plus,
  Eye, EyeOff, LayoutTemplate, ExternalLink, Info, Monitor,
} from 'lucide-react';

// ── Screen-size guard ─────────────────────────────────────────────────────────
const useScreenTooSmall = () => {
  const [tooSmall, setTooSmall] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const check = () => setTooSmall(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return tooSmall;
};

const ScreenTooSmall = () => (
  <div className="fixed inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-8 z-50">
    <div className="text-center max-w-sm">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
          <Monitor className="w-10 h-10 text-white/70" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-white mb-3">Cần màn hình lớn hơn</h1>
      <p className="text-slate-300 text-sm leading-relaxed mb-6">
        Tính năng sắp xếp bố cục yêu cầu thiết bị có màn hình rộng.
        Vui lòng sử dụng{' '}
        <span className="text-white font-semibold">máy tính bảng</span> hoặc{' '}
        <span className="text-white font-semibold">máy tính</span> để tiếp tục.
      </p>
      <div className="flex items-center justify-center gap-6 text-slate-400 text-xs mb-8">
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl">💻</span>
          <span>Máy tính</span>
        </div>
        <div className="text-slate-600">hoặc</div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl">📱</span>
          <span className="line-through opacity-40">Điện thoại</span>
        </div>
      </div>
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại
      </button>
    </div>
  </div>
);
import newsService from '../../services/newsService';
import useNewsLayoutStore, {
  BLOCK_TYPES, BLOCK_META, SIDEBAR_BLOCK_TYPES,
  DEFAULT_MAIN_BLOCKS, DEFAULT_SIDEBAR_BLOCKS,
} from '../../stores/newsLayoutStore';
import { BLOCK_REGISTRY } from '../../components/news/public/NewsBlocks';

// ── Color scheme ──────────────────────────────────────────────────────────────
const TILE_COLORS = {
  SEARCH_BAR:         { bg: 'bg-violet-50',  bd: 'border-violet-300',  tx: 'text-violet-800',  bar: 'bg-violet-500'  },
  HERO_SLIDER:        { bg: 'bg-blue-50',    bd: 'border-blue-300',    tx: 'text-blue-800',    bar: 'bg-blue-500'    },
  NEWS_TICKER:        { bg: 'bg-orange-50',  bd: 'border-orange-300',  tx: 'text-orange-800',  bar: 'bg-orange-500'  },
  FEATURED_GRID:      { bg: 'bg-amber-50',   bd: 'border-amber-300',   tx: 'text-amber-800',   bar: 'bg-amber-500'   },
  ALL_CATEGORIES:     { bg: 'bg-emerald-50', bd: 'border-emerald-300', tx: 'text-emerald-800', bar: 'bg-emerald-500' },
  CATEGORY_SECTION:   { bg: 'bg-teal-50',    bd: 'border-teal-300',    tx: 'text-teal-800',    bar: 'bg-teal-500'    },
  LATEST_NEWS:        { bg: 'bg-sky-50',     bd: 'border-sky-300',     tx: 'text-sky-800',     bar: 'bg-sky-500'     },
  BANNER:             { bg: 'bg-rose-50',    bd: 'border-rose-300',    tx: 'text-rose-800',    bar: 'bg-rose-500'    },
  SIDEBAR_FEATURED:   { bg: 'bg-red-50',     bd: 'border-red-300',     tx: 'text-red-800',     bar: 'bg-red-500'     },
  SIDEBAR_CATEGORIES: { bg: 'bg-cyan-50',    bd: 'border-cyan-300',    tx: 'text-cyan-800',    bar: 'bg-cyan-500'    },
  AD_WIDGET:          { bg: 'bg-indigo-50',  bd: 'border-indigo-300',  tx: 'text-indigo-800',  bar: 'bg-indigo-500'  },
};
const tc = (type) => TILE_COLORS[type] ?? { bg: 'bg-gray-50', bd: 'border-gray-300', tx: 'text-gray-700', bar: 'bg-gray-500' };

// ── Block config forms ────────────────────────────────────────────────────────
const BlockConfigForm = ({ block, onUpdateConfig, categories }) => {
  const cfg = block.config || {};
  const cl = tc(block.type);
  const borderCls = `border-t border-current/10`;

  if (block.type === BLOCK_TYPES.CATEGORY_SECTION) {
    return (
      <div className={`${borderCls} pt-2 px-3 pb-3 space-y-2`}>
        <div>
          <label className="block text-[10px] font-bold opacity-60 uppercase tracking-wide mb-1">Chuyên mục</label>
          <select
            value={cfg.categoryId || ''}
            onChange={(e) => {
              const cat = categories.find((c) => String(c.id) === e.target.value);
              onUpdateConfig(block.id, { categoryId: cat?.id || null, categoryName: cat?.ten || '', categorySlug: cat?.fullPathSlug || '' });
            }}
            className="w-full px-2 py-1.5 bg-white/80 border border-current/20 rounded-lg text-xs outline-none"
          >
            <option value="">— Chọn chuyên mục —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold opacity-60 uppercase tracking-wide mb-1">Số bài</label>
          <select value={cfg.size || 4} onChange={(e) => onUpdateConfig(block.id, { size: Number(e.target.value) })} className="w-full px-2 py-1.5 bg-white/80 border border-current/20 rounded-lg text-xs outline-none">
            {[2, 3, 4, 6, 8].map((n) => <option key={n} value={n}>{n} bài</option>)}
          </select>
        </div>
      </div>
    );
  }

  if (block.type === BLOCK_TYPES.LATEST_NEWS) {
    return (
      <div className={`${borderCls} pt-2 px-3 pb-3 grid grid-cols-2 gap-2`}>
        <div>
          <label className="block text-[10px] font-bold opacity-60 uppercase tracking-wide mb-1">Số bài</label>
          <select value={cfg.size || 8} onChange={(e) => onUpdateConfig(block.id, { size: Number(e.target.value) })} className="w-full px-2 py-1.5 bg-white/80 border border-current/20 rounded-lg text-xs outline-none">
            {[4, 6, 8, 12].map((n) => <option key={n} value={n}>{n} bài</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold opacity-60 uppercase tracking-wide mb-1">Số cột</label>
          <select value={cfg.columns || 4} onChange={(e) => onUpdateConfig(block.id, { columns: Number(e.target.value) })} className="w-full px-2 py-1.5 bg-white/80 border border-current/20 rounded-lg text-xs outline-none">
            {[2, 3, 4].map((n) => <option key={n} value={n}>{n} cột</option>)}
          </select>
        </div>
      </div>
    );
  }

  if (block.type === BLOCK_TYPES.FEATURED_GRID) {
    return (
      <div className={`${borderCls} pt-2 px-3 pb-3`}>
        <label className="block text-[10px] font-bold opacity-60 uppercase tracking-wide mb-1">Số bài nổi bật</label>
        <select value={cfg.size || 4} onChange={(e) => onUpdateConfig(block.id, { size: Number(e.target.value) })} className="w-full px-2 py-1.5 bg-white/80 border border-current/20 rounded-lg text-xs outline-none">
          {[3, 4, 5].map((n) => <option key={n} value={n}>{n} bài</option>)}
        </select>
      </div>
    );
  }

  if (block.type === BLOCK_TYPES.SIDEBAR_FEATURED) {
    return (
      <div className={`${borderCls} pt-2 px-3 pb-3`}>
        <label className="block text-[10px] font-bold opacity-60 uppercase tracking-wide mb-1">Số bài hiển thị</label>
        <select value={cfg.size || 5} onChange={(e) => onUpdateConfig(block.id, { size: Number(e.target.value) })} className="w-full px-2 py-1.5 bg-white/80 border border-current/20 rounded-lg text-xs outline-none">
          {[3, 4, 5, 8].map((n) => <option key={n} value={n}>{n} bài</option>)}
        </select>
      </div>
    );
  }

  return null;
};

// ── Resize Handle (main blocks only) ─────────────────────────────────────────
const ResizeHandle = ({ blockId, currentSpan, gridRef, onResize }) => {
  const [active, setActive] = useState(false);

  const handleMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startSpan = currentSpan;
    const gridWidth = gridRef.current?.clientWidth ?? 800;
    const colW = gridWidth / 12;
    setActive(true);

    const onMove = (me) => {
      const newSpan = Math.max(2, Math.min(12, startSpan + Math.round((me.clientX - startX) / colW)));
      onResize(blockId, newSpan);
    };
    const onUp = () => {
      setActive(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div
      title={`Kéo để đổi kích thước (${currentSpan}/12 cột)`}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
      className={`
        absolute top-0 right-0 h-full w-4 cursor-col-resize z-10
        flex flex-col items-center justify-center gap-[3px] rounded-r-xl
        transition-opacity hover:bg-black/10
        ${active ? 'opacity-100 bg-black/10' : 'opacity-0 group-hover:opacity-100'}
      `}
    >
      <div className="w-0.5 h-3 rounded-full bg-current opacity-50" />
      <div className="w-0.5 h-3 rounded-full bg-current opacity-30" />
    </div>
  );
};

// ── Main content tile (with colSpan + resize handle) ─────────────────────────
const MainTile = ({
  block, index, isDragOver, isDragging, isSelected,
  onSelect, onRemove, onUpdateConfig, onUpdateColSpan,
  onDragStart, onDragEnter, onDragEnd,
  categories, gridRef,
}) => {
  const meta = BLOCK_META[block.type] || {};
  const cl = tc(block.type);
  const span = block.colSpan || 12;

  return (
    <div
      style={{ gridColumn: `span ${span}` }}
      className={`
        relative group rounded-xl border-2 overflow-hidden transition-all duration-150
        ${cl.bg} ${cl.bd} ${cl.tx}
        ${isSelected ? 'ring-2 ring-enews-500 ring-offset-2 shadow-lg' : 'hover:shadow-md hover:brightness-[0.97]'}
        ${isDragOver ? 'scale-[1.015] shadow-xl ring-2 ring-enews-400' : ''}
        ${isDragging ? 'opacity-20 scale-95' : ''}
      `}
    >
      {/* Header */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, index)}
        onDragEnter={() => onDragEnter(index)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => onSelect(block.id)}
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
      >
        <GripVertical className="w-3.5 h-3.5 opacity-40 cursor-grab active:cursor-grabbing flex-shrink-0" />
        <span className="text-sm leading-none flex-shrink-0">{meta.icon || '📦'}</span>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold leading-tight block truncate">
            {meta.label}
            {block.type === BLOCK_TYPES.CATEGORY_SECTION && block.config?.categoryName && (
              <span className="font-normal opacity-60"> · {block.config.categoryName}</span>
            )}
            {block.type === BLOCK_TYPES.CATEGORY_SECTION && !block.config?.categoryName && (
              <span className="font-normal text-amber-500/80"> · chưa chọn</span>
            )}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(block.id); }}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 hover:text-red-600 transition-all"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Width bar */}
      <div className="px-3 pb-2 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-current/10 overflow-hidden">
          <div
            className={`h-full ${cl.bar} rounded-full transition-all duration-200`}
            style={{ width: `${(span / 12) * 100}%` }}
          />
        </div>
        <span className="text-[10px] font-mono opacity-40 tabular-nums">{span}/12</span>
      </div>

      {/* Config */}
      {isSelected && meta.configurable && (
        <BlockConfigForm block={block} onUpdateConfig={onUpdateConfig} categories={categories} />
      )}

      {/* Resize handle */}
      <ResizeHandle blockId={block.id} currentSpan={span} gridRef={gridRef} onResize={onUpdateColSpan} />
    </div>
  );
};

// ── Sidebar tile (no resize, vertical only) ───────────────────────────────────
const SidebarTile = ({
  block, index, isDragOver, isDragging, isSelected,
  onSelect, onRemove, onUpdateConfig,
  onDragStart, onDragEnter, onDragEnd,
  categories,
}) => {
  const meta = BLOCK_META[block.type] || {};
  const cl = tc(block.type);

  return (
    <div
      className={`
        relative group rounded-xl border-2 overflow-hidden transition-all duration-150
        ${cl.bg} ${cl.bd} ${cl.tx}
        ${isSelected ? 'ring-2 ring-enews-500 ring-offset-1 shadow-lg' : 'hover:shadow-md hover:brightness-[0.97]'}
        ${isDragOver ? 'scale-[1.02] shadow-xl ring-2 ring-enews-400' : ''}
        ${isDragging ? 'opacity-20 scale-95' : ''}
      `}
    >
      {/* Header */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, index)}
        onDragEnter={() => onDragEnter(index)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => onSelect(block.id)}
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
      >
        <GripVertical className="w-3.5 h-3.5 opacity-40 cursor-grab active:cursor-grabbing flex-shrink-0" />
        <span className="text-sm leading-none flex-shrink-0">{meta.icon || '📦'}</span>
        <span className="flex-1 text-xs font-bold truncate">{meta.label}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(block.id); }}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 hover:text-red-600 transition-all"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Config */}
      {isSelected && meta.configurable && (
        <BlockConfigForm block={block} onUpdateConfig={onUpdateConfig} categories={categories} />
      )}
    </div>
  );
};

// ── Main canvas (12-column grid + resize) ─────────────────────────────────────
const MainCanvas = ({ blocks, selectedId, onSelect, onRemove, onUpdateConfig, onUpdateColSpan, onReorder, onAddBlock, categories }) => {
  const gridRef = useRef(null);
  const dragFrom = useRef(null);
  const [dragOver, setDragOver] = useState(null);
  const [dropActive, setDropActive] = useState(false);

  const handleDragStart = useCallback((e, i) => { dragFrom.current = i; e.dataTransfer.effectAllowed = 'move'; }, []);
  const handleDragEnter = useCallback((i) => { if (dragFrom.current !== null) setDragOver(i); }, []);
  const handleDragEnd = useCallback(() => {
    if (dragFrom.current !== null && dragOver !== null && dragFrom.current !== dragOver)
      onReorder(dragFrom.current, dragOver);
    dragFrom.current = null;
    setDragOver(null);
  }, [dragOver, onReorder]);

  const onDrop = (e) => {
    e.preventDefault();
    setDropActive(false);
    if (dragFrom.current !== null) return;
    const type = e.dataTransfer.getData('block-type');
    if (type) onAddBlock(type);
  };

  return (
    <div>
      {/* Ruler */}
      <div className="grid grid-cols-12 gap-2 mb-1 px-1">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="text-center">
            <span className="text-[9px] text-gray-300 font-mono select-none">{i + 1}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        ref={gridRef}
        className={`grid grid-cols-12 gap-2 p-3 rounded-2xl min-h-36 transition-all ${dropActive ? 'ring-2 ring-enews-400 bg-enews-50/30' : 'bg-slate-100/60'}`}
        style={{ backgroundImage: 'repeating-linear-gradient(90deg,transparent 0,transparent calc(8.333% - 1px),rgba(148,163,184,0.18) calc(8.333% - 1px),rgba(148,163,184,0.18) 8.333%)' }}
        onDragOver={(e) => { e.preventDefault(); if (dragFrom.current === null) setDropActive(true); }}
        onDragLeave={() => setDropActive(false)}
        onDrop={onDrop}
      >
        {blocks.map((block, index) => (
          <MainTile
            key={block.id}
            block={block} index={index}
            isDragOver={dragOver === index}
            isDragging={dragFrom.current === index}
            isSelected={selectedId === block.id}
            onSelect={onSelect} onRemove={onRemove}
            onUpdateConfig={onUpdateConfig} onUpdateColSpan={onUpdateColSpan}
            onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragEnd={handleDragEnd}
            categories={categories} gridRef={gridRef}
          />
        ))}
        {blocks.length === 0 && (
          <div className="col-span-12 flex flex-col items-center justify-center py-14 text-gray-300 pointer-events-none">
            <LayoutTemplate className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Chưa có khối nội dung</p>
            <p className="text-xs mt-1 opacity-60">Kéo hoặc nhấn khối từ palette</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Sidebar canvas (vertical stack, no resize) ────────────────────────────────
const SidebarCanvas = ({ blocks, selectedId, onSelect, onRemove, onUpdateConfig, onReorder, onAddBlock, categories }) => {
  const dragFrom = useRef(null);
  const [dragOver, setDragOver] = useState(null);
  const [dropActive, setDropActive] = useState(false);

  const handleDragStart = useCallback((e, i) => { dragFrom.current = i; e.dataTransfer.effectAllowed = 'move'; }, []);
  const handleDragEnter = useCallback((i) => { if (dragFrom.current !== null) setDragOver(i); }, []);
  const handleDragEnd = useCallback(() => {
    if (dragFrom.current !== null && dragOver !== null && dragFrom.current !== dragOver)
      onReorder(dragFrom.current, dragOver);
    dragFrom.current = null;
    setDragOver(null);
  }, [dragOver, onReorder]);

  const onDrop = (e) => {
    e.preventDefault();
    setDropActive(false);
    if (dragFrom.current !== null) return;
    const type = e.dataTransfer.getData('block-type');
    if (type) onAddBlock(type);
  };

  return (
    <div
      className={`p-2.5 rounded-2xl min-h-36 space-y-2 transition-all ${dropActive ? 'ring-2 ring-enews-400 bg-enews-50/30' : 'bg-slate-100/60'}`}
      onDragOver={(e) => { e.preventDefault(); if (dragFrom.current === null) setDropActive(true); }}
      onDragLeave={() => setDropActive(false)}
      onDrop={onDrop}
    >
      {blocks.map((block, index) => (
        <SidebarTile
          key={block.id}
          block={block} index={index}
          isDragOver={dragOver === index}
          isDragging={dragFrom.current === index}
          isSelected={selectedId === block.id}
          onSelect={onSelect} onRemove={onRemove}
          onUpdateConfig={onUpdateConfig}
          onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragEnd={handleDragEnd}
          categories={categories}
        />
      ))}
      {blocks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-gray-300 pointer-events-none">
          <span className="text-3xl mb-2 opacity-30">📌</span>
          <p className="text-xs text-center opacity-60">Kéo hoặc nhấn khối sidebar vào đây</p>
        </div>
      )}
    </div>
  );
};

// ── Palette item ──────────────────────────────────────────────────────────────
const PaletteItem = ({ type, meta, isAdded, onAdd }) => {
  const cl = tc(type);
  return (
    <button
      draggable={!isAdded}
      onDragStart={(e) => {
        if (isAdded) { e.preventDefault(); return; }
        e.dataTransfer.setData('block-type', type);
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onClick={() => !isAdded && onAdd(type)}
      disabled={isAdded}
      className={`
        w-full flex items-center gap-2 px-2.5 py-2 rounded-xl border-2 text-xs text-left transition-all select-none
        ${isAdded
          ? `${cl.bg} ${cl.bd} ${cl.tx} opacity-40 cursor-not-allowed`
          : `${cl.bg} ${cl.bd} ${cl.tx} hover:brightness-[0.96] hover:shadow-sm cursor-grab active:scale-95`
        }
      `}
    >
      <span className="text-base leading-none flex-shrink-0">{meta.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate leading-tight">{meta.label}</div>
        <div className="text-[10px] opacity-55 truncate">{meta.description}</div>
      </div>
      {isAdded ? <span className="text-[9px] opacity-40">✓</span> : <Plus className="w-3 h-3 opacity-40 flex-shrink-0" />}
    </button>
  );
};

// ── Live Preview ──────────────────────────────────────────────────────────────
const LivePreview = ({ mainBlocks, sidebarBlocks }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.4);

  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    setScale(Math.min((containerRef.current.clientWidth - 16) / 1200, 0.75));
  }, []);

  useEffect(() => {
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateScale]);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-100 px-3 py-2 flex items-center gap-2 flex-shrink-0">
        <Eye className="w-3.5 h-3.5 text-enews-600" />
        <span className="text-xs font-semibold text-gray-700">Xem trước</span>
        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
          {Math.round(scale * 100)}%
        </span>
        <a href="/" target="_blank" rel="noreferrer" className="ml-auto text-[10px] text-enews-600 hover:text-enews-700 flex items-center gap-1">
          Trang thật <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto bg-gray-200/70 p-2">
        <div style={{ width: `${1200 * scale}px`, margin: '0 auto' }}>
          <div className="bg-gray-300 rounded-t-lg px-2 py-1.5 flex items-center gap-1.5">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-white rounded text-[9px] text-gray-400 px-2 py-0.5 text-center">localhost:3000/</div>
          </div>

          <div style={{ zoom: scale, width: '1200px', background: '#f9fafb', padding: '16px 24px 32px', borderRadius: '0 0 8px 8px', boxShadow: '0 4px 24px rgba(0,0,0,0.15)', pointerEvents: 'none', userSelect: 'none' }}>
            {/* Header mock */}
            <div className="bg-enews-700 text-white px-4 py-2.5 rounded-lg mb-4 flex items-center justify-between text-xs font-semibold">
              <span>📰 Youth KGU — Tin tức Đoàn Hội</span>
              <span className="text-enews-200 text-[10px]">Trang chủ · Văn bản · ...</span>
            </div>

            {/* Two-column layout */}
            <div className="flex gap-6 items-start">
              {/* Main */}
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-12 gap-4">
                  {mainBlocks.map((block) => {
                    const Component = BLOCK_REGISTRY[block.type];
                    if (!Component) return null;
                    return (
                      <div key={block.id} style={{ gridColumn: `span ${block.colSpan || 12}` }}>
                        <Component config={block.config || {}} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar — real blocks */}
              <aside className="w-72 flex-shrink-0 space-y-4">
                {sidebarBlocks.map((block) => {
                  const Component = BLOCK_REGISTRY[block.type];
                  if (!Component) return null;
                  return <Component key={block.id} config={block.config || {}} />;
                })}
                {sidebarBlocks.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 h-32 flex items-center justify-center">
                    <span className="text-xs text-gray-300">Sidebar trống</span>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Editor Page ──────────────────────────────────────────────────────────
const NewsLayoutEditorPage = () => {
  const screenTooSmall = useScreenTooSmall();
  const navigate = useNavigate();
  const { mainBlocks: savedMain, sidebarBlocks: savedSidebar, setLayout, resetToDefault } = useNewsLayoutStore();

  if (screenTooSmall) return <ScreenTooSmall />;

  const [localMain, setLocalMain]       = useState(() => JSON.parse(JSON.stringify(savedMain)));
  const [localSidebar, setLocalSidebar] = useState(() => JSON.parse(JSON.stringify(savedSidebar)));
  const [selectedId, setSelectedId]     = useState(null);
  const [showPreview, setShowPreview]   = useState(true);

  const { data: tree = [] } = useQuery({
    queryKey: ['chuyen-muc-tree'],
    queryFn:  () => newsService.getCayDanhMuc(),
    staleTime: 30 * 60 * 1000,
  });
  const flatCategories = [];
  tree.forEach((top) => {
    flatCategories.push(top);
    (top.children || top.danhSachCon || []).forEach((c) =>
      flatCategories.push({ ...c, ten: `  └ ${c.ten}` })
    );
  });

  // Main palette (non-sidebar types)
  const mainPaletteTypes = Object.entries(BLOCK_META).filter(([t]) => !SIDEBAR_BLOCK_TYPES.has(t));
  // Sidebar palette (sidebar types)
  const sidebarPaletteTypes = Object.entries(BLOCK_META).filter(([t]) => SIDEBAR_BLOCK_TYPES.has(t));

  const mainUsed    = new Set(localMain.map((b) => b.type));
  const sidebarUsed = new Set(localSidebar.map((b) => b.type));

  // ── Add handlers ──
  const handleAddMainBlock = useCallback((type) => {
    const meta = BLOCK_META[type];
    if (!meta || SIDEBAR_BLOCK_TYPES.has(type)) return;
    if (meta.unique && mainUsed.has(type)) { toast.info(`"${meta.label}" đã có trong bố cục`); return; }
    const id = `${type.toLowerCase().replace(/_/g, '-')}-${Date.now()}`;
    const defaultConfig =
      type === BLOCK_TYPES.LATEST_NEWS      ? { size: 8, columns: 4 } :
      type === BLOCK_TYPES.FEATURED_GRID    ? { size: 4 } :
      type === BLOCK_TYPES.CATEGORY_SECTION ? { size: 4 } : {};
    setLocalMain((prev) => [...prev, { id, type, config: defaultConfig, colSpan: 12 }]);
    setSelectedId(id);
  }, [mainUsed]);

  const handleAddSidebarBlock = useCallback((type) => {
    const meta = BLOCK_META[type];
    if (!meta || !SIDEBAR_BLOCK_TYPES.has(type)) return;
    if (meta.unique && sidebarUsed.has(type)) { toast.info(`"${meta.label}" đã có trong sidebar`); return; }
    const id = `${type.toLowerCase().replace(/_/g, '-')}-${Date.now()}`;
    const defaultConfig = type === BLOCK_TYPES.SIDEBAR_FEATURED ? { size: 5 } : {};
    setLocalSidebar((prev) => [...prev, { id, type, config: defaultConfig }]);
    setSelectedId(id);
  }, [sidebarUsed]);

  // ── Remove ──
  const handleRemove = useCallback((id) => {
    setLocalMain((prev) => prev.filter((b) => b.id !== id));
    setLocalSidebar((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  // ── Update config (works for both columns) ──
  const handleUpdateConfig = useCallback((id, patch) => {
    setLocalMain((prev) => prev.map((b) => b.id === id ? { ...b, config: { ...b.config, ...patch } } : b));
    setLocalSidebar((prev) => prev.map((b) => b.id === id ? { ...b, config: { ...b.config, ...patch } } : b));
  }, []);

  const handleUpdateColSpan = useCallback((id, colSpan) => {
    setLocalMain((prev) => prev.map((b) => b.id === id ? { ...b, colSpan } : b));
  }, []);

  const handleSelect = useCallback((id) => {
    setSelectedId((prev) => prev === id ? null : id);
  }, []);

  // ── Reorder ──
  const handleMainReorder = useCallback((from, to) => {
    setLocalMain((prev) => {
      const arr = [...prev];
      const [m] = arr.splice(from, 1);
      arr.splice(to, 0, m);
      return arr;
    });
  }, []);

  const handleSidebarReorder = useCallback((from, to) => {
    setLocalSidebar((prev) => {
      const arr = [...prev];
      const [m] = arr.splice(from, 1);
      arr.splice(to, 0, m);
      return arr;
    });
  }, []);

  // ── Save / Reset ──
  const handleSave = () => {
    setLayout({ mainBlocks: localMain, sidebarBlocks: localSidebar });
    toast.success('Đã lưu bố cục trang tin tức!');
  };

  const handleReset = () => {
    if (!window.confirm('Khôi phục bố cục mặc định? Mọi thay đổi hiện tại sẽ mất.')) return;
    resetToDefault();
    setLocalMain(JSON.parse(JSON.stringify(DEFAULT_MAIN_BLOCKS)));
    setLocalSidebar(JSON.parse(JSON.stringify(DEFAULT_SIDEBAR_BLOCKS)));
    setSelectedId(null);
    toast.info('Đã khôi phục bố cục mặc định');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0 z-20">
        <div className="h-14 px-4 flex items-center gap-3">
          <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <LayoutTemplate className="w-5 h-5 text-enews-600" />
          <span className="font-semibold text-gray-800 flex-1 text-sm sm:text-base">Bố cục Trang Tin tức</span>

          {/* Legend */}
          <div className="hidden xl:flex items-center gap-3 mr-2 text-[11px] text-gray-400">
            <span className="flex items-center gap-1"><GripVertical className="w-3.5 h-3.5" /> Kéo sắp xếp</span>
            <span className="text-gray-200">·</span>
            <span>Kéo cạnh phải → đổi kích thước</span>
          </div>

          <button
            onClick={() => setShowPreview((v) => !v)}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors ${showPreview ? 'border-enews-300 text-enews-700 bg-enews-50' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden xl:inline">{showPreview ? 'Ẩn preview' : 'Xem trước'}</span>
          </button>

          <a href="/" target="_blank" rel="noreferrer" className="hidden sm:flex items-center gap-1 text-xs text-gray-500 hover:text-enews-600 border border-gray-200 px-2.5 py-1.5 rounded-lg transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mặc định</span>
          </button>

          <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-enews-600 hover:bg-enews-700 text-white font-medium rounded-lg transition-colors shadow-sm">
            <Save className="w-3.5 h-3.5" />
            Lưu bố cục
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Palette ── */}
        <div className="w-52 flex-shrink-0 flex flex-col bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-3 space-y-4">

            {/* Main blocks palette */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Nội dung chính
              </p>
              <div className="space-y-1.5">
                {mainPaletteTypes.map(([type, meta]) => (
                  <PaletteItem
                    key={type} type={type} meta={meta}
                    isAdded={meta.unique && mainUsed.has(type)}
                    onAdd={handleAddMainBlock}
                  />
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Sidebar blocks palette */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Sidebar phải
              </p>
              <div className="space-y-1.5">
                {sidebarPaletteTypes.map(([type, meta]) => (
                  <PaletteItem
                    key={type} type={type} meta={meta}
                    isAdded={meta.unique && sidebarUsed.has(type)}
                    onAdd={handleAddSidebarBlock}
                  />
                ))}
              </div>
            </div>

            {/* Ad banner hint */}
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
              <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-600 leading-snug">
                Hình ảnh widget quản lý tại{' '}
                <button onClick={() => navigate('/admin/ad-banner-manager')} className="font-bold underline hover:text-blue-800">
                  Ad Manager
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* ── CENTER: Two-column canvas ── */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="p-5">

            {/* Canvas header */}
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-bold text-gray-800">Canvas bố cục</h2>
              <span className="text-xs text-gray-400">
                — kéo <GripVertical className="w-3 h-3 inline align-middle opacity-50" /> sắp xếp
                · kéo cạnh phải đổi kích thước
              </span>
            </div>

            {/* Two-column canvas */}
            <div className="flex gap-4 items-start">

              {/* Main content column */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Nội dung chính
                  </span>
                  <span className="text-[10px] text-gray-300 font-mono">12 cột</span>
                  <span className="text-[10px] text-gray-300">· {localMain.length} khối</span>
                </div>
                <MainCanvas
                  blocks={localMain}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  onRemove={handleRemove}
                  onUpdateConfig={handleUpdateConfig}
                  onUpdateColSpan={handleUpdateColSpan}
                  onReorder={handleMainReorder}
                  onAddBlock={handleAddMainBlock}
                  categories={flatCategories}
                />
              </div>

              {/* Sidebar column */}
              <div className="w-52 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Sidebar
                  </span>
                  <span className="text-[10px] text-gray-300">· {localSidebar.length} khối</span>
                </div>
                <SidebarCanvas
                  blocks={localSidebar}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  onRemove={handleRemove}
                  onUpdateConfig={handleUpdateConfig}
                  onReorder={handleSidebarReorder}
                  onAddBlock={handleAddSidebarBlock}
                  categories={flatCategories}
                />
              </div>
            </div>

            {/* Footer hint */}
            <p className="text-center text-[11px] text-gray-300 mt-5 select-none">
              💡 Nhấn khối để mở cấu hình · Kéo{' '}
              <GripVertical className="w-3 h-3 inline align-middle opacity-50" />{' '}
              để di chuyển · Kéo cạnh phải (nội dung chính) để thay đổi kích thước
            </p>
          </div>
        </div>

        {/* ── RIGHT: Live Preview ── */}
        <div className={`flex-shrink-0 flex flex-col border-l border-gray-200 bg-white overflow-hidden transition-all duration-300 ${showPreview ? 'w-[380px]' : 'w-0'}`}>
          {showPreview && <LivePreview mainBlocks={localMain} sidebarBlocks={localSidebar} />}
        </div>
      </div>
    </div>
  );
};

export default NewsLayoutEditorPage;
