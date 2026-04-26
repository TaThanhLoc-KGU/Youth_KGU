/**
 * ClbRegistrationPage — Sinh viên duyệt & đăng ký tham gia CLB
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Search, CheckCircle2, Clock, XCircle, UserPlus,
         X, ChevronRight, BadgeCheck, Banknote, Activity } from 'lucide-react';
import { toast } from 'react-toastify';
import cauLacBoService from '../../services/cauLacBoService';

const CO_CHE_LABEL = {
  TU_DO:             { label: 'Mở tự do',        cls: 'bg-green-100 text-green-700' },
  YEU_CAU_DONG_PHI:  { label: 'Yêu cầu đóng phí', cls: 'bg-yellow-100 text-yellow-700' },
  YEU_CAU_HOAT_DONG: { label: 'Yêu cầu HĐ',       cls: 'bg-blue-100 text-blue-700' },
  YEU_CAU_CA_HAI:    { label: 'Phí + HĐ',          cls: 'bg-purple-100 text-purple-700' },
};

const STATUS_STYLE = {
  CHO_DUYET: { cls: 'bg-yellow-100 text-yellow-700', icon: Clock,          label: 'Chờ duyệt' },
  DA_DUYET:  { cls: 'bg-green-100 text-green-700',   icon: CheckCircle2,   label: 'Đã được duyệt' },
  TU_CHOI:   { cls: 'bg-red-100 text-red-700',       icon: XCircle,        label: 'Bị từ chối' },
  HUY:       { cls: 'bg-gray-100 text-gray-500',     icon: X,              label: 'Đã hủy' },
};

// Modal đăng ký
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
          {/* CLB info */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="font-semibold text-blue-900">{clb.tenClb}</p>
            {clb.tenKhoa && <p className="text-xs text-blue-600 mt-0.5">{clb.tenKhoa}</p>}
            {clb.soThanhVien != null && (
              <p className="text-xs text-blue-500 mt-0.5">{clb.soThanhVien} thành viên</p>
            )}
          </div>

          {/* Yêu cầu CLB */}
          {clb.moTaYeuCau && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-xs font-semibold text-yellow-800 mb-1">📋 Yêu cầu từ CLB:</p>
              <p className="text-xs text-yellow-700">{clb.moTaYeuCau}</p>
            </div>
          )}

          {isChoDuyet ? (
            <>
              <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">Đơn của bạn đang chờ BCN xem xét.</p>
              </div>
              {existingDon.lyDoDangKy && (
                <p className="text-sm text-gray-600 italic">Lý do bạn đã ghi: "{existingDon.lyDoDangKy}"</p>
              )}
              <button onClick={() => huyMutation.mutate()}
                disabled={huyMutation.isPending}
                className="w-full py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50">
                {huyMutation.isPending ? 'Đang hủy…' : 'Hủy đơn đăng ký'}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do đăng ký / giới thiệu bản thân
                  <span className="text-gray-400 font-normal"> (không bắt buộc)</span>
                </label>
                <textarea value={lyDo} onChange={e => setLyDo(e.target.value)} rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="VD: Tôi muốn tham gia để phát triển kỹ năng lập trình..." />
              </div>
              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
                <button onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  {submitMutation.isPending ? 'Đang gửi…' : 'Gửi đơn đăng ký'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClbRegistrationPage() {
  const [search, setSearch] = useState('');
  const [loaiFilter, setLoaiFilter] = useState('');
  const [registerTarget, setRegisterTarget] = useState(null);

  // Tất cả CLB công khai
  const { data: allClbs = [], isLoading: clbLoading } = useQuery({
    queryKey: ['all-clbs-public'],
    queryFn: () => cauLacBoService.getAll({ choPhepDangKy: true }),
  });

  // Đơn đăng ký của SV hiện tại
  const { data: myDangKy = [] } = useQuery({
    queryKey: ['my-dangky'],
    queryFn: () => cauLacBoService.getMyDangKy(),
  });

  // Index: maClb → trạng thái đơn
  const myStatusMap = Object.fromEntries(
    myDangKy.map(d => [d.maClb, d])
  );

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

  const existingDon = registerTarget ? myStatusMap[registerTarget.maClb] : null;
  const canRegister = (clb) => {
    const don = myStatusMap[clb.maClb];
    if (!don) return true;
    return don.trangThai === 'TU_CHOI' || don.trangThai === 'HUY';
  };
  const isPending = (clb) => myStatusMap[clb.maClb]?.trangThai === 'CHO_DUYET';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Đăng ký tham gia CLB / Đội / Nhóm</h1>
        <p className="text-sm text-gray-500 mt-1">Tìm kiếm và đăng ký tham gia các câu lạc bộ</p>
      </div>

      {/* Đơn của tôi */}
      {myDangKy.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" /> Đơn đăng ký của tôi
          </h3>
          <div className="space-y-2">
            {myDangKy.map(don => {
              const st = STATUS_STYLE[don.trangThai] || STATUS_STYLE.HUY;
              const Icon = st.icon;
              return (
                <div key={don.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{don.tenClb}</p>
                    {don.lyDoXuLy && (
                      <p className="text-xs text-gray-500 mt-0.5">Phản hồi: {don.lyDoXuLy}</p>
                    )}
                  </div>
                  <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${st.cls}`}>
                    <Icon className="w-3 h-3" /> {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm CLB..."
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

      {/* CLB list */}
      {clbLoading ? (
        <div className="py-16 text-center text-gray-400">Đang tải danh sách…</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Không tìm thấy CLB phù hợp</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(clb => {
            const don    = myStatusMap[clb.maClb];
            const coche  = clb.cocheThanHVien || 'TU_DO';
            const ccInfo = CO_CHE_LABEL[coche] || CO_CHE_LABEL.TU_DO;
            const pending = isPending(clb);
            const memberAlready = don?.trangThai === 'DA_DUYET';
            const canReg = canRegister(clb) && !memberAlready && clb.choPhepDangKyTuDo !== false;

            return (
              <div key={clb.maClb}
                className="bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow p-5">
                {/* Header */}
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
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">{clb.soThanhVien ?? 0}</p>
                    <p className="text-xs text-gray-400">thành viên</p>
                  </div>
                </div>

                {/* Info chips */}
                <div className="flex flex-wrap gap-2 mb-4">
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
                  {(coche === 'YEU_CAU_HOAT_DONG' || coche === 'YEU_CAU_CA_HAI') && clb.soHoatDongToiThieu && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Tối thiểu {clb.soHoatDongToiThieu} HĐ/kỳ
                    </span>
                  )}
                </div>

                {clb.moTa && (
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">{clb.moTa}</p>
                )}

                {/* CTA */}
                {memberAlready ? (
                  <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                    <BadgeCheck className="w-4 h-4" /> Bạn đã là thành viên
                  </div>
                ) : pending ? (
                  <button onClick={() => setRegisterTarget(clb)}
                    className="w-full py-2 bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-yellow-100">
                    <Clock className="w-4 h-4" /> Đang chờ duyệt
                    <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  </button>
                ) : canReg ? (
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

      {/* Modal */}
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
