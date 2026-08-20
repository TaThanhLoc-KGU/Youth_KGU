import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Mailbox, MessageSquareReply, Trash2, ShieldCheck } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/constants';
import gopYService from '../../services/gopYService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

const LOAI_LABEL = { GOP_Y: 'Góp ý', PHAN_ANH: 'Phản ánh', KHAC: 'Khác' };

const TRANG_THAI_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'MOI', label: 'Mới gửi' },
  { value: 'DANG_XU_LY', label: 'Đang xử lý' },
  { value: 'DA_XU_LY', label: 'Đã xử lý' },
  { value: 'TU_CHOI', label: 'Từ chối' },
];

const TRANG_THAI_BADGE = {
  MOI: { label: 'Mới gửi', variant: 'info' },
  DANG_XU_LY: { label: 'Đang xử lý', variant: 'warning' },
  DA_XU_LY: { label: 'Đã xử lý', variant: 'success' },
  TU_CHOI: { label: 'Từ chối', variant: 'danger' },
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

const PAGE_SIZE = 15;

/**
 * Quản lý Thùng thư góp ý (admin/BCH). Dữ liệu trả về từ backend (GopYAdminDTO)
 * cố tình KHÔNG có field định danh người gửi — trang này vì vậy cũng không
 * render bất kỳ thông tin định danh nào, đảm bảo tính minh bạch/dân chủ.
 */
const GopYManagePage = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const canRespond = hasPermission(PERMISSIONS.XU_LY_GOP_Y);

  const [page, setPage] = useState(0);
  const [trangThaiFilter, setTrangThaiFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [phanHoiForm, setPhanHoiForm] = useState({ phanHoi: '', trangThai: 'DA_XU_LY' });

  const { data, isLoading } = useQuery({
    queryKey: ['gop-y-manage', page, trangThaiFilter],
    queryFn: () => gopYService.getAllAdmin({ page, size: PAGE_SIZE, trangThai: trangThaiFilter || undefined }),
    keepPreviousData: true,
  });

  const items = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['gop-y-manage'] });

  const respondMutation = useMutation({
    mutationFn: () => gopYService.respond(detail.id, phanHoiForm),
    onSuccess: () => { toast.success('Đã gửi phản hồi'); setDetail(null); invalidate(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Phản hồi thất bại'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => gopYService.remove(id),
    onSuccess: () => { toast.success('Đã xóa góp ý'); setConfirmDelete(null); invalidate(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xóa thất bại'),
  });

  const openDetail = (row) => {
    setDetail(row);
    setPhanHoiForm({ phanHoi: row.phanHoi || '', trangThai: row.trangThai === 'MOI' ? 'DANG_XU_LY' : row.trangThai });
  };

  const columns = [
    {
      header: 'Loại',
      accessor: 'loai',
      width: '100px',
      render: (v) => <Badge variant="gray" size="sm">{LOAI_LABEL[v] || v}</Badge>,
    },
    {
      header: 'Tiêu đề',
      accessor: 'tieuDe',
      render: (v, row) => (
        <div>
          <div className="font-medium text-gray-900 text-sm line-clamp-1">{v}</div>
          <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">{row.noiDung}</div>
        </div>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: 'trangThai',
      width: '120px',
      render: (v) => {
        const b = TRANG_THAI_BADGE[v] || { label: v, variant: 'gray' };
        return <Badge variant={b.variant}>{b.label}</Badge>;
      },
    },
    {
      header: 'Ngày gửi',
      accessor: 'createdAt',
      width: '140px',
      className: 'hidden sm:table-cell',
      render: (v) => fmtDate(v),
    },
    {
      header: 'Thao tác',
      accessor: 'id',
      width: '120px',
      render: (id, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openDetail(row)}
            className="p-1.5 text-gray-400 hover:text-primary rounded" title="Xem / Phản hồi">
            <MessageSquareReply className="w-4 h-4" />
          </button>
          {canRespond && (
            <button onClick={() => setConfirmDelete(row)}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Xóa">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Mailbox className="w-6 h-6 text-primary" /> Thùng thư góp ý
        </h1>
        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Danh tính người gửi được ẩn hoàn toàn — chỉ hiển thị nội dung góp ý/phản ánh.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <Select
          value={trangThaiFilter}
          onChange={(e) => { setTrangThaiFilter(e.target.value); setPage(0); }}
          options={TRANG_THAI_OPTIONS}
          className="w-full sm:w-56"
        />
      </div>

      <Table columns={columns} data={items} isLoading={isLoading} emptyMessage="Chưa có góp ý nào." onRowClick={openDetail} />

      {totalPages > 1 && (
        <Table.Pagination
          currentPage={page}
          totalPages={totalPages}
          totalElements={data?.totalElements || 0}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}

      {/* Chi tiết / phản hồi */}
      {detail && (
        <Modal isOpen onClose={() => setDetail(null)} title="Chi tiết góp ý" subtitle={detail.tieuDe} size="lg">
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="gray" size="sm">{LOAI_LABEL[detail.loai] || detail.loai}</Badge>
              <span className="text-xs text-gray-400">{fmtDate(detail.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words bg-slate-50 rounded-lg p-3">{detail.noiDung}</p>

            {canRespond ? (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <Select
                    value={phanHoiForm.trangThai}
                    onChange={(e) => setPhanHoiForm((f) => ({ ...f, trangThai: e.target.value }))}
                    options={TRANG_THAI_OPTIONS.filter((o) => o.value)}
                    placeholder={null}
                    className="w-full sm:w-56"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phản hồi</label>
                  <textarea
                    value={phanHoiForm.phanHoi}
                    onChange={(e) => setPhanHoiForm((f) => ({ ...f, phanHoi: e.target.value }))}
                    rows={4}
                    placeholder="Nội dung phản hồi gửi đến sinh viên..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => respondMutation.mutate()} isLoading={respondMutation.isPending}>
                    Gửi phản hồi
                  </Button>
                </div>
              </div>
            ) : detail.phanHoi && (
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                <p className="text-xs font-semibold text-primary mb-1">Phản hồi</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{detail.phanHoi}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Xác nhận xóa */}
      {confirmDelete && (
        <Modal isOpen onClose={() => setConfirmDelete(null)} title="Xác nhận xóa góp ý" size="sm">
          <p className="text-sm text-gray-600 mb-4">
            Bạn có chắc muốn xóa góp ý <strong>"{confirmDelete.tieuDe}"</strong>? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Hủy</Button>
            <Button variant="danger" onClick={() => deleteMutation.mutate(confirmDelete.id)} isLoading={deleteMutation.isPending}>
              Xóa
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default GopYManagePage;
