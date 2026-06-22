import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import PermissionAssignModal from '../../components/admin/PermissionAssignModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import {
  Users, UserPlus, Clock, Upload, Search, X, Trash2, Key,
  ShieldCheck, Download, RefreshCw, Check, ChevronLeft, ChevronRight,
  Edit2, EyeOff, Eye, AlertCircle, CheckCircle2,
  FileSpreadsheet, UserCheck, UserX, MoreHorizontal,
  Building2, BookOpen, Crown, Trophy
} from 'lucide-react';
import accountService from '../../services/accountService';
import api from '../../services/api';
import {
  ACCOUNT_API,
  ROLE_LABELS,
  ROLE_OPTIONS,
  ROLES_REQUIRE_KHOA,
  ROLES_REQUIRE_CHI_DOAN,
  ROLES_REQUIRE_CLB,
} from '../../constants/accountConstants';

// ─── constants ─────────────────────────────────────────────────────────────────

const ROLE_COLORS = {
  ADMIN:             'bg-red-100 text-red-700 border border-red-200',
  QUAN_LY_KHOA:      'bg-purple-100 text-purple-700 border border-purple-200',
  PHO_QUAN_LY_KHOA:  'bg-indigo-100 text-indigo-700 border border-indigo-200',
  QUAN_LY_CHI_DOAN:  'bg-blue-100 text-blue-700 border border-blue-200',
  PHO_CHI_DOAN:      'bg-cyan-100 text-cyan-700 border border-cyan-200',
  DOAN_VIEN:         'bg-green-100 text-green-700 border border-green-200',
  DIEM_DANH_VIEN:    'bg-orange-100 text-orange-700 border border-orange-200',
  QUAN_LY_CLB:       'bg-violet-100 text-violet-700 border border-violet-200',
};

const TABS = [
  { id: 'list',    label: 'Tất cả',        icon: Users },
  { id: 'pending', label: 'Chờ duyệt',     icon: Clock },
  { id: 'create',  label: 'Tạo tài khoản', icon: UserPlus },
  { id: 'import',  label: 'Nhập Excel',    icon: FileSpreadsheet },
  { id: 'khoa',    label: 'Đoàn Khoa',     icon: Building2 },
];

const EXCEL_COLUMNS = ['Họ và tên', 'Tên đăng nhập', 'Email', 'Mật khẩu', 'Vai trò', 'Mã khoa', 'Mã lớp', 'Mã SV'];
const PAGE_SIZE = 20;

// ─── helpers ────────────────────────────────────────────────────────────────────

const removeVietnameseTones = (str) =>
  (str || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

const generateUsername = (hoTen = '') => {
  const words = removeVietnameseTones(hoTen).split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  const last = words[words.length - 1];
  const initials = words.slice(0, -1).map(w => w[0]).join('');
  return last + initials;
};

const genKhoaUsername = (maKhoa = '', tenKhoa = '') => {
  const initials = removeVietnameseTones(tenKhoa || maKhoa)
    .toLowerCase()
    .replace(/^khoa\s+/i, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0])
    .join('');
  return 'doankhoa' + (initials || maKhoa.toLowerCase());
};

// ─── sub-components ─────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function StatusBadge({ trangThai, isActive }) {
  if (trangThai === 'CHO_PHE_DUYET') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Chờ duyệt</span>;
  if (trangThai === 'TU_CHOI') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Từ chối</span>;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}><span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />{isActive ? 'Hoạt động' : 'Tạm khóa'}</span>;
}

function ActionMenu({ account, onEdit, onDelete, onResetPw, onToggleActive, onPermissions }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, right: 0 });
  const btnRef = useRef();
  const menuRef = useRef();

  React.useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          btnRef.current  && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const toggle = () => {
    if (!open) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setOpen(v => !v);
  };

  return (
    <>
      <button ref={btnRef} onClick={toggle}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
        <MoreHorizontal size={16} />
      </button>
      {open && createPortal(
        <div ref={menuRef} style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999 }}
          className="w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1">
          <button onClick={() => { onEdit(account); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Edit2 size={14} /> Chỉnh sửa</button>
          <button onClick={() => { onPermissions(account); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><ShieldCheck size={14} /> Phân quyền</button>
          <button onClick={() => { onResetPw(account); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Key size={14} /> Reset mật khẩu</button>
          <button onClick={() => { onToggleActive(account); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
            {account.isActive ? <><EyeOff size={14} /> Tạm khóa</> : <><Eye size={14} /> Kích hoạt</>}
          </button>
          <hr className="my-1 border-gray-100" />
          <button onClick={() => { onDelete(account); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} /> Xóa tài khoản</button>
        </div>,
        document.body
      )}
    </>
  );
}

// ─── SearchableSelect ────────────────────────────────────────────────────────────
function SearchableSelect({ value, onChange, options, placeholder = 'Chọn...', required }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const wrapRef = React.useRef();
  const inputRef = React.useRef();

  React.useEffect(() => {
    if (!open) return;
    const close = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  React.useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  const filtered = options.filter(o =>
    removeVietnameseTones(o.label).includes(removeVietnameseTones(q)) ||
    o.value.toLowerCase().includes(q.toLowerCase())
  );
  const selected = options.find(o => o.value === value);

  return (
    <div ref={wrapRef} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)} required={required}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left ${open ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'}`}>
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>{selected ? selected.label : placeholder}</span>
        <ChevronRight size={13} className={`text-gray-400 transition-transform shrink-0 ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm kiếm..."
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="max-h-48 overflow-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400 text-center">Không tìm thấy</div>
            ) : filtered.map(o => (
              <button key={o.value} type="button"
                onClick={() => { onChange(o.value); setOpen(false); setQ(''); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-blue-50 transition-colors ${o.value === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}>
                {o.value === value && <Check size={13} className="shrink-0 text-blue-600" />}
                <span className={o.value === value ? '' : 'ml-[21px]'}>{o.label}</span>
                {o.sub && <span className="ml-auto text-xs text-gray-400 shrink-0">{o.sub}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── main page ──────────────────────────────────────────────────────────────────

export default function AccountManagementPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('list');

  // list state
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(0);

  // modal/action state
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [permTarget, setPermTarget] = useState(null);
  const [toast, setToast] = useState(null);

  // create form
  const [createForm, setCreateForm] = useState({ hoTen: '', username: '', email: '', password: '', vaiTro: 'DOAN_VIEN', gioiTinh: 'NAM', maKhoa: '', maLop: '', maSv: '', maClb: '' });
  const [autoUsername, setAutoUsername] = useState(true);

  // import state
  const [importRows, setImportRows] = useState([]);
  const [importProgress, setImportProgress] = useState(null);
  const dropRef = useRef();
  const fileInputRef = useRef();

  // khoa quick-create state
  const [khoaUsernameMap, setKhoaUsernameMap] = useState({});
  const [khoaSelected, setKhoaSelected]       = useState(new Set());
  const [khoaCreating, setKhoaCreating]       = useState(false);
  const [khoaResults, setKhoaResults]         = useState(null);

  // ── queries ──────────────────────────────────────────────────────────────────
  const { data: allAccounts = [], isLoading: loadingAll, refetch } = useQuery({
    queryKey: ['accounts-all'],
    queryFn: accountService.getAllAccounts,
    staleTime: 60_000,
  });

  const { data: pendingList = [], isLoading: loadingPending } = useQuery({
    queryKey: ['accounts-pending'],
    queryFn: () => api.get(ACCOUNT_API.PENDING_APPROVAL).then(r => r.data?.data || []),
    staleTime: 30_000,
    enabled: tab === 'pending',
  });

  const { data: khoaList = [] } = useQuery({
    queryKey: ['khoa-list'],
    queryFn: () => api.get('/api/khoa/active').then(r => Array.isArray(r.data) ? r.data : (r.data?.data || [])),
    staleTime: 300_000,
  });

  const { data: clbList = [] } = useQuery({
    queryKey: ['clb-list'],
    queryFn: () => api.get('/api/clb').then(r => r.data?.data || []),
    staleTime: 120_000,
    enabled: tab === 'create' || tab === 'khoa',
  });

  const { data: lopList = [] } = useQuery({
    queryKey: ['lop-list', createForm.maKhoa],
    queryFn: () => api.get('/api/lop', { params: { maKhoa: createForm.maKhoa } }).then(r => r.data?.data || []).catch(() => []),
    enabled: !!createForm.maKhoa && ROLES_REQUIRE_CHI_DOAN.includes(createForm.vaiTro),
    staleTime: 60_000,
  });

  // khoa quick-create rows
  const khoaRows = useMemo(() =>
    khoaList.map(k => ({
      ...k,
      username: khoaUsernameMap[k.maKhoa] ?? genKhoaUsername(k.maKhoa, k.tenKhoa),
      existing: allAccounts.find(a => a.maKhoa === k.maKhoa && a.vaiTro === 'QUAN_LY_KHOA') || null,
    })),
  [khoaList, khoaUsernameMap, allAccounts]);

  // ── mutations ────────────────────────────────────────────────────────────────
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['accounts-all'] });
    qc.invalidateQueries({ queryKey: ['accounts-pending'] });
  };

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const approveMut = useMutation({
    mutationFn: (id) => api.post(ACCOUNT_API.APPROVE(id)),
    onSuccess: () => { invalidate(); showToast('success', 'Đã phê duyệt tài khoản'); },
    onError: (e) => showToast('error', e.response?.data?.message || 'Lỗi phê duyệt'),
  });

  const rejectMut = useMutation({
    mutationFn: (id) => api.post(ACCOUNT_API.REJECT(id)),
    onSuccess: () => { invalidate(); showToast('success', 'Đã từ chối tài khoản'); },
    onError: (e) => showToast('error', e.response?.data?.message || 'Lỗi từ chối'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => accountService.deleteAccount(id),
    onSuccess: () => { setDeleteTarget(null); invalidate(); showToast('success', 'Đã xóa tài khoản'); },
    onError: (e) => showToast('error', typeof e === 'string' ? e : 'Lỗi xóa tài khoản'),
  });

  const resetPwMut = useMutation({
    mutationFn: (id) => accountService.resetPassword(id),
    onSuccess: (msg) => { setResetTarget(null); showToast('success', msg || 'Đã reset mật khẩu về KGU@123456'); },
    onError: (e) => showToast('error', typeof e === 'string' ? e : 'Lỗi reset mật khẩu'),
  });

  const toggleActiveMut = useMutation({
    mutationFn: ({ id, active }) => api.patch(ACCOUNT_API.SET_ACTIVE(id), { isActive: active }),
    onSuccess: (_, { active }) => { invalidate(); showToast('success', active ? 'Đã kích hoạt tài khoản' : 'Đã tạm khóa tài khoản'); },
    onError: (e) => showToast('error', e.response?.data?.message || 'Lỗi cập nhật trạng thái'),
  });

  const createMut = useMutation({
    mutationFn: (data) => accountService.createAccountManually(data),
    onSuccess: () => {
      invalidate();
      showToast('success', 'Tạo tài khoản thành công');
      setCreateForm({ hoTen: '', username: '', email: '', password: '', vaiTro: 'DOAN_VIEN', gioiTinh: 'NAM', maKhoa: '', maLop: '', maSv: '', maClb: '' });
      setAutoUsername(true);
    },
    onError: (e) => showToast('error', typeof e === 'string' ? e : 'Lỗi tạo tài khoản'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => accountService.updateAccount(id, data),
    onSuccess: () => { setEditModal(null); invalidate(); showToast('success', 'Đã cập nhật tài khoản'); },
    onError: (e) => showToast('error', typeof e === 'string' ? e : 'Lỗi cập nhật'),
  });

  // ── form helpers ─────────────────────────────────────────────────────────────
  const handleCreateField = (field, value) => {
    setCreateForm(f => {
      const next = { ...f, [field]: value };
      if (field === 'hoTen' && autoUsername) next.username = generateUsername(value);
      if (field === 'vaiTro') { next.maKhoa = ''; next.maLop = ''; next.maClb = ''; }
      return next;
    });
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!createForm.hoTen.trim() || !createForm.username.trim() || !createForm.password.trim()) {
      showToast('error', 'Vui lòng điền đầy đủ thông tin bắt buộc (*)');
      return;
    }
    createMut.mutate({ ...createForm, maSv: createForm.maSv || null, maKhoa: createForm.maKhoa || null, maLop: createForm.maLop || null, maClb: createForm.maClb || null });
  };

  const openEdit = (acc) => {
    setEditModal(acc);
    setEditForm({ hoTen: acc.hoTen || '', vaiTro: acc.vaiTro || 'DOAN_VIEN', maKhoa: acc.maKhoa || '' });
  };

  // ── excel import ─────────────────────────────────────────────────────────────
  const parseFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const data = rows.slice(1).filter(r => r.some(c => c)).map(r => ({
          hoTen:    String(r[0] || '').trim(),
          username: String(r[1] || '').trim(),
          email:    String(r[2] || '').trim(),
          password: String(r[3] || 'KGU@123456').trim(),
          vaiTro:   String(r[4] || 'DOAN_VIEN').trim().toUpperCase(),
          maKhoa:   String(r[5] || '').trim() || null,
          maLop:    String(r[6] || '').trim() || null,
          maSv:     String(r[7] || '').trim() || null,
        }));
        resolve(data);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

  const handleFileSelect = async (file) => {
    if (!file) return;
    try {
      const rows = await parseFile(file);
      setImportRows(rows);
      setImportProgress(null);
    } catch {
      showToast('error', 'Không thể đọc file. Vui lòng dùng file .xlsx hoặc .xls');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dropRef.current?.classList.remove('border-blue-400', 'bg-blue-50');
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const runKhoaCreate = async () => {
    const toCreate = khoaRows.filter(r => khoaSelected.has(r.maKhoa) && !r.existing);
    if (!toCreate.length) return;
    setKhoaCreating(true);
    setKhoaResults(null);
    const settled = await Promise.allSettled(
      toCreate.map(r => accountService.createAccountManually({
        hoTen:    `Đoàn khoa ${r.tenKhoa}`,
        username:  r.username,
        email:    `doankhoa.${r.maKhoa.toLowerCase()}@kgu.edu.vn`,
        password: 'KGU@123456',
        vaiTro:   'QUAN_LY_KHOA',
        gioiTinh: 'NAM',
        maKhoa:    r.maKhoa,
        maLop:    null,
        maSv:     null,
      }))
    );
    const ok   = settled.filter(s => s.status === 'fulfilled').length;
    const fail = settled.filter(s => s.status === 'rejected').length;
    const errors = settled
      .map((s, i) => s.status === 'rejected' ? { name: toCreate[i].tenKhoa, msg: s.reason?.response?.data?.message || s.reason?.message || 'Lỗi' } : null)
      .filter(Boolean);
    setKhoaResults({ ok, fail, errors });
    setKhoaCreating(false);
    setKhoaSelected(new Set());
    if (ok > 0) invalidate();
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      EXCEL_COLUMNS,
      ['Nguyễn Văn An', 'nguyenvana', 'nguyenvana@vnkgu.edu.vn', 'KGU@123456', 'DOAN_VIEN', 'KHCN', 'KHCN22A', 'SV001'],
      ['Trần Thị Bảo', 'tranthib', 'tranthib@vnkgu.edu.vn', 'KGU@123456', 'PHO_CHI_DOAN', 'KHCN', 'KHCN22B', ''],
    ]);
    ws['!cols'] = EXCEL_COLUMNS.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mẫu nhập tài khoản');
    XLSX.writeFile(wb, 'mau_nhap_tai_khoan.xlsx');
  };

  const runImport = async () => {
    if (!importRows.length) return;
    const errors = [];
    let done = 0;
    setImportProgress({ done: 0, total: importRows.length, errors: [] });
    for (const row of importRows) {
      try { await accountService.createAccountManually(row); }
      catch (e) { errors.push({ name: `${row.hoTen} (${row.username})`, msg: typeof e === 'string' ? e : 'Lỗi không xác định' }); }
      done++;
      setImportProgress({ done, total: importRows.length, errors: [...errors] });
    }
    invalidate();
    if (errors.length === 0) showToast('success', `Đã tạo thành công ${done} tài khoản`);
    else showToast('error', `Hoàn tất: ${done - errors.length}/${done} thành công`);
  };

  // ── list filter ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return allAccounts.filter(acc => {
      const q = removeVietnameseTones(search);
      const matchSearch = !search
        || removeVietnameseTones(acc.hoTen || '').includes(q)
        || (acc.username || '').toLowerCase().includes(q)
        || (acc.email || '').toLowerCase().includes(q);
      const matchRole = !filterRole || acc.vaiTro === filterRole;
      const matchStatus = !filterStatus
        || (filterStatus === 'active' && acc.isActive && acc.trangThai !== 'CHO_PHE_DUYET')
        || (filterStatus === 'inactive' && !acc.isActive)
        || acc.trangThai === filterStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }, [allAccounts, search, filterRole, filterStatus]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const stats = useMemo(() => ({
    total:   allAccounts.length,
    active:  allAccounts.filter(a => a.isActive && a.trangThai !== 'CHO_PHE_DUYET').length,
    pending: allAccounts.filter(a => a.trangThai === 'CHO_PHE_DUYET').length,
    admins:  allAccounts.filter(a => ['ADMIN','QUAN_LY_KHOA','PHO_QUAN_LY_KHOA'].includes(a.vaiTro)).length,
  }), [allAccounts]);

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.text}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tài khoản</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý toàn bộ tài khoản người dùng trong hệ thống</p>
        </div>

        {/* stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Tổng tài khoản',  value: stats.total,   icon: Users,       bg: 'bg-blue-50',    text: 'text-blue-600' },
            { label: 'Đang hoạt động',  value: stats.active,  icon: UserCheck,   bg: 'bg-emerald-50', text: 'text-emerald-600' },
            { label: 'Chờ phê duyệt',   value: stats.pending, icon: Clock,       bg: 'bg-amber-50',   text: 'text-amber-600' },
            { label: 'Cán bộ quản lý',  value: stats.admins,  icon: Crown,       bg: 'bg-purple-50',  text: 'text-purple-600' },
          ].map(({ label, value, icon: Icon, bg, text }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                <Icon size={18} className={text} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 leading-none mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* tabs card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* tab nav */}
          <div className="border-b border-gray-100 px-4 flex gap-1 pt-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { setTab(id); setPage(0); }}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${tab === id ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/40' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                <Icon size={15} />
                {label}
                {id === 'pending' && stats.pending > 0 && (
                  <span className="ml-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {stats.pending > 9 ? '9+' : stats.pending}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ── ALL ACCOUNTS TAB ─────────────────────────────────────────────── */}
            {tab === 'list' && (
              <div>
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Tìm theo tên, username, email..."
                      className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {search && <button onClick={() => { setSearch(''); setPage(0); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13} /></button>}
                  </div>
                  <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(0); }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Tất cả vai trò</option>
                    {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Tạm khóa</option>
                    <option value="CHO_PHE_DUYET">Chờ phê duyệt</option>
                  </select>
                  <button onClick={() => refetch()} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <RefreshCw size={14} /> Làm mới
                  </button>
                </div>

                {loadingAll ? (
                  <div className="py-16 text-center text-gray-400">Đang tải dữ liệu...</div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
                            <th className="px-4 py-3 text-left font-medium">Người dùng</th>
                            <th className="px-4 py-3 text-left font-medium">Tên đăng nhập</th>
                            <th className="px-4 py-3 text-left font-medium">Vai trò</th>
                            <th className="px-4 py-3 text-left font-medium">Khoa / Lớp</th>
                            <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                            <th className="px-4 py-3 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {pageData.length === 0 ? (
                            <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">Không có tài khoản nào phù hợp</td></tr>
                          ) : pageData.map(acc => (
                            <tr key={acc.id} className="hover:bg-gray-50/50 transition-colors group">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {((acc.hoTen || acc.username || '?')[0]).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 leading-snug">{acc.hoTen || '—'}</p>
                                    {acc.email && <p className="text-xs text-gray-400">{acc.email}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-mono text-xs text-gray-600">{acc.username}</td>
                              <td className="px-4 py-3"><RoleBadge role={acc.vaiTro} /></td>
                              <td className="px-4 py-3 text-xs text-gray-500">
                                {acc.tenKhoa || acc.maKhoa || ''}
                                {(acc.tenLop || acc.maLop) ? <span className="text-gray-400"> / {acc.tenLop || acc.maLop}</span> : null}
                              </td>
                              <td className="px-4 py-3"><StatusBadge trangThai={acc.trangThai} isActive={acc.isActive} /></td>
                              <td className="px-4 py-3">
                                <ActionMenu
                                  account={acc}
                                  onEdit={openEdit}
                                  onDelete={setDeleteTarget}
                                  onResetPw={setResetTarget}
                                  onToggleActive={(a) => toggleActiveMut.mutate({ id: a.id, active: !a.isActive })}
                                  onPermissions={setPermTarget}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                        <span>Hiển thị {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} / {filtered.length}</span>
                        <div className="flex items-center gap-1">
                          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft size={14} /></button>
                          {(() => {
                            const windowSize = Math.min(totalPages, 7);
                            const start = Math.max(0, Math.min(page - 3, totalPages - windowSize));
                            return Array.from({ length: windowSize }, (_, i) => {
                              const p = start + i;
                              return <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-lg text-xs font-medium ${p === page ? 'bg-blue-600 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>{p + 1}</button>;
                            });
                          })()}
                          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronRight size={14} /></button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── PENDING TAB ──────────────────────────────────────────────────── */}
            {tab === 'pending' && (
              <div>
                <p className="text-sm text-gray-500 mb-5">Các tài khoản đang chờ phê duyệt từ người dùng tự đăng ký.</p>
                {loadingPending ? (
                  <div className="py-16 text-center text-gray-400">Đang tải...</div>
                ) : pendingList.length === 0 ? (
                  <div className="py-16 text-center">
                    <CheckCircle2 size={40} className="mx-auto text-emerald-300 mb-3" />
                    <p className="text-gray-500 font-medium">Không có tài khoản chờ duyệt</p>
                    <p className="text-gray-400 text-sm mt-1">Tất cả đăng ký đã được xử lý</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingList.map(acc => (
                      <div key={acc.id} className="flex items-center gap-4 p-4 rounded-xl border border-amber-100 bg-amber-50/30 hover:bg-white transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shrink-0 text-sm">
                          {((acc.hoTen || '?')[0]).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{acc.hoTen}</p>
                          <p className="text-xs text-gray-500 truncate">{acc.username} · {acc.email}</p>
                          {acc.ngayDangKy && <p className="text-xs text-gray-400 mt-0.5">Đăng ký lúc {new Date(acc.ngayDangKy).toLocaleString('vi-VN')}</p>}
                        </div>
                        <RoleBadge role={acc.vaiTro || 'DOAN_VIEN'} />
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => approveMut.mutate(acc.id)} disabled={approveMut.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-60">
                            <UserCheck size={13} /> Duyệt
                          </button>
                          <button onClick={() => rejectMut.mutate(acc.id)} disabled={rejectMut.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 disabled:opacity-60">
                            <UserX size={13} /> Từ chối
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── CREATE TAB ───────────────────────────────────────────────────── */}
            {tab === 'create' && (
              <div className="max-w-2xl">
                <p className="text-sm text-gray-500 mb-6">Tạo tài khoản mới với vai trò và phạm vi quản lý cụ thể.</p>

                {/* role picker */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Chọn vai trò *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ROLE_OPTIONS.map(r => (
                      <button key={r.value} type="button" onClick={() => handleCreateField('vaiTro', r.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${createForm.vaiTro === r.value ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-100 hover:border-gray-300 bg-white'}`}>
                        <p className={`text-xs font-semibold leading-snug ${createForm.vaiTro === r.value ? 'text-blue-700' : 'text-gray-700'}`}>{r.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* name */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Họ và tên *</label>
                      <input value={createForm.hoTen} onChange={e => handleCreateField('hoTen', e.target.value)} placeholder="Nguyễn Văn An" required
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    {/* username */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Tên đăng nhập *</label>
                      <div className="flex gap-2">
                        <input value={createForm.username} onChange={e => { setAutoUsername(false); handleCreateField('username', e.target.value); }} placeholder="nguyenvana" required
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                        <button type="button" title="Tự động từ họ tên" onClick={() => { setAutoUsername(true); handleCreateField('hoTen', createForm.hoTen); }}
                          className="px-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600">
                          <RefreshCw size={13} />
                        </button>
                      </div>
                    </div>
                    {/* email */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
                      <input value={createForm.email} onChange={e => handleCreateField('email', e.target.value)} type="email" placeholder="email@example.com (không bắt buộc)"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    {/* password */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Mật khẩu *</label>
                      <input value={createForm.password} onChange={e => handleCreateField('password', e.target.value)} type="password" placeholder="KGU@123456" required
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    {/* gender */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Giới tính</label>
                      <select value={createForm.gioiTinh} onChange={e => handleCreateField('gioiTinh', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="NAM">Nam</option>
                        <option value="NU">Nữ</option>
                        <option value="KHAC">Khác</option>
                      </select>
                    </div>
                    {/* khoa (for khoa/chi-doan scoped roles) */}
                    {(ROLES_REQUIRE_KHOA.includes(createForm.vaiTro) || ROLES_REQUIRE_CHI_DOAN.includes(createForm.vaiTro)) && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1"><Building2 size={11} /> Khoa *</label>
                        <SearchableSelect
                          value={createForm.maKhoa}
                          onChange={v => handleCreateField('maKhoa', v)}
                          required
                          placeholder="-- Tìm và chọn khoa --"
                          options={khoaList.map(k => ({ value: k.maKhoa, label: k.tenKhoa || k.maKhoa, sub: k.maKhoa }))}
                        />
                      </div>
                    )}
                    {/* CLB (for QUAN_LY_CLB role) */}
                    {ROLES_REQUIRE_CLB.includes(createForm.vaiTro) && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1"><Trophy size={11} /> CLB / Đội / Nhóm *</label>
                        <SearchableSelect
                          value={createForm.maClb}
                          onChange={v => handleCreateField('maClb', v)}
                          required
                          placeholder="-- Tìm và chọn CLB --"
                          options={clbList.map(c => ({ value: c.maClb, label: c.tenClb || c.maClb, sub: c.loai }))}
                        />
                      </div>
                    )}
                    {/* lop (for chi-doan roles) */}
                    {ROLES_REQUIRE_CHI_DOAN.includes(createForm.vaiTro) && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1"><BookOpen size={11} /> Lớp *</label>
                        {lopList.length > 0 ? (
                          <SearchableSelect
                            value={createForm.maLop}
                            onChange={v => handleCreateField('maLop', v)}
                            required
                            placeholder="-- Tìm và chọn lớp --"
                            options={lopList.map(l => ({ value: l.maLop || l.id, label: l.tenLop || l.maLop, sub: l.maLop }))}
                          />
                        ) : (
                          <input value={createForm.maLop} onChange={e => handleCreateField('maLop', e.target.value)} placeholder="Mã lớp (VD: KHCN22A)" required
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        )}
                      </div>
                    )}
                    {/* mssv for DOAN_VIEN */}
                    {createForm.vaiTro === 'DOAN_VIEN' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Mã sinh viên</label>
                        <input value={createForm.maSv} onChange={e => handleCreateField('maSv', e.target.value)} placeholder="SV001"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={createMut.isPending}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed">
                      <UserPlus size={15} /> {createMut.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
                    </button>
                    <button type="button" onClick={() => { setCreateForm({ hoTen: '', username: '', email: '', password: '', vaiTro: 'DOAN_VIEN', gioiTinh: 'NAM', maKhoa: '', maLop: '', maSv: '' }); setAutoUsername(true); }}
                      className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                      Xóa form
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── IMPORT TAB ───────────────────────────────────────────────────── */}
            {tab === 'import' && (
              <div className="max-w-3xl">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-sm text-gray-700 font-medium">Nhập hàng loạt tài khoản từ file Excel</p>
                    <p className="text-xs text-gray-400 mt-1">Tải mẫu Excel, điền thông tin và upload để nhập tự động.</p>
                  </div>
                  <button onClick={downloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 shrink-0">
                    <Download size={14} /> Tải mẫu Excel
                  </button>
                </div>

                {/* column hint */}
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 mb-5">
                  <p className="font-semibold mb-1">Cột trong file (theo thứ tự):</p>
                  <div className="flex flex-wrap gap-1">
                    {EXCEL_COLUMNS.map((c, i) => (
                      <span key={c} className="bg-blue-100 px-2 py-0.5 rounded font-mono">{i + 1}. {c}</span>
                    ))}
                  </div>
                  <p className="mt-2 text-blue-500">Vai trò: ADMIN · QUAN_LY_KHOA · PHO_QUAN_LY_KHOA · QUAN_LY_CHI_DOAN · PHO_CHI_DOAN · DOAN_VIEN</p>
                </div>

                {/* dropzone */}
                {importRows.length === 0 && !importProgress && (
                  <div ref={dropRef}
                    onDragOver={e => { e.preventDefault(); dropRef.current?.classList.add('border-blue-400', 'bg-blue-50'); }}
                    onDragLeave={() => dropRef.current?.classList.remove('border-blue-400', 'bg-blue-50')}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-14 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                    <Upload size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-600">Kéo thả file hoặc click để chọn</p>
                    <p className="text-xs text-gray-400 mt-1">Hỗ trợ .xlsx · .xls · .csv</p>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => handleFileSelect(e.target.files[0])} />
                  </div>
                )}

                {/* preview table */}
                {importRows.length > 0 && !importProgress && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-700">
                        Xem trước <span className="text-blue-600 font-bold">{importRows.length}</span> tài khoản
                        {importRows.some(r => !r.hoTen || !r.username) && (
                          <span className="ml-2 text-red-500 text-xs"><AlertCircle size={12} className="inline" /> Có dòng thiếu thông tin</span>
                        )}
                      </p>
                      <button onClick={() => { setImportRows([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"><X size={12} /> Xóa & chọn lại</button>
                    </div>
                    <div className="overflow-auto rounded-xl border border-gray-100 max-h-72 mb-4">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                          <tr>{['#', 'Họ tên', 'Username', 'Email', 'Vai trò', 'Khoa', 'Lớp', 'Mã SV'].map(h => (
                            <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {importRows.map((r, i) => (
                            <tr key={i} className={(!r.hoTen || !r.username) ? 'bg-red-50' : 'hover:bg-gray-50'}>
                              <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                              <td className="px-3 py-2 font-medium text-gray-800">{r.hoTen || <span className="text-red-500">Trống!</span>}</td>
                              <td className="px-3 py-2 font-mono text-gray-600">{r.username || <span className="text-red-500">Trống!</span>}</td>
                              <td className="px-3 py-2 text-gray-500 max-w-[160px] truncate">{r.email}</td>
                              <td className="px-3 py-2"><RoleBadge role={r.vaiTro} /></td>
                              <td className="px-3 py-2 text-gray-500">{r.maKhoa}</td>
                              <td className="px-3 py-2 text-gray-500">{r.maLop}</td>
                              <td className="px-3 py-2 text-gray-500">{r.maSv}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button onClick={runImport}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700">
                      <Upload size={15} /> Nhập {importRows.length} tài khoản
                    </button>
                  </div>
                )}

                {/* import progress */}
                {importProgress && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700">{importProgress.done < importProgress.total ? 'Đang nhập...' : 'Hoàn tất!'}</span>
                        <span className="text-gray-500 font-mono">{importProgress.done}/{importProgress.total}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${importProgress.done === importProgress.total && importProgress.errors.length === 0 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: `${(importProgress.done / importProgress.total) * 100}%` }} />
                      </div>
                    </div>
                    {importProgress.done === importProgress.total && (
                      <>
                        <div className={`flex items-center gap-2 text-sm font-medium ${importProgress.errors.length === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {importProgress.errors.length === 0 ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                          {importProgress.errors.length === 0
                            ? `Thành công: tất cả ${importProgress.total} tài khoản đã được tạo`
                            : `Thành công: ${importProgress.total - importProgress.errors.length}/${importProgress.total} · Lỗi: ${importProgress.errors.length}`}
                        </div>
                        {importProgress.errors.length > 0 && (
                          <div className="max-h-40 overflow-auto rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700 space-y-1">
                            {importProgress.errors.map((e, i) => <div key={i}><strong>{e.name}:</strong> {e.msg}</div>)}
                          </div>
                        )}
                        <button onClick={() => { setImportRows([]); setImportProgress(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                          className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">
                          Nhập file khác
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── KHOA QUICK-CREATE TAB ─────────────────────────────────────────── */}
            {tab === 'khoa' && (
              <div>
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">Tạo nhanh tài khoản Đoàn khoa</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Tạo tài khoản <strong>Bí thư Đoàn khoa</strong> (QUAN_LY_KHOA) cho từng khoa. Mỗi khoa chỉ cần một tài khoản đại diện.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const todo = khoaRows.filter(r => !r.existing);
                      setKhoaSelected(new Set(todo.map(r => r.maKhoa)));
                    }}
                    className="shrink-0 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 whitespace-nowrap"
                  >
                    Chọn tất cả chưa có
                  </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-3 py-2.5 w-8">
                          <input type="checkbox"
                            checked={khoaRows.filter(r => !r.existing).every(r => khoaSelected.has(r.maKhoa)) && khoaRows.some(r => !r.existing)}
                            onChange={e => {
                              const todo = khoaRows.filter(r => !r.existing).map(r => r.maKhoa);
                              setKhoaSelected(e.target.checked ? new Set(todo) : new Set());
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600"
                          />
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Khoa</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Mã khoa</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Username (chỉnh được)</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {khoaRows.map(row => (
                        <tr key={row.maKhoa} className={`hover:bg-gray-50/50 transition-colors ${khoaSelected.has(row.maKhoa) ? 'bg-blue-50/30' : ''}`}>
                          <td className="px-3 py-3 text-center">
                            <input type="checkbox"
                              checked={khoaSelected.has(row.maKhoa)}
                              disabled={!!row.existing}
                              onChange={e => {
                                setKhoaSelected(prev => {
                                  const n = new Set(prev);
                                  e.target.checked ? n.add(row.maKhoa) : n.delete(row.maKhoa);
                                  return n;
                                });
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 disabled:opacity-40"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <p className="font-medium text-gray-800 text-sm">{row.tenKhoa}</p>
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{row.maKhoa}</span>
                          </td>
                          <td className="px-3 py-3">
                            {row.existing ? (
                              <span className="font-mono text-sm text-gray-500">{row.existing.username}</span>
                            ) : (
                              <input
                                type="text"
                                value={row.username}
                                onChange={e => setKhoaUsernameMap(m => ({ ...m, [row.maKhoa]: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                                className="font-mono text-sm px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-full max-w-[200px]"
                              />
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {row.existing ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                  <CheckCircle2 size={11} /> Đã có tài khoản
                                </span>
                                <p className="text-xs text-gray-400 mt-0.5">{row.existing.hoTen || row.existing.username}</p>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                Chưa có
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Info + action */}
                <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="text-sm text-gray-500">
                    Đã chọn <strong className="text-blue-600">{khoaSelected.size}</strong> khoa ·
                    Mật khẩu mặc định: <strong className="font-mono">KGU@123456</strong> ·
                    Vai trò: <strong>Bí thư Đoàn khoa</strong>
                  </div>
                  <button
                    onClick={runKhoaCreate}
                    disabled={khoaSelected.size === 0 || khoaCreating}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    {khoaCreating ? <><RefreshCw size={14} className="animate-spin" /> Đang tạo...</> : <><UserPlus size={14} /> Tạo {khoaSelected.size} tài khoản</>}
                  </button>
                </div>

                {/* Results */}
                {khoaResults && (
                  <div className={`mt-4 p-4 rounded-xl border text-sm ${khoaResults.fail === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                    <p className="font-semibold">
                      ✓ Tạo thành công {khoaResults.ok} tài khoản
                      {khoaResults.fail > 0 && ` · ✗ Thất bại ${khoaResults.fail}`}
                    </p>
                    {khoaResults.errors.map((e, i) => (
                      <p key={i} className="text-xs mt-1 text-red-600"><strong>{e.name}:</strong> {e.msg}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── EDIT MODAL ────────────────────────────────────────────────────────── */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Chỉnh sửa tài khoản</h3>
              <button onClick={() => setEditModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Họ và tên</label>
                <input value={editForm.hoTen} onChange={e => setEditForm(f => ({ ...f, hoTen: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Vai trò</label>
                <select value={editForm.vaiTro} onChange={e => setEditForm(f => ({ ...f, vaiTro: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {(ROLES_REQUIRE_KHOA.includes(editForm.vaiTro) || ROLES_REQUIRE_CHI_DOAN.includes(editForm.vaiTro)) && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Mã khoa</label>
                  <input value={editForm.maKhoa} onChange={e => setEditForm(f => ({ ...f, maKhoa: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => updateMut.mutate({ id: editModal.id, data: editForm })} disabled={updateMut.isPending}
                className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60">
                {updateMut.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button onClick={() => setEditModal(null)} className="px-5 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ─────────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={20} className="text-red-600" /></div>
            <h3 className="font-semibold text-gray-900 mb-1">Xóa tài khoản?</h3>
            <p className="text-sm text-gray-500 mb-5">Tài khoản <strong className="text-gray-800">{deleteTarget.hoTen || deleteTarget.username}</strong> sẽ bị xóa vĩnh viễn và không thể khôi phục.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">Hủy</button>
              <button onClick={() => deleteMut.mutate(deleteTarget.id)} disabled={deleteMut.isPending}
                className="flex-1 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 disabled:opacity-60">
                {deleteMut.isPending ? 'Đang xóa...' : 'Xóa tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESET PASSWORD CONFIRM ─────────────────────────────────────────────── */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4"><Key size={20} className="text-amber-600" /></div>
            <h3 className="font-semibold text-gray-900 mb-1">Reset mật khẩu?</h3>
            <p className="text-sm text-gray-500 mb-2">Mật khẩu của <strong className="text-gray-800">{resetTarget.hoTen || resetTarget.username}</strong> sẽ được đặt lại về:</p>
            <p className="font-mono text-sm font-bold text-gray-900 bg-gray-100 rounded-lg px-4 py-2 inline-block mb-5">KGU@123456</p>
            <div className="flex gap-3">
              <button onClick={() => setResetTarget(null)} className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">Hủy</button>
              <button onClick={() => resetPwMut.mutate(resetTarget.id)} disabled={resetPwMut.isPending}
                className="flex-1 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 disabled:opacity-60">
                {resetPwMut.isPending ? 'Đang reset...' : 'Reset mật khẩu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PERMISSION ASSIGN MODAL ────────────────────────────────────────────── */}
      <PermissionAssignModal
        account={permTarget}
        isOpen={!!permTarget}
        onClose={() => setPermTarget(null)}
      />
    </div>
  );
}
