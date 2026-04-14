import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import useAuthStore from '../../../stores/authStore';
import { PERMISSIONS } from '../../../utils/constants';
import chuyenMucService from '../../../services/chuyenMucService';
import ChuyenMucForm from '../../../components/news/manage/ChuyenMucForm';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';

const TO_CHUC_LABEL = {
  DOAN: 'Đoàn TN',
  HOI: 'Hội SV',
  BAN_DOI_CLB: 'Ban Đội CLB',
  CHUNG: 'Chung',
};

const TO_CHUC_COLOR = {
  DOAN: 'bg-blue-100 text-blue-700',
  HOI: 'bg-green-100 text-green-700',
  BAN_DOI_CLB: 'bg-purple-100 text-purple-700',
  CHUNG: 'bg-gray-100 text-gray-600',
};

/** Recursive tree node */
const TreeRow = ({ node, depth = 0, onEdit, onAddChild, onDelete, canManage }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children?.length > 0;

  return (
    <>
      <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
        <td className="py-2.5 px-4" style={{ paddingLeft: `${16 + depth * 24}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button onClick={() => setExpanded((v) => !v)} className="text-gray-400 hover:text-gray-600">
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-4" />
            )}
            {expanded && hasChildren ? (
              <FolderOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
            <span className="font-medium text-gray-900 text-sm">{node.ten}</span>
            {node.moTa && (
              <span className="text-xs text-gray-400 hidden sm:inline truncate max-w-xs">— {node.moTa}</span>
            )}
          </div>
        </td>
        <td className="hidden sm:table-cell py-2.5 px-4 text-sm text-gray-500">{node.fullPathSlug}</td>
        <td className="hidden sm:table-cell py-2.5 px-4">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TO_CHUC_COLOR[node.toChuc] || 'bg-gray-100 text-gray-600'}`}>
            {TO_CHUC_LABEL[node.toChuc] || node.toChuc}
          </span>
        </td>
        <td className="hidden sm:table-cell py-2.5 px-4 text-sm text-center">{node.thuTu ?? 0}</td>
        <td className="py-2.5 px-4">
          <span className={`inline-block w-2 h-2 rounded-full ${node.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
        </td>
        <td className="py-2.5 px-4">
          {canManage && (
            <div className="flex items-center gap-1">
              <button onClick={() => onAddChild(node)}
                className="p-1.5 text-gray-400 hover:text-green-600 rounded" title="Thêm chuyên mục con">
                <Plus className="w-4 h-4" />
              </button>
              <button onClick={() => onEdit(node)}
                className="p-1.5 text-gray-400 hover:text-yellow-600 rounded" title="Sửa">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(node)}
                className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Xóa">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </td>
      </tr>
      {expanded && hasChildren && node.children.map((child) => (
        <TreeRow
          key={child.id}
          node={child}
          depth={depth + 1}
          onEdit={onEdit}
          onAddChild={onAddChild}
          onDelete={onDelete}
          canManage={canManage}
        />
      ))}
    </>
  );
};

const ChuyenMucManage = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission(PERMISSIONS.QUAN_LY_CHUYEN_MUC);

  const [modalOpen, setModalOpen]       = useState(false);
  const [editNode, setEditNode]         = useState(null);   // null = create
  const [parentNode, setParentNode]     = useState(null);   // pre-fill parent
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: tree = [], isLoading } = useQuery({
    queryKey: ['admin-chuyen-muc-tree'],
    queryFn: () => chuyenMucService.getTree(),
    staleTime: 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-chuyen-muc-tree'] });

  const deleteMutation = useMutation({
    mutationFn: (id) => chuyenMucService.delete(id),
    onSuccess: () => { toast.success('Đã xóa chuyên mục'); setConfirmDelete(null); invalidate(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Không thể xóa (có thể đang có bài viết)'),
  });

  const openCreate = () => { setEditNode(null); setParentNode(null); setModalOpen(true); };
  const openEdit   = (node) => { setEditNode(node); setParentNode(null); setModalOpen(true); };
  const openAddChild = (node) => { setEditNode(null); setParentNode(node); setModalOpen(true); };
  const handleSaved = () => { setModalOpen(false); invalidate(); };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý Chuyên mục</h1>
          <p className="text-sm text-gray-500 mt-0.5">Cây chuyên mục – danh mục tin tức</p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Thêm chuyên mục
          </Button>
        )}
      </div>

      {/* Tree table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="bg-gray-200 h-9 rounded" />)}
          </div>
        ) : tree.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Chưa có chuyên mục nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Tên chuyên mục</th>
                  <th className="hidden sm:table-cell text-left py-3 px-4 font-semibold text-gray-600">Slug</th>
                  <th className="hidden sm:table-cell text-left py-3 px-4 font-semibold text-gray-600">Tổ chức</th>
                  <th className="hidden sm:table-cell text-center py-3 px-4 font-semibold text-gray-600">Thứ tự</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Active</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tree.map((node) => (
                  <TreeRow
                    key={node.id}
                    node={node}
                    onEdit={openEdit}
                    onAddChild={openAddChild}
                    onDelete={setConfirmDelete}
                    canManage={canManage}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      {modalOpen && (
        <ChuyenMucForm
          chuyenMuc={editNode}
          defaultParent={parentNode}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal
          isOpen
          onClose={() => setConfirmDelete(null)}
          title="Xác nhận xóa chuyên mục"
          size="sm"
        >
          <p className="text-sm text-gray-600 mb-4">
            Bạn có chắc muốn xóa chuyên mục <strong>"{confirmDelete.ten}"</strong>?
            Nếu chuyên mục có bài viết, thao tác này sẽ thất bại.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Hủy</Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate(confirmDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ChuyenMucManage;
