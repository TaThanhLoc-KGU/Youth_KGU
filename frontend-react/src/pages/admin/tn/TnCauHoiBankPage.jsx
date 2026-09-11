import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Search, Pencil, Trash2, ArrowLeft, Check, X } from 'lucide-react';
import tnService, { DO_KHO, LOAI_CAU_HOI } from '../../../services/tnService';
import { ROUTES } from '../../../utils/constants';
import Loading from '../../../components/common/Loading';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Modal from '../../../components/common/Modal';

const DK_LABEL = Object.fromEntries(DO_KHO.map((d) => [d.value, d.label]));

const EMPTY_Q = {
  noiDung: '', loai: 'MOT_DAP_AN', doKho: 'TRUNG_BINH', danhMucId: '', diem: 1, giaiThich: '',
  dapAns: [{ noiDung: '', dung: true }, { noiDung: '', dung: false }],
};

export default function TnCauHoiBankPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [kw, setKw] = useState('');
  const [doKho, setDoKho] = useState('');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null);   // null | {} | question

  const { data, isLoading } = useQuery({
    queryKey: ['tn-ch', kw, doKho, page],
    queryFn: () => tnService.cauHoi.search({ kw: kw || undefined, doKho: doKho || undefined, page, size: 20 }),
  });
  const { data: danhMuc } = useQuery({ queryKey: ['tn-danh-muc'], queryFn: tnService.cauHoi.danhMuc });

  const mutDel = useMutation({
    mutationFn: (id) => tnService.cauHoi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tn-ch'] }); toast.success('Đã ẩn câu hỏi'); },
  });

  if (isLoading) return <Loading />;
  const rows = data?.content || [];

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(ROUTES.ADMIN_TN_DE_THI)}><ArrowLeft className="w-5 h-5 text-slate-400" /></button>
          <h1 className="text-xl font-bold text-slate-900">Ngân hàng câu hỏi</h1>
        </div>
        <Button icon={Plus} onClick={() => setEditing({ ...EMPTY_Q })}>Thêm câu hỏi</Button>
      </div>

      <div className="flex gap-2">
        <Input leftIcon={Search} placeholder="Tìm nội dung câu hỏi..." value={kw}
               onChange={(e) => { setKw(e.target.value); setPage(0); }} containerClassName="flex-1 max-w-sm" />
        <select className="input-base w-40" value={doKho} onChange={(e) => { setDoKho(e.target.value); setPage(0); }}>
          <option value="">Mọi độ khó</option>
          {DO_KHO.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      <div className="rounded-xl bg-white ring-1 ring-slate-200 divide-y divide-slate-100">
        {rows.length === 0 && <p className="text-center py-12 text-slate-400 text-sm">Không có câu hỏi</p>}
        {rows.map((c) => (
          <div key={c.id} className="p-4 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-slate-800 line-clamp-2" dangerouslySetInnerHTML={{ __html: c.noiDung }} />
              <div className="flex flex-wrap gap-2 mt-1.5 text-[11px]">
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{DK_LABEL[c.doKho]}</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                  {LOAI_CAU_HOI.find((l) => l.value === c.loai)?.label}
                </span>
                {c.danhMucTen && <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">{c.danhMucTen}</span>}
                <span className="text-slate-400">{c.diem}đ · {c.dapAns.length} đáp án</span>
              </div>
            </div>
            <Button size="xs" variant="ghost" icon={Pencil} onClick={() => setEditing(c)} />
            <Button size="xs" variant="danger-ghost" icon={Trash2}
                    onClick={() => window.confirm('Ẩn câu hỏi này?') && mutDel.mutate(c.id)} />
          </div>
        ))}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Trước</Button>
          <span className="text-sm text-slate-500 py-1.5">{page + 1}/{data.totalPages}</span>
          <Button size="sm" variant="outline" disabled={page + 1 >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Sau</Button>
        </div>
      )}

      {editing && (
        <CauHoiModal q={editing} danhMuc={danhMuc || []} onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); qc.invalidateQueries({ queryKey: ['tn-ch'] }); }} />
      )}
    </div>
  );
}

function CauHoiModal({ q, danhMuc, onClose, onSaved }) {
  const isEdit = !!q.id;
  const [f, setF] = useState({
    noiDung: q.noiDung || '', loai: q.loai || 'MOT_DAP_AN', doKho: q.doKho || 'TRUNG_BINH',
    danhMucId: q.danhMucId ?? '', diem: q.diem ?? 1, giaiThich: q.giaiThich || '',
    dapAns: (q.dapAns?.length ? q.dapAns : EMPTY_Q.dapAns).map((d) => ({ noiDung: d.noiDung, dung: !!d.dung })),
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setDa = (i, k, v) => setF((p) => ({
    ...p,
    dapAns: p.dapAns.map((d, di) => {
      if (di !== i) return k === 'dung' && v && p.loai !== 'NHIEU_DAP_AN' ? { ...d, dung: false } : d;
      return { ...d, [k]: v };
    }),
  }));

  const mut = useMutation({
    mutationFn: (body) => isEdit ? tnService.cauHoi.update(q.id, body) : tnService.cauHoi.create(body),
    onSuccess: () => { toast.success(isEdit ? 'Đã lưu' : 'Đã thêm'); onSaved(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Lỗi'),
  });

  const save = () => {
    if (!f.noiDung.trim()) return toast.error('Nhập nội dung câu hỏi');
    const das = f.dapAns.filter((d) => d.noiDung.trim());
    if (das.length < 2) return toast.error('Cần ít nhất 2 đáp án');
    if (!das.some((d) => d.dung)) return toast.error('Chọn ít nhất 1 đáp án đúng');
    mut.mutate({
      noiDung: f.noiDung, loai: f.loai, doKho: f.doKho,
      danhMucId: f.danhMucId === '' ? null : Number(f.danhMucId),
      diem: Number(f.diem), giaiThich: f.giaiThich || null,
      dapAns: das.map((d, i) => ({ noiDung: d.noiDung, dung: d.dung, thuTu: i })),
    });
  };

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'Sửa câu hỏi' : 'Thêm câu hỏi'} size="lg">
      <div className="space-y-3">
        <div>
          <label className="form-label">Nội dung câu hỏi</label>
          <textarea className="input-base w-full" rows={3} value={f.noiDung} onChange={(e) => set('noiDung', e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-4 gap-2">
          <div>
            <label className="form-label">Loại</label>
            <select className="input-base" value={f.loai} onChange={(e) => set('loai', e.target.value)}>
              {LOAI_CAU_HOI.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Độ khó</label>
            <select className="input-base" value={f.doKho} onChange={(e) => set('doKho', e.target.value)}>
              {DO_KHO.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Danh mục</label>
            <select className="input-base" value={f.danhMucId} onChange={(e) => set('danhMucId', e.target.value)}>
              <option value="">—</option>
              {danhMuc.map((d) => <option key={d.id} value={d.id}>{d.ten}</option>)}
            </select>
          </div>
          <Input type="number" step="0.5" label="Điểm" value={f.diem} onChange={(e) => set('diem', e.target.value)} />
        </div>

        <div>
          <label className="form-label">Đáp án (bấm ✓ để đánh dấu đúng)</label>
          <div className="space-y-2">
            {f.dapAns.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <button onClick={() => setDa(i, 'dung', !d.dung)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    d.dung ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {d.dung ? <Check className="w-4 h-4" /> : String.fromCharCode(65 + i)}
                </button>
                <input className="input-base flex-1" placeholder={`Đáp án ${String.fromCharCode(65 + i)}`}
                  value={d.noiDung} onChange={(e) => setDa(i, 'noiDung', e.target.value)} />
                {f.dapAns.length > 2 && (
                  <button onClick={() => set('dapAns', f.dapAns.filter((_, di) => di !== i))}>
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {f.loai !== 'DUNG_SAI' && f.dapAns.length < 6 && (
            <Button size="xs" variant="ghost" icon={Plus} className="mt-2"
              onClick={() => set('dapAns', [...f.dapAns, { noiDung: '', dung: false }])}>Thêm đáp án</Button>
          )}
        </div>

        <div>
          <label className="form-label">Giải thích (tuỳ chọn)</label>
          <textarea className="input-base w-full" rows={2} value={f.giaiThich} onChange={(e) => set('giaiThich', e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button isLoading={mut.isPending} onClick={save}>Lưu</Button>
        </div>
      </div>
    </Modal>
  );
}
