import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, FileText, Send, Lock, Pencil, Trash2, Database } from 'lucide-react';
import tnService from '../../../services/tnService';
import { ROUTES } from '../../../utils/constants';
import Loading from '../../../components/common/Loading';
import Button from '../../../components/common/Button';

const TT_BADGE = {
  NHAP:        'bg-slate-100 text-slate-600',
  DA_XUAT_BAN: 'bg-emerald-100 text-emerald-700',
  DONG:        'bg-rose-100 text-rose-700',
};
const TT_LABEL = { NHAP: 'Nháp', DA_XUAT_BAN: 'Đang mở', DONG: 'Đã đóng' };

export default function TnDeThiListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['tn-de-thi', page],
    queryFn: () => tnService.deThi.list({ page, size: 15 }),
  });

  const mutTrangThai = useMutation({
    mutationFn: ({ id, trangThai }) => tnService.deThi.doiTrangThai(id, trangThai),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tn-de-thi'] }); toast.success('Đã cập nhật'); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Lỗi'),
  });
  const mutXoa = useMutation({
    mutationFn: (id) => tnService.deThi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tn-de-thi'] }); toast.success('Đã xoá'); },
  });

  if (isLoading) return <Loading />;
  const rows = data?.content || [];

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Đề thi trắc nghiệm</h1>
          <p className="text-sm text-slate-500">Tạo và quản lý các bài thi trắc nghiệm</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={Database} onClick={() => navigate(ROUTES.ADMIN_TN_CAU_HOI)}>
            Ngân hàng câu hỏi
          </Button>
          <Button icon={Plus} onClick={() => navigate(ROUTES.ADMIN_TN_DE_THI_TAO)}>Tạo đề</Button>
        </div>
      </div>

      <div className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase text-slate-400">
              <th className="text-left px-4 py-3">Tiêu đề</th>
              <th className="px-4 py-3">Chế độ</th>
              <th className="px-4 py-3">Số câu</th>
              <th className="px-4 py-3">Thời lượng</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2" />Chưa có đề thi nào
              </td></tr>
            )}
            {rows.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <button className="font-medium text-slate-800 hover:text-primary text-left"
                          onClick={() => navigate(`${ROUTES.ADMIN_TN_DE_THI}/${d.id}/sua`)}>
                    {d.tieuDe}
                  </button>
                </td>
                <td className="px-4 py-3 text-center text-xs text-slate-500">
                  {d.cheDo === 'NGAU_NHIEN' ? 'Ngẫu nhiên' : 'Cố định'}
                </td>
                <td className="px-4 py-3 text-center">{d.tongSoCau}</td>
                <td className="px-4 py-3 text-center text-slate-500">{d.thoiLuongPhut}′</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TT_BADGE[d.trangThai]}`}>
                    {TT_LABEL[d.trangThai]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {d.trangThai !== 'DA_XUAT_BAN' ? (
                      <Button size="xs" variant="success-ghost" icon={Send} title="Xuất bản"
                              onClick={() => mutTrangThai.mutate({ id: d.id, trangThai: 'DA_XUAT_BAN' })} />
                    ) : (
                      <Button size="xs" variant="ghost" icon={Lock} title="Đóng đề"
                              onClick={() => mutTrangThai.mutate({ id: d.id, trangThai: 'DONG' })} />
                    )}
                    <Button size="xs" variant="ghost" icon={Pencil} title="Sửa"
                            onClick={() => navigate(`${ROUTES.ADMIN_TN_DE_THI}/${d.id}/sua`)} />
                    <Button size="xs" variant="danger-ghost" icon={Trash2} title="Xoá"
                            onClick={() => window.confirm('Xoá đề thi này?') && mutXoa.mutate(d.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Trước</Button>
          <span className="text-sm text-slate-500 py-1.5">{page + 1}/{data.totalPages}</span>
          <Button size="sm" variant="outline" disabled={page + 1 >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Sau</Button>
        </div>
      )}
    </div>
  );
}
