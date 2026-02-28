import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';

const TreeNode = ({ node, depth = 0 }) => {
  const location = useLocation();
  const isActive = location.pathname === `/${node.fullPathSlug}`;
  const hasChildren = node.children?.length > 0;
  const [expanded, setExpanded] = useState(depth < 1);

  return (
    <li>
      <div className={`flex items-center gap-1 group rounded-lg ${isActive ? 'bg-red-50' : 'hover:bg-gray-50'} transition-colors`}>
        {hasChildren ? (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            {expanded
              ? <ChevronDown className="w-3.5 h-3.5" />
              : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="w-7 flex-shrink-0" />
        )}
        <Link
          to={`/${node.fullPathSlug}`}
          className={`flex-1 flex items-center gap-2 py-1.5 pr-2 text-sm truncate ${
            isActive ? 'text-red-700 font-semibold' : 'text-gray-700'
          }`}
          style={{ paddingLeft: depth * 8 }}
        >
          {expanded && hasChildren
            ? <FolderOpen className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
            : <Folder className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
          {node.ten}
        </Link>
      </div>
      {hasChildren && expanded && (
        <ul className="ml-4">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
};

/**
 * Hiển thị cây danh mục dạng expand/collapse.
 * Props: tree = [{id, ten, fullPathSlug, children: [...]}]
 */
const CategoryTree = ({ tree = [] }) => {
  if (!tree.length) return null;
  return (
    <nav aria-label="Danh mục bài viết">
      <ul className="space-y-0.5">
        {tree.map((node) => (
          <TreeNode key={node.id} node={node} depth={0} />
        ))}
      </ul>
    </nav>
  );
};

export default CategoryTree;
