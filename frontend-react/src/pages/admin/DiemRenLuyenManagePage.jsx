import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  Plus, Edit, CheckCircle2, Lock, Search, X, Award, GraduationCap,
} from 'lucide-react';
import api from '../../services/api';
import studentService from '../../services/studentService';
import useAuthStore from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/constants';
import Table, { Pagination } from '../../components/common/Table';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

// ── API cục bộ (chưa có service module riêng cho phân hệ này) ─────────────────
const drlApi = {
  getHocKyList: () => api.get('/api/hocky').then(r => r.data),
  getMauDanhGia: () => api.get('/api/drl-mau-danh-gia', { params: { activeOnly: true } }).then(r => r.data.data),
  getByHocKy: (maHocKy, trangThai, page, size) =>
    api.get(`/api/diem-ren-luyen/hoc-ky/${encodeURIComponent(maHocKy)}`, { params: { trangThai: trangThai || undefined, page, size } })
      .then(r => r.data.data),
  upsert: (payload) => api.post('/api/diem-ren-luyen', payload).then(r => r.data.data),
  duyet: (id) => api.patch(`/api/diem-ren-luyen/${id}/duyet`).then(r => r.data.data),
  khoa: (id) => api.patch(`/api/diem-ren-luyen/${id}/khoa`).then(r => r.data.data),
};

const XEP_LOAI_LABEL = {
  XUAT_SAC: 'Xuất sắc', TOT: 'Tốt', KHA: 'Khá',
  TRUNG_BINH: 'Trung bình', YEU: 'Yếu', KEM: 'Kém',
};
const XEP_LOAI_VARIANT = {
  XUAT_SAC: 'success', TOT: 'success', KHA: 'primary',
  TRUNG_BINH: 'warning', YEU: 'danger', KEM: 'danger',
};
const TRANG_THAI_LABEL = { NHAP: 'Nháp', DA_DUYET: 'Đã duyệt', KHOA: 'Đã khóa' };
const TRANG_THAI_VARIANT = { NHAP: 'gray', DA_DUYET: 'success', KHOA: 'danger' };

function tinhXepLoai(tongDiem) {
  if (tongDiem >= 90) return 'XUAT_SAC';
  if (tongDiem >= 80) return 'TOT';
  if (tongDiem >= 65) return 'KHA';
  if (tongDiem >= 50) return 'TRUNG_BINH';
  if (tongDiem >= 35) return 'YEU';
  return 'KEM';
}

function parseChiTiet(chiTiet) {
  if (!chiTiet) return null;
  try {
    const arr = JSON.parse(chiTiet);
    return Array.isArray(arr) && arr.length > 0 ? arr : null;
  } catch {
    return null;
  }
}

const DiemRenLuyenManagePage = () => {
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission(PERMISSIONS.QUAN_LY_DIEM_REN_LUYEN);
  const queryClient = useQueryClient();

  const [maHocKy, setMaHocKy] = useState('');
  const [trangThaiFilter, setTrangThaiFilter] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const { data: hocKyList = [] } = useQuery({
    queryKey: ['drl-hoc-ky-list'],
    queryFn: drlApi.getHocKyList,
  });

  const { data: mauList = [] } = useQuery({
    queryKey: ['drl-mau-active'],
    queryFn: drlApi.getMauDanhGia,
  });
  const mau = mauList[0] || null;

  // Chọn học kỳ hiện hành làm mặc định khi danh sách vừa tải xong
  useEffect(() => {
    if (!maHocKy && hocKyList.length > 0) {
      const current = hocKyList.find(hk => hk.isCurrent) || hocKyList[0];
      setMaHocKy(current.maHocKy);
    }
  }, [hocKyList, maHocKy]);

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['drl-list', maHocKy, trangThaiFilter, page, size],
    queryFn: () => drlApi.getByHocKy(maHocKy, trangThaiFilter, page, size),
    enabled: !!maHocKy,
    keepPreviousData: true,
  });

  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null); // null = tạo mới
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'duyet'|'khoa', record }

  const upsertMutation = useMutation({
    mutationFn: drlApi.upsert,
    onSuccess: () => {
      toast.success('Đã lưu điểm rèn luyện');
      queryClient.invalidateQueries(['drl-list']);
      setShowModal(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lưu điểm thất bại'),
  });

  const duyetMutation = useMutation({
    mutationFn: (id) => drlApi.duyet(id),
    onSuccess: () => {
      toast.success('Đã phê duyệt');
      queryClient.invalidateQueries(['drl-list']);
      setConfirmAction(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Phê duyệt thất bại'),
  });

  const khoaMutation = useMutation({
    mutationFn: (id) => drlApi.khoa(id),
    onSuccess: () => {
      toast.success('Đã khóa điểm');
      queryClient.invalidateQueries(['drl-list']);
      setConfirmAction(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Khóa điểm thất bại'),
  });

  const columns = [
    { header: 'MSSV', accessor: 'maSv', width: '120px', render: v => <span className="font-mono text-xs">{v}</span> },
    { header: 'Họ tên', accessor: 'tenSv', render: v => <span className="font-medium text-gray-900">{v || '—'}</span> },
    {
      header: 'Tổng điểm', accessor: 'tongDiem', width: '110px',
      render: v => <span className="font-bold text-indigo-700">{v}đ</span>,
    },
    {
      header: 'Xếp loại', accessor: 'xepLoai', width: '120px',
      render: v => v ? <Badge variant={XEP_LOAI_VARIANT[v] || 'gray'}>{XEP_LOAI_LABEL[v] || v}</Badge> : '—',
    },
    {
      header: 'Trạng thái', accessor: 'trangThai', width: '120px',
      render: v => <Badge variant={TRANG_THAI_VARIANT[v] || 'gray'}>{TRANG_THAI_LABEL[v] || v}</Badge>,
    },
    {
      header: 'Thao tác', accessor: 'actions', width: '190px',
      render: (_, row) => (
        <div className="flex items-center gap-1.5 justify-end flex-wrap">
          <Button size="sm" variant="ghost" icon={Edit}
            onClick={() => { setEditingRecord(row); setShowModal(true); }}
            title={row.trangThai === 'KHOA' ? 'Xem (đã khóa, không sửa được)' : 'Sửa điểm'} />
          {canManage && row.trangThai === 'NHAP' && (
            <Button size="sm" variant="ghost" icon={CheckCircle2}
              className="text-green-600 hover:text-green-700"
              onClick={() => setConfirmAction({ type: 'duyet', record: row })}
              title="Phê duyệt" />
          )}
          {canManage && row.trangThai !== 'KHOA' && (
            <Button size="sm" variant="ghost" icon={Lock}
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setConfirmAction({ type: 'khoa', record: row })}
              title="Khóa điểm" />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600" /> Điểm rèn luyện
          </h1>
          <p className="text-gray-600 mt-1">Nhập, phê duyệt và quản lý điểm rèn luyện sinh viên theo học kỳ</p>
        </div>
        {canManage && (
          <Button icon={Plus} disabled={!maHocKy || !mau}
            onClick={() => { setEditingRecord(null); setShowModal(true); }}>
            Nhập điểm
          </Button>
        )}
      </div>

      {!mau && (
        <Card className="border border-amber-200 bg-amber-50 text-amber-700 text-sm">
          Chưa có mẫu đánh giá nào được kích hoạt (bảng <code>drl_mau_danh_gia</code>). Cần kích hoạt ít nhất 1 mẫu để nhập điểm.
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-56">
            <Select
              label="Học kỳ"
              value={maHocKy}
              onChange={(e) => { setMaHocKy(e.target.value); setPage(0); }}
              options={hocKyList.map(hk => ({ value: hk.maHocKy, label: `${hk.tenHocKy}${hk.isCurrent ? ' (hiện tại)' : ''}` }))}
              placeholder="Chọn học kỳ"
            />
          </div>
          <div className="w-48">
            <Select
              label="Trạng thái"
              value={trangThaiFilter}
              onChange={(e) => { setTrangThaiFilter(e.target.value); setPage(0); }}
              options={[
                { value: '', label: 'Tất cả' },
                { value: 'NHAP', label: 'Nháp' },
                { value: 'DA_DUYET', label: 'Đã duyệt' },
                { value: 'KHOA', label: 'Đã khóa' },
              ]}
              placeholder={null}
            />
          </div>
        </div>
      </Card>

      {!maHocKy ? (
        <Card className="text-center text-gray-500 py-10">
          <GraduationCap className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          Chọn học kỳ để xem danh sách điểm rèn luyện
        </Card>
      ) : (
        <>
          <Table columns={columns} data={pageData?.content || []} isLoading={isLoading}
            emptyMessage="Chưa có sinh viên nào được nhập điểm trong học kỳ này" />
          {pageData && pageData.totalElements > 0 && (
            <Pagination
              currentPage={page} totalPages={pageData.totalPages || 1}
              pageSize={size} totalElements={pageData.totalElements || 0}
              onPageChange={setPage} onPageSizeChange={(s) => { setSize(s); setPage(0); }}
            />
          )}
        </>
      )}

      {showModal && (
        <ScoreModal
          record={editingRecord}
          maHocKy={maHocKy}
          hocKyLabel={hocKyList.find(hk => hk.maHocKy === maHocKy)?.tenHocKy}
          mau={mau}
          canManage={canManage}
          isSaving={upsertMutation.isPending}
          onSave={(payload) => upsertMutation.mutate(payload)}
          onClose={() => setShowModal(false)}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction?.type === 'duyet') duyetMutation.mutate(confirmAction.record.id);
          else if (confirmAction?.type === 'khoa') khoaMutation.mutate(confirmAction.record.id);
        }}
        title={confirmAction?.type === 'duyet' ? 'Phê duyệt điểm rèn luyện' : 'Khóa điểm rèn luyện'}
        description={
          confirmAction?.type === 'duyet'
            ? `Phê duyệt điểm rèn luyện của "${confirmAction?.record?.tenSv}" (${confirmAction?.record?.maSv})?`
            : `Khóa điểm rèn luyện của "${confirmAction?.record?.tenSv}" (${confirmAction?.record?.maSv})? Sau khi khóa sẽ không thể chỉnh sửa nữa.`
        }
        confirmLabel={confirmAction?.type === 'duyet' ? 'Phê duyệt' : 'Khóa'}
        isLoading={duyetMutation.isPending || khoaMutation.isPending}
      />
    </div>
  );
};

// ── Modal nhập/sửa điểm ──────────────────────────────────────────────────────
function ScoreModal({ record, maHocKy, hocKyLabel, mau, canManage, isSaving, onSave, onClose }) {
  const isEdit = !!record;
  const isLocked = record?.trangThai === 'KHOA';
  const readOnly = isLocked || !canManage;

  const [student, setStudent] = useState(isEdit ? { maSv: record.maSv, hoTen: record.tenSv } : null);
  const [studentQuery, setStudentQuery] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [scores, setScores] = useState(record?.scores || {});
  const [ghiChu, setGhiChu] = useState(record?.ghiChu || '');
  const [lyDoThayDoi, setLyDoThayDoi] = useState('');

  useEffect(() => {
    if (!studentQuery.trim()) { setStudentResults([]); return; }
    setSearching(true);
    const timer = setTimeout(() => {
      studentService.getAll({ search: studentQuery.trim(), size: 8 })
        .then(res => setStudentResults(res?.content || []))
        .catch(() => setStudentResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [studentQuery]);

  const tongDiem = useMemo(() => {
    const sum = Object.values(scores).reduce((acc, v) => acc + (Number(v) || 0), 0);
    return Math.min(sum, 100);
  }, [scores]);
  const xepLoai = tinhXepLoai(tongDiem);

  const setScore = (maTieuChi, value) => {
    setScores(prev => ({ ...prev, [maTieuChi]: value === '' ? undefined : Number(value) }));
  };

  const handleSubmit = () => {
    if (!student) { toast.warning('Vui lòng chọn sinh viên'); return; }
    onSave({
      maSv: student.maSv,
      maHocKy,
      mauId: mau?.id,
      scores,
      ghiChu,
      lyDoThayDoi: lyDoThayDoi || undefined,
    });
  };

  return (
    <Modal
      isOpen onClose={onClose}
      title={isEdit ? `Điểm rèn luyện — ${record.maSv}` : 'Nhập điểm rèn luyện'}
      subtitle={hocKyLabel}
      icon={Award}
      size="lg"
      footer={!readOnly && (
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Hủy</Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSaving} disabled={!student}>
            Lưu điểm
          </Button>
        </>
      )}
    >
      <div className="space-y-5">
        {isLocked && (
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600">
            <Lock className="w-4 h-4" /> Điểm đã bị khóa — chỉ xem, không thể chỉnh sửa.
          </div>
        )}

        {/* Chọn sinh viên */}
        {isEdit ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-500">Sinh viên:</span>
            <span className="font-semibold text-gray-900">{record.tenSv}</span>
            <span className="text-gray-400 font-mono text-xs">({record.maSv})</span>
          </div>
        ) : student ? (
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
            <span className="font-semibold text-indigo-900 text-sm">{student.hoTen}</span>
            <span className="text-indigo-500 font-mono text-xs">({student.maSv})</span>
            <button onClick={() => { setStudent(null); setStudentQuery(''); }} className="ml-auto text-indigo-400 hover:text-indigo-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                autoFocus
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                placeholder="Tìm sinh viên theo MSSV hoặc tên..."
                className="form-input h-9 pl-9 text-sm w-full"
              />
            </div>
            {studentQuery.trim() && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {searching ? (
                  <div className="px-3 py-2.5 text-sm text-gray-400">Đang tìm...</div>
                ) : studentResults.length === 0 ? (
                  <div className="px-3 py-2.5 text-sm text-gray-400">Không tìm thấy sinh viên</div>
                ) : studentResults.map(sv => (
                  <button
                    key={sv.maSv}
                    onClick={() => { setStudent(sv); setStudentQuery(''); setStudentResults([]); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex items-center justify-between gap-2"
                  >
                    <span className="font-medium text-gray-800">{sv.hoTen}</span>
                    <span className="text-xs text-gray-400 font-mono">{sv.maSv}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tổng điểm live */}
        <div className="flex items-center gap-4 bg-gray-50 rounded-xl px-4 py-3">
          <div>
            <p className="text-xs text-gray-500">Tổng điểm</p>
            <p className="text-2xl font-bold text-indigo-700">{tongDiem}đ</p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div>
            <p className="text-xs text-gray-500">Xếp loại</p>
            <Badge variant={XEP_LOAI_VARIANT[xepLoai]}>{XEP_LOAI_LABEL[xepLoai]}</Badge>
          </div>
        </div>

        {/* Danh mục & tiêu chí */}
        {!mau ? (
          <p className="text-sm text-amber-600">Chưa có mẫu đánh giá được kích hoạt.</p>
        ) : (
          <div className="space-y-4">
            {(mau.danhMucList || []).sort((a, b) => (a.thuTu ?? 0) - (b.thuTu ?? 0)).map(dm => (
              <div key={dm.id} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                  <p className="font-semibold text-sm text-gray-800">{dm.maDanhMuc}. {dm.tenDanhMuc}</p>
                  <span className="text-xs text-gray-400">tối đa {dm.diemToiDa}đ</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {(dm.tieuChiList || []).sort((a, b) => (a.thuTu ?? 0) - (b.thuTu ?? 0)).map(tc => {
                    const options = parseChiTiet(tc.chiTiet);
                    return (
                      <div key={tc.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-400">{tc.maTieuChi}</p>
                          <p className="text-sm text-gray-700">{tc.noiDung}</p>
                        </div>
                        <div className="flex-shrink-0 w-32">
                          {options ? (
                            <select
                              disabled={readOnly}
                              value={scores[tc.maTieuChi] ?? ''}
                              onChange={(e) => setScore(tc.maTieuChi, e.target.value)}
                              className="form-input h-8 text-sm w-full disabled:bg-gray-50"
                            >
                              <option value="">— chọn —</option>
                              {options.map(opt => (
                                <option key={opt.id} value={opt.diem}>{opt.noi_dung} ({opt.diem}đ)</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="number" min={0} max={tc.diemToiDa}
                              disabled={readOnly}
                              value={scores[tc.maTieuChi] ?? ''}
                              onChange={(e) => setScore(tc.maTieuChi, e.target.value)}
                              placeholder={`0-${tc.diemToiDa}`}
                              className="form-input h-8 text-sm w-full text-right disabled:bg-gray-50"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ghi chú */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Ghi chú</label>
          <textarea
            disabled={readOnly}
            value={ghiChu}
            onChange={(e) => setGhiChu(e.target.value)}
            rows={2}
            className="form-input text-sm w-full resize-y disabled:bg-gray-50"
          />
        </div>

        {isEdit && !readOnly && (
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Lý do thay đổi (tùy chọn, lưu vào lịch sử)</label>
            <input
              value={lyDoThayDoi}
              onChange={(e) => setLyDoThayDoi(e.target.value)}
              placeholder="VD: Bổ sung minh chứng hoạt động tình nguyện"
              className="form-input h-9 text-sm w-full"
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

export default DiemRenLuyenManagePage;
