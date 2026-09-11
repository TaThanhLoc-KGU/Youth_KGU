import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Trash2, Search, GripVertical, ListChecks, Shuffle } from 'lucide-react';
import tnService, { DO_KHO } from '../../../services/tnService';
import { ROUTES } from '../../../utils/constants';
import Loading from '../../../components/common/Loading';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';

const EMPTY = {
  tieuDe: '', moTa: '', cheDo: 'CO_DINH',
  thoiLuongPhut: 30, soLanLamToiDa: 1,
  tronCauHoi: true, tronDapAn: true, chamDiemTungPhan: false,
  thangDiem: 10, diemDat: '', cheDoHienKetQua: 'NGAY',
  choXemLaiBai: true, hienDapAnDung: true,
  moLuc: '', dongLuc: '', maKhoa: '',
  cauHoiCoDinh: [],   // [{cauHoiId, thuTu, noiDung, diemGhiDe}]
  maTran: [],         // [{danhMucId, doKho, soLuong, diemMoiCau}]
};

export default function TnDeThiFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [f, setF] = useState(EMPTY);

  const { data: detail, isLoading } = useQuery({
    queryKey: ['tn-de-thi-detail', id],
    queryFn: () => tnService.deThi.get(id),
    enabled: isEdit,
  });
  const { data: danhMuc } = useQuery({ queryKey: ['tn-danh-muc'], queryFn: tnService.cauHoi.danhMuc });

  useEffect(() => {
    if (!detail) return;
    setF({
      ...EMPTY, ...detail,
      diemDat: detail.diemDat ?? '',
      moLuc: detail.moLuc?.slice(0, 16) || '',
      dongLuc: detail.dongLuc?.slice(0, 16) || '',
      maKhoa: detail.maKhoa || '',
      cauHoiCoDinh: (detail.cauHoiCoDinh || []).map((c) => ({
        cauHoiId: c.cauHoiId, thuTu: c.thuTu, noiDung: c.noiDung, diemGhiDe: c.diemGhiDe ?? '',
      })),
      maTran: (detail.maTran || []).map((m) => ({
        danhMucId: m.danhMucId ?? '', doKho: m.doKho ?? '', soLuong: m.soLuong, diemMoiCau: m.diemMoiCau ?? '',
      })),
    });
  }, [detail]);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const mut = useMutation({
    mutationFn: (body) => (isEdit ? tnService.deThi.update(id, body) : tnService.deThi.create(body)),
    onSuccess: (d) => { toast.success(isEdit ? 'Đã lưu' : 'Đã tạo đề'); navigate(`${ROUTES.ADMIN_TN_DE_THI}/${d.id}`); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Lỗi lưu đề'),
  });

  const submit = () => {
    if (!f.tieuDe.trim()) return toast.error('Nhập tiêu đề');
    const body = {
      ...f,
      thoiLuongPhut: Number(f.thoiLuongPhut), soLanLamToiDa: Number(f.soLanLamToiDa),
      thangDiem: Number(f.thangDiem),
      diemDat: f.diemDat === '' ? null : Number(f.diemDat),
      moLuc: f.moLuc || null, dongLuc: f.dongLuc || null,
      maKhoa: f.maKhoa || null,
    };
    if (f.cheDo === 'CO_DINH') {
      if (!f.cauHoiCoDinh.length) return toast.error('Chọn ít nhất 1 câu hỏi');
      body.cauHoiCoDinh = f.cauHoiCoDinh.map((c, i) => ({
        cauHoiId: c.cauHoiId, thuTu: i, diemGhiDe: c.diemGhiDe === '' ? null : Number(c.diemGhiDe),
      }));
      body.maTran = null;
    } else {
      if (!f.maTran.length) return toast.error('Thêm ít nhất 1 dòng ma trận');
      body.maTran = f.maTran.map((m) => ({
        danhMucId: m.danhMucId === '' ? null : Number(m.danhMucId),
        doKho: m.doKho || null,
        soLuong: Number(m.soLuong),
        diemMoiCau: m.diemMoiCau === '' ? null : Number(m.diemMoiCau),
      }));
      body.cauHoiCoDinh = null;
    }
    mut.mutate(body);
  };

  const tongCauMaTran = useMemo(
    () => f.maTran.reduce((s, m) => s + (Number(m.soLuong) || 0), 0), [f.maTran]);

  if (isEdit && isLoading) return <Loading />;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-slate-900">{isEdit ? 'Sửa đề thi' : 'Tạo đề thi trắc nghiệm'}</h1>

      {/* Thông tin chung */}
      <Section title="Thông tin chung">
        <Input label="Tiêu đề" required value={f.tieuDe} onChange={(e) => set('tieuDe', e.target.value)} />
        <label className="form-label">Mô tả</label>
        <textarea className="input-base w-full" rows={2} value={f.moTa} onChange={(e) => set('moTa', e.target.value)} />
        <div className="grid sm:grid-cols-3 gap-3">
          <NumField label="Thời lượng (phút)" value={f.thoiLuongPhut} onChange={(v) => set('thoiLuongPhut', v)} />
          <NumField label="Số lần làm tối đa" value={f.soLanLamToiDa} onChange={(v) => set('soLanLamToiDa', v)} />
          <NumField label="Thang điểm" value={f.thangDiem} onChange={(v) => set('thangDiem', v)} />
          <NumField label="Điểm đạt (bỏ trống = không xét)" value={f.diemDat} onChange={(v) => set('diemDat', v)} />
          <Input type="datetime-local" label="Mở lúc" value={f.moLuc} onChange={(e) => set('moLuc', e.target.value)} />
          <Input type="datetime-local" label="Đóng lúc" value={f.dongLuc} onChange={(e) => set('dongLuc', e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          <Check label="Trộn thứ tự câu hỏi" v={f.tronCauHoi} on={(v) => set('tronCauHoi', v)} />
          <Check label="Trộn thứ tự đáp án" v={f.tronDapAn} on={(v) => set('tronDapAn', v)} />
          <Check label="Chấm điểm từng phần (câu nhiều đáp án)" v={f.chamDiemTungPhan} on={(v) => set('chamDiemTungPhan', v)} />
          <Check label="Cho xem lại bài sau khi nộp" v={f.choXemLaiBai} on={(v) => set('choXemLaiBai', v)} />
          <Check label="Hiện đáp án đúng khi xem lại" v={f.hienDapAnDung} on={(v) => set('hienDapAnDung', v)} />
        </div>
        <div>
          <label className="form-label">Hiển thị kết quả</label>
          <select className="input-base" value={f.cheDoHienKetQua} onChange={(e) => set('cheDoHienKetQua', e.target.value)}>
            <option value="NGAY">Ngay sau khi nộp</option>
            <option value="SAU_KHI_DONG">Sau khi đề đóng</option>
            <option value="KHONG">Không hiển thị</option>
          </select>
        </div>
      </Section>

      {/* Chế độ sinh đề — RẼ NHÁNH */}
      <Section title="Chế độ sinh đề">
        <div className="grid sm:grid-cols-2 gap-3">
          <ModeCard active={f.cheDo === 'CO_DINH'} onClick={() => set('cheDo', 'CO_DINH')}
            icon={ListChecks} title="Đề cố định"
            desc="Chọn cụ thể từng câu hỏi. Mọi thí sinh làm cùng một bộ đề." />
          <ModeCard active={f.cheDo === 'NGAU_NHIEN'} onClick={() => set('cheDo', 'NGAU_NHIEN')}
            icon={Shuffle} title="Đề ngẫu nhiên (ma trận)"
            desc="Cài số câu theo độ khó/danh mục. Đề bốc riêng khi thí sinh bấm Bắt đầu." />
        </div>

        {f.cheDo === 'CO_DINH'
          ? <CoDinhEditor value={f.cauHoiCoDinh} onChange={(v) => set('cauHoiCoDinh', v)} />
          : <MaTranEditor value={f.maTran} onChange={(v) => set('maTran', v)} danhMuc={danhMuc || []} tong={tongCauMaTran} />}
      </Section>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(ROUTES.ADMIN_TN_DE_THI)}>Huỷ</Button>
        <Button isLoading={mut.isPending} onClick={submit}>{isEdit ? 'Lưu' : 'Tạo đề'}</Button>
      </div>
    </div>
  );
}

/* ---------- Mode CỐ ĐỊNH: chọn câu từ ngân hàng ---------- */
function CoDinhEditor({ value, onChange }) {
  const [kw, setKw] = useState('');
  const [doKho, setDoKho] = useState('');
  const { data } = useQuery({
    queryKey: ['tn-ch-pick', kw, doKho],
    queryFn: () => tnService.cauHoi.search({ kw: kw || undefined, doKho: doKho || undefined, size: 30 }),
  });
  const chosenIds = new Set(value.map((v) => v.cauHoiId));

  return (
    <div className="mt-4 grid lg:grid-cols-2 gap-4">
      {/* Bên trái: ngân hàng */}
      <div className="rounded-lg ring-1 ring-slate-200 p-3">
        <div className="flex gap-2 mb-2">
          <Input leftIcon={Search} placeholder="Tìm câu hỏi..." value={kw} onChange={(e) => setKw(e.target.value)} containerClassName="flex-1" />
          <select className="input-base w-32" value={doKho} onChange={(e) => setDoKho(e.target.value)}>
            <option value="">Mọi mức</option>
            {DO_KHO.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {(data?.content || []).map((c) => (
            <button key={c.id} disabled={chosenIds.has(c.id)}
              onClick={() => onChange([...value, { cauHoiId: c.id, noiDung: c.noiDung, diemGhiDe: '' }])}
              className="w-full text-left py-2 px-1 text-sm hover:bg-slate-50 disabled:opacity-40 flex items-start gap-2">
              <Plus className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2" dangerouslySetInnerHTML={{ __html: c.noiDung }} />
            </button>
          ))}
        </div>
      </div>
      {/* Bên phải: đã chọn */}
      <div className="rounded-lg ring-1 ring-slate-200 p-3">
        <p className="text-xs font-semibold text-slate-500 mb-2">Đã chọn: {value.length} câu</p>
        <div className="max-h-80 overflow-y-auto space-y-1.5">
          {value.map((c, i) => (
            <div key={c.cauHoiId} className="flex items-center gap-2 text-sm bg-slate-50 rounded-md px-2 py-1.5">
              <GripVertical className="w-4 h-4 text-slate-300" />
              <span className="text-slate-400 text-xs w-5">{i + 1}</span>
              <span className="flex-1 line-clamp-1" dangerouslySetInnerHTML={{ __html: c.noiDung }} />
              <input type="number" step="0.5" placeholder="điểm" className="input-base w-16 !py-1 text-xs"
                value={c.diemGhiDe}
                onChange={(e) => onChange(value.map((x, xi) => xi === i ? { ...x, diemGhiDe: e.target.value } : x))} />
              <button onClick={() => onChange(value.filter((_, xi) => xi !== i))}>
                <Trash2 className="w-4 h-4 text-rose-400" />
              </button>
            </div>
          ))}
          {!value.length && <p className="text-xs text-slate-400 py-6 text-center">Chưa chọn câu nào</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Mode NGẪU NHIÊN: ma trận ---------- */
function MaTranEditor({ value, onChange, danhMuc, tong }) {
  const add = () => onChange([...value, { danhMucId: '', doKho: '', soLuong: 5, diemMoiCau: '' }]);
  const upd = (i, k, v) => onChange(value.map((r, ri) => ri === i ? { ...r, [k]: v } : r));
  return (
    <div className="mt-4">
      <div className="rounded-lg ring-1 ring-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-400 uppercase">
            <tr><th className="px-3 py-2 text-left">Danh mục</th><th className="px-3 py-2">Độ khó</th>
              <th className="px-3 py-2">Số câu</th><th className="px-3 py-2">Điểm/câu</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {value.map((r, i) => (
              <tr key={i}>
                <td className="px-3 py-2">
                  <select className="input-base !py-1" value={r.danhMucId} onChange={(e) => upd(i, 'danhMucId', e.target.value)}>
                    <option value="">Mọi danh mục</option>
                    {danhMuc.map((d) => <option key={d.id} value={d.id}>{d.ten}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select className="input-base !py-1" value={r.doKho} onChange={(e) => upd(i, 'doKho', e.target.value)}>
                    <option value="">Mọi mức</option>
                    {DO_KHO.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2 text-center">
                  <input type="number" min="1" className="input-base !py-1 w-16 text-center"
                    value={r.soLuong} onChange={(e) => upd(i, 'soLuong', e.target.value)} />
                </td>
                <td className="px-3 py-2 text-center">
                  <input type="number" step="0.5" placeholder="mặc định" className="input-base !py-1 w-20 text-center"
                    value={r.diemMoiCau} onChange={(e) => upd(i, 'diemMoiCau', e.target.value)} />
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => onChange(value.filter((_, ri) => ri !== i))}>
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-2">
        <Button size="sm" variant="outline" icon={Plus} onClick={add}>Thêm dòng</Button>
        <span className="text-sm text-slate-500">Tổng: <b>{tong}</b> câu mỗi lượt thi</span>
      </div>
    </div>
  );
}

/* ---------- bits ---------- */
const Section = ({ title, children }) => (
  <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 sm:p-5 space-y-3">
    <h2 className="font-semibold text-slate-800">{title}</h2>
    {children}
  </div>
);
const NumField = ({ label, value, onChange }) => (
  <Input type="number" label={label} value={value} onChange={(e) => onChange(e.target.value)} />
);
const Check = ({ label, v, on }) => (
  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer py-1">
    <input type="checkbox" checked={!!v} onChange={(e) => on(e.target.checked)} className="rounded" />
    {label}
  </label>
);
const ModeCard = ({ active, onClick, icon: Icon, title, desc }) => (
  <button onClick={onClick}
    className={`text-left rounded-lg border-2 p-3.5 transition-colors ${
      active ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}>
    <div className="flex items-center gap-2 font-semibold text-slate-800">
      <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-slate-400'}`} />{title}
    </div>
    <p className="text-xs text-slate-500 mt-1">{desc}</p>
  </button>
);
