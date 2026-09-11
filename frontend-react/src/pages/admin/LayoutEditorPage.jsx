/**
 * LayoutEditorPage.jsx
 * Drag-and-drop dashboard layout editor for admins.
 * Uses HTML5 native drag-and-drop (no extra library needed).
 *
 * Left panel : Widget palette — drag widgets FROM here to add them.
 * Right panel: Canvas — current layout; drag items to reorder, click × to remove,
 *              click colSpan buttons to resize.
 */
import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft, RotateCcw, Save, GripVertical, X, ChevronLeft, ChevronRight,
  LayoutGrid,
} from 'lucide-react';
import useDashboardLayoutStore, {
  WIDGET_META, WIDGET_TYPES, COLSPAN_STEPS,
} from '../../stores/dashboardLayoutStore';

// ─── ColSpan badge ────────────────────────────────────────────────────────────

const COL_LABEL = { 3: '1/4', 4: '1/3', 6: '1/2', 8: '2/3', 12: 'Full' };

const ColSpanControls = ({ item, onCycle }) => {
  const meta = WIDGET_META[item.type] || {};
  const min = meta.minColSpan || 3;
  const allowed = COLSPAN_STEPS.filter((c) => c >= min);
  const idx = allowed.indexOf(item.colSpan);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); onCycle(item.id, -1, allowed, idx); }}
        className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
        disabled={idx <= 0}
        title="Thu nhỏ"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <span className="text-[10px] font-mono font-bold text-gray-600 w-7 text-center">
        {COL_LABEL[item.colSpan] || `${item.colSpan}/12`}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onCycle(item.id, 1, allowed, idx); }}
        className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
        disabled={idx >= allowed.length - 1}
        title="Mở rộng"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ─── Canvas item ──────────────────────────────────────────────────────────────

const COL_BAR_STYLE = {
  3:  'w-1/4',
  4:  'w-1/3',
  6:  'w-1/2',
  8:  'w-2/3',
  12: 'w-full',
};

const CanvasItem = ({
  item, index, total,
  onRemove, onCycleColSpan,
  onDragStart, onDragEnter, onDragEnd, isDragOver,
}) => {
  const meta = WIDGET_META[item.type] || {};
  const barClass = COL_BAR_STYLE[item.colSpan] || 'w-full';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnter={(e) => onDragEnter(e, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={`
        group relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-grab
        transition-all select-none
        ${isDragOver
          ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.01]'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
      `}
    >
      {/* Drag handle */}
      <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />

      {/* Icon */}
      <span className="text-xl flex-shrink-0">{meta.icon || '📦'}</span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-800">{meta.label || item.type}</p>
          <ColSpanControls item={item} onCycle={(id, dir, allowed, idx) => {
            const nextIdx = Math.max(0, Math.min(allowed.length - 1, idx + dir));
            onCycleColSpan(id, allowed[nextIdx]);
          }} />
        </div>
        <p className="text-xs text-gray-400 truncate">{meta.description || ''}</p>
        {/* Width preview bar */}
        <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full bg-blue-400 rounded-full transition-all ${barClass}`} />
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.id)}
        className="flex-shrink-0 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
        title="Xóa widget"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// ─── Palette item ─────────────────────────────────────────────────────────────

const PaletteItem = ({ type, onAdd }) => {
  const meta = WIDGET_META[type] || {};

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'palette', type }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onAdd(type)}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 cursor-grab active:cursor-grabbing transition-colors group"
    >
      <span className="text-lg flex-shrink-0">{meta.icon || '📦'}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-700 group-hover:text-blue-700">{meta.label || type}</p>
        <p className="text-[10px] text-gray-400 truncate">{meta.description || ''}</p>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const LayoutEditorPage = () => {
  const navigate = useNavigate();
  const { items, addWidget, removeWidget, setColSpan, setLayout, resetToDefault } = useDashboardLayoutStore();

  // Local editable copy
  const [localItems, setLocalItems] = useState(() => [...items]);

  // Drag state
  const dragFromIndex = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // ── Palette drag-drop ──

  const handleCanvasDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData('text/plain');
      const data = JSON.parse(raw);
      if (data.source === 'palette') {
        const meta = WIDGET_META[data.type];
        const id = `w-${Date.now()}`;
        setLocalItems((prev) => [
          ...prev,
          { id, type: data.type, colSpan: meta?.defaultColSpan || 6 },
        ]);
      }
    } catch { /* not our drag */ }
  };

  // ── Canvas reorder drag-drop ──

  const handleItemDragStart = useCallback((e, index) => {
    dragFromIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'canvas', index }));
  }, []);

  const handleItemDragEnter = useCallback((e, index) => {
    e.preventDefault();
    if (dragFromIndex.current === null) return;
    setDragOverIndex(index);
  }, []);

  const handleItemDragEnd = useCallback(() => {
    if (dragFromIndex.current !== null && dragOverIndex !== null && dragFromIndex.current !== dragOverIndex) {
      setLocalItems((prev) => {
        const arr = [...prev];
        const [moved] = arr.splice(dragFromIndex.current, 1);
        arr.splice(dragOverIndex, 0, moved);
        return arr;
      });
    }
    dragFromIndex.current = null;
    setDragOverIndex(null);
  }, [dragOverIndex]);

  // ── Item actions ──

  const handleRemove = useCallback((id) => {
    setLocalItems((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const handleCycleColSpan = useCallback((id, newColSpan) => {
    setLocalItems((prev) =>
      prev.map((w) => (w.id === id ? { ...w, colSpan: newColSpan } : w))
    );
  }, []);

  const handleAddFromPalette = useCallback((type) => {
    const meta = WIDGET_META[type];
    const id = `w-${Date.now()}`;
    setLocalItems((prev) => [
      ...prev,
      { id, type, colSpan: meta?.defaultColSpan || 6 },
    ]);
  }, []);

  // ── Save / Reset ──

  const handleSave = () => {
    setLayout(localItems);
    toast.success('Đã lưu bố cục dashboard');
    navigate('/admin');
  };

  const handleReset = () => {
    if (!window.confirm('Khôi phục bố cục mặc định? Mọi tùy chỉnh hiện tại sẽ mất.')) return;
    resetToDefault();
    useDashboardLayoutStore.getState();
    const defaultItems = useDashboardLayoutStore.getState().items;
    setLocalItems([...defaultItems]);
    toast.info('Đã khôi phục bố cục mặc định');
  };

  const usedTypes = new Set(localItems.map((w) => w.type));
  const allTypes = Object.values(WIDGET_TYPES);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Quay lại Dashboard</span>
          </button>

          <LayoutGrid className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-gray-800 flex-1 text-sm sm:text-base">Tùy chỉnh bố cục Dashboard</span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Mặc định
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Lưu bố cục
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col lg:flex-row flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-6">

        {/* ── Left palette ── */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:sticky lg:top-20">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Widget có sẵn
            </h2>
            <p className="text-[11px] text-gray-400 mb-3">
              Kéo vào canvas hoặc nhấn để thêm
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
              {allTypes.map((type) => (
                <div key={type} className="relative">
                  <PaletteItem type={type} onAdd={handleAddFromPalette} />
                  {usedTypes.has(type) && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-400" title="Đã có trên canvas" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right canvas ── */}
        <div className="flex-1 min-w-0">
          <div className="mb-3 flex items-center gap-2 overflow-x-auto">
            <h2 className="text-sm font-bold text-gray-700">Canvas</h2>
            <span className="text-xs text-gray-400">— kéo để sắp xếp lại, nhấn × để xóa</span>
          </div>

          {/* Drop zone */}
          <div className="overflow-x-auto w-full">
          <div
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
            className={`
              min-h-[400px] rounded-xl border-2 border-dashed p-4 space-y-2 transition-colors
              ${localItems.length === 0 ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200 bg-transparent'}
            `}
          >
            {localItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <LayoutGrid className="w-10 h-10 mb-3 text-gray-300" />
                <p className="text-sm">Kéo widget từ bảng bên trái vào đây</p>
              </div>
            ) : (
              localItems.map((item, index) => (
                <CanvasItem
                  key={item.id}
                  item={item}
                  index={index}
                  total={localItems.length}
                  isDragOver={dragOverIndex === index}
                  onRemove={handleRemove}
                  onCycleColSpan={handleCycleColSpan}
                  onDragStart={handleItemDragStart}
                  onDragEnter={handleItemDragEnter}
                  onDragEnd={handleItemDragEnd}
                />
              ))
            )}
          </div>

          </div>

          {/* Preview hint */}
          {localItems.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-2">Xem trước bố cục (12 cột):</p>
              <div className="grid grid-cols-12 gap-1">
                {localItems.map((item) => {
                  const meta = WIDGET_META[item.type] || {};
                  const span = item.colSpan || 6;
                  return (
                    <div
                      key={item.id}
                      className="h-6 bg-blue-100 border border-blue-200 rounded flex items-center justify-center overflow-hidden"
                      style={{ gridColumn: `span ${span}` }}
                    >
                      <span className="text-[9px] font-medium text-blue-600 truncate px-1">
                        {meta.icon} {meta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LayoutEditorPage;
