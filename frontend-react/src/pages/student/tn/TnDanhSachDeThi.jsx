import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileQuestion, Clock, ListChecks, Play, RotateCw, Eye, Lock } from 'lucide-react';
import tnService from '../../../services/tnService';
import { ROUTES } from '../../../utils/constants';
import Loading from '../../../components/common/Loading';
import Button from '../../../components/common/Button';

const TINH_TRANG = {
  CO_THE_LAM: { label: 'Bắt đầu', variant: 'primary', icon: Play },
  DANG_LAM:   { label: 'Tiếp tục làm', variant: 'warning', icon: RotateCw },
  HET_LUOT:   { label: 'Xem kết quả', variant: 'outline', icon: Eye },
  DA_DONG:    { label: 'Đã đóng', variant: 'secondary', icon: Lock, disabled: true },
  CHUA_MO:    { label: 'Chưa mở', variant: 'secondary', icon: Lock, disabled: true },
};

export default function TnDanhSachDeThi() {
  const navigate = useNavigate();
  const { data: des, isLoading } = useQuery({
    queryKey: ['tn-de-thi-kha-dung'],
    queryFn: tnService.thi.deThiKhaDung,
  });
  const { data: lichSu } = useQuery({ queryKey: ['tn-lich-su'], queryFn: tnService.thi.lichSu });

  if (isLoading) return <Loading />;

  const act = (d) => {
    if (d.tinhTrang === 'CO_THE_LAM' || d.tinhTrang === 'DANG_LAM') {
      navigate(`${ROUTES.STUDENT_TN_LAM_BAI}/${d.deThiId}`);
    } else if (d.tinhTrang === 'HET_LUOT' && d.luotThiGanNhat) {
      navigate(`${ROUTES.STUDENT_TN_KET_QUA}/${d.luotThiGanNhat}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Thi trắc nghiệm</h1>
        <p className="text-sm text-slate-500">Các bài thi bạn có thể tham gia</p>
      </div>

      {(!des || des.length === 0) && (
        <div className="text-center py-16 text-slate-400">
          <FileQuestion className="w-10 h-10 mx-auto mb-2" />
          <p className="text-sm">Hiện chưa có bài thi nào</p>
        </div>
      )}

      <div className="space-y-3">
        {des?.map((d) => {
          const tt = TINH_TRANG[d.tinhTrang] || TINH_TRANG.CO_THE_LAM;
          const Icon = tt.icon;
          return (
            <div key={d.deThiId} className="rounded-xl bg-white ring-1 ring-slate-200 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{d.tieuDe}</p>
                  {d.moTa && <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">{d.moTa}</p>}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><ListChecks className="w-3.5 h-3.5" />{d.tongSoCau} câu</span>
                    <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{d.thoiLuongPhut} phút</span>
                    <span>Thang điểm {d.thangDiem}</span>
                    <span>Lượt: {d.soLanDaLam}/{d.soLanLamToiDa}</span>
                    <span className="text-slate-400">{d.cheDo === 'NGAU_NHIEN' ? 'Đề ngẫu nhiên' : 'Đề cố định'}</span>
                  </div>
                </div>
                <Button variant={tt.variant} icon={Icon} disabled={tt.disabled} onClick={() => act(d)}>
                  {tt.label}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {lichSu?.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Lịch sử làm bài</h2>
          <div className="rounded-xl bg-white ring-1 ring-slate-200 divide-y divide-slate-100">
            {lichSu.map((h) => (
              <button key={h.luotThiId}
                onClick={() => navigate(`${ROUTES.STUDENT_TN_KET_QUA}/${h.luotThiId}`)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50">
                <span className="text-slate-600">
                  Lần {h.lanThu} · {new Date(h.thoiGianBatDau).toLocaleString('vi-VN')}
                </span>
                <span className="font-semibold text-slate-800">
                  {h.trangThai === 'DANG_LAM' ? 'Đang làm' : `${h.diem ?? '-'} điểm`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
