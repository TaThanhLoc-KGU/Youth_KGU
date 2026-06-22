/**
 * ClbRegistrationPage — Trang CLB dành cho sinh viên
 * Tab 1 "CLB của tôi": CLB đang tham gia + lệ phí tích hợp
 * Tab 2 "Khám phá":    Tìm kiếm & đăng ký CLB mới
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Search, CheckCircle2, Clock, XCircle, UserPlus,
  X, ChevronRight, BadgeCheck, Banknote, Activity, Zap,
  AlertCircle, QrCode, Copy, CreditCard, History, Info,
  Star, LayoutGrid, RefreshCw, Calendar,
} from 'lucide-react';
import { ROUTES } from '../../utils/constants';
import { toast } from 'react-toastify';
import cauLacBoService from '../../services/cauLacBoService';

// ── Constants ──────────────────────────────────────────────────────────────────
const CO_CHE_LABEL = {
  TU_DO:             { label: 'Mở tự do',         cls: 'bg-green-100 text-green-700' },
  YEU_CAU_DONG_PHI:  { label: 'Yêu cầu đóng phí', cls: 'bg-yellow-100 text-yellow-700' },
  YEU_CAU_HOAT_DONG: { label: 'Yêu cầu HĐ',        cls: 'bg-blue-100 text-blue-700' },
  YEU_CAU_CA_HAI:    { label: 'Phí + HĐ',           cls: 'bg-purple-100 text-purple-700' },
};

const STATUS_STYLE = {
  CHO_DUYET: { cls: 'bg-yellow-100 text-yellow-700', icon: Clock,        label: 'Chờ duyệt' },
  DA_DUYET:  { cls: 'bg-green-100 text-green-700',   icon: CheckCircle2, label: 'Đã duyệt' },
  TU_CHOI:   { cls: 'bg-red-100 text-red-700',       icon: XCircle,      label: 'Bị từ chối' },
  HUY:       { cls: 'bg-gray-100 text-gray-500',     icon: X,            label: 'Đã hủy' },
};

const FEE_STATUS = {
  CHUA_DONG: { label: 'Chưa đóng', cls: 'bg-amber-100 text-amber-700' },
  DA_DONG:   { label: 'Đã đóng',   cls: 'bg-green-100 text-green-700' },
  MIEN_GIAM: { label: 'Miễn giảm', cls: 'bg-blue-100 text-blue-700' },
  QUA_HAN:   { label: 'Quá hạn',   cls: 'bg-red-100 text-red-700' },
};

// ── Payment Modal ──────────────────────────────────────────────────────────────
const PayModal = ({ info, onClose, onPayOS }) => {
  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Đã sao chép'); };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b flex items-center justify-between bg-gray-50/50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-600" /> Thanh toán lệ phí
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-center">
            <p className="font-semibold text-gray-800">{info.tenSv}</p>
            <p className="text-xs text-gray-500">{info.tenClb}</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">
              {Number(info.soTien).toLocaleString('vi-VN')}đ
            </p>
          </div>

          {/* QR + bank info */}
          {info.qrUrl ? (
            <>
              <div className="flex justify-center">
                <img src={info.qrUrl} alt="QR" className="w-48 h-48 object-contain rounded-xl border" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border cursor-pointer"
                  onClick={() => copy(info.accountNumber)}>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">{info.bankCode} — {info.accountHolder}</p>
                    <p className="font-bold text-gray-800">{info.accountNumber}</p>
                  </div>
                  <Copy className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
                <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-xl border border-indigo-100 cursor-pointer"
                  onClick={() => copy(info.noiDungCk)}>
                  <div>
                    <p className="text-[9px] font-bold text-indigo-400 uppercase mb-0.5">Nội dung CK (bắt buộc)</p>
                    <p className="font-bold text-indigo-700">{info.noiDungCk}</p>
                  </div>
                  <Copy className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                </div>
              </div>
              <p className="text-[10px] text-center text-gray-400 italic">
                * Không thay đổi nội dung CK — hệ thống tự ghi nhận tức thì
              </p>
            </>
          ) : !info.hasPayOS ? (
            <div className="py-6 text-center">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">CLB chưa cấu hình thanh toán. Vui lòng liên hệ BCN.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ── DangKy Modal ───────────────────────────────────────────────────────────────
function DangKyModal({ clb, onClose, existingDon }) {
  const queryClient = useQueryClient();
  const [lyDo, setLyDo] = useState('');

  const submitMutation = useMutation({
    mutationFn: () => cauLacBoService.submitDangKy(clb.maClb, lyDo || null),
    onSuccess: () => {
      toast.success('Đã gửi đơn đăng ký thành công!');
      queryClient.invalidateQueries(['my-dangky']);
      onClose();
    },
    onError: e => toast.error(e.response?.data?.message || 'Lỗi gửi đơn'),
  });

  const huyMutation = useMutation({
    mutationFn: () => cauLacBoService.huyDon(clb.maClb, existingDon.id),
    onSuccess: () => {
      toast.success('Đã hủy đơn');
      queryClient.invalidateQueries(['my-dangky']);
      onClose();
    },
    onError: e => toast.error(e.response?.data?.message || 'Lỗi hủy đơn'),
  });

  const isChoDuyet = existingDon?.trangThai === 'CHO_DUYET';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold">
            {isChoDuyet ? 'Đơn đang chờ duyệt' : `Đăng ký: ${clb.tenClb}`}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="font-semibold text-blue-900">{clb.tenClb}</p>
            {clb.moTaYeuCau && (
              <p className="text-xs text-yellow-700 mt-2 bg-yellow-50 p-2 rounded">{clb.moTaYeuCau}</p>
            )}
          </div>
          {isChoDuyet ? (
            <>
              <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 p-3 rounded-lg text-sm">
                <Clock className="w-4 h-4" /> Đơn của bạn đang chờ BCN xem xét.
              </div>
              <button onClick={() => huyMutation.mutate()} disabled={huyMutation.isPending}
                className="w-full py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50">
                {huyMutation.isPending ? 'Đang hủy…' : 'Hủy đơn đăng ký'}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do đăng ký <span className="text-gray-400 font-normal">(không bắt buộc)</span>
                </label>
                <textarea value={lyDo} onChange={e => setLyDo(e.target.value)} rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="VD: Tôi muốn tham gia để phát triển kỹ năng..." />
              </div>
              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
                <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  {submitMutation.isPending ? 'Đang gửi…' : 'Gửi đơn'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab: CLB của tôi (gộp lệ phí) ────────────────────────────────────────────
function MyClbsTab({ myClbs, myFees, refetchFees }) {
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState({});

  const payOSMutation = useMutation({
    mutationFn: ({ maClb, id }) => {
      const url = window.location.href.split('?')[0];
      return cauLacBoService.createPayOSLink(maClb, id, url + '?payment=success', url + '?payment=cancel');
    },
    onSuccess: (data) => { if (data.checkoutUrl) window.location.href = data.checkoutUrl; },
    onError: e => toast.error(e.response?.data?.message || 'Lỗi tạo link PayOS'),
  });

  // Group phí theo maClb
  const feesByClb = myFees.reduce((acc, f) => {
    if (!acc[f.maClb]) acc[f.maClb] = [];
    acc[f.maClb].push(f);
    return acc;
  }, {});

  if (myClbs.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Bạn chưa tham gia CLB nào</p>
        <p className="text-xs mt-1">Chuyển sang tab <strong>Khám phá</strong> để đăng ký</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {myClbs.map(mc => {
        const fees   = feesByClb[mc.maClb] || [];
        const unpaid = fees.filter(f => f.trangThai === 'CHUA_DONG');
        const paid   = fees.filter(f => f.trangThai !== 'CHUA_DONG');
        const showHist = showHistory[mc.maClb];

        return (
          <div key={mc.maClb} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* CLB header */}
            <div className="px-5 py-4 flex items-center justify-between bg-blue-50 border-b border-blue-100">
              <div>
                <h3 className="font-bold text-gray-900">{mc.tenClb}</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                  {mc.chucVuLabel || mc.chucVu || 'Thành viên'}
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                <BadgeCheck className="w-3.5 h-3.5" /> Thành viên
              </span>
            </div>

            {/* Phí chưa đóng — TẠM ẨN */}
            {false && unpaid.length > 0 && (
              <div className="p-5 bg-slate-50 space-y-6">
                {unpaid.map(f => (
                  <div key={f.id} className="bg-white rounded-3xl border-2 border-indigo-50 shadow-xl shadow-indigo-100/20 overflow-hidden">
                    <div className="p-6">
                      {/* Top Info */}
                      <div className="flex flex-col sm:flex-row justify-between gap-6 mb-6">
                        <div className="flex gap-4">
                          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
                            <Banknote className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {f.tenHocKy}
                              </span>
                              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                CHƯA ĐÓNG
                              </span>
                            </div>
                            <p className="text-2xl font-black text-gray-900 mt-2">
                              {Number(f.soTien).toLocaleString('vi-VN')}đ
                            </p>
                          </div>
                        </div>

                      </div>

                      {/* QR & Bank Info */}
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Hướng dẫn chuyển khoản</h4>
                          
                          <div className="space-y-3">
                            <div className="group cursor-pointer" onClick={() => {
                              navigator.clipboard.writeText(`${f.maXacThucCk} ${f.maSv}`);
                              toast.info('Đã copy nội dung');
                            }}>
                              <p className="text-[10px] font-black text-indigo-500 uppercase mb-1">Nội dung CK chuẩn</p>
                              <div className="bg-indigo-600 text-white px-3 py-2.5 rounded-xl font-black text-base flex items-center justify-between shadow-md shadow-indigo-100">
                                <span>{f.maXacThucCk} {f.maSv}</span>
                                <Copy className="w-4 h-4 opacity-50" />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="cursor-pointer" onClick={() => {
                                navigator.clipboard.writeText(f.bankAccountNo);
                                toast.info('Đã copy STK');
                              }}>
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Số tài khoản</p>
                                <p className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                                  {f.bankAccountNo || '---'} <Copy className="w-3 h-3 text-slate-300" />
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Ngân hàng</p>
                                <p className="font-black text-slate-800 text-sm uppercase">{f.bankName || '---'}</p>
                              </div>
                            </div>
                            
                            <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Chủ tài khoản</p>
                               <p className="font-bold text-slate-700 text-sm uppercase">{f.accountName || 'Ban chủ nhiệm CLB'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="bg-white p-2 border-2 border-dashed border-indigo-100 rounded-[1.5rem] shadow-inner relative group/qr">
                            <img 
                              src={`https://img.vietqr.io/image/${f.bankName}-${f.bankAccountNo}-compact2.png?amount=${f.soTien}&addInfo=${encodeURIComponent(f.maXacThucCk + ' ' + f.maSv)}&accountName=${encodeURIComponent(f.accountName || '')}`} 
                              alt="VietQR" 
                              className="w-36 h-36 object-contain" 
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/5 opacity-0 group-hover/qr:opacity-100 transition-opacity rounded-[1.5rem]">
                               <QrCode className="w-8 h-8 text-indigo-600" />
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quét mã VietQR</p>
                            <p className="text-[8px] text-slate-400 mt-0.5 italic">* Tự động điền số tiền & nội dung</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-start gap-2 bg-amber-50 p-3 rounded-xl border border-amber-100">
                        <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                          Hệ thống duyệt tự động. Vui lòng <strong>không chỉnh sửa nội dung chuyển khoản</strong> để phí được duyệt tức thì.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Lịch sử phí — TẠM ẨN */}
            {false && paid.length > 0 && (
              <div className="px-5 py-2 border-t border-gray-50">
                <button onClick={() => setShowHistory(h => ({ ...h, [mc.maClb]: !h[mc.maClb] }))}
                  className="text-[10px] font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1 py-1">
                  <History className="w-3 h-3" />
                  {showHist ? 'Ẩn' : 'Xem'} lịch sử ({paid.length})
                </button>
                {showHist && (
                  <div className="mt-1 space-y-1 pb-2">
                    {paid.map(f => {
                      const st = FEE_STATUS[f.trangThai] || FEE_STATUS.DA_DONG;
                      return (
                        <div key={f.id} className="flex items-center justify-between py-1.5">
                          <div>
                            <p className="text-xs font-medium text-gray-700">
                              {Number(f.soTien).toLocaleString('vi-VN')}đ — {f.tenHocKy}
                            </p>
                            {f.ngayDong && <p className="text-[10px] text-gray-400">{f.ngayDong}</p>}
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* {fees.length === 0 && (
              <div className="px-5 py-3 text-xs text-gray-400 text-center border-t border-gray-50">
                Không có khoản lệ phí nào
              </div>
            )} */}
          </div>
        );
      })}
    </div>
  );
}

// ── Tab: Khám phá CLB ─────────────────────────────────────────────────────────
function ExploreTab({ allClbs, clbLoading, myClbSet, myStatusMap, myFees, feesByClb }) {
  const [search, setSearch]       = useState('');
  const [loaiFilter, setLoaiFilter] = useState('');
  const [registerTarget, setRegisterTarget] = useState(null);

  const filtered = allClbs.filter(c => {
    if (loaiFilter && c.loai !== loaiFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.tenClb?.toLowerCase().includes(q) ||
             c.maClb?.toLowerCase().includes(q) ||
             c.linhVuc?.toLowerCase().includes(q);
    }
    return true;
  });

  const isMember  = (clb) => myClbSet.has(clb.maClb) || myStatusMap[clb.maClb]?.trangThai === 'DA_DUYET';
  const isPending = (clb) => myStatusMap[clb.maClb]?.trangThai === 'CHO_DUYET';
  const canReg    = (clb) => !isMember(clb) && !isPending(clb) && clb.choPhepDangKyTuDo !== false;

  const existingDon = registerTarget ? myStatusMap[registerTarget.maClb] : null;

  return (
    <div className="space-y-4">
      {/* Search & filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm CLB, đội, nhóm..."
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={loaiFilter} onChange={e => setLoaiFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
          <option value="">Tất cả loại</option>
          <option value="CLB">Câu lạc bộ</option>
          <option value="DOI">Đội</option>
          <option value="NHOM">Nhóm</option>
        </select>
      </div>

      {/* Grid */}
      {clbLoading ? (
        <div className="py-16 text-center text-gray-400">Đang tải…</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Không tìm thấy CLB phù hợp</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(clb => {
            const don     = myStatusMap[clb.maClb];
            const coche   = clb.cocheThanHVien || 'TU_DO';
            const ccInfo  = CO_CHE_LABEL[coche] || CO_CHE_LABEL.TU_DO;
            const pending = isPending(clb);
            const member  = isMember(clb);
            const canR    = canReg(clb);
            const unpaidFees = (feesByClb[clb.maClb] || []).filter(f => f.trangThai === 'CHUA_DONG');

            return (
              <div key={clb.maClb}
                className={`bg-white rounded-xl border hover:shadow-md transition-shadow p-5 ${
                  member ? 'border-green-200' : 'border-gray-100'
                }`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        clb.loai === 'CLB' ? 'bg-blue-100 text-blue-700' :
                        clb.loai === 'DOI' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>{clb.loai}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${ccInfo.cls}`}>
                        {ccInfo.label}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900">{clb.tenClb}</h3>
                    {clb.tenKhoa && <p className="text-xs text-gray-500 mt-0.5">{clb.tenKhoa}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-blue-600">{clb.soThanhVien ?? 0}</p>
                    <p className="text-xs text-gray-400">thành viên</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {clb.linhVuc && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      🏷 {clb.linhVuc}
                    </span>
                  )}
                  {(coche === 'YEU_CAU_DONG_PHI' || coche === 'YEU_CAU_CA_HAI') && clb.soTienPhiKy && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                      <Banknote className="w-3 h-3" />
                      {Number(clb.soTienPhiKy).toLocaleString('vi-VN')}đ/{clb.donViPhi === 'KY' ? 'kỳ' : clb.donViPhi === 'NAM' ? 'năm' : 'tháng'}
                    </span>
                  )}
                </div>

                {clb.moTa && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{clb.moTa}</p>
                )}

                {/* Lệ phí chưa đóng — TẠM ẨN */}

                {/* CTA */}
                {member ? (
                  <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                    <BadgeCheck className="w-4 h-4" /> Bạn đã là thành viên
                  </div>
                ) : pending ? (
                  <button onClick={() => setRegisterTarget(clb)}
                    className="w-full py-2 bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-yellow-100">
                    <Clock className="w-4 h-4" /> Đang chờ duyệt
                    <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  </button>
                ) : canR ? (
                  <button onClick={() => setRegisterTarget(clb)}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" /> Đăng ký tham gia
                  </button>
                ) : (
                  <div className="text-xs text-gray-400 text-center py-1">
                    CLB không nhận đăng ký trực tuyến
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {registerTarget && (
        <DangKyModal
          clb={registerTarget}
          existingDon={existingDon?.trangThai === 'CHO_DUYET' ? existingDon : null}
          onClose={() => setRegisterTarget(null)}
        />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ClbRegistrationPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') === 'fees' ? 'mine' : 'explore';
  });

  // Xử lý PayOS redirect params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      toast.success('Thanh toán thành công! Hệ thống đang cập nhật.');
      queryClient.invalidateQueries(['my-fees']);
      setTab('mine');
    } else if (params.get('payment') === 'cancel') {
      toast.warn('Giao dịch đã bị hủy.');
    }
    if (params.has('payment') || params.has('tab')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [queryClient]);

  const { data: allClbs = [], isLoading: clbLoading } = useQuery({
    queryKey: ['all-clbs-public'],
    queryFn: () => cauLacBoService.getAll({ choPhepDangKy: true }),
  });

  const { data: myDangKy = [] } = useQuery({
    queryKey: ['my-dangky'],
    queryFn: () => cauLacBoService.getMyDangKy(),
  });

  const { data: myFees = [], refetch: refetchFees } = useQuery({
    queryKey: ['my-fees'],
    queryFn: () => cauLacBoService.getMyFees(),
  });

  const { data: myClbs = [] } = useQuery({
    queryKey: ['my-membership'],
    queryFn: () => cauLacBoService.getMyMembership(),
  });

  const myStatusMap = Object.fromEntries(myDangKy.map(d => [d.maClb, d]));
  const myClbSet    = new Set(myClbs.map(c => c.maClb));
  const feesByClb   = myFees.reduce((acc, f) => {
    if (!acc[f.maClb]) acc[f.maClb] = [];
    acc[f.maClb].push(f);
    return acc;
  }, {});

  const unpaidCount = myFees.filter(f => f.trangThai === 'CHUA_DONG').length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-20 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-7 h-7 text-blue-600" /> Câu lạc bộ
        </h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý thành viên, lệ phí và đăng ký CLB của bạn</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setTab('mine')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'mine' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BadgeCheck className="w-4 h-4" />
          CLB của tôi
          {myClbs.length > 0 && (
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
              {myClbs.length}
            </span>
          )}
          {/* badge phí chưa đóng — tạm ẩn */}
        </button>
        <button
          onClick={() => setTab('explore')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'explore' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Search className="w-4 h-4" />
          Khám phá
        </button>
      </div>

      {/* Tab content */}
      {tab === 'mine' ? (
        <MyClbsTab myClbs={myClbs} myFees={myFees} refetchFees={refetchFees} />
      ) : (
        <ExploreTab
          allClbs={allClbs}
          clbLoading={clbLoading}
          myClbSet={myClbSet}
          myStatusMap={myStatusMap}
          myFees={myFees}
          feesByClb={feesByClb}
        />
      )}
    </div>
  );
}
