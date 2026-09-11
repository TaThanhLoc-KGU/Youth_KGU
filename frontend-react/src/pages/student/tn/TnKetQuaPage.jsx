import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Trophy, RotateCcw } from 'lucide-react';
import tnService from '../../../services/tnService';
import { ROUTES } from '../../../utils/constants';
import Loading from '../../../components/common/Loading';
import Button from '../../../components/common/Button';

export default function TnKetQuaPage() {
  const { luotThiId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['tn-ket-qua', luotThiId],
    queryFn: () => tnService.thi.ketQua(luotThiId),
  });

  if (isLoading) return <Loading />;
  if (!data) return null;

  const dat = data.dat;
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Thẻ điểm */}
      <div className={`rounded-2xl p-6 text-center ${dat === true ? 'bg-emerald-50' : dat === false ? 'bg-rose-50' : 'bg-slate-50'}`}>
        <Trophy className={`w-10 h-10 mx-auto mb-2 ${dat === true ? 'text-emerald-500' : dat === false ? 'text-rose-400' : 'text-slate-400'}`} />
        <p className="text-sm text-slate-500">
          {data.trangThai === 'TU_DONG_NOP' ? 'Bài thi đã tự động nộp (hết giờ)' : 'Bạn đã hoàn thành bài thi'}
        </p>
        <p className="text-4xl font-bold text-slate-900 mt-1">
          {data.diem}<span className="text-lg text-slate-400 font-medium"> điểm</span>
        </p>
        <p className="text-sm text-slate-500 mt-1">
          Đúng {data.soCauDung}/{data.tongSoCau} câu
          {data.diemTho != null && ` · ${data.diemTho}/${data.tongDiemToiDa} điểm thô`}
        </p>
        {dat != null && (
          <span className={`inline-block mt-3 text-xs font-bold px-3 py-1 rounded-full ${
            dat ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {dat ? 'ĐẠT' : 'CHƯA ĐẠT'}
          </span>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" icon={RotateCcw} onClick={() => navigate(ROUTES.STUDENT_TN)}>
          Về danh sách đề thi
        </Button>
      </div>

      {/* Xem lại từng câu */}
      {data.hienChiTiet ? (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-800">Xem lại bài làm</h3>
          {data.chiTiet.map((c) => {
            const chon = c.traLoi || [];
            const dung = c.dapAnDung || null;
            return (
              <div key={c.thuTu} className="rounded-xl bg-white ring-1 ring-slate-200 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-400">Câu {c.thuTu}</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                    c.dung ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {c.dung ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {c.diemDatDuoc}/{c.diem} điểm
                  </span>
                </div>
                <div className="prose prose-sm max-w-none text-slate-800 mb-3"
                     dangerouslySetInnerHTML={{ __html: c.noiDung }} />
                <div className="space-y-1.5">
                  {c.dapAns.map((da) => {
                    const isChon = chon.includes(da.id);
                    const isDung = dung ? dung.includes(da.id) : null;
                    return (
                      <div key={da.id} className={`flex items-center gap-2 text-sm rounded-md px-3 py-2 ${
                        isDung === true ? 'bg-emerald-50 text-emerald-800'
                          : isChon && isDung === false ? 'bg-rose-50 text-rose-700'
                          : 'text-slate-600'
                      }`}>
                        {isDung === true ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          : isChon ? <XCircle className="w-4 h-4 text-rose-400" />
                          : <span className="w-4 h-4 inline-block" />}
                        <span>{da.noiDung}</span>
                        {isChon && <span className="text-[10px] font-semibold ml-auto">bạn chọn</span>}
                      </div>
                    );
                  })}
                </div>
                {c.giaiThich && (
                  <p className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-md px-3 py-2">
                    <b>Giải thích:</b> {c.giaiThich}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-400 text-center py-6">
          Đề thi không cho phép xem lại chi tiết bài làm.
        </p>
      )}
    </div>
  );
}
