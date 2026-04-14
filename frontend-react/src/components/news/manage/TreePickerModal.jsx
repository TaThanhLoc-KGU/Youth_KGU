import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Search, ChevronRight, ChevronDown, Check } from 'lucide-react';
import chuyenMucService from '../../../services/chuyenMucService';

const TreeNode = ({ node, selectedId, onSelect, searchTerm, depth = 0 }) => {
  const [open, setOpen] = useState(depth < 1);
  const isSelected = node.id === selectedId;
  const hasChildren = node.children?.length > 0;

  const highlight = (text) => {
    if (!searchTerm) return text;
    const idx = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 text-gray-900 rounded">{text.slice(idx, idx + searchTerm.length)}</mark>
        {text.slice(idx + searchTerm.length)}
      </>
    );
  };

  return (
    <li>
      <div
        className={`flex items-center gap-1 rounded-lg cursor-pointer px-2 py-1.5 ${
          isSelected ? 'bg-red-50 text-red-700' : 'hover:bg-gray-50 text-gray-700'
        } transition-colors`}
        style={{ paddingLeft: 8 + depth * 16 }}
        onClick={() => onSelect(node)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="w-5 flex-shrink-0" />
        )}
        <span className="text-sm flex-1">{highlight(node.ten)}</span>
        {isSelected && <Check className="w-4 h-4 text-red-600 flex-shrink-0" />}
      </div>
      {hasChildren && open && (
        <ul>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} searchTerm={searchTerm} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
};

/**
 * Modal chọn chuyên mục dạng cây.
 * Props: value (ChuyenMucDTO | null), onChange (fn), onClose (fn)
 */
const TreePickerModal = ({ value, onChange, onClose }) => {
  const [search, setSearch] = useState('');

  const { data: tree = [], isLoading } = useQuery({
    queryKey: ['chuyen-muc-tree'],
    queryFn: () => chuyenMucService.getTree(),
    staleTime: 30 * 60 * 1000,
  });

  // Flat list for search
  const flatList = useMemo(() => {
    const flat = [];
    const walk = (nodes) => nodes.forEach((n) => { flat.push(n); if (n.children?.length) walk(n.children); });
    walk(tree);
    return flat;
  }, [tree]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    return flatList.filter((n) => n.ten.toLowerCase().includes(search.toLowerCase()));
  }, [search, flatList]);

  const handleSelect = (node) => {
    onChange(node);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Chọn chuyên mục</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên danh mục..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Đang tải...</div>
          ) : search.trim() ? (
            searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Không tìm thấy danh mục</div>
            ) : (
              <ul className="space-y-0.5">
                {searchResults.map((node) => (
                  <li
                    key={node.id}
                    onClick={() => handleSelect(node)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm ${
                      node.id === value?.id ? 'bg-red-50 text-red-700' : 'hover:bg-gray-50 text-gray-700'
                    } transition-colors`}
                  >
                    {node.id === value?.id && <Check className="w-4 h-4 text-red-600 flex-shrink-0" />}
                    <span>{node.ten}</span>
                    {node.duongDan && (
                      <span className="text-xs text-gray-400 ml-auto">{node.fullPathSlug}</span>
                    )}
                  </li>
                ))}
              </ul>
            )
          ) : (
            <ul className="space-y-0.5">
              {tree.map((node) => (
                <TreeNode key={node.id} node={node} selectedId={value?.id} onSelect={handleSelect} searchTerm="" depth={0} />
              ))}
            </ul>
          )}
        </div>

        {/* Current selection */}
        {value && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <p className="text-xs text-gray-500">Đã chọn:</p>
            <p className="text-sm font-medium text-red-700">{value.ten}</p>
            {value.fullPathSlug && (
              <p className="text-xs text-gray-400 font-mono">{value.fullPathSlug}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TreePickerModal;
