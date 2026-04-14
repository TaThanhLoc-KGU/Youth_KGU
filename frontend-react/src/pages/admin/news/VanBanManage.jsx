import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Send, Download, ExternalLink, Bell } from 'lucide-react';
import useAuthStore from '../../../stores/authStore';
import { PERMISSIONS } from '../../../utils/constants';
import vanBanService from '../../../services/vanBanService';
import newsService from '../../../services/newsService';
import VanBanForm from '../../../components/news/manage/VanBanForm';
import Table from '../../../components/common/Table';
import Button from '../../../components/common/Button';
import SearchInput from '../../../components/common/SearchInput';
import Select from '../../../components/common/Select';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';

const LOAI_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: 'KE_HOACH', label: 'Kế hoạch' },
  { value: 'CONG_VAN', label: 'Công văn' },
  { value: 'QUYET_DINH', label: 'Quyết định' },
  { value: 'THONG_BAO', label: 'Thông báo' },
  { value: 'BAO_CAO', label: 'Báo cáo' },
  { value: 'HUONG_DAN', label: 'Hướng dẫn' },
  { value: 'BIEN_BAN', label: 'Biên bản' },
  { value: 'TO_TRINH', label: 'Tờ trình' },
  { value: 'KHAC', label: 'Khác' },
];

const TRANG_THAI_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'PUBLISHED', label: 'Đã đăng' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
];

const STATUS_BADGE = {
  DRAFT:     { label: 'Nháp',     color: 'gray' },
  PUBLISHED: { label: 'Đã đăng',  color: 'green' },
  ARCHIVED:  { label: 'Lưu trữ', color: 'red' },
};

const LOAI_LABEL = {
  KE_HOACH: 'Kế hoạch', CONG_VAN: 'Công văn', QUYET_DINH: 'Quyết định',
  THONG_BAO: 'Thông báo', BAO_CAO: 'Báo cáo', HUONG_DAN: 'Hướng dẫn',
  BIEN_BAN: 'Biên bản', TO_TRINH: 'Tờ trình', KHAC: 'Khác',
};

const PAGE_SIZE = 15;

const VanBanManage = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();

  const canManage  = hasPermission(PERMISSIONS.QUAN_LY_VAN_BAN);
  const canDelete  = hasPermission(PERMISSIONS.XOA_VAN_BAN);

  const [page, setPage]     = useState(0);
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loai, setLoai]       = useState('');
  const [trangThai, setTrangThai] = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-van-ban', page, keyword, loai, trangThai],
    queryFn: () => vanBanService.getDanhSachManage({
      page, size: PAGE_SIZE,
      keyword: keyword || undefined,
      loai: loai || undefined,
      trangThai: trangThai || undefined,
    }),
    keepPreviousData: true,
    staleTime: 30 * 1000,
  });

  const items = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-van-ban'] });

  const publishMutation = useMutation({
    mutationFn: (id) => vanBanService.publish(id),
    onSuccess: () => { toast.success('Đã đăng văn bản'); invalidate(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi khi đăng văn bản'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => vanBanService.delete(id),
    onSuccess: () => { toast.success('Đã xóa văn bản'); setConfirmDelete(null); invalidate(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xóa thất bại'),
  });

  const broadcastMutation = useMutation({
    mutationFn: (row) => newsService.broadcastNotification({
      title: `📄 Văn bản mới: ${row.soHieu || row.trichYeu}`,
      message: row.trichYeu,
      type: 'VAN_BAN',
      relatedId: row.id,
    }),
    onSuccess: (count) => toast.success(`Đã gửi thông báo đến ${count} người dùng`),
    onError: (e) => toast.error(e.response?.data?.message || 'Gửi thông báo thất bại'),
  });

  const handleDownload = async (id, soHieu) => {
    try {
      const blob = await vanBanService.taiVe(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${soHieu || id}`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Không thể tải văn bản');
    }
  };

  const handleSearch = () => { setKeyword(search); setPage(0); };
  const openCreate = () => { setSelectedId(null); setModalOpen(true); };
  const openEdit   = (id) => { setSelectedId(id); setModalOpen(true); };
  const handleSaved = () => { setModalOpen(false); invalidate(); };

  const columns = [
    {
      header: 'Số hiệu',
      accessor: 'soHieu',
      width: '130px',
      render: (v) => <span className="font-mono text-sm font-medium text-gray-800">{v || '—'}</span>,
    },
    {
      header: 'Trích yếu',
      accessor: 'trichYeu',
      render: (v, row) => (
        <div>
          <div className="font-medium text-gray-900 text-sm line-clamp-2">{v}</div>
          <div className="text-xs text-gray-400 mt-0.5">{row.coQuanBanHanh || ''}</div>
        </div>
      ),
    },
    {
      header: 'Loại',
      accessor: 'loaiVanBan',
      width: '110px',
      className: 'hidden sm:table-cell',
      render: (v) => <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{LOAI_LABEL[v] || v}</span>,
    },
    {
      header: 'Ngày ban hành',
      accessor: 'ngayBanHanh',
      width: '120px',
      className: 'hidden sm:table-cell',
      render: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
    },
    {
      header: 'Trạng thái',
      accessor: 'trangThai',
      width: '110px',
      render: (v) => {
        const s = STATUS_BADGE[v] || { label: v, color: 'gray' };
        return <Badge variant={s.color}>{s.label}</Badge>;
      },
    },
    {
      header: 'Thao tác',
      accessor: 'id',
      width: '160px',
      render: (id, row) => (
        <div className="flex items-center gap-1">
          {row.trangThai === 'PUBLISHED' && (
            <>
              <button onClick={() => handleDownload(id, row.soHieu)}
                className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Tải về">
                <Download className="w-4 h-4" />
              </button>
              <a href={vanBanService.getXemUrl(id)} target="_blank" rel="noreferrer"
                className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Xem trực tuyến">
                <ExternalLink className="w-4 h-4" />
              </a>
            </>
          )}
          {canManage && (
            <button onClick={() => openEdit(id)}
              className="p-1.5 text-gray-400 hover:text-yellow-600 rounded" title="Sửa">
              <Edit className="w-4 h-4" />
            </button>
          )}
          {canManage && row.trangThai === 'DRAFT' && (
            <button onClick={() => publishMutation.mutate(id)}
              className="p-1.5 text-gray-400 hover:text-green-600 rounded" title="Đăng">
              <Send className="w-4 h-4" />
            </button>
          )}
          {canManage && row.trangThai === 'PUBLISHED' && (
            <button
              onClick={() => broadcastMutation.mutate(row)}
              disabled={broadcastMutation.isPending}
              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded disabled:opacity-50"
              title="Gửi thông báo đến tất cả người dùng"
            >
              <Bell className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý Văn bản</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kho văn bản, kế hoạch, công văn của Đoàn – Hội KGU</p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Thêm văn bản
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex-1 flex gap-2">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Tìm theo số hiệu hoặc trích yếu..."
            className="flex-1"
          />
          <Button variant="secondary" onClick={handleSearch}>Tìm</Button>
        </div>
        <Select
          value={loai}
          onChange={(e) => { setLoai(e.target.value); setPage(0); }}
          options={LOAI_OPTIONS}
          className="w-full sm:w-44"
        />
        <Select
          value={trangThai}
          onChange={(e) => { setTrangThai(e.target.value); setPage(0); }}
          options={TRANG_THAI_OPTIONS}
          className="w-full sm:w-44"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <Table
          columns={columns}
          data={items}
          isLoading={isLoading}
          emptyMessage="Không có văn bản nào."
        />
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Trang {page + 1} / {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Trước</Button>
            <Button variant="secondary" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Sau</Button>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {modalOpen && (
        <VanBanForm
          vanBanId={selectedId}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal
          isOpen
          onClose={() => setConfirmDelete(null)}
          title="Xác nhận xóa văn bản"
          size="sm"
        >
          <p className="text-sm text-gray-600 mb-4">
            Bạn có chắc muốn xóa văn bản <strong>"{confirmDelete.trichYeu}"</strong>?
            Hành động này không thể hoàn tác.
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

export default VanBanManage;
