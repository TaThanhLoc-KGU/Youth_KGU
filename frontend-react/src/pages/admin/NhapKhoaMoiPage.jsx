import { useMemo, useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Layers,
  GraduationCap, Users2, ArrowRight, RotateCcw,
} from 'lucide-react';
import nhapKhoaMoiService from '../../services/nhapKhoaMoiService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';

/**
 * "Nhập khóa mới" — tải file export sinh viên (tải thẳng từ hệ thống nhà trường, KHÔNG cần
 * chỉnh sửa) khi có khóa mới nhập học. Tự phát hiện ngành/lớp chưa có, xin xác nhận Khoa cho
 * ngành mới, rồi tạo Ngành + Lớp (tên lớp = mã lớp) + Sinh viên trong 1 lần.
 */
export default function NhapKhoaMoiPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [khoaChon, setKhoaChon] = useState({});   // { tenNganhGoiY: maKhoa }
  const [maNganhChon, setMaNganhChon] = useState({});
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const { data: khoaList } = useQuery({ queryKey: ['khoa-list-nkm'], queryFn: nhapKhoaMoiService.danhSachKhoa });

  const mutPreview = useMutation({
    mutationFn: (f) => nhapKhoaMoiService.preview(f),
    onSuccess: (data) => { setPreview(data); setResult(null); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Không đọc được file'),
  });

  const mutConfirm = useMutation({
    mutationFn: () => nhapKhoaMoiService.confirm(file, khoaChon, maNganhChon),
    onSuccess: (data) => { setResult(data); toast.success('Đã nhập khóa mới thành công'); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Nhập khóa mới thất bại'),
  });

  const chonFile = (f) => {
    setFile(f); setPreview(null); setResult(null); setKhoaChon({}); setMaNganhChon({});
    mutPreview.mutate(f);
  };

  const thieuKhoa = useMemo(
    () => (preview?.nganhMoiCanChonKhoa || []).filter((ten) => !khoaChon[ten]),
    [preview, khoaChon]
  );
  const sanSangXacNhan = preview && preview.soDongHopLe > 0 && thieuKhoa.length === 0;

  const lamLai = () => {
    setFile(null); setPreview(null); setResult(null); setKhoaChon({}); setMaNganhChon({});
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Nhập khóa mới</h1>
        <p className="text-sm text-slate-500">
          Tải trực tiếp file danh sách sinh viên xuất từ hệ thống nhà trường (không cần chỉnh sửa) —
          hệ thống tự phát hiện ngành/lớp chưa có để tạo mới cùng lúc với sinh viên.
        </p>
      </div>

      {/* ---- Bước 1: chọn file ---- */}
      {!result && (
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium cursor-pointer hover:bg-primary-600">
              <Upload className="w-4 h-4" /> Chọn file Excel
              <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={(e) => e.target.files?.[0] && chonFile(e.target.files[0])} />
            </label>
            {file && <span className="text-sm text-slate-600 inline-flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />{file.name}
            </span>}
            {preview && (
              <Button size="sm" variant="outline" icon={RotateCcw} onClick={lamLai}>Chọn file khác</Button>
            )}
          </div>
        </Card>
      )}

      {mutPreview.isPending && <Loading />}

      {/* ---- Bước 2: preview ---- */}
      {preview && !result && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Tổng số dòng" value={preview.tongSoDong} icon={Users2} tone="slate" />
            <Stat label="Hợp lệ" value={preview.soDongHopLe} icon={CheckCircle2} tone="emerald" />
            <Stat label="Lỗi" value={preview.soDongLoi} icon={AlertTriangle} tone="rose" />
            <Stat label="Số lớp" value={preview.nhomLop?.length ?? 0} icon={Layers} tone="blue" />
          </div>

          {preview.khoaHocMoi?.length > 0 && (
            <Banner tone="amber">
              Khóa học mới sẽ được tạo: <b>{preview.khoaHocMoi.join(', ')}</b>
            </Banner>
          )}

          {preview.soDongLoi > 0 && (
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h3 className="font-semibold text-slate-800 text-sm">Lỗi dữ liệu ({preview.soDongLoi} dòng — sẽ bị bỏ qua)</h3>
              </div>
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
                {preview.loi.slice(0, 100).map((e, i) => (
                  <div key={i} className="px-4 py-2 text-sm flex gap-3">
                    <span className="text-slate-400 w-16 flex-shrink-0">Dòng {e.rowNumber}</span>
                    <span className="text-rose-600">{e.errorMessage}</span>
                  </div>
                ))}
                {preview.loi.length > 100 && (
                  <p className="px-4 py-2 text-xs text-slate-400">…và {preview.loi.length - 100} lỗi khác</p>
                )}
              </div>
            </Card>
          )}

          {/* Ngành mới cần chọn khoa */}
          {preview.nganhMoiCanChonKhoa?.length > 0 && (
            <Card className="p-0 overflow-hidden ring-2 ring-amber-200">
              <div className="px-4 py-3 border-b border-amber-100 bg-amber-50 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-amber-800 text-sm">
                  {preview.nganhMoiCanChonKhoa.length} ngành mới — chọn Khoa trước khi xác nhận
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {preview.nganhMoiCanChonKhoa.map((ten) => (
                  <div key={ten} className="px-4 py-3 flex flex-wrap items-center gap-3">
                    <span className="font-medium text-slate-800 flex-1 min-w-[180px]">{ten}</span>
                    <select
                      className="input-base w-56"
                      value={khoaChon[ten] || ''}
                      onChange={(e) => setKhoaChon((p) => ({ ...p, [ten]: e.target.value }))}
                    >
                      <option value="">— Chọn khoa —</option>
                      {(khoaList || []).map((k) => (
                        <option key={k.maKhoa} value={k.maKhoa}>{k.tenKhoa}</option>
                      ))}
                    </select>
                    <input
                      className="input-base w-40 text-xs"
                      placeholder="Mã ngành (tự sinh nếu bỏ trống)"
                      value={maNganhChon[ten] || ''}
                      onChange={(e) => setMaNganhChon((p) => ({ ...p, [ten]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Danh sách lớp */}
          <Card className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm">Danh sách lớp ({preview.nhomLop?.length ?? 0})</h3>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-left">Mã lớp</th>
                    <th className="px-3 py-2 text-left">Ngành</th>
                    <th className="px-3 py-2 text-center">SV</th>
                    <th className="px-3 py-2 text-center">Lớp</th>
                    <th className="px-3 py-2 text-center">Ngành</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {preview.nhomLop?.map((l) => (
                    <tr key={l.maLop}>
                      <td className="px-3 py-2 font-mono text-xs">{l.maLop}</td>
                      <td className="px-3 py-2">{l.nganhDaTonTai ? l.tenNganhKhop : l.tenNganhGoiY}
                        {l.nganhDaTonTai && <span className="text-xs text-slate-400"> · {l.tenKhoaKhop}</span>}</td>
                      <td className="px-3 py-2 text-center">{l.soLuongSv}</td>
                      <td className="px-3 py-2 text-center">
                        <Badge tone={l.lopDaTonTai ? 'slate' : 'blue'}>{l.lopDaTonTai ? 'Đã có' : 'Mới'}</Badge>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge tone={l.nganhDaTonTai ? 'slate' : 'amber'}>{l.nganhDaTonTai ? 'Đã có' : 'Mới'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex items-center justify-between">
            {thieuKhoa.length > 0 ? (
              <p className="text-sm text-amber-600">Còn {thieuKhoa.length} ngành mới chưa chọn khoa</p>
            ) : <span />}
            <Button icon={ArrowRight} iconPosition="right" disabled={!sanSangXacNhan}
              isLoading={mutConfirm.isPending} onClick={() => mutConfirm.mutate()}>
              Xác nhận nhập {preview.soDongHopLe} sinh viên
            </Button>
          </div>
        </div>
      )}

      {/* ---- Bước 3: kết quả ---- */}
      {result && (
        <Card className="p-6 text-center bg-emerald-50">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="font-semibold text-slate-800 mb-4">Đã nhập khóa mới thành công</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
            <ResultStat label="Khóa học mới" value={result.khoaHocMoiTao} />
            <ResultStat label="Ngành mới" value={result.nganhMoiTao} />
            <ResultStat label="Lớp mới" value={result.lopMoiTao} />
            <ResultStat label="SV mới tạo" value={result.sinhVienMoiTao} />
            <ResultStat label="SV cập nhật" value={result.sinhVienCapNhat} />
          </div>
          <Button className="mt-5" variant="outline" icon={RotateCcw} onClick={lamLai}>Nhập file khác</Button>
        </Card>
      )}
    </div>
  );
}

const TONE = {
  slate: 'bg-slate-100 text-slate-600', emerald: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600', blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-700',
};

function Stat({ label, value, icon: Icon, tone }) {
  return (
    <Card className="p-4">
      <span className={`inline-flex w-9 h-9 rounded-lg items-center justify-center ${TONE[tone]}`}><Icon className="w-4.5 h-4.5" /></span>
      <p className="text-xs text-slate-500 mt-2">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}
function ResultStat({ label, value }) {
  return (
    <div className="rounded-lg bg-white/70 py-3">
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
function Badge({ tone, children }) {
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TONE[tone]}`}>{children}</span>;
}
function Banner({ tone, children }) {
  return <div className={`rounded-lg px-4 py-3 text-sm ${TONE[tone] || TONE.slate}`}>{children}</div>;
}
