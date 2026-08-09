import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { XCircle, Download, Users, UserCheck, RefreshCw, LayoutTemplate } from 'lucide-react';
import chungNhanService from '../../services/chungNhanService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/dateFormat';
import useAuthStore from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/constants';

const TemplatePicker = ({ value, onChange }) => {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['chung-nhan-mau'],
    queryFn: chungNhanService.getTemplates,
  });
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Mẫu chứng nhận</label>
      {isLoading ? (
        <p className="text-xs text-gray-400">Đang tải danh sách mẫu...</p>
      ) : templates.length === 0 ? (
        <p className="text-xs text-amber-600">
          Chưa có mẫu nào — vào <Link to="/admin/certificates/templates" className="underline font-medium">Mẫu chứng nhận</Link> để tạo trước.
        </p>
      ) : (
        <select
          className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">— Chọn mẫu —</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.ten}</option>
          ))}
        </select>
      )}
    </div>
  );
};

const IssueSingleModal = ({ isOpen, onClose, onSuccess }) => {
  const [maSv, setMaSv] = useState('');
  const [maHoatDong, setMaHoatDong] = useState('');
  const [templateId, setTemplateId] = useState(null);
  const mutation = useMutation({
    mutationFn: () => chungNhanService.issueAuto(maSv.trim(), maHoatDong.trim(), templateId),
    onSuccess: () => {
      toast.success('Cấp chứng nhận thành công!');
      onSuccess();
      onClose();
      setMaSv('');
      setMaHoatDong('');
      setTemplateId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi cấp chứng nhận'),
  });
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cấp chứng nhận đơn lẻ" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mã sinh viên</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={maSv}
            onChange={e => setMaSv(e.target.value)}
            placeholder="VD: SV001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mã hoạt động</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={maHoatDong}
            onChange={e => setMaHoatDong(e.target.value)}
            placeholder="VD: HD001"
          />
        </div>
        <TemplatePicker value={templateId} onChange={setTemplateId} />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
            disabled={!maSv || !maHoatDong}
          >
            Cấp chứng nhận
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const IssueBulkModal = ({ isOpen, onClose, onSuccess }) => {
  const [maHoatDong, setMaHoatDong] = useState('');
  const [templateId, setTemplateId] = useState(null);
  const mutation = useMutation({
    mutationFn: () => chungNhanService.issueBulk(maHoatDong.trim(), templateId),
    onSuccess: (res) => {
      toast.success(res.message || 'Cấp hàng loạt thành công!');
      onSuccess();
      onClose();
      setMaHoatDong('');
      setTemplateId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi cấp hàng loạt'),
  });
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cấp hàng loạt theo hoạt động" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Cấp chứng nhận PDF cho tất cả sinh viên đã tham gia hoạt động, dùng mẫu đã chọn.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mã hoạt động</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={maHoatDong}
            onChange={e => setMaHoatDong(e.target.value)}
            placeholder="VD: HD001"
          />
        </div>
        <TemplatePicker value={templateId} onChange={setTemplateId} />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
            disabled={!maHoatDong || !templateId}
            icon={Users}
          >
            Cấp hàng loạt
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const RevokeModal = ({ cert, isOpen, onClose, onSuccess }) => {
  const [lyDo, setLyDo] = useState('');
  const mutation = useMutation({
    mutationFn: () => chungNhanService.revoke(cert.id, lyDo.trim()),
    onSuccess: () => {
      toast.success('Thu hồi thành công!');
      onSuccess();
      onClose();
      setLyDo('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi thu hồi'),
  });
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thu hồi chứng nhận" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Xác nhận thu hồi chứng nhận <strong>{cert?.maChungNhan}</strong> của SV{' '}
          <strong>{cert?.hoTenSinhVien}</strong>?
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lý do thu hồi</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm"
            rows={3}
            value={lyDo}
            onChange={e => setLyDo(e.target.value)}
            placeholder="Nhập lý do..."
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button
            variant="danger"
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
            disabled={!lyDo}
            icon={XCircle}
          >
            Thu hồi
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default function ChungNhanPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission(PERMISSIONS.QUAN_LY_DANG_KY);

  const [search, setSearch] = useState('');
  const [showIssue, setShowIssue] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);

  const { data: certs = [], isLoading, refetch } = useQuery({
    queryKey: ['chung-nhan'],
    queryFn: () => chungNhanService.getAll(),
  });

  const filtered = certs.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.maChungNhan || '').toLowerCase().includes(q) ||
      (c.hoTenSinhVien || '').toLowerCase().includes(q) ||
      (c.maSv || '').toLowerCase().includes(q) ||
      (c.tenHoatDong || '').toLowerCase().includes(q)
    );
  });

  const handleExport = async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((c, i) => ({
        'STT': i + 1,
        'Mã chứng nhận': c.maChungNhan,
        'Mã SV': c.maSv,
        'Họ tên SV': c.hoTenSinhVien,
        'Hoạt động': c.tenHoatDong,
        'Ngày cấp': c.ngayCap ? formatDate(c.ngayCap) : '',
        'Trạng thái': c.isActive ? 'Hợp lệ' : 'Thu hồi',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Chứng nhận');
    XLSX.writeFile(wb, `chung_nhan_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const columns = [
    {
      header: 'Mã CN',
      accessor: 'maChungNhan',
      render: v => <span className="font-mono text-xs">{v}</span>,
    },
    {
      header: 'Sinh viên',
      render: (_, r) => (
        <div>
          <p className="font-medium text-sm">{r.hoTenSinhVien}</p>
          <p className="text-xs text-gray-500">{r.maSv}</p>
        </div>
      ),
    },
    {
      header: 'Hoạt động',
      accessor: 'tenHoatDong',
      render: v => <span className="text-sm">{v}</span>,
    },
    {
      header: 'Ngày cấp',
      accessor: 'ngayCap',
      render: v => <span className="text-sm">{formatDate(v)}</span>,
    },
    {
      header: 'Trạng thái',
      accessor: 'isActive',
      render: v => (
        <Badge variant={v ? 'success' : 'danger'} dot>
          {v ? 'Hợp lệ' : 'Đã thu hồi'}
        </Badge>
      ),
    },
    ...(canManage
      ? [
          {
            header: 'Thao tác',
            render: (_, r) =>
              r.isActive ? (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={XCircle}
                  className="text-red-600"
                  title="Thu hồi"
                  onClick={() => setRevokeTarget(r)}
                />
              ) : null,
          },
        ]
      : []),
  ];

  const stats = {
    total: certs.length,
    active: certs.filter(c => c.isActive).length,
    revoked: certs.filter(c => !c.isActive).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý Chứng nhận</h1>
        <p className="text-gray-600 mt-1">Cấp và quản lý chứng nhận tham gia hoạt động</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-xs text-gray-600">Tổng chứng nhận</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs text-gray-600">Đang hợp lệ</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs text-gray-600">Đã thu hồi</p>
            <p className="text-2xl font-bold text-red-600">{stats.revoked}</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <SearchInput
              value={search}
              onSearch={setSearch}
              placeholder="Tìm mã CN, SV, hoạt động..."
              className="w-full sm:w-80"
            />
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="ghost" icon={RefreshCw} onClick={() => refetch()}>
                Làm mới
              </Button>
              <button
                onClick={handleExport}
                disabled={!filtered.length}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Xuất Excel ({filtered.length})
              </button>
              {canManage && (
                <>
                  <Link to="/admin/certificates/templates">
                    <Button size="sm" variant="outline" icon={LayoutTemplate}>
                      Mẫu chứng nhận
                    </Button>
                  </Link>
                  <Button size="sm" icon={UserCheck} onClick={() => setShowIssue(true)}>
                    Cấp đơn lẻ
                  </Button>
                  <Button size="sm" icon={Users} variant="secondary" onClick={() => setShowBulk(true)}>
                    Cấp hàng loạt
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        <Table columns={columns} data={filtered} isLoading={isLoading} />
      </Card>

      <IssueSingleModal
        isOpen={showIssue}
        onClose={() => setShowIssue(false)}
        onSuccess={() => queryClient.invalidateQueries(['chung-nhan'])}
      />
      <IssueBulkModal
        isOpen={showBulk}
        onClose={() => setShowBulk(false)}
        onSuccess={() => queryClient.invalidateQueries(['chung-nhan'])}
      />
      {revokeTarget && (
        <RevokeModal
          cert={revokeTarget}
          isOpen={!!revokeTarget}
          onClose={() => setRevokeTarget(null)}
          onSuccess={() => queryClient.invalidateQueries(['chung-nhan'])}
        />
      )}
    </div>
  );
}
