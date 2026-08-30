import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import emailBroadcastService from '../../services/emailBroadcastService';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Select from '../common/Select';
import ConfirmDialog from '../common/ConfirmDialog';

const EMPTY_FORM = { id: null, tenNhom: '', diaChiEmail: '', maKhoa: '' };

/**
 * Quản lý nhóm mail (thêm/sửa/xóa) — mở từ trang Soạn & Gửi Email.
 * khoaOptions: [{ value: maKhoa, label: tenKhoa }] để chọn khoa gắn với nhóm (để trống = nhóm chung).
 */
const EmailGroupManageModal = ({ isOpen, onClose, khoaOptions = [] }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['email-broadcast-groups'],
    queryFn: emailBroadcastService.getGroups,
    enabled: isOpen,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['email-broadcast-groups'] });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { tenNhom: form.tenNhom.trim(), diaChiEmail: form.diaChiEmail.trim(), maKhoa: form.maKhoa || null };
      return form.id ? emailBroadcastService.updateGroup(form.id, payload) : emailBroadcastService.createGroup(payload);
    },
    onSuccess: () => {
      toast.success(form.id ? 'Đã cập nhật nhóm mail' : 'Đã tạo nhóm mail');
      setForm(EMPTY_FORM);
      invalidate();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lưu nhóm mail thất bại'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => emailBroadcastService.deleteGroup(id),
    onSuccess: () => { toast.success('Đã xóa nhóm mail'); setConfirmDelete(null); invalidate(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xóa thất bại'),
  });

  const startEdit = (g) => setForm({ id: g.id, tenNhom: g.tenNhom, diaChiEmail: g.diaChiEmail, maKhoa: g.maKhoa || '' });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quản lý nhóm mail" subtitle="Mỗi khoa 1 nhóm riêng, hoặc để trống khoa cho nhóm dùng chung" size="lg">
      <div className="space-y-4">
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              value={form.tenNhom}
              onChange={(e) => setForm((f) => ({ ...f, tenNhom: e.target.value }))}
              placeholder="Tên nhóm (vd: Sinh viên Khoa CNTT)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              value={form.diaChiEmail}
              onChange={(e) => setForm((f) => ({ ...f, diaChiEmail: e.target.value }))}
              placeholder="Địa chỉ email nhóm (vd: cntt-svgroup@vnkgu.edu.vn)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={form.maKhoa}
              onChange={(e) => setForm((f) => ({ ...f, maKhoa: e.target.value }))}
              options={[{ value: '', label: '— Nhóm chung (không gắn khoa) —' }, ...khoaOptions]}
              placeholder={null}
              className="w-full sm:w-64"
            />
            <div className="flex gap-2 sm:ml-auto">
              {form.id && (
                <Button variant="secondary" onClick={() => setForm(EMPTY_FORM)}>Hủy sửa</Button>
              )}
              <Button icon={form.id ? Pencil : Plus} onClick={() => saveMutation.mutate()} isLoading={saveMutation.isPending}>
                {form.id ? 'Cập nhật' : 'Thêm nhóm'}
              </Button>
            </div>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
          {isLoading && <p className="text-sm text-gray-400 p-3">Đang tải...</p>}
          {!isLoading && groups.length === 0 && (
            <p className="text-sm text-gray-400 p-3">Chưa có nhóm mail nào — thêm ở trên.</p>
          )}
          {groups.map((g) => (
            <div key={g.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{g.tenNhom}</p>
                <p className="text-xs text-gray-400 truncate">
                  {g.diaChiEmail} {g.tenKhoa ? `· ${g.tenKhoa}` : '· Nhóm chung'}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => startEdit(g)} className="p-1.5 text-gray-400 hover:text-primary rounded" title="Sửa">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setConfirmDelete(g)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Xóa">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => deleteMutation.mutate(confirmDelete.id)}
        isLoading={deleteMutation.isPending}
        title="Xóa nhóm mail"
        description={confirmDelete ? `Xóa nhóm "${confirmDelete.tenNhom}"? Các email đã gửi trước đó không bị ảnh hưởng.` : ''}
      />
    </Modal>
  );
};

export default EmailGroupManageModal;
